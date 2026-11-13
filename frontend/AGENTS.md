# Painel GUARÁ (Vite + React)

Leia o [README](README.md) antes de mexer: regras para não dar conflito, estrutura e decisões que valem
para todas as telas. A memória técnica está em `documentos/specs/` (ver o `AGENTS.md` da raiz).

- Não é mais Next.js (ADR 0003): SPA em Vite, rotas em `src/app/router.tsx`, HTML em `index.html`.
  Não procure `layout.tsx`, `next/*`, `"use client"` ou `node_modules/next`.
- Dados: hooks de `@/lib/consultas` → `@/lib/dados`. Nunca importe `dados-mock.ts` na tela.
- Gates: `npm run lint`, `npm test`, `npm run build`.
