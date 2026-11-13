import { Outlet } from "react-router";
import { AbasMobile, TopoMobile } from "@/components/NavMobile";
import { Sidebar } from "@/components/Sidebar";
import { usePainelTempoReal } from "@/lib/tempoReal";

// Moldura de todas as telas. O <body> (index.html) é o flex: a barra lateral, o topo do celular,
// o <main> e as abas entram nele direto (#root usa display: contents).
export function Shell() {
  // Sem VITE_WS_URL não faz nada: o painel segue com os dados ilustrativos.
  usePainelTempoReal();
  return (
    <>
      <Sidebar />
      <TopoMobile />
      {/* No celular, o padding de baixo reserva as abas (3.5rem), o selo do Netlify que fica
          logo acima delas (~3.5rem, ver globals.css) e a área segura. Sem contar o selo, o fim
          da página ficava escondido atrás dele. */}
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-6 lg:p-8">
        <Outlet />
      </main>
      <AbasMobile />
    </>
  );
}
