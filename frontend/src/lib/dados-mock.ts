// Dados ILUSTRATIVOS para o protótipo visual.
// Coordenadas aproximadas da região do TFPM, só para o mapa ter onde desenhar.
// Tudo é gerado com semente fixa, para servidor e navegador produzirem os mesmos dados.

import type {
  Admin,
  Alerta,
  Dispositivo,
  Funcao,
  Leitura,
  Pessoa,
  StatusTrabalho,
  Trecho,
  TrechoId,
  Turno,
} from "./tipos";
import { distanciaM } from "./cobertura";

/** Gerador pseudoaleatório determinístico (mulberry32). */
function criarAleatorio(semente: number) {
  let a = semente;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Único usuário do sistema, fixo. O protótipo não tem login de propósito: quem avalia
 * abre a URL e o sistema já está funcionando. Ver src/app/cadastro/README.md.
 */
export const ADMIN_ATUAL: Admin = {
  id: "A001",
  nome: "Helena Marques",
  matricula: "800147",
  cargo: "Coordenação de turno · CCO",
};

// Coordenadas da pera do TFPM, levantadas pela equipe em campo/satélite.
// Sete são pontos medidos (viradores, PIAL e cinco vértices do anel); os outros
// cinco são o ponto médio entre vizinhos, para os 12 trechos ficarem espaçados
// ao redor do laço. O conjunto cobre cerca de 1,2 x 1,9 km.
//
// A ordem é a da operação: o trem chega na Recepção (oeste), é formado, corre os
// trechos X ao redor da pera, passa pelo PIAL e termina nos Viradores (norte).
// Ainda é aproximação: o polígono de cada trecho só sai com a planta oficial.

/** Centro da pera. O mapa ajusta o enquadramento pelos trechos. */
export const CENTRO_TFPM: [number, number] = [-2.5729563, -44.3427728];

export const TRECHOS: Trecho[] = [
  { id: "VIRADORES", nome: "Pátio dos Viradores", areaDeRisco: true, centro: [-2.5689360, -44.3447059] },
  { id: "X07", nome: "Trecho X07", areaDeRisco: false, centro: [-2.5700551, -44.3398614] },
  { id: "X06", nome: "Trecho X06", areaDeRisco: false, centro: [-2.5711742, -44.3350170] },
  { id: "OFICINA", nome: "Oficina Central · PIAL", areaDeRisco: false, centro: [-2.5785906, -44.3371723] },
  { id: "X05", nome: "Trecho X05", areaDeRisco: false, centro: [-2.5782117, -44.3394548] },
  { id: "X03", nome: "Trecho X03", areaDeRisco: false, centro: [-2.5778328, -44.3417373] },
  { id: "X02", nome: "Trecho X02", areaDeRisco: false, centro: [-2.5778071, -44.3436069] },
  { id: "X01", nome: "Trecho X01", areaDeRisco: false, centro: [-2.5777815, -44.3454766] },
  { id: "FORMACAO", nome: "Formação", areaDeRisco: false, centro: [-2.5740920, -44.3489024] },
  { id: "RECEPCAO", nome: "Pátio de Recepção", areaDeRisco: false, centro: [-2.5704025, -44.3523283] },
  { id: "ESTACIONAMENTO", nome: "Estacionamento", areaDeRisco: false, centro: [-2.5692592, -44.3496507] },
  { id: "CTMR", nome: "CTMR", areaDeRisco: false, centro: [-2.5681159, -44.3469730] },
  // Fora da pera, ~2,6 km a noroeste: onde fica o restaurante. Ponto informado pela equipe.
  {
    id: "RESTAURANTE",
    nome: "Restaurante · Porto Vale",
    areaDeRisco: false,
    centro: [-2.5569236, -44.3600747],
    foraDoPatio: true,
  },
];

/** Trechos da operação, sem os locais de apoio. É onde o gerador espalha quem está trabalhando. */
const TRECHOS_PATIO = TRECHOS.filter((t) => !t.foraDoPatio);

const NOMES = [
  "Ana", "Bruno", "Carla", "Diego", "Elaine", "Fábio", "Gabriela", "Hugo", "Iara", "João",
  "Karina", "Lucas", "Marcela", "Nelson", "Olívia", "Paulo", "Queila", "Rafael", "Sabrina", "Tiago",
  "Úrsula", "Vinícius", "Wesley", "Ximena", "Yuri",
];
const SOBRENOMES = ["Silva", "Souza", "Costa", "Pereira", "Ribeiro", "Almeida", "Lima", "Araújo", "Carvalho", "Gomes"];

/** Data base dos dados fictícios. */
export const DIA_BASE = "2026-10-07";

const rand = criarAleatorio(42);
const escolher = <T,>(lista: readonly T[]) => lista[Math.floor(rand() * lista.length)];

/** 50 pessoas: proporção maquinista/manobrista provisória (pergunta P6.3). */
export const PESSOAS: Pessoa[] = Array.from({ length: 50 }, (_, i) => {
  const funcao: Funcao = i < 15 ? "maquinista" : "manobrista";
  const turno: Turno = (["A", "B", "C"] as const)[i % 3];
  return {
    id: `P${String(i + 1).padStart(3, "0")}`,
    nome: `${NOMES[i % NOMES.length]} ${escolher(SOBRENOMES)}`,
    matricula: String(810000 + i * 37),
    funcao,
    turno,
    // As duas últimas pessoas ficam sem dispositivo, para a tela de cadastro ter o que vincular.
    // 4 dígitos hexadecimais, como na etiqueta real e no exemplo do tipo Dispositivo.
    dispositivoId: i < 48 ? `ESP32-${(0x0a00 + i).toString(16).toUpperCase().padStart(4, "0")}` : null,
    ativo: true,
  };
});

/** Dispositivos: um por pessoa vinculada, mais 3 livres no estoque. */
export const DISPOSITIVOS: Dispositivo[] = [
  ...PESSOAS.filter((p) => p.dispositivoId).map((p, i) => ({
    id: p.dispositivoId as string,
    mac: `24:6F:28:${(0x10 + i).toString(16).toUpperCase()}:A1:${(0x20 + i).toString(16).toUpperCase()}`,
    bateriaPct: Math.round(15 + rand() * 85),
    ultimoSinal: `${DIA_BASE}T10:${String(Math.floor(rand() * 59)).padStart(2, "0")}:00-03:00`,
    firmware: "0.1.0",
    pessoaId: p.id,
  })),
  ...["ESP32-0B01", "ESP32-0B02", "ESP32-0B03"].map((id, i) => ({
    id,
    mac: `24:6F:28:FF:B0:0${i + 1}`,
    bateriaPct: 100,
    ultimoSinal: `${DIA_BASE}T06:00:00-03:00`,
    firmware: "0.1.0",
    pessoaId: null,
  })),
];

/**
 * Status sorteados no pátio. "Almoçando" e "Descansando" ficam de fora: só valem para
 * quem está no restaurante.
 */
const STATUS_NO_PATIO: StatusTrabalho[] = ["manobrando", "manobrando", "aguardando_programacao"];

/** As únicas pessoas no restaurante no fim do dia (a "posição atual" do mapa), e o que fazem lá. */
const NO_RESTAURANTE = new Map<string, StatusTrabalho>([
  ["P004", "almocando"],
  ["P018", "almocando"],
  ["P031", "descansando"],
]);
const INICIO_ALMOCO_MIN = 21 * 60 + 30;

function velocidadePara(status: StatusTrabalho, funcao: Funcao) {
  if (status === "manobrando") return funcao === "maquinista" ? 5 + rand() * 25 : rand() * 6;
  return rand() * 0.8;
}

// Onde ficam as pessoas no pátio. Antes cada uma ficava a ~50 m do centro de um trecho, e
// como os trechos formam duas fileiras, o mapa mostrava dois montinhos. Agora cada pessoa
// cai num ponto sorteado por igual em toda a área da pera (o retângulo dos trechos), e o
// trecho dela é o mais próximo desse ponto. Assim a área do radar fica toda ocupada.
const LATS = TRECHOS_PATIO.map((t) => t.centro[0]);
const LONS = TRECHOS_PATIO.map((t) => t.centro[1]);
const LIMITES_PATIO = {
  latMin: Math.min(...LATS),
  latMax: Math.max(...LATS),
  lonMin: Math.min(...LONS),
  lonMax: Math.max(...LONS),
};

function pontoNoPatio(): [number, number] {
  const { latMin, latMax, lonMin, lonMax } = LIMITES_PATIO;
  return [latMin + rand() * (latMax - latMin), lonMin + rand() * (lonMax - lonMin)];
}

function trechoMaisPerto(ponto: [number, number]): TrechoId {
  let melhor = TRECHOS_PATIO[0];
  for (const t of TRECHOS_PATIO) {
    if (distanciaM(ponto, t.centro) < distanciaM(ponto, melhor.centro)) melhor = t;
  }
  return melhor.id;
}

const METROS_POR_GRAU = 111_320;

/** Ponto sorteado por igual num disco de `raioM` metros em volta de `centro`. */
function pontoPerto(centro: [number, number], raioM: number): [number, number] {
  // sqrt: sem ela os pontos se acumulariam no centro do disco.
  const r = raioM * Math.sqrt(rand());
  const angulo = rand() * 2 * Math.PI;
  const dLat = (r * Math.sin(angulo)) / METROS_POR_GRAU;
  const dLon = (r * Math.cos(angulo)) / (METROS_POR_GRAU * Math.cos((centro[0] * Math.PI) / 180));
  return [centro[0] + dLat, centro[1] + dLon];
}

/** Restaurante é um prédio só: lá as pessoas ficam juntas, a poucos metros umas das outras. */
const RAIO_RESTAURANTE_M = 40;
/** Quanto a leitura varia em volta de onde a pessoa está, de 10 em 10 min. */
const OSCILACAO_M = 20;
const RESTAURANTE = TRECHOS.find((t) => t.id === "RESTAURANTE")!;

/** Gera leituras a cada 10 min das 06h às 22h do dia base. */
function gerarHistorico(): Leitura[] {
  const leituras: Leitura[] = [];
  for (const p of PESSOAS) {
    if (!p.dispositivoId) continue;
    let base = pontoNoPatio();
    for (let min = 6 * 60; min <= 22 * 60; min += 10) {
      let status: StatusTrabalho;
      let trecho: TrechoId;
      let lat: number;
      let lon: number;
      const noRestaurante = NO_RESTAURANTE.get(p.id);
      if (noRestaurante && min >= INICIO_ALMOCO_MIN) {
        trecho = "RESTAURANTE";
        status = noRestaurante;
        [lat, lon] = pontoPerto(RESTAURANTE.centro, RAIO_RESTAURANTE_M);
      } else {
        // 20% de chance de ter ido para outro canto do pátio desde a última leitura.
        if (rand() < 0.2) base = pontoNoPatio();
        status = rand() < 0.03 ? "sem_sinal" : escolher(STATUS_NO_PATIO);
        [lat, lon] = pontoPerto(base, OSCILACAO_M);
        trecho = trechoMaisPerto([lat, lon]);
      }
      const hh = String(Math.floor(min / 60)).padStart(2, "0");
      const mm = String(min % 60).padStart(2, "0");
      leituras.push({
        dispositivoId: p.dispositivoId,
        pessoaId: p.id,
        timestamp: `${DIA_BASE}T${hh}:${mm}:00-03:00`,
        lat,
        lon,
        velocidadeKmh: Math.round(velocidadePara(status, p.funcao) * 10) / 10,
        trecho,
        status,
      });
    }
  }
  // Gerado pessoa por pessoa, mas o histórico é cronológico: sem ordenar por horário,
  // a tabela e a reprodução mostrariam uma pessoa de cada vez, e não o turno acontecendo.
  return leituras.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/** Leituras do dia, da mais antiga para a mais recente. */
export const LEITURAS: Leitura[] = gerarHistorico();

/**
 * Posição de quem ganhou ESP32 no cadastro e ainda não tem leitura no dia: um ponto do pátio
 * sorteado a partir do id da pessoa, para não pular de lugar a cada atualização de 5 s.
 * Acabou de receber o transmissor, então entra como "aguardando programação" e parado.
 */
export function leituraInicial(pessoa: Pessoa, dispositivoId: string): Leitura {
  const sorteio = criarAleatorio([...pessoa.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7));
  const { latMin, latMax, lonMin, lonMax } = LIMITES_PATIO;
  const ponto: [number, number] = [latMin + sorteio() * (latMax - latMin), lonMin + sorteio() * (lonMax - lonMin)];
  return {
    dispositivoId,
    pessoaId: pessoa.id,
    timestamp: LEITURAS[LEITURAS.length - 1].timestamp,
    lat: ponto[0],
    lon: ponto[1],
    velocidadeKmh: 0,
    trecho: trechoMaisPerto(ponto),
    status: "aguardando_programacao",
  };
}

export const ALERTAS: Alerta[] = [
  { id: "AL1", tipo: "area_de_risco", pessoaId: "P021", trecho: "VIRADORES", inicio: `${DIA_BASE}T10:12:00-03:00`, fim: null },
  { id: "AL2", tipo: "pessoa_isolada", pessoaId: "P033", trecho: "X03", inicio: `${DIA_BASE}T09:58:00-03:00`, fim: null },
  { id: "AL3", tipo: "bateria_baixa", pessoaId: "P007", trecho: "OFICINA", inicio: `${DIA_BASE}T09:40:00-03:00`, fim: null },
  { id: "AL4", tipo: "sem_sinal", pessoaId: "P044", trecho: "X07", inicio: `${DIA_BASE}T08:15:00-03:00`, fim: `${DIA_BASE}T08:31:00-03:00` },
];
