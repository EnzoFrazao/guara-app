import { describe, expect, it } from "vitest";
import { RAIO_MINIMO_M, distanciaM, raioDeCobertura } from "./cobertura";

describe("distanciaM", () => {
  it("é zero para o mesmo ponto", () => {
    expect(distanciaM([-2.57, -44.37], [-2.57, -44.37])).toBe(0);
  });

  it("um grau de latitude mede cerca de 111 km", () => {
    expect(distanciaM([0, 0], [1, 0])).toBeCloseTo(111_195, -2);
  });
});

describe("raioDeCobertura", () => {
  it("usa o raio mínimo para zero ou uma pessoa", () => {
    expect(raioDeCobertura([])).toBe(RAIO_MINIMO_M);
    expect(raioDeCobertura([[-2.57, -44.37]])).toBe(RAIO_MINIMO_M);
  });

  it("cobre a maior aresta da árvore geradora, com folga, arredondado a 10 m", () => {
    // Dois pontos a ~1,11 km: metade da distância (~556 m) x folga 1,15 = ~639 m -> 640.
    expect(raioDeCobertura([[0, 0], [0.01, 0]])).toBe(640);
  });

  it("o ponto do meio não aumenta o raio: vale a maior aresta, não a distância total", () => {
    const dois = raioDeCobertura([[0, 0], [0.01, 0]]);
    const tres = raioDeCobertura([[0, 0], [0.005, 0], [0.01, 0]]);
    expect(tres).toBeLessThan(dois);
  });

  it("nunca fica abaixo do mínimo, mesmo com todos juntos", () => {
    expect(raioDeCobertura([[0, 0], [0, 0.00001]])).toBe(RAIO_MINIMO_M);
  });
});
