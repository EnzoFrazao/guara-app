# GUARÁ · Telas web

Vite (SPA) + React 19 + TypeScript + Tailwind 4 + React Router + TanStack Query + Leaflet. Protótipo **só visual, com dados ilustrativos**: o painel ainda não chama a API (`../backend/`, um esqueleto) nem tem conexão com ESP32 ou Raspberry. A troca do Next.js por Vite está na [ADR 0003](../../documentos/specs/decisions/0003-spa-vite-e-backend-fastapi.md).

**Dois temas, claro e escuro**, com alternância pelo botão do rodapé. O claro é o padrão de quem abre o link publicado; o escuro existe porque o painel fica num CCO, muitas vezes em sala de pouca luz. O mapa é a exceção — não muda de cor em nenhum dos dois, porque a cor do terreno e da água ajuda a situar quem olha. Cores, campos e botões vêm de `globals.css` (`.campo`, `.botao`, `.botao-secundario`) e de `lib/rotulos.ts`; **não invente cor nova na página.** Ver [ADR 0001](../../documentos/specs/decisions/0001-tema-claro-por-variante.md) e [ADR 0002](../../documentos/specs/decisions/0002-claro-como-padrao.md).

## Rodar

Precisa de Node.js 20 ou mais novo.

```bash
cd codigo/frontend
npm install
npm run dev
```

Abra http://localhost:5173. Antes de enviar: `npm run lint`, `npm test` e `npm run build` (este roda `tsc -b` e `vite build`). Para o painel receber eventos em tempo real da API, defina `VITE_WS_URL` (ex.: `ws://localhost:8000/ws/painel`) num `.env.local`; sem ela, o painel segue só com os dados ilustrativos.

## Divisão da equipe: uma tela por pessoa

| Tela | Pasta | O que ler primeiro |
|---|---|---|
| Dashboard | `src/app/dashboard/` | [README da tela](src/app/dashboard/README.md) |
| Mapa ao vivo | `src/app/mapa/` | [README da tela](src/app/mapa/README.md) |
| Histórico | `src/app/historico/` | [README da tela](src/app/historico/README.md) |
| Cadastro | `src/app/cadastro/` | [README da tela](src/app/cadastro/README.md) |

Especificação completa: [docs/telas.md](../../documentos/docs/telas.md). 

## Regras para não dar conflito

1. **Cada pessoa mexe só na pasta da sua tela.** Componentes próprios vão em `_components/` dessa pasta.
2. **Arquivos compartilhados** (`src/lib/`, `src/components/`, `src/app/{Shell,router}.tsx`, `index.html`, `globals.css`, `package.json`) são do Enzo. Precisa mudar algo neles (um campo novo, um componente comum, uma biblioteca)? Peça no grupo.
3. **Dados sempre pelos hooks de `@/lib/consultas`** (que chamam `@/lib/dados`). Nunca importe `dados-mock.ts` direto na tela; assim todos usam os mesmos dados ilustrativos e, quando a API existir, só `dados.ts` muda.
4. **Cores e rótulos de status** vêm de `@/lib/rotulos`.
5. **Uma branch por tela:** `tela/dashboard`, `tela/mapa`, `tela/historico`, `tela/cadastro`. Abra um Pull Request para `main`.

```bash
git checkout -b tela/mapa
# ...trabalhe...
git add codigo/frontend/src/app/mapa
git commit -m "Mapa: filtro por turno"
git push -u origin tela/mapa
```

## Estrutura

```
index.html              HTML único: idioma, metas, script do tema, VLibras
src/
  main.tsx              entrada: TanStack Query + React Router
  app/
    router.tsx          rotas (/ leva ao /mapa)
    Shell.tsx           barra lateral + conteúdo (compartilhado)
    dashboard/          ← tela 1
    mapa/               ← tela 2
    historico/          ← tela 3
    cadastro/           ← tela 4
  components/           Sidebar, PageHeader, Card, StatusBadge, AoVivo (compartilhado)
  lib/
    tipos.ts            tipos de dados (Admin, Pessoa, Dispositivo, Leitura, Alerta…)
    dados.ts            funções de dados e validações usadas pelas telas
    dados-mock.ts       dados ilustrativos: 50 pessoas, 51 ESP32, leituras de um dia
    consultas.ts        hooks do TanStack Query sobre dados.ts
    tempoReal.ts        WebSocket do painel (só liga com VITE_WS_URL)
    rotulos.ts          textos e cores de status, função, turno, alerta, bateria
public/
  icon.png              favicon: a marca do guará, sem o nome
  apple-icon.png        ícone de tela inicial do iPhone
  guara-marca.png       só o pássaro: barra lateral
  guara-logo-completo.png  lockup com o nome: pitch e capa
```

## Decisões que valem para todas as telas

- **Sem login.** O operário não é usuário do sistema: entra como dado, pela tag ESP32. O admin é fixo (`adminAtual()`), mostrado no rodapé da barra lateral. O porquê está em [docs/telas.md](../../documentos/docs/telas.md#quem-usa).
- **Sem `react-leaflet`.** O mapa usa Leaflet puro dentro de um `useEffect`, porque o `MapContainer` quebrava com o duplo-mount do StrictMode. Detalhes em [src/app/mapa/README.md](src/app/mapa/README.md).
- **Cadastro guardado no `localStorage`**, só para sobreviver ao F5 na demonstração. Continua tudo no front. Há um botão para voltar aos dados originais.
- **Nada de `setState` direto no corpo de um `useEffect`** — o lint barra. Dados vêm dos hooks do TanStack Query.
- **As telas desmontam ao navegar.** Filtros digitados não persistem ao voltar para a tela.
- **A marca na barra lateral é só o pássaro**, com "GUARÁ" em texto HTML ao lado. O lockup completo tem o nome em tinta escura, que sumiria no tema preto, e a legenda ficaria ilegível nos 224 px da barra. Ele está em `public/` para quem for montar o pitch.
