"use client";

/**
 * Selo de "ao vivo": ponto piscando + hora da última atualização.
 * `atualizadoEm` é um Date.now() vindo do estado da tela. Enquanto for 0 (antes da
 * primeira carga) a hora não aparece, para servidor e navegador renderizarem igual.
 */
export function AoVivo({
  atualizadoEm = 0,
  rotulo = "Ao vivo",
  pausado = false,
}: {
  atualizadoEm?: number;
  rotulo?: string;
  pausado?: boolean;
}) {
  const cor = pausado
    ? "border-zinc-700 claro:border-traco-forte bg-zinc-800/60 claro:bg-nevoa text-zinc-400 claro:text-tinta-media"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 claro:text-emerald-700";
  const ponto = pausado ? "bg-zinc-500 claro:bg-cinza-vale" : "bg-emerald-400 claro:bg-emerald-600 pulso";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${cor}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${ponto}`} />
      {pausado ? "Pausado" : rotulo}
      {atualizadoEm > 0 && (
        <span className="opacity-60">
          · {new Date(atualizadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      )}
    </span>
  );
}
