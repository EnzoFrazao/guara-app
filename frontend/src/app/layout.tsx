import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { AbasMobile, TopoMobile } from "@/components/NavMobile";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

const TITULO = "GUARÁ · Posicionamento Operacional";
const DESCRICAO = "Localização em tempo real de maquinistas e manobristas no TFPM";

// openGraph dá título e descrição à prévia quando o link é colado no WhatsApp ou no Teams.
// O ícone de tela inicial do iPhone vem de app/apple-icon.png (convenção de arquivo do Next).
export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  openGraph: { title: TITULO, description: DESCRICAO, locale: "pt_BR", type: "website" },
};

// Muita gente abre pelo celular, via QR code. `viewportFit: cover` deixa o fundo ir
// até as bordas do iPhone; as barras compensam com env(safe-area-inset-*). O zoom do
// usuário fica liberado de propósito (acessibilidade).
// themeColor sai com a cor do claro, que é o padrão (ADR 0002); o script abaixo troca a meta
// para quem escolheu o escuro. O color-scheme vem do CSS (:root e [data-tema="claro"]).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f4f5",
};

// O claro já vem no HTML do servidor; este script só desliga para quem escolheu o escuro.
// Roda antes da primeira pintura, senão a página aparece clara e "pisca" para o escuro. É
// inline porque um arquivo externo chegaria tarde demais.
//
// Fica no começo do <body>, e NÃO no <head>: o Netlify injeta um comentário com quebra de
// linha logo depois do <meta charset>, e esse nó de texto no <head> fazia o React não achar
// este <script> ao hidratar (erro #418). Aí o React remontava a página inteira e o <html>
// voltava a data-tema="claro", ignorando quem escolheu o escuro. No <body> nada é injetado
// antes dele, e ele ainda roda antes de qualquer conteúdo ser desenhado. A meta theme-color
// não tem lugar garantido no <head> (a ordem é do Next), então o script a acerta na hora e de
// novo no DOMContentLoaded. O cliente ainda insere uma cópia depois de hidratar, que fica com a
// cor do claro; não importa, porque o navegador usa a primeira theme-color do documento.
const TEMA_SEM_PISCAR = `try{if(localStorage.getItem("guara.tema")==="escuro"){document.documentElement.removeAttribute("data-tema");var m=function(){document.querySelectorAll('meta[name="theme-color"]').forEach(function(e){e.setAttribute("content","#09090b")})};m();document.addEventListener("DOMContentLoaded",m)}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: para quem escolheu o escuro, o script abaixo tira o
    // data-tema do <html> antes do React hidratar, então o HTML do servidor e o DOM divergem
    // de propósito. O aviso vale só para este elemento, não desce para os filhos.
    <html lang="pt-BR" data-tema="claro" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-zinc-950 claro:bg-areia text-zinc-100 claro:text-tinta claro:bg-areia claro:text-tinta lg:flex-row">
        <script dangerouslySetInnerHTML={{ __html: TEMA_SEM_PISCAR }} />
        <Sidebar />
        <TopoMobile />
        {/* No celular, o padding de baixo reserva as abas (3.5rem), o selo do Netlify que fica
            logo acima delas (~3.5rem, ver globals.css) e a área segura. Sem contar o selo, o fim
            da página ficava escondido atrás dele. */}
        <main className="min-w-0 flex-1 overflow-x-hidden px-4 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom))] sm:px-6 lg:p-8">
          {children}
        </main>
        <AbasMobile />
        {/* VLibras (tradução para Libras do governo federal). O loader se inicializa
            sozinho: cria o botão flutuante à direita, fora da árvore do React, e só
            baixa o app do avatar quando alguém clica. */}
        <Script src="https://vlibras.gov.br/app/vlibras-plugin.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
