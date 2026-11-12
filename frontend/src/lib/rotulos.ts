import type { Funcao, StatusTrabalho, TipoAlerta, Turno } from "./tipos";

// A ordem das chaves é a ordem da lista de status nos filtros e nas legendas.
export const ROTULO_STATUS: Record<StatusTrabalho, string> = {
  manobrando: "Manobrando",
  almocando: "Almoçando",
  aguardando_programacao: "Aguardando programação",
  descansando: "Descansando",
  sem_sinal: "Sem sinal",
};

/**
 * Classes Tailwind de cada status. Use sempre estas nas telas.
 * O fundo e o anel (a 15 % e 30 %) servem aos dois temas: sobre papel viram pastel.
 * Só o texto muda, pela variante `claro:` — a 300 some no branco.
 * A MATIZ é a mesma dos pontos do mapa (COR_STATUS_MAPA) nos dois temas, senão a
 * legenda do mapa deixaria de bater com o ponto.
 */
export const COR_STATUS: Record<StatusTrabalho, string> = {
  manobrando: "bg-sky-500/15 text-sky-300 claro:text-sky-700 ring-1 ring-sky-500/30",
  almocando: "bg-amber-500/15 text-amber-300 claro:text-amber-700 ring-1 ring-amber-500/30",
  aguardando_programacao: "bg-emerald-500/15 text-emerald-300 claro:text-emerald-700 ring-1 ring-emerald-500/30",
  descansando: "bg-zinc-500/15 text-zinc-300 claro:text-zinc-700 ring-1 ring-zinc-500/30",
  sem_sinal: "bg-red-500/15 text-red-300 claro:text-red-700 ring-1 ring-red-500/30",
};

/**
 * Cor dos pontos no mapa, das barras e da rosca. Tons claros, para contrastar no escuro.
 * NÃO muda com o tema: o mapa é o mesmo nos dois (pedido do time).
 */
export const COR_STATUS_MAPA: Record<StatusTrabalho, string> = {
  manobrando: "#38bdf8",
  almocando: "#fbbf24",
  aguardando_programacao: "#34d399",
  descansando: "#a1a1aa",
  sem_sinal: "#f87171",
};

export const ROTULO_FUNCAO: Record<Funcao, string> = {
  maquinista: "Maquinista",
  manobrista: "Manobrista",
};

export const ROTULO_TURNO: Record<Turno, string> = {
  A: "Turno A (07h–15h)",
  B: "Turno B (15h–23h)",
  C: "Turno C (23h–07h)",
};

/** Faixas de bateria do ESP32. Usadas no cadastro e no dashboard. */
export type FaixaBateria = "critica" | "baixa" | "ok";

export function faixaBateria(pct: number): FaixaBateria {
  if (pct < 20) return "critica";
  if (pct < 50) return "baixa";
  return "ok";
}

export const COR_BATERIA: Record<FaixaBateria, string> = {
  critica: "bg-red-500/15 text-red-300 claro:text-red-700 ring-1 ring-red-500/30",
  baixa: "bg-amber-500/15 text-amber-300 claro:text-amber-700 ring-1 ring-amber-500/30",
  ok: "bg-emerald-500/15 text-emerald-300 claro:text-emerald-700 ring-1 ring-emerald-500/30",
};

export const ROTULO_ALERTA: Record<TipoAlerta, string> = {
  area_de_risco: "Pessoa em área de risco",
  pessoa_isolada: "Pessoa isolada parada",
  sem_sinal: "Dispositivo sem sinal",
  bateria_baixa: "Bateria baixa",
};
