"use client";

// Leaflet puro, sem react-leaflet.
//
// Por quê: o MapContainer do react-leaflet cria o mapa num callback de ref, e não num
// efeito. Com o duplo-mount do StrictMode (React 19) o mesmo <div> era reaproveitado por
// uma segunda instância, o que gerava os erros "Map container is being reused by another
// instance", "Cannot read properties of null (reading '_targets')" e o appendChild de
// undefined no TileLayer. Criando o mapa dentro de um useEffect, o cleanup chama
// map.remove() e devolve o <div> limpo antes da remontagem.

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { CENTRO_TFPM, TRECHOS } from "@/lib/dados-mock";
import { COR_STATUS_MAPA, ROTULO_FUNCAO, ROTULO_STATUS } from "@/lib/rotulos";
import type { PosicaoAtual } from "@/lib/tipos";

// Tiles do OpenStreetMap, escurecidos por CSS (.leaflet-tile-pane em globals.css).
// Os basemaps escuros prontos (CARTO, Stadia) passaram a exigir chave de API; inverter
// o tile claro resolve sem depender de cadastro nem de chave em produção.
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const CREDITO = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const NOME_TRECHO = new Map(TRECHOS.map((t) => [t.id, t.nome]));

/** Monta o popup com DOM, e não com string, para nome digitado no cadastro não virar HTML. */
function popupDaPessoa(p: PosicaoAtual) {
  const raiz = document.createElement("div");
  raiz.className = "guara-popup";

  const nome = document.createElement("strong");
  nome.textContent = p.pessoa.nome;
  raiz.append(nome);

  const linhas = [
    `${ROTULO_FUNCAO[p.pessoa.funcao]} · Turno ${p.pessoa.turno}`,
    `${ROTULO_STATUS[p.status]} · ${NOME_TRECHO.get(p.trecho) ?? p.trecho} · ${p.velocidadeKmh} km/h`,
    // Sempre a posição lida do ESP32, nunca a do ponto desenhado (que pode ter sido afastado).
    `Lat ${p.lat.toFixed(6)} · Lon ${p.lon.toFixed(6)}`,
    `${p.dispositivo.id} · bateria ${p.dispositivo.bateriaPct}%`,
  ];
  for (const texto of linhas) {
    const linha = document.createElement("p");
    linha.textContent = texto;
    raiz.append(linha);
  }
  return raiz;
}

// Pontos das pessoas. Várias pessoas no mesmo trecho ficam a poucos metros umas das outras,
// e no zoom de enquadramento isso dá menos de um pixel: os pontos se empilhavam. Em vez de
// agrupar (o que esconderia gente), afastamos os pontos na tela só o bastante para não se
// sobreporem, e refazemos a cada zoom. Com zoom alto ninguém sai do lugar.
const RAIO_MAQUINISTA_PX = 6;
const RAIO_MANOBRISTA_PX = 4.5;
const FOLGA_PX = 1.5;

type PontoDesenhado = {
  pessoaId: string;
  marcador: L.CircleMarker;
  real: L.LatLng;
  raioBase: number;
  raio: number;
  /** Tem sinal: candidato a andar (ver escolherQuemAnda). */
  podeAndar: boolean;
};

/**
 * Tamanho do ponto conforme o zoom. No celular o enquadramento cai para o zoom 13, onde o
 * pátio inteiro tem ~150 px: com o ponto cheio, o espalhamento empurraria gente para fora
 * da área do radar. Encolhendo, todo mundo cabe sem encostar e sem sair do lugar.
 */
function escalaDoZoom(zoom: number) {
  if (zoom >= 15) return 1;
  if (zoom >= 14) return 0.8;
  return 0.6;
}

/** Empurra para fora os pares que se sobrepõem na tela, até ninguém encostar (ou 60 voltas). */
function espalharNaTela(m: L.Map, pontos: PontoDesenhado[]) {
  if (!m.getPane("mapPane")) return;
  const escala = escalaDoZoom(m.getZoom());
  for (const p of pontos) {
    p.raio = p.raioBase * escala;
    p.marcador.setRadius(p.raio);
  }
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of pontos) {
    const xy = m.latLngToLayerPoint(p.real);
    xs.push(xy.x);
    ys.push(xy.y);
  }

  for (let volta = 0; volta < 60; volta++) {
    let mexeu = false;
    for (let i = 0; i < pontos.length; i++) {
      for (let j = i + 1; j < pontos.length; j++) {
        const minimo = pontos[i].raio + pontos[j].raio + FOLGA_PX;
        const dx = xs[j] - xs[i];
        const dy = ys[j] - ys[i];
        const d = Math.hypot(dx, dy);
        if (d >= minimo) continue;
        // Pontos idênticos não têm direção: usa o ângulo áureo para abrir em leque, sempre igual.
        const angulo = (i * 137.5 + j * 47) * (Math.PI / 180);
        const ux = d > 0.01 ? dx / d : Math.cos(angulo);
        const uy = d > 0.01 ? dy / d : Math.sin(angulo);
        const metade = (minimo - d) / 2;
        xs[i] -= ux * metade;
        ys[i] -= uy * metade;
        xs[j] += ux * metade;
        ys[j] += uy * metade;
        mexeu = true;
      }
    }
    if (!mexeu) break;
  }

  pontos.forEach((p, k) => {
    const destino = m.layerPointToLatLng(L.point(xs[k], ys[k]));
    p.marcador.setLatLng(destino);
    if (p.marcador.isPopupOpen()) p.marcador.getPopup()?.setLatLng(destino);
  });
  escolherQuemAnda(pontos, xs, ys, escala);
}

// Pessoas andando. Os dados do protótipo são fixos entre as atualizações, e o mapa parado
// parecia uma planta com bolinhas. A maior parte das pessoas oscila uns poucos pixels, cada
// uma no seu ritmo, para ficar claro que cada ponto é alguém. É só desenho (CSS em
// globals.css, classes `guara-anda-N`): a posição e o popup continuam sendo a leitura do
// ESP32, e com prefers-reduced-motion ninguém se mexe.

/** Fração das bolinhas que anda (pedido do time: 60%). */
const FRACAO_ANDA = 0.6;
/** Quantos trajetos `guara-anda-N` existem em globals.css. */
const TRAJETOS = 6;
/** Maior deslocamento desses trajetos, em px, no zoom 15 ou mais. Atualize junto com o CSS. */
const PASSO_MAX_PX = 7.5;
/** Menor passo que ainda se nota; abaixo disso a bolinha parece parada. */
const PASSO_MIN_PX = 2.5;

/** Quem está sem sinal não tem posição nova: fica parado. */
function podeAndar(p: PosicaoAtual) {
  return p.status !== "sem_sinal";
}

/**
 * Trajeto e ritmo fixos por pessoa, tirados do id: uma nova escolha (zoom, filtro) não troca o
 * trajeto de quem continua andando. A duração varia de 9 a 14,9 s, então mesmo duas pessoas no
 * mesmo trajeto não andam juntas.
 */
function jeitoDeAndar(pessoaId: string) {
  // FNV-1a com mistura final: os ids diferem só no fim ("P007", "P012"), e um hash simples
  // deixava todo mundo com a mesma duração e no mesmo par de trajetos.
  let h = 2166136261;
  for (const c of pessoaId) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  h ^= h >>> 16;
  h = Math.imul(h, 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return { trajeto: (h % TRAJETOS) + 1, duracaoS: 9 + (Math.floor(h / TRAJETOS) % 60) / 10 };
}

/**
 * Escolhe quem anda depois do espalhamento: 60% das bolinhas, as de mais folga até o vizinho
 * primeiro. Cada uma anda no máximo metade da sua folga (o vizinho pode estar vindo na
 * direção oposta), mas nunca menos que PASSO_MIN_PX, senão nem pareceria andar. O espalhamento
 * deixa só 1,5 px entre vizinhos, então nos aglomerados duas bolinhas podem se sobrepor por
 * uns pixels enquanto andam; nunca a ponto de uma esconder a outra, e em repouso ninguém
 * encosta. Roda de novo a cada zoom; nos zooms afastados o passo encolhe junto com o ponto.
 */
function escolherQuemAnda(pontos: PontoDesenhado[], xs: number[], ys: number[], escala: number) {
  const vao = (i: number, j: number) => Math.hypot(xs[j] - xs[i], ys[j] - ys[i]) - pontos[i].raio - pontos[j].raio;
  const folga = pontos.map((_, i) => {
    let menor = Infinity;
    for (let j = 0; j < pontos.length; j++) if (j !== i) menor = Math.min(menor, vao(i, j));
    return menor;
  });
  const quantos = Math.round(pontos.length * FRACAO_ANDA);
  const escolhidos = pontos
    .map((_, i) => i)
    .filter((i) => pontos[i].podeAndar)
    .sort((a, b) => folga[b] - folga[a])
    .slice(0, quantos);
  const passo = new Map(
    escolhidos.map((i) => [i, Math.min(PASSO_MAX_PX, Math.max(PASSO_MIN_PX, folga[i] / 2 / escala)) / PASSO_MAX_PX]),
  );
  pontos.forEach((p, i) => andar(p, passo.has(i) ? escala * passo.get(i)! : null));
}

const CLASSES_ANDAR = ["guara-anda", ...Array.from({ length: TRAJETOS }, (_, i) => `guara-anda-${i + 1}`)];

/**
 * Liga o trajeto no marcador, com `escala` multiplicando o passo do CSS, ou desliga (`null`).
 * Os marcadores são recriados a cada 5 s; sem o atraso negativo tirado do relógio das
 * animações, o trajeto recomeçaria do zero e o ponto daria um pulo. O relógio é
 * `document.timeline`, e não `performance.now()`: com a aba escondida as animações param, mas
 * `performance.now()` continua correndo, e o ponto pularia na volta.
 */
function andar(p: PontoDesenhado, escala: number | null) {
  const el = p.marcador.getElement() as SVGElement | undefined;
  if (!el) return;
  if (escala === null) {
    el.classList.remove(...CLASSES_ANDAR);
    delete el.dataset.anda;
    return;
  }
  const { trajeto, duracaoS } = jeitoDeAndar(p.pessoaId);
  el.style.setProperty("--anda-escala", escala.toFixed(3));
  // Já andando (nova escolha no zoom): não mexer no atraso. A animação começou quando o
  // marcador nasceu; regravar o atraso agora deslocaria o trajeto e o ponto daria um pulo.
  if (el.dataset.anda === String(trajeto)) return;
  const agoraS = Number(document.timeline.currentTime ?? 0) / 1000;
  el.classList.remove(...CLASSES_ANDAR);
  el.classList.add("guara-anda", `guara-anda-${trajeto}`);
  el.style.animationDuration = `${duracaoS}s`;
  el.style.animationDelay = `-${(agoraS % duracaoS).toFixed(2)}s`;
  el.dataset.anda = String(trajeto);
}

// Cobertura ("radar" em volta de cada pessoa). Os círculos são desenhados opacos num pane
// próprio e o filtro SVG #guara-gosma, aplicado ao grupo inteiro (globals.css), borra e
// recorta o conjunto: círculos próximos se fundem numa forma única, como uma gosma. A
// transparência vem depois da fusão, então 50 círculos sobrepostos não escurecem.
const COR_COBERTURA = "#3b82f6";

/** Filtro da gosma: borra, aplica limiar no alfa (funde), separa a borda e clareia o miolo. */
function FiltroGosma() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <filter id="guara-gosma" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="borrao" />
        <feColorMatrix in="borrao" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="gosma" />
        <feMorphology in="gosma" operator="erode" radius="2" result="miolo" />
        <feComposite in="gosma" in2="miolo" operator="out" result="borda" />
        <feComponentTransfer in="gosma" result="preenchimento">
          <feFuncA type="linear" slope="0.18" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="preenchimento" />
          <feMergeNode in="borda" />
        </feMerge>
      </filter>
    </svg>
  );
}

export default function MapaLeaflet({ posicoes, raioCoberturaM }: { posicoes: PosicaoAtual[]; raioCoberturaM: number }) {
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const camadaPessoas = useRef<L.LayerGroup | null>(null);
  const camadaGosma = useRef<L.LayerGroup | null>(null);
  const camadaPulso = useRef<L.LayerGroup | null>(null);
  const renderers = useRef<{ gosma: L.Renderer; pulso: L.Renderer } | null>(null);
  const pontos = useRef<PontoDesenhado[]>([]);
  /** Pessoa com o popup aberto, para reabri-lo depois do redesenho de 5 s. */
  const popupAberto = useRef<string | null>(null);

  // Cria o mapa uma única vez e o destrói no cleanup.
  useEffect(() => {
    if (!elemento.current) return;

    const m = L.map(elemento.current, { center: CENTRO_TFPM, zoom: 14 });
    L.tileLayer(TILES, { attribution: CREDITO, maxZoom: 19 }).addTo(m);

    // Enquadra o pátio inteiro, em vez de confiar num zoom fixo. Sem animação: na
    // primeira pintura não há o que animar, e um fitBounds animado deixa trabalho
    // agendado para depois, que é justamente o que não queremos num componente que
    // pode ser desmontado a qualquer momento.
    // No celular a margem de 48 px comeria boa parte do mapa.
    const margem = elemento.current.clientWidth < 640 ? 16 : 48;
    m.fitBounds(L.latLngBounds(TRECHOS.map((t) => t.centro)), { padding: [margem, margem], animate: false });

    // Trechos: círculos provisórios até termos os polígonos reais do pátio.
    for (const t of TRECHOS) {
      L.circle(t.centro, {
        radius: t.areaDeRisco ? 80 : 90,
        color: t.areaDeRisco ? "#f87171" : "#52525b",
        weight: t.areaDeRisco ? 2 : 1,
        fillColor: t.areaDeRisco ? "#ef4444" : "#a1a1aa",
        fillOpacity: t.areaDeRisco ? 0.12 : 0.05,
      })
        .bindTooltip(t.nome)
        .addTo(m);
    }

    // Panes da cobertura: acima dos tiles (200) e abaixo dos trechos e pessoas (400), sem
    // capturar clique, para os popups continuarem funcionando por cima da gosma.
    for (const [nome, z] of [["radar", "350"], ["radarPulso", "360"]] as const) {
      const pane = m.createPane(nome);
      pane.style.zIndex = z;
      pane.style.pointerEvents = "none";
    }
    // Um renderer por pane, criado uma vez: cada um tem o próprio <svg>, e o filtro vale só
    // para o da gosma. Criar renderer a cada redesenho deixaria um <svg> órfão a cada 5 s.
    renderers.current = { gosma: L.svg({ pane: "radar" }), pulso: L.svg({ pane: "radarPulso" }) };
    camadaGosma.current = L.layerGroup().addTo(m);
    camadaPulso.current = L.layerGroup().addTo(m);
    camadaPessoas.current = L.layerGroup().addTo(m);
    m.on("zoomend", () => espalharNaTela(m, pontos.current));
    mapa.current = m;

    return () => {
      m.remove();
      mapa.current = null;
      camadaPessoas.current = null;
      camadaGosma.current = null;
      camadaPulso.current = null;
      renderers.current = null;
      pontos.current = [];
    };
  }, []);

  // Redesenha os pontos a cada atualização de posição.
  useEffect(() => {
    const camada = camadaPessoas.current;
    const m = mapa.current;
    // `map.remove()` faz `delete this._mapPane`, e aí qualquer conta de coordenada
    // estoura com "Cannot read properties of undefined (reading '_leaflet_pos')".
    // Como a tela recarrega as posições a cada 5 s e o Fast Refresh remonta o
    // componente em desenvolvimento, dá para cair aqui com o mapa já destruído:
    // `getPane` devolve undefined nesse caso, e é o sinal de que não há onde desenhar.
    const gosma = camadaGosma.current;
    const pulso = camadaPulso.current;
    const r = renderers.current;
    if (!camada || !gosma || !pulso || !r || !m || !m.getPane("mapPane")) return;
    // O clearLayers fecha o popup (e dispara popupclose), então guardamos antes quem estava aberto.
    const reabrir = popupAberto.current;
    camada.clearLayers();
    gosma.clearLayers();
    pulso.clearLayers();

    if (raioCoberturaM > 0) {
      for (const p of posicoes) {
        L.circle([p.lat, p.lon], {
          renderer: r.gosma,
          radius: raioCoberturaM,
          stroke: false,
          fillColor: COR_COBERTURA,
          fillOpacity: 1,
          interactive: false,
        }).addTo(gosma);
        L.circle([p.lat, p.lon], {
          renderer: r.pulso,
          radius: raioCoberturaM,
          color: COR_COBERTURA,
          weight: 1.5,
          fill: false,
          interactive: false,
          className: "guara-radar-pulso",
        }).addTo(pulso);
      }
    }

    pontos.current = posicoes.map((p) => {
      const raio = p.pessoa.funcao === "maquinista" ? RAIO_MAQUINISTA_PX : RAIO_MANOBRISTA_PX;
      const marcador = L.circleMarker([p.lat, p.lon], {
        radius: raio,
        color: "#09090b",
        weight: 1.5,
        fillColor: COR_STATUS_MAPA[p.status],
        fillOpacity: 1,
      })
        .bindPopup(popupDaPessoa(p))
        .on("popupopen", () => (popupAberto.current = p.pessoaId))
        .on("popupclose", () => {
          if (popupAberto.current === p.pessoaId) popupAberto.current = null;
        })
        .addTo(camada);
      return { pessoaId: p.pessoaId, marcador, real: L.latLng(p.lat, p.lon), raioBase: raio, raio, podeAndar: podeAndar(p) };
    });
    espalharNaTela(m, pontos.current);

    // Reabre sem autoPan: se a pessoa arrastou o mapa, não queremos puxá-lo de volta a cada 5 s.
    const alvo = pontos.current.find((p) => p.pessoaId === reabrir)?.marcador;
    const popup = alvo?.getPopup();
    if (alvo && popup) {
      popup.options.autoPan = false;
      alvo.openPopup();
      popup.options.autoPan = true;
    }
  }, [posicoes, raioCoberturaM]);

  return (
    <>
      <FiltroGosma />
      {/* `isolate` prende os z-index do Leaflet (os controles chegam a 1000) dentro do mapa; sem
          isso, ao rolar a página no celular, o botão de zoom passava por cima do topo fixo. */}
      <div ref={elemento} className="isolate h-[60svh] min-h-80 w-full rounded-lg border border-zinc-800 claro:border-traco lg:h-[560px]" />
    </>
  );
}
