// Tempo real do painel: WebSocket do navegador em `/ws/painel` da API (arquitetura da
// homologação, `documentos/entregas/KaizenDO-arquitetura-homologacao.docx`).
//
// Ligado só quando `VITE_WS_URL` existe (ex.: `ws://localhost:5173/ws/painel`, que o proxy do Vite
// leva à API; em produção `wss://<servidor>/ws/painel`). Sem ela o painel segue com os dados
// ilustrativos e este hook não faz nada.
//
// O formato do payload de cada evento ainda não está fechado com o back-end: o evento só diz
// QUE algo mudou, e o painel recarrega a consulta correspondente (REST). Quando o payload
// existir, dá para escrever direto no cache em vez de recarregar.
//
// Autenticação do WebSocket (o navegador não envia cabeçalho): em aberto, depende do login do
// painel. Ver `documentos/specs/open-decisions.md`.

import { useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { useEffect } from "react";
import { chaves } from "./consultas";

export const TIPOS_DE_EVENTO = ["posicao", "dispositivo_status", "alerta", "bloqueio", "acionamento"] as const;
export type TipoDeEvento = (typeof TIPOS_DE_EVENTO)[number];

/** Lê uma mensagem do servidor; devolve o tipo, ou `null` se não for um evento conhecido. */
export function tipoDaMensagem(bruto: unknown): TipoDeEvento | null {
  if (typeof bruto !== "string") return null;
  try {
    const tipo = (JSON.parse(bruto) as { tipo?: unknown } | null)?.tipo;
    return TIPOS_DE_EVENTO.find((t) => t === tipo) ?? null;
  } catch {
    return null;
  }
}

/** Quais consultas o evento invalida. `acionamento` ainda não tem tela: nada a recarregar. */
export function consultasAfetadas(tipo: TipoDeEvento | null): QueryKey[] {
  switch (tipo) {
    case "posicao":
      return [chaves.posicoes];
    case "dispositivo_status":
      return [chaves.dispositivos, chaves.posicoes];
    case "alerta":
    case "bloqueio":
      return [chaves.alertas];
    default:
      return [];
  }
}

/** Recuo exponencial entre tentativas de reconexão: 1 s, 2 s, 4 s... até 30 s. */
export function atrasoDeReconexao(tentativa: number) {
  return Math.min(30_000, 1000 * 2 ** tentativa);
}

export function usePainelTempoReal() {
  const cliente = useQueryClient();

  useEffect(() => {
    const url = import.meta.env.VITE_WS_URL as string | undefined;
    if (!url) return;

    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tentativa = 0;
    let encerrado = false;

    const abrir = () => {
      socket = new WebSocket(url);
      socket.onopen = () => {
        tentativa = 0;
        // Perdeu mensagens enquanto estava fora? Recarrega a foto atual (GET /posicoes/atuais).
        void cliente.invalidateQueries({ queryKey: chaves.posicoes });
      };
      socket.onmessage = (e) => {
        for (const queryKey of consultasAfetadas(tipoDaMensagem(e.data))) void cliente.invalidateQueries({ queryKey });
      };
      socket.onclose = () => {
        if (!encerrado) timer = setTimeout(abrir, atrasoDeReconexao(tentativa++));
      };
    };
    abrir();

    return () => {
      encerrado = true;
      clearTimeout(timer);
      socket?.close();
    };
  }, [cliente]);
}
