# GUARÁ — painel de Posicionamento Operacional Inteligente

![Next.js 16](https://img.shields.io/badge/Next.js-16-black) ![React 19](https://img.shields.io/badge/React-19-61dafb) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tailwind 4](https://img.shields.io/badge/Tailwind-4-38bdf8) ![Estado](https://img.shields.io/badge/estado-protótipo%20visual-orange)

Painel web do protótipo GUARÁ, feito para o desafio **Posicionamento Operacional Inteligente** do programa KaizenDO da Vale, no Terminal Ferroviário de Ponta da Madeira (São Luís/MA). Mostra onde está cada pessoa no pátio, quem está em campo, alertas e o histórico de posições.

**Estado:** protótipo **visual**, com dados ilustrativos (nomes e posições fictícios). Não há backend nem conexão com ESP32 ou Raspberry Pi.

## Telas

| Tela | Rota |
|---|---|
| Dashboard de monitoramento | `/dashboard` |
| Mapa ao vivo | `/mapa` |
| Histórico de posições | `/historico` |
| Cadastro | `/cadastro` |

## Stack

Next.js 16, React 19, TypeScript, Tailwind 4 e Leaflet.

## Como rodar

```bash
cd frontend
npm install
npm run dev
```

Abra http://localhost:3000. Antes de enviar alterações: `npm run lint` e `npm run build`.

Detalhes do front-end em [`frontend/README.md`](frontend/README.md).
