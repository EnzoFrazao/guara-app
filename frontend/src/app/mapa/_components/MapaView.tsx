"use client";

// Filtros, legenda e atualização periódica. Veja o que falta em ../README.md.
// O Leaflet usa `window`, então o mapa é carregado só no navegador (ssr: false).

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AoVivo } from "@/components/AoVivo";
import { Card } from "@/components/Card";
import { raioDeCobertura } from "@/lib/cobertura";
import { PainelFiltros } from "@/components/PainelFiltros";
import { listarTrechos, posicoesAtuais } from "@/lib/dados";
import { COR_STATUS_MAPA, ROTULO_FUNCAO, ROTULO_STATUS, ROTULO_TURNO } from "@/lib/rotulos";
import type { Funcao, PosicaoAtual, StatusTrabalho, Trecho, TrechoId, Turno } from "@/lib/tipos";

const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => <div className="h-[60svh] min-h-80 animate-pulse lg:h-[560px] rounded-lg border border-zinc-800 claro:border-traco bg-zinc-900 claro:bg-papel" />,
});

const INTERVALO_MS = 5000;

export function MapaView() {
  const [posicoes, setPosicoes] = useState<PosicaoAtual[]>([]);
  const [trechos, setTrechos] = useState<Trecho[]>([]);
  const [atualizadoEm, setAtualizadoEm] = useState(0);
  const [funcao, setFuncao] = useState<Funcao | "">("");
  const [status, setStatus] = useState<StatusTrabalho | "">("");
  const [turno, setTurno] = useState<Turno | "">("");
  const [trecho, setTrecho] = useState<TrechoId | "">("");
  const [busca, setBusca] = useState("");
  const [cobertura, setCobertura] = useState(true);

  const aplicar = useCallback((ps: PosicaoAtual[]) => {
    setPosicoes(ps);
    setAtualizadoEm(Date.now());
  }, []);

  useEffect(() => {
    posicoesAtuais().then(aplicar);
    const id = setInterval(() => posicoesAtuais().then(aplicar), INTERVALO_MS);
    return () => clearInterval(id);
  }, [aplicar]);

  useEffect(() => {
    listarTrechos().then(setTrechos);
  }, []);

  const filtradas = useMemo(
    () =>
      posicoes.filter(
        (p) =>
          (!funcao || p.pessoa.funcao === funcao) &&
          (!status || p.status === status) &&
          (!turno || p.pessoa.turno === turno) &&
          (!trecho || p.trecho === trecho) &&
          (!busca || p.pessoa.nome.toLowerCase().includes(busca.toLowerCase())),
      ),
    [posicoes, funcao, status, turno, trecho, busca],
  );

  const foraDoPatio = useMemo(() => new Set(trechos.filter((t) => t.foraDoPatio).map((t) => t.id)), [trechos]);

  // Recalcula com o filtro: a malha mostrada é a de quem está no mapa. Quem está fora da pera
  // (restaurante, ~2,6 km) não entra na conta, senão o raio iria a ~1,4 km e a malha do pátio
  // viraria uma mancha só. Essas pessoas ganham a própria gosma, com o mesmo raio.
  const raioCobertura = useMemo(() => {
    const doPatio = filtradas.filter((p) => !foraDoPatio.has(p.trecho));
    return raioDeCobertura((doPatio.length > 0 ? doPatio : filtradas).map((p): [number, number] => [p.lat, p.lon]));
  }, [filtradas, foraDoPatio]);
  // Sem os trechos ainda não dá para saber quem está fora do pátio: espera para não piscar a mancha.
  const mostrarCobertura = cobertura && trechos.length > 0;

  return (
    <div className="grid gap-4">
      <Card>
        <PainelFiltros
          busca={<input className="campo" placeholder="Buscar pessoa" value={busca} onChange={(e) => setBusca(e.target.value)} />}
          ativos={[funcao, status, turno, trecho].filter(Boolean).length}
          depois={
            <div className="flex items-center justify-between gap-3 lg:contents">
              <span className="text-sm text-zinc-400 claro:text-tinta-media">
                <strong className="font-semibold text-zinc-100 claro:text-tinta tabular-nums">{filtradas.length}</strong> no mapa
              </span>
              <div className="lg:ml-auto">
                <AoVivo atualizadoEm={atualizadoEm} rotulo="Posições a cada 5 s" />
              </div>
            </div>
          }
        >
          <select className="campo" value={funcao} onChange={(e) => setFuncao(e.target.value as Funcao | "")}>
            <option value="">Todas as funções</option>
            {Object.entries(ROTULO_FUNCAO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
          <select className="campo" value={status} onChange={(e) => setStatus(e.target.value as StatusTrabalho | "")}>
            <option value="">Todos os status</option>
            {Object.entries(ROTULO_STATUS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
          <select className="campo" value={turno} onChange={(e) => setTurno(e.target.value as Turno | "")}>
            <option value="">Todos os turnos</option>
            {Object.entries(ROTULO_TURNO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
          <select className="campo" value={trecho} onChange={(e) => setTrecho(e.target.value as TrechoId | "")}>
            <option value="">Todos os trechos</option>
            {trechos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-zinc-300 claro:text-tinta-media">
            <input type="checkbox" checked={cobertura} onChange={(e) => setCobertura(e.target.checked)} />
            Cobertura
          </label>
        </PainelFiltros>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-zinc-800 claro:border-traco pt-3 text-xs text-zinc-400 claro:text-tinta-media">
          {Object.entries(COR_STATUS_MAPA).map(([s, cor]) => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: cor }} />
              {ROTULO_STATUS[s as StatusTrabalho]}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full border border-red-400/60 bg-red-500/20" />
            Área de risco (viradores)
          </span>
          {mostrarCobertura && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full border border-blue-400 bg-blue-500/25" />
              {/* Um span só: soltos, texto e número viram itens do flex e o gap separa demais. */}
              <span>
                Cobertura · raio <span className="tabular-nums">{raioCobertura}</span> m
              </span>
            </span>
          )}
          <span className="w-full text-zinc-600 claro:text-tinta-suave sm:ml-auto sm:w-auto">Ponto maior = maquinista</span>
        </div>
      </Card>

      <MapaLeaflet posicoes={filtradas} raioCoberturaM={mostrarCobertura ? raioCobertura : 0} />
    </div>
  );
}
