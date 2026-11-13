# Tela: Mapa ao vivo

**Responsável:** _nome aqui_ · **Rota:** `/mapa` · **Especificação:** [docs/telas.md](../../../../../documentos/docs/telas.md#2-mapa-ao-vivo)

## Arquivos desta tela (só você mexe)

```
mapa/
  page.tsx                  entrada da rota (não precisa mexer)
  _components/MapaView.tsx  filtros, legenda e atualização periódica
  _components/MapaLeaflet.tsx  o mapa (Leaflet), carregado só no navegador
```

Fora da pasta: `@/lib/cobertura` calcula o raio da área de cobertura.

O Leaflet pesa e só faz sentido no navegador; por isso `MapaView` importa `MapaLeaflet` com `React.lazy` dentro de um `Suspense`, com o mesmo esqueleto de carregamento de antes. Mantenha assim.

## Por que Leaflet puro, e não react-leaflet

O `react-leaflet` foi **removido do projeto**. O `MapContainer` dele cria o mapa num callback de `ref`, e não num efeito, então com o duplo-mount do StrictMode (React 19) o mesmo `<div>` era reaproveitado por uma segunda instância. Daí os três erros:

- `Map container is being reused by another instance`
- `Cannot read properties of null (reading '_targets')`
- `Cannot read properties of undefined (reading 'appendChild')` no `TileLayer`

Agora o mapa é criado dentro de um `useEffect` e o cleanup chama `map.remove()`, devolvendo o `<div>` limpo antes da remontagem. **Não volte a usar `MapContainer`.**

Dois efeitos: um cria e destrói o mapa (roda uma vez), outro redesenha as camadas de pessoas e de cobertura quando `posicoes` ou o raio mudam.

## Cobertura (a "gosma" azul)

Em volta de cada pessoa há um círculo azul; os círculos se fundem numa forma única, translúcida e com contorno, mostrando a malha que liga todo mundo. Um pulso de radar sai de cada pessoa (desligado com `prefers-reduced-motion`). O checkbox "Cobertura" liga e desliga; a legenda mostra o raio.

- **Raio calculado, não fixo.** O pedido inicial era 3 km, mas a pera mede ~1,2 x 1,9 km: cada círculo cobriria o pátio todo. `raioDeCobertura()` usa o menor raio que ainda conecta todos os pontos visíveis (metade da maior aresta da árvore geradora mínima, +15 % de folga, mínimo de 150 m, arredondado a 10 m). Recalcula com os filtros. Com os dados atuais dá ~230 m.
- **Só o pátio entra na conta.** Quem está num trecho com `foraDoPatio` (o restaurante, a ~2,6 km) fica fora do cálculo: senão o raio subiria para ~1,4 km e a malha do pátio viraria uma mancha só. Essas pessoas ganham a própria gosma, com o mesmo raio. A cobertura só aparece depois que os trechos carregam, para a mancha não piscar.
- **Por que filtro SVG.** Círculos translúcidos empilhados escurecem onde se sobrepõem. Por isso os círculos são opacos, num pane próprio (`radar`), e o filtro `#guara-gosma` (declarado no JSX do `MapaLeaflet`, aplicado em `globals.css`) borra, aplica limiar no alfa (funde), recorta a borda e só então deixa o miolo translúcido.
- **Renderers criados uma vez**, junto com o mapa. Criar `L.svg()` a cada redesenho deixaria um `<svg>` órfão no pane a cada 5 s.
- Os panes da cobertura ficam entre os tiles e os trechos e não capturam clique: os popups continuam funcionando.

## Pontos sem sobreposição

- **Espalhamento na tela, não nos dados.** `espalharNaTela()` empurra os pares de pontos que se encostam até ficarem a 1,5 px um do outro, e roda de novo a cada `zoomend`. No zoom alto quase ninguém sai do lugar. O popup mostra sempre a lat/lon lida do ESP32, nunca a do ponto desenhado.
- **Ponto encolhe nos zooms afastados** (`escalaDoZoom`: 100 % do zoom 15 para cima, 80 % no 14, 60 % no 13 ou menos). No celular o enquadramento cai para o zoom 13; com o ponto cheio, o espalhamento empurrava gente para fora da gosma.
- **Popup sobrevive ao redesenho de 5 s.** O `clearLayers` fecha o popup; guardamos quem estava aberto antes e reabrimos sem `autoPan`, para não puxar o mapa de volta se a pessoa o arrastou.

## Pessoas andando

Os dados do protótipo não mudam entre as atualizações de 5 s, e o mapa parado parecia uma planta com bolinhas. **60% das bolinhas** (`FRACAO_ANDA`, pedido do time) oscilam num laço lento; só quem está sem sinal fica de fora (`escolherQuemAnda` e `andar` no `MapaLeaflet`; trajetos `guara-anda-N` em `globals.css`).

- **Passo pela folga.** O espalhamento deixa só 1,5 px entre vizinhos. Depois de espalhar, os de mais folga até o vizinho são escolhidos primeiro, e cada um anda no máximo metade da sua folga (o vizinho pode vir na direção oposta), entre `PASSO_MIN_PX` (2,5) e `PASSO_MAX_PX` (7,5) no zoom 15; nos zooms afastados o passo encolhe com o ponto (`--anda-escala`). A escolha refaz a cada zoom.
- **Sem pulo no zoom.** Na nova escolha do `zoomend`, quem já está andando no mesmo trajeto só ganha a escala nova (`data-anda` no `<path>`). Regravar o `animation-delay` de uma animação em curso desloca o trajeto (o início dela é quando o marcador nasceu) e o ponto pulava ~4 px, e de novo no redesenho seguinte.
- **Pode encostar um pouco, nunca esconder.** Com 60% andando não há folga para todos, então nos aglomerados duas bolinhas se sobrepõem por uns pixels enquanto andam; em repouso ninguém encosta. Medido a 375 px (zoom 14) simulando 60 s: pior sobreposição de 1,65 px, e os centros nunca ficam a menos de 1,57 vezes o raio da bolinha maior. A primeira versão (6 pessoas, só quem tinha folga para não encostar nunca) foi trocada por esta a pedido.
- **Trajeto e ritmo por pessoa**, tirados de um hash do id (`jeitoDeAndar`): a escolha pode mudar com zoom ou filtro sem trocar o trajeto de quem continua andando. O hash precisa misturar bem: os ids só diferem no fim, e um `h * 31 + c` deixava todos com a mesma duração.
- **Só desenho.** É um `transform` de CSS no `<path>` do marcador: a posição, o espalhamento e o popup continuam sendo a leitura do ESP32. Com `prefers-reduced-motion`, ninguém se mexe.
- **`--anda-escala` sem fallback no `var()`; o padrão fica na classe `.guara-anda`.** Com `calc(var(--anda-x1) * var(--anda-escala, 1))` o CSS servido pelo `next dev` (da época do Next.js) chegou sem o `calc` e o passo não encolhia. Não ficou claro se foi o otimizador do Tailwind ou cache do dev; sem o fallback, o `calc` chega no dev e no build.
- **Sem pulo a cada 5 s.** Os marcadores são recriados no redesenho; o atraso negativo da animação vem de `document.timeline.currentTime`, então o trajeto continua de onde estava. Não use `performance.now()`: com a aba escondida as animações param, mas ele continua correndo, e o ponto pularia na volta.

## Tiles

`tile.openstreetmap.org`, coloridos de propósito — a cor do terreno e da água ajuda a situar quem olha, e o resto da interface é escuro. Os basemaps escuros prontos (CARTO, Stadia) passaram a exigir chave de API; se um dia precisar de mapa escuro, prefira escurecer por CSS em `.leaflet-tile-pane` a depender de chave.

## Dados (de `@/lib/dados`)

- `posicoesAtuais()` · um ponto por pessoa (lat, lon, status, velocidade, bateria)
- `listarTrechos()` · centro de cada trecho e se é área de risco
- `listarAlertas(true)` · para destacar quem está em alerta

## Já feito

Mapa OpenStreetMap, círculos dos trechos (viradores em vermelho) e do restaurante, pontos coloridos por status e sem sobreposição, área de cobertura fundida com pulso de radar, 60% das pessoas andando um pouco, popup com detalhes e lat/lon (fica aberto nas atualizações), layout de celular, filtros de nome, função, status, turno e trecho, legenda, selo "ao vivo" com hora da última leitura, enquadramento automático no pátio (`fitBounds`) e atualização a cada 5 s.

## A fazer

- [ ] Ajustar ao mockup
- [ ] Destacar pessoas com alerta ativo (piscar ou ícone)
- [ ] Rastro dos últimos minutos ao clicar numa pessoa (usar `historico({ nome, dia })`)
- [ ] Imagem do mapa oficial do TFPM como camada (`documentos/docs/fotos-desafio/09-mapa-tfpm-a.png`)
- [ ] Polígonos de verdade dos trechos, no lugar dos círculos

## Coordenadas

Os centros dos trechos em `dados-mock.ts` vêm de **pontos levantados pela equipe**: os viradores, o PIAL (Posto de Inspeção e Abastecimento de Locomotivas), o centro da pera e cinco vértices do anel. Os outros cinco trechos são o ponto médio entre vizinhos, para os 12 ficarem espaçados ao redor do laço.

A pera cobre cerca de **1,2 x 1,9 km** e os trechos vizinhos ficam a ~200 m; os círculos dos trechos têm raio de 90 m. As pessoas do pátio são sorteadas por igual em todo o retângulo dos trechos, e o trecho de cada uma é o mais próximo do ponto sorteado. Antes ficavam a ~50 m do centro de um trecho, e como os trechos formam duas fileiras o mapa mostrava dois montinhos.

O **restaurante (Porto Vale)** fica fora da pera, em `-2.5569236, -44.3600747` (ponto informado pela equipe). Só três pessoas aparecem lá, no fim do dia: duas almoçando e uma descansando. "Almoçando" e "descansando" só existem para quem está no restaurante; no pátio o status é manobrando, aguardando programação ou sem sinal.

Continua sendo aproximação — o polígono de cada trecho só sai com a planta oficial da Vale.

**Divergências com o diagrama oficial (conferido em 2026-10-07, não corrigido de propósito):** ver [`specs/open-decisions.md`](../../../../../documentos/specs/open-decisions.md). Resumo: no diagrama X01/X02 ficam dentro do Pátio de Recepção e X06/X07 dentro da Formação; aqui são trechos separados e distantes, e falta o X04.

> Houve duas versões erradas antes desta: coordenadas inventadas (as pessoas apareciam **no mar**) e depois um corredor tirado do OpenStreetMap, longo demais e deslocado. Se precisar mexer, parta dos pontos levantados, não de estimativa.
