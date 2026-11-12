"use client";

// Cadastro de uma pessoa em 4 passos. As regras de validação não moram aqui: vêm de
// @/lib/dados, as mesmas que o cadastro usa no fim. Aqui elas só são chamadas mais cedo,
// para o passo errado não deixar avançar.

import { useCallback, useState } from "react";
import { Card } from "@/components/Card";
import {
  cadastrarDispositivo,
  cadastrarPessoa,
  normalizarIdDispositivo,
  normalizarNome,
  validarIdDispositivo,
  validarMac,
  validarMatricula,
  validarNome,
} from "@/lib/dados";
import { ROTULO_FUNCAO, ROTULO_TURNO } from "@/lib/rotulos";
import type { Dispositivo, Funcao, Turno } from "@/lib/tipos";

const PASSOS = ["Pessoa", "Função e turno", "Dispositivo", "Conferir"];

type ModoDispositivo = "livre" | "novo" | "nenhum";

export function NovoCadastroWizard({
  livres,
  aoConcluir,
}: {
  livres: Dispositivo[];
  aoConcluir: (mensagem: string) => void | Promise<void>;
}) {
  const [passo, setPasso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");
  const [matricula, setMatricula] = useState("");
  const [funcao, setFuncao] = useState<Funcao>("manobrista");
  const [turno, setTurno] = useState<Turno>("A");
  const [modo, setModo] = useState<ModoDispositivo>("livre");
  const [escolhido, setEscolhido] = useState("");
  const [novoId, setNovoId] = useState("");
  const [novoMac, setNovoMac] = useState("");

  // Foco automático no primeiro campo só com mouse. No celular, focar sozinho abre o
  // teclado assim que a pessoa toca na aba Cadastro, cobrindo metade da tela.
  // Estável (useCallback) para o React só chamar ao montar o campo, e não a cada render.
  const focarComMouse = useCallback((campo: HTMLInputElement | null) => {
    if (campo && window.matchMedia("(pointer: fine)").matches) campo.focus();
  }, []);

  function limpar() {
    setPasso(0);
    setNome("");
    setMatricula("");
    setFuncao("manobrista");
    setTurno("A");
    setModo("livre");
    setEscolhido("");
    setNovoId("");
    setNovoMac("");
    setErro(null);
  }

  /** Erro do passo atual, ou null quando dá para avançar. */
  function problemaDoPasso(n: number): string | null {
    if (n === 0) return validarNome(nome) ?? validarMatricula(matricula);
    if (n === 2) {
      if (modo === "livre" && !escolhido) return "Escolha um ESP32 da lista ou siga sem dispositivo.";
      if (modo === "novo") return validarIdDispositivo(novoId) ?? validarMac(novoMac);
    }
    return null;
  }

  function avancar() {
    const problema = problemaDoPasso(passo);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    // Sem ESP32 livre no estoque, o passo 3 já começa na opção de cadastrar um novo.
    if (passo === 1 && livres.length === 0 && modo === "livre") setModo("novo");
    setPasso((p) => p + 1);
  }

  async function concluir() {
    setErro(null);
    setSalvando(true);
    try {
      let dispositivoId: string | null = null;
      if (modo === "novo") {
        const criado = await cadastrarDispositivo(novoId, novoMac);
        dispositivoId = criado.id;
      } else if (modo === "livre") {
        dispositivoId = escolhido || null;
      }

      const criada = await cadastrarPessoa({ nome, matricula, funcao, turno, dispositivoId });
      // "Pessoa cadastrada" concorda com "pessoa", não com o gênero de quem foi cadastrado.
      const mensagem = dispositivoId
        ? `Pessoa cadastrada: ${criada.nome}, com o ${dispositivoId}. Já aparece no mapa.`
        : `Pessoa cadastrada: ${criada.nome}. Vincule um ESP32 para ela aparecer no mapa.`;
      limpar();
      await aoConcluir(mensagem);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  const rotuloDispositivo =
    modo === "novo" ? normalizarIdDispositivo(novoId) : modo === "livre" ? escolhido : "Sem dispositivo";

  return (
    <Card
      titulo="Novo cadastro"
      acao={
        passo > 0 && (
          <button type="button" className="botao-secundario" onClick={limpar}>
            Começar de novo
          </button>
        )
      }
    >
      {/* Trilha dos passos. No celular só o passo atual mostra o nome, para caber numa linha. */}
      <ol className="mb-5 flex items-center gap-x-2 gap-y-2 sm:flex-wrap">
        {PASSOS.map((rotulo, i) => {
          const feito = i < passo;
          const atual = i === passo;
          return (
            <li key={rotulo} className="flex shrink-0 items-center gap-2">
              <span
                aria-current={atual ? "step" : undefined}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  atual
                    ? "bg-zinc-100 claro:bg-verde-vale text-zinc-900 claro:text-white"
                    : feito
                      ? "bg-emerald-500/20 text-emerald-300 claro:text-emerald-700 ring-1 ring-emerald-500/40"
                      : "bg-zinc-800 claro:bg-nevoa text-zinc-500 claro:text-tinta-suave"
                }`}
              >
                {feito ? "✓" : i + 1}
              </span>
              <span
                className={`text-sm ${atual ? "font-medium text-zinc-100 claro:text-tinta" : "hidden text-zinc-500 claro:text-tinta-suave sm:inline"}`}
              >
                {rotulo}
              </span>
              {i < PASSOS.length - 1 && <span className="mx-0.5 h-px w-4 bg-zinc-800 claro:bg-nevoa sm:mx-1 sm:w-6" />}
            </li>
          );
        })}
      </ol>

      {passo === 0 && (
        <div className="grid max-w-md gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400 claro:text-tinta-media">Nome completo</span>
            <input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ana Ribeiro" ref={focarComMouse} />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400 claro:text-tinta-media">Matrícula</span>
            <input
              className="campo font-mono"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="810000"
              inputMode="numeric"
            />
          </label>
        </div>
      )}

      {passo === 1 && (
        <div className="grid max-w-md gap-4">
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm text-zinc-400 claro:text-tinta-media">Função</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROTULO_FUNCAO) as Funcao[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFuncao(f)}
                  aria-pressed={funcao === f}
                  className={`min-h-11 rounded-md border px-3 py-2 text-sm transition-colors ${
                    funcao === f
                      ? "border-zinc-100 claro:border-verde-vale bg-zinc-100 claro:bg-verde-vale font-medium text-zinc-900 claro:text-white"
                      : "border-zinc-800 claro:border-traco bg-zinc-950 claro:bg-areia text-zinc-300 claro:text-tinta-media hover:border-zinc-700 claro:hover:border-traco-forte"
                  }`}
                >
                  {ROTULO_FUNCAO[f]}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 claro:text-tinta-suave">
              Maquinista fica na locomotiva; manobrista fica no chão. O ranking de acionamento filtra por função.
            </p>
          </fieldset>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-400 claro:text-tinta-media">Turno</span>
            <select className="campo" value={turno} onChange={(e) => setTurno(e.target.value as Turno)}>
              {Object.entries(ROTULO_TURNO).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </label>
        </div>
      )}

      {passo === 2 && (
        <div className="grid max-w-lg gap-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["livre", `Usar um do estoque (${livres.length})`],
                ["novo", "Cadastrar um novo"],
                ["nenhum", "Seguir sem dispositivo"],
              ] as [ModoDispositivo, string][]
            ).map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                onClick={() => {
                  setModo(valor);
                  setErro(null);
                }}
                aria-pressed={modo === valor}
                disabled={valor === "livre" && livres.length === 0}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 pointer-coarse:py-2.5 ${
                  modo === valor ? "bg-zinc-100 claro:bg-verde-vale text-zinc-900 claro:text-white" : "bg-zinc-800 claro:bg-nevoa text-zinc-400 claro:text-tinta-media hover:text-zinc-100 claro:hover:text-tinta"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </div>

          {modo === "livre" && (
            <ul className="grid gap-1.5">
              {livres.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setEscolhido(d.id)}
                    aria-pressed={escolhido === d.id}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      escolhido === d.id
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-zinc-800 claro:border-traco bg-zinc-950 claro:bg-areia hover:border-zinc-700 claro:hover:border-traco-forte"
                    }`}
                  >
                    <span className="font-mono text-zinc-100 claro:text-tinta">{d.id}</span>
                    <span className="text-xs text-zinc-500 claro:text-tinta-suave">bateria {d.bateriaPct}%</span>
                    <span className="ml-auto hidden font-mono text-xs text-zinc-600 claro:text-tinta-suave sm:inline">{d.mac}</span>
                  </button>
                </li>
              ))}
              {livres.length === 0 && (
                <li className="rounded-md border border-zinc-800 claro:border-traco bg-zinc-950 claro:bg-areia px-3 py-3 text-sm text-zinc-500 claro:text-tinta-suave">
                  Nenhum ESP32 livre no estoque. Cadastre um novo ou siga sem dispositivo.
                </li>
              )}
            </ul>
          )}

          {modo === "novo" && (
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-400 claro:text-tinta-media">Id da etiqueta</span>
                <input className="campo font-mono" value={novoId} onChange={(e) => setNovoId(e.target.value)} placeholder="ESP32-0B04" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-zinc-400 claro:text-tinta-media">MAC do módulo</span>
                <input className="campo font-mono" value={novoMac} onChange={(e) => setNovoMac(e.target.value)} placeholder="24:6F:28:FF:B0:04" />
              </label>
              <p className="text-xs text-zinc-500 claro:text-tinta-suave">
                O dispositivo é cadastrado e já sai vinculado a esta pessoa.
              </p>
            </div>
          )}

          {modo === "nenhum" && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 claro:text-amber-800">
              Sem ESP32, a pessoa fica cadastrada mas <strong>não aparece no mapa nem no dashboard</strong>. Dá para
              vincular depois, na tabela abaixo.
            </p>
          )}
        </div>
      )}

      {passo === 3 && (
        <dl className="grid max-w-md gap-2 text-sm">
          {[
            ["Nome", normalizarNome(nome)],
            ["Matrícula", matricula.trim()],
            ["Função", ROTULO_FUNCAO[funcao]],
            ["Turno", ROTULO_TURNO[turno]],
            ["ESP32", rotuloDispositivo],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="flex justify-between gap-4 border-b border-zinc-800 claro:border-traco pb-2">
              <dt className="text-zinc-500 claro:text-tinta-suave">{rotulo}</dt>
              <dd className="text-right font-medium text-zinc-100 claro:text-tinta">{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      {erro && (
        <p role="alert" className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 claro:text-red-700">
          {erro}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="botao-secundario"
          onClick={() => {
            setErro(null);
            setPasso((p) => p - 1);
          }}
          disabled={passo === 0 || salvando}
        >
          Voltar
        </button>
        {passo < PASSOS.length - 1 ? (
          <button type="button" className="botao" onClick={avancar}>
            Continuar
          </button>
        ) : (
          <button type="button" className="botao" onClick={concluir} disabled={salvando}>
            {salvando ? "Cadastrando…" : "Concluir cadastro"}
          </button>
        )}
        <span className="ml-auto text-xs text-zinc-600 claro:text-tinta-suave">
          Passo {passo + 1} de {PASSOS.length}
        </span>
      </div>
    </Card>
  );
}
