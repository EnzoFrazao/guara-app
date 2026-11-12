"use client";

import { useState, type ReactNode } from "react";

/**
 * Busca + filtros de uma tela. No desktop (lg) fica tudo numa linha, como sempre foi.
 * No celular os selects não cabem em fila: fica à vista só a busca, e o botão "Filtros"
 * abre os selects um embaixo do outro: em duas colunas, com fonte de 16 px (iOS), o select
 * de 155 px cortava "Todas as funções". A partir de sm cabem três por linha.
 */
export function PainelFiltros({
  busca,
  ativos = 0,
  children,
  depois,
}: {
  /** Campo sempre visível, ao lado do botão no celular. */
  busca?: ReactNode;
  /** Quantos filtros estão aplicados, para o botão avisar mesmo fechado. */
  ativos?: number;
  /** Os selects e demais campos que recolhem no celular. */
  children: ReactNode;
  /** Conteúdo depois dos filtros (contador, selo ao vivo). */
  depois?: ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="flex gap-2 lg:contents">
        {busca && <div className="min-w-0 flex-1 lg:flex-none [&>*]:w-full lg:[&>*]:w-auto">{busca}</div>}
        <button
          type="button"
          className="botao-secundario shrink-0 lg:hidden"
          aria-expanded={aberto}
          onClick={() => setAberto((a) => !a)}
        >
          Filtros{ativos > 0 && <span className="ml-1 text-zinc-100 claro:text-tinta">· {ativos}</span>}
          <span aria-hidden="true" className={`ml-1.5 inline-block transition-transform ${aberto ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
      </div>
      <div
        className={`${aberto ? "grid" : "hidden"} grid-cols-1 gap-2 sm:grid-cols-3 lg:contents [&>*]:w-full [&>*]:min-w-0 lg:[&>*]:w-auto`}
      >
        {children}
      </div>
      {depois}
    </div>
  );
}
