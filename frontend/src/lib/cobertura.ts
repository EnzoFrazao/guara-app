// Raio da área de cobertura do mapa (o "radar" em volta de cada pessoa).
//
// O pedido original era 3 km, mas a pera inteira mede ~1,2 x 1,9 km: com 3 km cada
// círculo cobre o pátio todo e a malha some numa mancha só. Em vez de um número fixo,
// usamos o menor raio que ainda liga todo mundo: dois círculos de raio r se tocam
// quando a distância entre os centros é <= 2r, então basta cobrir a maior aresta da
// árvore geradora mínima. Sem Leaflet aqui, porque MapaView também roda no servidor.

/** Menor raio desenhado, para uma pessoa sozinha (ou um trecho filtrado) ainda ter área. */
export const RAIO_MINIMO_M = 150;

/** Folga sobre o raio exato, para os círculos vizinhos formarem "ponte" e não só encostarem. */
const FOLGA = 1.15;

const RAIO_TERRA_M = 6_371_000;

/** Distância em metros entre dois pontos [lat, lon] (haversine). */
export function distanciaM(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLon = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_M * Math.asin(Math.sqrt(h));
}

/**
 * Menor raio (m) para que os círculos em volta de `pontos` formem uma área única.
 * Árvore geradora mínima por Prim, O(n²): com ~50 pessoas não vale estrutura melhor.
 * Arredonda para 10 m, para a legenda não tremer a cada atualização de posição.
 */
export function raioDeCobertura(pontos: [number, number][]) {
  if (pontos.length < 2) return RAIO_MINIMO_M;

  const naArvore = new Array<boolean>(pontos.length).fill(false);
  const melhor = new Array<number>(pontos.length).fill(Infinity);
  melhor[0] = 0;
  let maiorAresta = 0;

  for (let passo = 0; passo < pontos.length; passo++) {
    let u = -1;
    for (let i = 0; i < pontos.length; i++) {
      if (!naArvore[i] && (u === -1 || melhor[i] < melhor[u])) u = i;
    }
    naArvore[u] = true;
    maiorAresta = Math.max(maiorAresta, melhor[u]);
    for (let v = 0; v < pontos.length; v++) {
      if (!naArvore[v]) melhor[v] = Math.min(melhor[v], distanciaM(pontos[u], pontos[v]));
    }
  }

  const raio = Math.max(RAIO_MINIMO_M, (maiorAresta / 2) * FOLGA);
  return Math.ceil(raio / 10) * 10;
}
