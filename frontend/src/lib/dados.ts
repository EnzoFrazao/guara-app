// Funções de dados usadas pelas telas. Devolvem dados ILUSTRATIVOS de dados-mock.ts.
// O protótipo é só visual: as telas sempre pegam dados por aqui, nunca direto do mock.
//
// Cadastro: pessoas e dispositivos ficam guardados no localStorage do navegador, para o
// que foi cadastrado sobreviver ao F5 durante a demonstração. Continua sendo tudo front,
// sem servidor e sem banco. `restaurarDados()` volta ao estado original de dados-mock.ts.
//
// As validações abaixo (formato de matrícula, de id ESP32 e de MAC, duplicidade, vínculo
// 1 para 1) ficam aqui e não na tela, para quando a fonte virar o backend de verdade.

import { ADMIN_ATUAL, ALERTAS, DISPOSITIVOS, LEITURAS, PESSOAS, TRECHOS, leituraInicial } from "./dados-mock";
import type {
  Admin,
  Alerta,
  Dispositivo,
  FiltrosHistorico,
  Leitura,
  Pessoa,
  PosicaoAtual,
  Trecho,
} from "./tipos";

const atraso = <T,>(valor: T) => new Promise<T>((r) => setTimeout(() => r(valor), 150));

const CHAVE = "guara.cadastro.v1";

/** Cópia do estado inicial, tirada antes de qualquer alteração. Base do "restaurar". */
const SEMENTE = {
  pessoas: PESSOAS.map((p) => ({ ...p })),
  dispositivos: DISPOSITIVOS.map((d) => ({ ...d })),
};

let hidratado = false;

/** Troca o conteúdo do array sem trocar a referência, que as outras telas já importaram. */
function repor<T>(destino: T[], origem: readonly T[]) {
  destino.splice(0, destino.length, ...origem);
}

/** Lê o localStorage na primeira chamada. No servidor (SSR) não faz nada. */
function hidratar() {
  if (hidratado || typeof window === "undefined") return;
  hidratado = true;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return;
    const salvo = JSON.parse(bruto) as { pessoas?: Pessoa[]; dispositivos?: Dispositivo[] };
    if (Array.isArray(salvo.pessoas) && salvo.pessoas.length > 0) repor(PESSOAS, salvo.pessoas);
    if (Array.isArray(salvo.dispositivos) && salvo.dispositivos.length > 0) repor(DISPOSITIVOS, salvo.dispositivos);
  } catch {
    // Dado corrompido ou de um formato antigo: descarta e segue com a semente do mock.
    window.localStorage.removeItem(CHAVE);
  }
}

function persistir() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify({ pessoas: PESSOAS, dispositivos: DISPOSITIVOS }));
  } catch {
    // Cota cheia ou navegação privada: o cadastro continua funcionando só em memória.
  }
}

/** Próximo id sequencial da lista (P001, P002…), à prova de remoções. */
function proximoId(ids: readonly string[], prefixo: string) {
  const maior = ids.reduce((max, id) => {
    const n = Number(id.slice(prefixo.length));
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);
  return `${prefixo}${String(maior + 1).padStart(3, "0")}`;
}

/**
 * Quem está usando o sistema. Fixo no protótipo: não existe login, para quem avalia
 * abrir a URL e já ver o sistema funcionando. Ver src/app/cadastro/README.md.
 */
export function adminAtual(): Admin {
  return ADMIN_ATUAL;
}

export async function listarTrechos(): Promise<Trecho[]> {
  return atraso(TRECHOS);
}

export async function listarPessoas(): Promise<Pessoa[]> {
  hidratar();
  return atraso(PESSOAS);
}

export async function listarDispositivos(): Promise<Dispositivo[]> {
  hidratar();
  return atraso(DISPOSITIVOS);
}

/**
 * Última posição de cada pessoa com ESP32 vinculado agora. Quem manda é o vínculo do
 * cadastro, não as leituras: desvinculou, sai do mapa; cadastrou com ESP32, entra (com
 * `leituraInicial`, porque o histórico gerado não tem leitura dela).
 */
export async function posicoesAtuais(): Promise<PosicaoAtual[]> {
  hidratar();
  const ultima = new Map<string, Leitura>();
  for (const l of LEITURAS) ultima.set(l.pessoaId, l);
  const posicoes: PosicaoAtual[] = [];
  for (const pessoa of PESSOAS) {
    const dispositivo = pessoa.dispositivoId ? DISPOSITIVOS.find((d) => d.id === pessoa.dispositivoId) : undefined;
    if (!dispositivo) continue;
    const leitura = ultima.get(pessoa.id) ?? leituraInicial(pessoa, dispositivo.id);
    posicoes.push({ ...leitura, dispositivoId: dispositivo.id, pessoa, dispositivo });
  }
  return atraso(posicoes);
}

export async function historico(filtros: FiltrosHistorico = {}): Promise<(Leitura & { pessoa: Pessoa })[]> {
  hidratar();
  const nome = filtros.nome?.toLowerCase().trim();
  const resultado = LEITURAS.flatMap((l) => {
    const pessoa = PESSOAS.find((p) => p.id === l.pessoaId);
    if (!pessoa) return [];
    if (nome && !pessoa.nome.toLowerCase().includes(nome)) return [];
    if (filtros.turno && pessoa.turno !== filtros.turno) return [];
    if (filtros.funcao && pessoa.funcao !== filtros.funcao) return [];
    if (filtros.status && l.status !== filtros.status) return [];
    if (filtros.trecho && l.trecho !== filtros.trecho) return [];
    if (filtros.dia && !l.timestamp.startsWith(filtros.dia)) return [];
    return [{ ...l, pessoa }];
  });
  return atraso(resultado.reverse());
}

export async function listarAlertas(somenteAtivos = false): Promise<Alerta[]> {
  return atraso(somenteAtivos ? ALERTAS.filter((a) => a.fim === null) : ALERTAS);
}

/** Valida e aplica o vínculo. Separado para ser reusado pelo cadastro de pessoa. */
function aplicarVinculo(pessoaId: string, dispositivoId: string | null) {
  const pessoa = PESSOAS.find((p) => p.id === pessoaId);
  if (!pessoa) throw new Error("Pessoa não encontrada.");

  if (dispositivoId) {
    const novo = DISPOSITIVOS.find((d) => d.id === dispositivoId);
    if (!novo) throw new Error(`Dispositivo ${dispositivoId} não encontrado.`);
    if (novo.pessoaId && novo.pessoaId !== pessoaId) {
      const atual = PESSOAS.find((p) => p.id === novo.pessoaId);
      throw new Error(`O ${novo.id} já está com ${atual?.nome ?? "outra pessoa"}. Desvincule antes de reaproveitar.`);
    }
  }

  // Solta o dispositivo anterior desta pessoa antes de assumir o novo (vínculo 1 para 1).
  for (const d of DISPOSITIVOS) if (d.pessoaId === pessoaId) d.pessoaId = null;
  if (dispositivoId) {
    const novo = DISPOSITIVOS.find((d) => d.id === dispositivoId)!;
    novo.pessoaId = pessoaId;
  }
  pessoa.dispositivoId = dispositivoId;
}

/** Vincula (ou desvincula, com dispositivoId null) uma pessoa a um ESP32. */
export async function vincularDispositivo(pessoaId: string, dispositivoId: string | null): Promise<void> {
  hidratar();
  aplicarVinculo(pessoaId, dispositivoId);
  persistir();
  return atraso(undefined);
}

const RE_MATRICULA = /^\d{6}$/;
/** Id da etiqueta como nos dados do mock: ESP32-0A1B. */
const RE_ESP32 = /^ESP32-[0-9A-F]{4}$/;
const RE_MAC = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;

// Validadores por campo. Ficam exportados para o wizard do cadastro barrar passo a
// passo sem reescrever as regras: a tela chama o mesmo código que o cadastro usa.
// Devolvem a mensagem de erro, ou null quando o valor está bom.

export function normalizarNome(nome: string) {
  return nome.trim().replace(/\s+/g, " ");
}

export function validarNome(nome: string): string | null {
  return normalizarNome(nome).length < 3 ? "Informe o nome completo da pessoa." : null;
}

export function validarMatricula(matricula: string): string | null {
  hidratar();
  const limpa = matricula.trim();
  if (!RE_MATRICULA.test(limpa)) return "A matrícula deve ter 6 dígitos (ex.: 810000).";
  if (PESSOAS.some((p) => p.matricula === limpa)) return `A matrícula ${limpa} já está cadastrada.`;
  return null;
}

export function normalizarIdDispositivo(id: string) {
  return id.trim().toUpperCase();
}

export function validarIdDispositivo(id: string): string | null {
  hidratar();
  const limpo = normalizarIdDispositivo(id);
  if (!RE_ESP32.test(limpo)) {
    return "O id da etiqueta deve seguir o formato ESP32-XXXX, com 4 dígitos hexadecimais (ex.: ESP32-0B04).";
  }
  if (DISPOSITIVOS.some((d) => d.id === limpo)) return `O ${limpo} já está cadastrado.`;
  return null;
}

export function normalizarMac(mac: string) {
  return mac.trim().toUpperCase().replace(/-/g, ":");
}

export function validarMac(mac: string): string | null {
  hidratar();
  const limpo = normalizarMac(mac);
  if (!RE_MAC.test(limpo)) return "O MAC deve seguir o formato 24:6F:28:FF:B0:04.";
  if (DISPOSITIVOS.some((d) => d.mac === limpo)) return `O MAC ${limpo} já está cadastrado.`;
  return null;
}

export async function cadastrarPessoa(dados: Omit<Pessoa, "id" | "ativo">): Promise<Pessoa> {
  hidratar();
  const nome = normalizarNome(dados.nome);
  const matricula = dados.matricula.trim();

  // Valida tudo antes de mexer nas listas, para não deixar cadastro pela metade.
  const problema = validarNome(dados.nome) ?? validarMatricula(dados.matricula);
  if (problema) throw new Error(problema);
  if (dados.dispositivoId) {
    const d = DISPOSITIVOS.find((x) => x.id === dados.dispositivoId);
    if (!d) throw new Error(`Dispositivo ${dados.dispositivoId} não encontrado.`);
    if (d.pessoaId) throw new Error(`O ${d.id} já está vinculado a outra pessoa.`);
  }

  const pessoa: Pessoa = {
    id: proximoId(PESSOAS.map((p) => p.id), "P"),
    nome,
    matricula,
    funcao: dados.funcao,
    turno: dados.turno,
    dispositivoId: null,
    ativo: true,
  };
  PESSOAS.push(pessoa);
  if (dados.dispositivoId) aplicarVinculo(pessoa.id, dados.dispositivoId);
  persistir();
  return atraso(pessoa);
}

export async function cadastrarDispositivo(id: string, mac: string): Promise<Dispositivo> {
  hidratar();
  const idLimpo = normalizarIdDispositivo(id);
  const macLimpo = normalizarMac(mac);

  const problema = validarIdDispositivo(id) ?? validarMac(mac);
  if (problema) throw new Error(problema);

  const dispositivo: Dispositivo = {
    id: idLimpo,
    mac: macLimpo,
    bateriaPct: 100,
    // Dispositivo recém-cadastrado ainda não transmitiu: marcamos a hora do cadastro.
    ultimoSinal: new Date().toISOString(),
    firmware: "0.1.0",
    pessoaId: null,
  };
  DISPOSITIVOS.push(dispositivo);
  persistir();
  return atraso(dispositivo);
}

/**
 * Remove uma pessoa do cadastro e solta o ESP32 dela de volta para o estoque.
 *
 * As leituras antigas dessa pessoa continuam em LEITURAS, mas `posicoesAtuais` e
 * `historico` ignoram leitura sem pessoa correspondente, então ela some do mapa,
 * do dashboard e do histórico. No sistema de verdade isso seria uma inativação
 * (o campo `ativo` existe para isso), para não perder o registro do turno.
 */
export async function removerPessoa(pessoaId: string): Promise<Pessoa> {
  hidratar();
  const i = PESSOAS.findIndex((p) => p.id === pessoaId);
  if (i === -1) throw new Error("Pessoa não encontrada.");
  const pessoa = PESSOAS[i];
  for (const d of DISPOSITIVOS) if (d.pessoaId === pessoaId) d.pessoaId = null;
  PESSOAS.splice(i, 1);
  persistir();
  return atraso(pessoa);
}

/** Volta pessoas e dispositivos ao estado de dados-mock.ts e limpa o navegador. */
export async function restaurarDados(): Promise<void> {
  repor(PESSOAS, SEMENTE.pessoas.map((p) => ({ ...p })));
  repor(DISPOSITIVOS, SEMENTE.dispositivos.map((d) => ({ ...d })));
  hidratado = true;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(CHAVE);
    } catch {
      // Navegação privada: nada a limpar.
    }
  }
  return atraso(undefined);
}
