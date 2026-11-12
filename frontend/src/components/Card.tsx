import type { ReactNode } from "react";

export function Card({
  titulo,
  acao,
  children,
  className = "",
}: {
  titulo?: string;
  /** Conteúdo alinhado à direita do título (filtro, contador, botão). */
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-lg border border-zinc-800 claro:border-traco bg-zinc-900 claro:bg-papel claro:shadow-cartao p-3 sm:p-4 ${className}`}>
      {(titulo || acao) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          {titulo && <h2 className="text-sm font-medium text-zinc-400 claro:text-tinta-media">{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </section>
  );
}
