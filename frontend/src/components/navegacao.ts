// As quatro telas, na ordem do menu. A barra lateral (desktop) e as abas do celular
// leem esta mesma lista, para as duas navegações nunca divergirem.

export type NomeIcone = "painel" | "mapa" | "historico" | "cadastro";

export const ITENS: { href: string; rotulo: string; rotuloCurto: string; icone: NomeIcone }[] = [
  { href: "/dashboard", rotulo: "Dashboard", rotuloCurto: "Dashboard", icone: "painel" },
  { href: "/mapa", rotulo: "Mapa ao vivo", rotuloCurto: "Mapa", icone: "mapa" },
  { href: "/historico", rotulo: "Histórico", rotuloCurto: "Histórico", icone: "historico" },
  { href: "/cadastro", rotulo: "Cadastro", rotuloCurto: "Cadastro", icone: "cadastro" },
];
