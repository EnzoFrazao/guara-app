# GUARÁ · Telas web

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + Leaflet. Protótipo **só visual, com dados ilustrativos**. Não há backend nem conexão com ESP32 ou Raspberry.

**Dois temas, claro e escuro**, com alternância pelo botão do rodapé. O claro é o padrão de quem abre o link publicado; o escuro existe porque o painel fica num CCO, muitas vezes em sala de pouca luz. O mapa é a exceção — não muda de cor em nenhum dos dois, porque a cor do terreno e da água ajuda a situar quem olha. Cores, campos e botões vêm de `globals.css` (`.campo`, `.botao`, `.botao-secundario`) e de `lib/rotulos.ts`; **não invente cor nova na página.** Ver [ADR 0001](../../documentos/specs/decisions/0001-tema-claro-por-variante.md) e [ADR 0002](../../documentos/specs/decisions/0002-claro-como-padrao.md).

## Rodar

Precisa de Node.js 20 ou mais novo.

```bash
cd codigo/frontend
npm install
npm run dev
```

Abra http://localhost:3000. Antes de enviar: `npm run lint` e `npm run build`.

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
2. **Arquivos compartilhados** (`src/lib/`, `src/components/`, `src/app/layout.tsx`, `globals.css`, `package.json`) são do Enzo. Precisa mudar algo neles (um campo novo, um componente comum, uma biblioteca)? Peça no grupo.
3. **Dados sempre por `@/lib/dados`.** Nunca importe `dados-mock.ts` direto na tela; assim todos usam os mesmos dados ilustrativos.
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
src/
  app/
    layout.tsx          barra lateral + conteúdo (compartilhado)
    page.tsx            redireciona para /mapa
    dashboard/          ← tela 1
    mapa/               ← tela 2
    historico/          ← tela 3
    cadastro/           ← tela 4
    icon.png            favicon: a marca do guará, sem o nome
  components/           Sidebar, PageHeader, Card, StatusBadge, AoVivo (compartilhado)
  lib/
    tipos.ts            tipos de dados (Admin, Pessoa, Dispositivo, Leitura, Alerta…)
    dados.ts            funções de dados e validações usadas pelas telas
    dados-mock.ts       dados ilustrativos: 50 pessoas, 51 ESP32, leituras de um dia
    rotulos.ts          textos e cores de status, função, turno, alerta, bateria
public/
  guara-marca.png       só o pássaro: barra lateral
  guara-logo-completo.png  lockup com o nome: pitch e capa
```

## Decisões que valem para todas as telas

- **Sem login.** O operário não é usuário do sistema: entra como dado, pela tag ESP32. O admin é fixo (`adminAtual()`), mostrado no rodapé da barra lateral. O porquê está em [docs/telas.md](../../documentos/docs/telas.md#quem-usa).
- **Sem `react-leaflet`.** O mapa usa Leaflet puro dentro de um `useEffect`, porque o `MapContainer` quebrava com o duplo-mount do StrictMode. Detalhes em [src/app/mapa/README.md](src/app/mapa/README.md).
- **Cadastro guardado no `localStorage`**, só para sobreviver ao F5 na demonstração. Continua tudo no front. Há um botão para voltar aos dados originais.
- **Nada de `setState` direto no corpo de um `useEffect`** — o lint barra. Carregue dados no callback da promessa.
- **A marca na barra lateral é só o pássaro**, com "GUARÁ" em texto HTML ao lado. O lockup completo tem o nome em tinta escura, que sumiria no tema preto, e a legenda ficaria ilegível nos 224 px da barra. Ele está em `public/` para quem for montar o pitch.

Atenção: esta versão do Next.js é mais nova que muitos tutoriais. Em dúvida, a documentação instalada está em `node_modules/next/dist/docs/`.
