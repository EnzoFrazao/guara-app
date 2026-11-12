"use client";

// Visão do turno em uma tela. Veja o que falta em ../README.md.

import { useCallback, useEffect, useMemo, useState } from "react";
import { AoVivo } from "@/components/AoVivo";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { listarAlertas, listarTrechos, posicoesAtuais } from "@/lib/dados";
import { COR_STATUS_MAPA, ROTULO_ALERTA, ROTULO_FUNCAO, ROTULO_STATUS } from "@/lib/rotulos";
import type { Alerta, Funcao, PosicaoAtual, StatusTrabalho, Trecho } from "@/lib/tipos";
import { PizzaStatus } from "./PizzaStatus";

const ORDEM_STATUS: StatusTrabalho[] = ["manobrando", "almocando", "aguardando_programacao", "descansando", "sem_sinal"];

/** Status que contam como "em campo agora". Quem está sem sinal não dá para acionar. */
const EM_CAMPO: StatusTrabalho[] = ["manobrando", "almocando", "aguardando_programacao", "descansando"];

const INTERVALO_MS = 5000;

export function DashboardView() {
  const [posicoes, setPosicoes] = useState<PosicaoAtual[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [trechos, setTrechos] = useState<Trecho[]>([]);
  const [atualizadoEm, setAtualizadoEm] = useState(0);

  // Filtros do bloco "trabalhando agora"
  const [status, setStatus] = useState<StatusTrabalho | "">("");
  const [funcao, setFuncao] = useState<Funcao | "">("");
  const [busca, setBusca] = useState("");

  const buscar = useCallback(
    () => Promise.all([posicoesAtuais(), listarAlertas(true), listarTrechos()]),
    [],
  );
  const aplicar = useCallback(([ps, as, ts]: [PosicaoAtual[], Alerta[], Trecho[]]) => {
    setPosicoes(ps);
    setAlertas(as);
    setTrechos(ts);
    setAtualizadoEm(Date.now());
  }, []);

  useEffect(() => {
    buscar().then(aplicar);
    const id = setInterval(() => buscar().then(aplicar), INTERVALO_MS);
    return () => clearInterval(id);
  }, [buscar, aplicar]);

  const porStatus = useCallback((s: StatusTrabalho) => posicoes.filter((p) => p.status === s).length, [posicoes]);
  const bateriaBaixa = posicoes.filter((p) => p.dispositivo.bateriaPct < 20).length;
  const emCampo = posicoes.filter((p) => EM_CAMPO.includes(p.status));
  const aguardando = porStatus("aguardando_programacao");

  const nomePessoa = useMemo(() => new Map(trechos.map((t) => [t.id, t.nome])), [trechos]);

  const trabalhando = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return emCampo
      .filter(
        (p) =>
          (!status || p.status === status) &&
          (!funcao || p.pessoa.funcao === funcao) &&
          (!termo || p.pessoa.nome.toLowerCase().includes(termo) || p.pessoa.matricula.includes(termo)),
      )
      .sort((a, b) => ORDEM_STATUS.indexOf(a.status) - ORDEM_STATUS.indexOf(b.status) || a.pessoa.nome.localeCompare(b.pessoa.nome));
  }, [emCampo, status, funcao, busca]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AoVivo atualizadoEm={atualizadoEm} rotulo="Atualizando a cada 5 s" />
        <p className="text-sm text-zinc-500 claro:text-tinta-suave">
          <strong className="font-semibold text-zinc-200 claro:text-tinta">{emCampo.length}</strong> em campo agora ·{" "}
          <strong className="font-semibold text-emerald-400 claro:text-emerald-700">{aguardando}</strong> aguardando programação
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card titulo="Pessoas com dispositivo ativo">
          <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{posicoes.length}</p>
        </Card>
        <Card titulo="Alertas ativos">
          <p className={`text-2xl font-semibold tabular-nums sm:text-3xl ${alertas.length > 0 ? "text-red-400 claro:text-red-700" : "text-zinc-100 claro:text-tinta"}`}>
            {alertas.length}
          </p>
        </Card>
        <Card titulo="Sem sinal">
          <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{porStatus("sem_sinal")}</p>
        </Card>
        <Card titulo="Bateria abaixo de 20%">
          <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{bateriaBaixa}</p>
        </Card>
      </div>

      {/* No celular a lista "Trabalhando agora" tem ~47 cartões; com os alertas depois dela, eles
          ficavam a uns 4.000 px do topo. Vêm logo depois do resumo; do md em diante (tabela com
          altura máxima) voltam para o fim. */}
      <Card titulo="Alertas ativos" className="md:order-last">
        {alertas.length === 0 ? (
          <p className="text-sm text-zinc-500 claro:text-tinta-suave">Nenhum alerta ativo.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {alertas.map((a) => {
              const pessoa = posicoes.find((p) => p.pessoaId === a.pessoaId)?.pessoa;
              const risco = a.tipo === "area_de_risco" || a.tipo === "pessoa_isolada";
              return (
                <li
                  key={a.id}
                  className={`flex flex-wrap items-center gap-x-2 rounded-md border px-3 py-2 ${
                    risco ? "border-red-500/30 bg-red-500/10" : "border-amber-500/30 bg-amber-500/10"
                  }`}
                >
                  {risco && <span className="pulso inline-block h-1.5 w-1.5 rounded-full bg-red-400 claro:bg-red-600" />}
                  <strong className={risco ? "text-red-200 claro:text-red-800" : "text-amber-200 claro:text-amber-800"}>{ROTULO_ALERTA[a.tipo]}</strong>
                  <span className="text-zinc-400 claro:text-tinta-media">
                    {pessoa?.nome ?? a.pessoaId} · {nomePessoa.get(a.trecho) ?? a.trecho} · desde {a.inicio.slice(11, 16)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Quem está trabalhando agora, com filtro pelos status que já existem. */}
      <Card
        titulo={`Trabalhando agora · ${trabalhando.length} de ${emCampo.length}`}
        acao={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <input
              className="campo min-w-0 basis-full sm:w-44 sm:basis-auto"
              placeholder="Nome ou matrícula"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <select className="campo flex-1 sm:flex-none" value={funcao} onChange={(e) => setFuncao(e.target.value as Funcao | "")}>
              <option value="">Todas as funções</option>
              {Object.entries(ROTULO_FUNCAO).map(([v, r]) => (
                <option key={v} value={v}>{r}</option>
              ))}
            </select>
          </div>
        }
      >
        {/* Os status viram botões de filtro: clicar alterna, clicar de novo limpa.
            No celular a fileira rola para o lado em vez de quebrar em três linhas. */}
        <div className="sem-barra -mx-3 mb-3 flex gap-2 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button
            type="button"
            onClick={() => setStatus("")}
            aria-pressed={status === ""}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors pointer-coarse:py-2.5 ${
              status === "" ? "bg-zinc-100 claro:bg-verde-vale text-zinc-900 claro:text-white" : "bg-zinc-800 claro:bg-nevoa text-zinc-400 claro:text-tinta-media hover:text-zinc-100 claro:hover:text-tinta"
            }`}
          >
            Todos · {emCampo.length}
          </button>
          {EM_CAMPO.map((s) => {
            const n = emCampo.filter((p) => p.status === s).length;
            const ativo = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(ativo ? "" : s)}
                aria-pressed={ativo}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors pointer-coarse:py-2.5 ${
                  ativo ? "bg-zinc-100 claro:bg-verde-vale text-zinc-900 claro:text-white" : "bg-zinc-800 claro:bg-nevoa text-zinc-400 claro:text-tinta-media hover:text-zinc-100 claro:hover:text-tinta"
                }`}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: COR_STATUS_MAPA[s] }}
                />
                {ROTULO_STATUS[s]} · {n}
              </button>
            );
          })}
        </div>

        {/* Celular: um cartão por pessoa. Sem altura máxima aqui, para não criar uma
            rolagem dentro da rolagem da página. */}
        <ul className="grid gap-2 md:hidden">
          {trabalhando.map((p) => (
            <li key={p.pessoaId} className="rounded-md border border-zinc-800 claro:border-traco bg-zinc-950 claro:bg-areia px-3 py-2.5 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-zinc-100 claro:text-tinta">{p.pessoa.nome}</span>
                <StatusBadge status={p.status} />
              </div>
              <p className="mt-1 text-xs text-zinc-400 claro:text-tinta-media">
                {ROTULO_FUNCAO[p.pessoa.funcao]} · Turno {p.pessoa.turno} ·{" "}
                <span className="font-mono text-zinc-500 claro:text-tinta-suave">{p.pessoa.matricula}</span>
              </p>
              <p className="text-xs text-zinc-500 claro:text-tinta-suave">
                {nomePessoa.get(p.trecho) ?? p.trecho} · <span className="tabular-nums">{p.velocidadeKmh} km/h</span>
              </p>
            </li>
          ))}
          {trabalhando.length === 0 && <li className="py-6 text-center text-zinc-500 claro:text-tinta-suave">Ninguém com esses filtros.</li>}
        </ul>

        <div className="hidden max-h-80 overflow-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-zinc-900 claro:bg-papel text-xs uppercase tracking-wide text-zinc-500 claro:text-tinta-suave">
              <tr>
                <th className="py-2">Nome</th>
                <th>Função</th>
                <th>Turno</th>
                <th>Trecho</th>
                <th>Velocidade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trabalhando.map((p) => (
                <tr key={p.pessoaId} className="border-t border-zinc-800 claro:border-traco">
                  <td className="py-2">
                    {p.pessoa.nome}
                    <span className="ml-2 font-mono text-xs text-zinc-600 claro:text-tinta-suave">{p.pessoa.matricula}</span>
                  </td>
                  <td className="text-zinc-400 claro:text-tinta-media">{ROTULO_FUNCAO[p.pessoa.funcao]}</td>
                  <td className="text-zinc-400 claro:text-tinta-media">{p.pessoa.turno}</td>
                  <td className="text-zinc-400 claro:text-tinta-media">{nomePessoa.get(p.trecho) ?? p.trecho}</td>
                  <td className="tabular-nums text-zinc-400 claro:text-tinta-media">{p.velocidadeKmh} km/h</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
              {trabalhando.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-zinc-500 claro:text-tinta-suave">
                    Ninguém com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card titulo="Pessoas por status">
        <PizzaStatus fatias={ORDEM_STATUS.map((s) => ({ status: s, n: porStatus(s) }))} />
      </Card>
    </div>
  );
}
