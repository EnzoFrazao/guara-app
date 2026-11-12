"use client";

// Alternador entre o tema claro (padrão, com as cores da Vale) e o escuro.
//
// O claro já vem no HTML do servidor; a escolha do escuro fica no localStorage e é
// aplicada ANTES da primeira pintura pelo script inline de `layout.tsx`. Ou seja, a verdade sobre o tema mora no atributo
// `data-tema` do <html>, fora do React — por isso o botão lê esse estado com
// `useSyncExternalStore` em vez de um useEffect: é a API feita para fonte externa, e
// o lint proíbe setState no corpo de um efeito.

import { useSyncExternalStore } from "react";

export type Tema = "escuro" | "claro";

const CHAVE = "guara.tema";

const ouvintes = new Set<() => void>();

function assinar(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  return () => {
    ouvintes.delete(aoMudar);
  };
}

function lerDoNavegador(): Tema {
  return document.documentElement.getAttribute("data-tema") === "claro" ? "claro" : "escuro";
}

/** O servidor manda <html data-tema="claro">: o claro é o padrão (ADR 0002). */
function lerDoServidor(): Tema {
  return "claro";
}

function aplicar(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "claro") raiz.setAttribute("data-tema", "claro");
  else raiz.removeAttribute("data-tema");

  // A barra de status do celular acompanha o tema. São todas as metas porque o Next insere
  // uma cópia depois de hidratar.
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", tema === "claro" ? "#f3f4f5" : "#09090b"));

  try {
    window.localStorage.setItem(CHAVE, tema);
  } catch {
    // Navegação privada: o tema vale só enquanto a aba estiver aberta.
  }
  for (const avisar of ouvintes) avisar();
}

// Barra lateral: botão com borda e rótulo.
const ESTILO_COMPLETO =
  "gap-2 rounded-md border border-zinc-800 claro:border-traco px-2.5 py-1.5 text-xs font-medium text-zinc-400 claro:text-tinta-media hover:bg-zinc-900 claro:hover:bg-areia hover:text-zinc-100 claro:hover:text-tinta";

// Topo do celular: só o ícone, sem borda, com área de toque de 44 px. As margens negativas
// deixam a área de toque avançar sobre o padding do topo sem aumentar a altura da barra, e
// o -mr-2 alinha o desenho do ícone à margem direita.
const ESTILO_COMPACTO =
  "-my-1.5 -mr-2 h-11 w-11 rounded-lg text-zinc-400 claro:text-tinta-media hover:bg-zinc-900 claro:hover:bg-areia active:bg-zinc-900 claro:active:bg-nevoa hover:text-zinc-100 claro:hover:text-tinta";

/** `compacto` mostra só o ícone (topo do celular, onde não sobra largura). */
export function BotaoTema({ className = "", compacto = false }: { className?: string; compacto?: boolean }) {
  const tema = useSyncExternalStore(assinar, lerDoNavegador, lerDoServidor);
  const vaiParaClaro = tema === "escuro";
  const rotulo = vaiParaClaro ? "Tema claro" : "Tema escuro";

  return (
    <button
      type="button"
      onClick={() => aplicar(vaiParaClaro ? "claro" : "escuro")}
      aria-label={vaiParaClaro ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
      title={rotulo}
      className={`inline-flex items-center justify-center transition-colors ${compacto ? ESTILO_COMPACTO : ESTILO_COMPLETO} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`${compacto ? "h-5 w-5" : "h-4 w-4"} shrink-0`}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {vaiParaClaro ? (
          // Sol: clicar leva ao claro.
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          // Lua: clicar leva ao escuro.
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        )}
      </svg>
      {!compacto && <span>{rotulo}</span>}
    </button>
  );
}
