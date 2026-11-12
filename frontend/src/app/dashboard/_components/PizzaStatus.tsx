"use client";

// Rosca de "pessoas por status". É part-to-whole com 5 fatias e valores bem
// separados, que é o caso em que pizza funciona.
//
// As cores são a escala de STATUS do projeto (rotulos.ts), não uma paleta
// categórica: têm significado reservado e são as mesmas do mapa e dos badges.
// Por isso a identidade nunca depende só da cor — a legenda ao lado traz
// rótulo, contagem e percentual, e passar o mouse (ou tocar) escreve o valor no centro.

import { useState, type PointerEvent } from "react";
import { COR_STATUS_MAPA, ROTULO_STATUS } from "@/lib/rotulos";
import type { StatusTrabalho } from "@/lib/tipos";

const TAMANHO = 180;
const RAIO = 68;
const ESPESSURA = 24;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;
/** Respiro entre fatias, para duas cores vizinhas não encostarem. */
const FOLGA = 2;

export type FatiaStatus = { status: StatusTrabalho; n: number };

export function PizzaStatus({ fatias }: { fatias: FatiaStatus[] }) {
  const [emFoco, setEmFoco] = useState<StatusTrabalho | null>(null);

  const total = fatias.reduce((s, f) => s + f.n, 0);
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  // Só fatias com gente entram no desenho; a legenda mostra todas.
  // O início de cada arco é a soma das anteriores. Somar na hora, em vez de
  // acumular numa variável, porque o lint do React Compiler proíbe reatribuir
  // durante o render — e com 5 fatias o custo é irrelevante.
  const desenhadas = fatias.filter((f) => f.n > 0);
  const arcos = desenhadas.map((f, i) => ({
    ...f,
    inicio: (desenhadas.slice(0, i).reduce((soma, a) => soma + a.n, 0) / total) * CIRCUNFERENCIA,
    comprimento: (f.n / total) * CIRCUNFERENCIA,
  }));

  const foco = emFoco ? fatias.find((f) => f.status === emFoco) : undefined;

  // Mouse destaca ao passar por cima; no celular não existe hover, então o toque alterna.
  // Os eventos de mouse "de compatibilidade" que o celular dispara depois do toque não
  // entram aqui porque só ouvimos pointer events, filtrando pelo tipo.
  const interacao = (s: StatusTrabalho) => ({
    onPointerEnter: (e: PointerEvent) => {
      if (e.pointerType === "mouse") setEmFoco(s);
    },
    onPointerLeave: (e: PointerEvent) => {
      if (e.pointerType === "mouse") setEmFoco(null);
    },
    onPointerUp: (e: PointerEvent) => {
      if (e.pointerType !== "mouse") setEmFoco((atual) => (atual === s ? null : s));
    },
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg
        width={TAMANHO}
        height={TAMANHO}
        viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
        role="img"
        aria-label={`Pessoas por status: ${fatias.map((f) => `${ROTULO_STATUS[f.status]} ${f.n}`).join(", ")}`}
        className="shrink-0"
      >
        <g transform={`rotate(-90 ${TAMANHO / 2} ${TAMANHO / 2})`}>
          {/* Trilho, para a rosca existir mesmo sem dados. */}
          <circle
            cx={TAMANHO / 2}
            cy={TAMANHO / 2}
            r={RAIO}
            fill="none"
            stroke="var(--color-trilho-rosca)"
            strokeWidth={ESPESSURA}
          />
          {arcos.map((a) => {
            const visivel = Math.max(0, a.comprimento - FOLGA);
            const apagado = emFoco !== null && emFoco !== a.status;
            return (
              <circle
                key={a.status}
                cx={TAMANHO / 2}
                cy={TAMANHO / 2}
                r={RAIO}
                fill="none"
                stroke={COR_STATUS_MAPA[a.status]}
                strokeWidth={ESPESSURA}
                strokeDasharray={`${visivel} ${CIRCUNFERENCIA - visivel}`}
                strokeDashoffset={-a.inicio}
                opacity={apagado ? 0.25 : 1}
                className="transition-opacity duration-150"
                {...interacao(a.status)}
              />
            );
          })}
        </g>

        {/* Centro: o total, ou a fatia sob o mouse. */}
        <text
          x={TAMANHO / 2}
          y={TAMANHO / 2 - 4}
          textAnchor="middle"
          className="fill-zinc-50 claro:fill-tinta text-2xl font-semibold tabular-nums"
        >
          {foco ? foco.n : total}
        </text>
        <text
          x={TAMANHO / 2}
          y={TAMANHO / 2 + 14}
          textAnchor="middle"
          className="fill-zinc-500 claro:fill-tinta-suave text-[11px]"
        >
          {foco ? `${pct(foco.n).toFixed(0)}% ${ROTULO_STATUS[foco.status].toLowerCase()}` : "com dispositivo"}
        </text>
      </svg>

      <ul className="grid w-full gap-1.5 text-sm sm:w-auto sm:min-w-50 sm:flex-1">
        {fatias.map((f) => {
          const apagado = emFoco !== null && emFoco !== f.status;
          return (
            <li
              key={f.status}
              {...interacao(f.status)}
              className={`flex cursor-default items-center gap-2 rounded px-2 py-1.5 transition-colors ${
                emFoco === f.status ? "bg-zinc-800 claro:bg-nevoa" : ""
              } ${apagado ? "opacity-50" : ""}`}
            >
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: COR_STATUS_MAPA[f.status] }}
              />
              <span className="text-zinc-300 claro:text-tinta-media">{ROTULO_STATUS[f.status]}</span>
              <span className="ml-auto font-medium tabular-nums text-zinc-100 claro:text-tinta">{f.n}</span>
              <span className="w-10 text-right tabular-nums text-zinc-500 claro:text-tinta-suave">{pct(f.n).toFixed(0)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
