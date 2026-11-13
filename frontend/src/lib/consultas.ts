// Consultas das telas (TanStack Query) sobre `@/lib/dados`, que continua sendo a única porta de
// dados. Quando a fonte virar a API REST (/api/v1), muda só `dados.ts`; as telas não percebem.
//
// As telas leem só pelos hooks daqui, nunca chamam `dados.ts` direto para ler. Para gravar
// (cadastro), chamam `dados.ts` e depois `useRecarregarDados()`.

import { QueryClient, keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey, UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { historico, listarAlertas, listarDispositivos, listarPessoas, listarTrechos, posicoesAtuais } from "./dados";
import type { Alerta, Dispositivo, FiltrosHistorico, Pessoa, PosicaoAtual, Trecho } from "./tipos";

/** Intervalo de atualização das telas ao vivo (mapa e dashboard). */
export const INTERVALO_MS = 5000;

export const chaves = {
  posicoes: ["posicoes"] as const,
  pessoas: ["pessoas"] as const,
  dispositivos: ["dispositivos"] as const,
  trechos: ["trechos"] as const,
  alertas: ["alertas"] as const,
  historico: ["historico"] as const,
};

// structuralSharing desligado: `dados.ts` altera pessoas e dispositivos no próprio objeto
// (mock em memória). Com o compartilhamento estrutural, o Query acharia o resultado "igual" ao
// anterior e a tela não redesenharia depois de um cadastro.
export const clienteDeConsultas = new QueryClient({
  defaultOptions: { queries: { structuralSharing: false, refetchOnWindowFocus: false, retry: false } },
});

// Estáveis, para os useMemo das telas não recalcularem a cada render antes da primeira carga.
const SEM_POSICOES: PosicaoAtual[] = [];
const SEM_PESSOAS: Pessoa[] = [];
const SEM_DISPOSITIVOS: Dispositivo[] = [];
const SEM_TRECHOS: Trecho[] = [];
const SEM_ALERTAS: Alerta[] = [];
const SEM_LINHAS: Awaited<ReturnType<typeof historico>> = [];

/** `atualizadoEm` é 0 antes da primeira carga (o selo "ao vivo" não mostra hora até lá). */
function resultado<T>(consulta: UseQueryResult<T>, vazio: T) {
  return { dados: consulta.data ?? vazio, atualizadoEm: consulta.dataUpdatedAt };
}

/** Atualiza a cada 5 s, inclusive com a aba em segundo plano (como o setInterval que havia). */
const aoVivo = { refetchInterval: INTERVALO_MS, refetchIntervalInBackground: true } as const;

export function usePosicoesAtuais() {
  return resultado(useQuery({ queryKey: chaves.posicoes, queryFn: posicoesAtuais, ...aoVivo }), SEM_POSICOES);
}

export function useAlertas(somenteAtivos = false) {
  return resultado(
    useQuery({ queryKey: [...chaves.alertas, somenteAtivos], queryFn: () => listarAlertas(somenteAtivos), ...aoVivo }),
    SEM_ALERTAS,
  );
}

export function useTrechos() {
  return resultado(useQuery({ queryKey: chaves.trechos, queryFn: listarTrechos }), SEM_TRECHOS);
}

// Cópias: o mock devolve o mesmo array que depois altera.
export function usePessoas() {
  return resultado(useQuery({ queryKey: chaves.pessoas, queryFn: async () => [...(await listarPessoas())] }), SEM_PESSOAS);
}

export function useDispositivos() {
  return resultado(
    useQuery({ queryKey: chaves.dispositivos, queryFn: async () => [...(await listarDispositivos())] }),
    SEM_DISPOSITIVOS,
  );
}

/** Mantém as linhas anteriores na tela enquanto os filtros novos carregam. */
export function useHistorico(filtros: FiltrosHistorico) {
  return resultado(
    useQuery({
      queryKey: [...chaves.historico, filtros],
      queryFn: () => historico(filtros),
      placeholderData: keepPreviousData,
    }),
    SEM_LINHAS,
  );
}

/** Recarrega tudo que depende do cadastro (pessoas, dispositivos e quem aparece no mapa). */
export function useRecarregarDados() {
  const cliente = useQueryClient();
  return useCallback(
    () =>
      Promise.all(
        ([chaves.pessoas, chaves.dispositivos, chaves.posicoes, chaves.historico] satisfies QueryKey[]).map((queryKey) =>
          cliente.invalidateQueries({ queryKey }),
        ),
      ),
    [cliente],
  );
}
