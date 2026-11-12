"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminAtual } from "@/lib/dados";
import { BotaoTema } from "./BotaoTema";
import { ITENS } from "./navegacao";

export function Sidebar() {
  const caminho = usePathname();
  // Protótipo sem login: o admin é fixo, só para deixar claro de quem é o sistema.
  const admin = adminAtual();
  return (
    // Fica presa na altura da tela para o bloco do admin não ir parar no fim da página.
    // Abaixo de lg some: o celular navega pelas abas de NavMobile.
    <aside className="sticky top-0 hidden h-screen w-56 lg:flex shrink-0 flex-col border-r border-zinc-800 claro:border-traco bg-zinc-950 claro:bg-papel">
      {/* Só a marca (o guará), com "GUARÁ" em texto ao lado. O lockup completo
          (public/guara-logo-completo.png) tem o nome em tinta escura, que sumiria
          no tema preto, e a legenda ficaria ilegível nos 224 px da barra. */}
      <div className="flex items-center gap-3 px-5 py-6">
        <Image src="/guara-marca.png" alt="" width={44} height={31} priority className="shrink-0" />
        <div>
          <p className="text-lg font-bold leading-none tracking-tight text-zinc-50 claro:text-tinta">GUARÁ</p>
          <p className="mt-1 text-[10px] leading-tight text-zinc-500 claro:text-tinta-suave">
            Gestão Unificada de Alocação e Revezamento Ágil
          </p>
        </div>
      </div>
      <p className="-mt-3 mb-3 px-5 text-xs text-zinc-600 claro:text-tinta-suave">Posicionamento Operacional · TFPM</p>
      <nav className="flex flex-col gap-1 px-3">
        {ITENS.map((item) => {
          const ativo = caminho.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`rounded-md px-3 py-2 text-sm transition-colors ${
                ativo ? "bg-zinc-100 claro:bg-verde-vale font-medium text-zinc-900 claro:text-white" : "text-zinc-400 claro:text-tinta-media hover:bg-zinc-900 claro:hover:bg-papel hover:text-zinc-100 claro:hover:text-tinta"
              }`}
            >
              {item.rotulo}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-zinc-800 claro:border-traco px-5 py-4">
        <BotaoTema className="mb-3 w-full" />
        <span className="inline-block rounded bg-zinc-800 claro:bg-nevoa px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 claro:text-tinta-media">
          Administrador
        </span>
        <p className="mt-2 text-sm font-medium text-zinc-100 claro:text-tinta">{admin.nome}</p>
        <p className="text-xs text-zinc-500 claro:text-tinta-suave">{admin.cargo}</p>
        <p className="font-mono text-xs text-zinc-600 claro:text-tinta-suave">{admin.matricula}</p>
      </div>
    </aside>
  );
}
