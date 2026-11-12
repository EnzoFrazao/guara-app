import type { ReactNode } from "react";

export function PageHeader({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  /** Conteúdo à direita do título (indicador "ao vivo", botão, contador). */
  acao?: ReactNode;
}) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3 lg:mb-6 lg:gap-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-50 claro:text-tinta lg:text-2xl">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-zinc-400 claro:text-tinta-media">{descricao}</p>}
      </div>
      {acao}
    </header>
  );
}
