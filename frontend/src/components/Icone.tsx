import type { ReactNode } from "react";
import type { NomeIcone } from "./navegacao";

// Ícones de traço das abas do celular. Inline para não puxar biblioteca por 4 desenhos.
const DESENHOS: Record<NomeIcone, ReactNode> = {
  painel: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </>
  ),
  mapa: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  historico: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M3 3.5V8h4.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  cadastro: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2.5 20.5c.6-3.6 3.3-6 6.5-6s5.9 2.4 6.5 6" />
      <path d="M19 8v6M16 11h6" />
    </>
  ),
};

export function Icone({ nome, className = "" }: { nome: NomeIcone; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {DESENHOS[nome]}
    </svg>
  );
}
