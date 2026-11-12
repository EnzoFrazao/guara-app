"use client";

// Tela do administrador: cadastra operários e ESP32 e vincula um ao outro.
// O operário não acessa o sistema — ele só é identificado pela tag que carrega.
// O cadastro em si é o wizard (NovoCadastroWizard); aqui ficam o resumo, a gestão dos
// vínculos e o estoque. Veja o que falta em ../README.md.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import {
  cadastrarDispositivo,
  listarDispositivos,
  listarPessoas,
  removerPessoa,
  restaurarDados,
  vincularDispositivo,
} from "@/lib/dados";
import { COR_BATERIA, ROTULO_FUNCAO, ROTULO_TURNO, faixaBateria } from "@/lib/rotulos";
import type { Dispositivo, Funcao, Pessoa, Turno } from "@/lib/tipos";
import { NovoCadastroWizard } from "./NovoCadastroWizard";

function Bateria({ pct }: { pct: number }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COR_BATERIA[faixaBateria(pct)]}`}>
      {pct}%
    </span>
  );
}

/**
 * "agora" ou "há 12 min" quando o sinal é recente; senão a hora (10:23), com a data junto
 * se for de outro dia. O relativo só vale para a última hora: os dados ilustrativos têm
 * horário fixo e, fora dessa janela, "há N h" passaria a mentir.
 */
function desde(iso: string, agora: number) {
  const data = new Date(iso);
  const minutos = Math.floor((agora - data.getTime()) / 60_000);
  if (minutos >= 0 && minutos < 60) return minutos < 1 ? "agora" : `há ${minutos} min`;
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const mesmoDia = data.toDateString() === new Date(agora).toDateString();
  return mesmoDia ? hora : `${data.toLocaleDateString("pt-BR")} ${hora}`;
}

export function CadastroView() {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  // Fica em estado, e não em Date.now() no render, para o servidor e o navegador
  // renderizarem a mesma coisa na primeira passada.
  const [agora, setAgora] = useState(0);

  const [busca, setBusca] = useState("");
  const [filtroFuncao, setFiltroFuncao] = useState<Funcao | "">("");
  const [filtroTurno, setFiltroTurno] = useState<Turno | "">("");
  // Cadastro avulso de ESP32: o lote de dispositivos costuma chegar antes das pessoas,
  // então dá para encher o estoque sem precisar criar ninguém. O wizard continua
  // permitindo cadastrar um já vinculado, que é o caso de quem recebe a tag na hora.
  const [novoId, setNovoId] = useState("");
  const [novoMac, setNovoMac] = useState("");

  /** Id da pessoa esperando confirmação de exclusão. Excluir não é um clique só. */
  const [confirmando, setConfirmando] = useState<string | null>(null);

  const buscar = useCallback(() => Promise.all([listarPessoas(), listarDispositivos()]), []);

  // O lint não deixa chamar setState direto no corpo de um efeito, então a carga
  // inicial e as recargas passam por aqui, sempre dentro de um callback.
  const aplicar = useCallback(([ps, ds]: [Pessoa[], Dispositivo[]]) => {
    setPessoas([...ps]);
    setDispositivos([...ds]);
    setAgora(Date.now());
  }, []);

  useEffect(() => {
    buscar().then(aplicar);
  }, [buscar, aplicar]);

  /** Roda uma ação de cadastro, recarrega a tela e mostra o erro ou a confirmação. */
  const executar = useCallback(
    async (acao: () => Promise<string>) => {
      setErro(null);
      setSucesso(null);
      try {
        const mensagem = await acao();
        aplicar(await buscar());
        setSucesso(mensagem);
      } catch (e) {
        setErro((e as Error).message);
      }
    },
    [buscar, aplicar],
  );

  const recarregarCom = useCallback(
    async (mensagem: string) => {
      setErro(null);
      aplicar(await buscar());
      setSucesso(mensagem);
    },
    [buscar, aplicar],
  );

  const livres = useMemo(() => dispositivos.filter((d) => !d.pessoaId), [dispositivos]);
  const porId = useMemo(() => new Map(dispositivos.map((d) => [d.id, d])), [dispositivos]);
  const semDispositivo = pessoas.filter((p) => !p.dispositivoId).length;

  const filtradas = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return pessoas.filter(
      (p) =>
        (!filtroFuncao || p.funcao === filtroFuncao) &&
        (!filtroTurno || p.turno === filtroTurno) &&
        (!termo || p.nome.toLowerCase().includes(termo) || p.matricula.includes(termo)),
    );
  }, [pessoas, busca, filtroFuncao, filtroTurno]);

  // A troca de ESP32 e a exclusão aparecem na tabela (desktop) e nos cartões (celular).
  const seletorDispositivo = (p: Pessoa, className = "") => (
    <select
      className={`campo font-mono ${className}`}
      aria-label={`ESP32 de ${p.nome}`}
      value={p.dispositivoId ?? ""}
      onChange={(e) => {
        const escolhido = e.target.value || null;
        executar(async () => {
          await vincularDispositivo(p.id, escolhido);
          return escolhido
            ? `${escolhido} vinculado a ${p.nome}.`
            : `${p.nome} ficou sem dispositivo e sai do mapa.`;
        });
      }}
    >
      <option value="">Sem dispositivo</option>
      {p.dispositivoId && <option value={p.dispositivoId}>{p.dispositivoId}</option>}
      {livres.map((d) => <option key={d.id} value={d.id}>{d.id}</option>)}
    </select>
  );

  const acoesExcluir = (p: Pessoa) =>
    confirmando === p.id ? (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-zinc-400 claro:text-tinta-media">Excluir?</span>
        <button
          type="button"
          className="rounded border border-red-500/40 claro:border-vermelho-vale/40 bg-red-500/10 claro:bg-vermelho-vale/8 px-2 py-0.5 text-xs font-medium text-red-300 claro:text-vermelho-vale pointer-coarse:px-3 pointer-coarse:py-2 hover:bg-red-500/20 claro:hover:bg-vermelho-vale/15"
          onClick={() => {
            setConfirmando(null);
            executar(async () => {
              const fora = await removerPessoa(p.id);
              return fora.dispositivoId
                ? `${fora.nome} foi excluída. O ${fora.dispositivoId} voltou para o estoque.`
                : `${fora.nome} foi excluída do cadastro.`;
            });
          }}
        >
          Sim
        </button>
        <button
          type="button"
          className="rounded border border-zinc-700 claro:border-traco-forte px-2 py-0.5 text-xs pointer-coarse:px-3 pointer-coarse:py-2 text-zinc-400 claro:text-tinta-media hover:text-zinc-100 claro:hover:text-tinta"
          onClick={() => setConfirmando(null)}
        >
          Não
        </button>
      </span>
    ) : (
      <button
        type="button"
        aria-label={`Excluir ${p.nome}`}
        className="rounded border border-zinc-800 claro:border-traco px-2 py-0.5 text-xs pointer-coarse:px-3 pointer-coarse:py-2 text-zinc-500 claro:text-tinta-suave hover:border-red-500/40 claro:hover:border-vermelho-vale/40 hover:text-red-300 claro:hover:text-vermelho-vale"
        onClick={() => setConfirmando(p.id)}
      >
        Excluir
      </button>
    );

  return (
    <div className="grid gap-4">
      <p className="rounded-lg border border-zinc-800 claro:border-traco bg-zinc-900 claro:bg-papel px-4 py-3 text-sm text-zinc-400 claro:text-tinta-media">
        Esta é a área do administrador. O operário <strong className="font-medium text-zinc-100 claro:text-tinta">não acessa o
        sistema</strong>: ele é identificado automaticamente pelo ESP32 que carrega, e é esse vínculo que faz o nome
        dele aparecer no mapa, no dashboard e no histórico.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card titulo="Pessoas cadastradas">
          <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{pessoas.length}</p>
        </Card>
        <Card titulo="Com ESP32 vinculado">
          <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{pessoas.length - semDispositivo}</p>
        </Card>
        <Card titulo="Sem ESP32">
          <p className={`text-2xl font-semibold tabular-nums sm:text-3xl ${semDispositivo > 0 ? "text-amber-400 claro:text-amber-700" : ""}`}>
            {semDispositivo}
          </p>
        </Card>
        <Card titulo="ESP32 livres no estoque">
          <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{livres.length}</p>
        </Card>
      </div>

      {erro && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 claro:text-red-700">
          {erro}
        </p>
      )}
      {sucesso && (
        <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 claro:text-emerald-700">
          {sucesso}
        </p>
      )}

      <NovoCadastroWizard livres={livres} aoConcluir={recarregarCom} />

      <Card
        titulo="Pessoas e dispositivos vinculados"
        acao={<span className="text-sm text-zinc-500 claro:text-tinta-suave tabular-nums">{filtradas.length} de {pessoas.length}</span>}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <input
            className="campo w-full sm:w-auto"
            placeholder="Buscar por nome ou matrícula"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select className="campo min-w-0 flex-1 sm:flex-none" value={filtroFuncao} onChange={(e) => setFiltroFuncao(e.target.value as Funcao | "")}>
            <option value="">Todas as funções</option>
            {Object.entries(ROTULO_FUNCAO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
          <select className="campo min-w-0 flex-1 sm:flex-none" value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value as Turno | "")}>
            <option value="">Todos os turnos</option>
            {Object.entries(ROTULO_TURNO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
          </select>
        </div>

        {/* Celular: um cartão por pessoa, com o mesmo seletor de ESP32 e a mesma exclusão. */}
        <ul className="grid gap-2 md:hidden">
          {filtradas.map((p) => {
            const dispositivo = p.dispositivoId ? porId.get(p.dispositivoId) : undefined;
            return (
              <li key={p.id} className="grid gap-2 rounded-md border border-zinc-800 claro:border-traco bg-zinc-950 claro:bg-areia px-3 py-2.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-100 claro:text-tinta">{p.nome}</p>
                    <p className="text-xs text-zinc-400 claro:text-tinta-media">
                      <span className="font-mono">{p.matricula}</span> · {ROTULO_FUNCAO[p.funcao]} · Turno {p.turno}
                    </p>
                  </div>
                  {dispositivo && <Bateria pct={dispositivo.bateriaPct} />}
                </div>
                <div className="flex items-center gap-2">
                  {seletorDispositivo(p, "min-w-0 flex-1")}
                  <span className="shrink-0">{acoesExcluir(p)}</span>
                </div>
              </li>
            );
          })}
          {filtradas.length === 0 && (
            <li className="py-6 text-center text-zinc-500 claro:text-tinta-suave">Nenhuma pessoa encontrada com esses filtros.</li>
          )}
        </ul>

        <div className="hidden max-h-[32rem] overflow-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-zinc-900 claro:bg-papel text-xs uppercase tracking-wide text-zinc-500 claro:text-tinta-suave">
              <tr>
                <th className="py-2">Nome</th>
                <th>Matrícula</th>
                <th>Função</th>
                <th>Turno</th>
                <th className="w-px whitespace-nowrap">ESP32 vinculado</th>
                <th className="w-px whitespace-nowrap pl-3">Bateria</th>
                <th className="w-px whitespace-nowrap pl-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((p) => {
                const dispositivo = p.dispositivoId ? porId.get(p.dispositivoId) : undefined;
                return (
                  <tr key={p.id} className="border-t border-zinc-800 claro:border-traco">
                    <td className="py-2">{p.nome}</td>
                    <td className="font-mono text-xs text-zinc-400 claro:text-tinta-media">{p.matricula}</td>
                    <td className="text-zinc-400 claro:text-tinta-media">{ROTULO_FUNCAO[p.funcao]}</td>
                    <td className="text-zinc-400 claro:text-tinta-media">{p.turno}</td>
                    <td className="w-px whitespace-nowrap">{seletorDispositivo(p)}</td>
                    <td className="w-px whitespace-nowrap pl-3">
                      {dispositivo ? <Bateria pct={dispositivo.bateriaPct} /> : <span className="text-zinc-600 claro:text-tinta-suave">—</span>}
                    </td>
                    <td className="w-px whitespace-nowrap py-1 pl-3 text-right">{acoesExcluir(p)}</td>
                  </tr>
                );
              })}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-zinc-500 claro:text-tinta-suave">
                    Nenhuma pessoa encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card titulo={`Estoque de ESP32 livres: ${livres.length}`}>
        <form
          className="mb-3 flex flex-wrap items-end gap-2 border-b border-zinc-800 claro:border-traco pb-3"
          onSubmit={(evento) => {
            evento.preventDefault();
            executar(async () => {
              const criado = await cadastrarDispositivo(novoId, novoMac);
              setNovoId("");
              setNovoMac("");
              return `${criado.id} entrou no estoque, pronto para vincular.`;
            });
          }}
        >
          <label className="grid min-w-0 flex-1 gap-1 text-sm sm:flex-none">
            <span className="text-xs text-zinc-500 claro:text-tinta-suave">Id da etiqueta</span>
            <input
              className="campo font-mono w-full sm:w-40"
              value={novoId}
              onChange={(e) => setNovoId(e.target.value)}
              placeholder="ESP32-0B04"
              required
            />
          </label>
          <label className="grid min-w-0 flex-1 gap-1 text-sm sm:flex-none">
            <span className="text-xs text-zinc-500 claro:text-tinta-suave">MAC do módulo</span>
            <input
              className="campo font-mono w-full sm:w-48"
              value={novoMac}
              onChange={(e) => setNovoMac(e.target.value)}
              placeholder="24:6F:28:FF:B0:04"
              required
            />
          </label>
          <button type="submit" className="botao">Adicionar ao estoque</button>
        </form>

        {livres.length === 0 ? (
          <p className="text-sm text-zinc-500 claro:text-tinta-suave">
            Nenhum livre. Cadastre um acima, ou desvincule algum em uso na tabela.
          </p>
        ) : (
          <ul className="grid gap-1.5 md:grid-cols-2">
            {livres.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-zinc-800 claro:border-traco bg-zinc-950 claro:bg-areia px-3 py-1.5 text-sm">
                <span className="font-mono text-zinc-100 claro:text-tinta">{d.id}</span>
                <Bateria pct={d.bateriaPct} />
                <span className="ml-auto text-xs text-zinc-600 claro:text-tinta-suave">
                  {agora ? `último sinal: ${desde(d.ultimoSinal, agora)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 claro:border-traco bg-zinc-900 claro:bg-papel px-4 py-3 text-sm">
        <p className="text-zinc-500 claro:text-tinta-suave">
          Os cadastros ficam guardados neste navegador, sem servidor. Antes de apresentar, volte aos dados originais.
        </p>
        <button
          type="button"
          className="botao-secundario"
          onClick={() =>
            executar(async () => {
              await restaurarDados();
              return "Dados voltaram ao estado original.";
            })
          }
        >
          Restaurar dados originais
        </button>
      </div>
    </div>
  );
}
