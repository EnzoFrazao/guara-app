import { describe, expect, it } from "vitest";
import { chaves } from "./consultas";
import { atrasoDeReconexao, consultasAfetadas, tipoDaMensagem } from "./tempoReal";

describe("tipoDaMensagem", () => {
  it("reconhece os cinco tipos de evento do /ws/painel", () => {
    for (const tipo of ["posicao", "dispositivo_status", "alerta", "bloqueio", "acionamento"]) {
      expect(tipoDaMensagem(JSON.stringify({ tipo, v: 1 }))).toBe(tipo);
    }
  });

  it("ignora o que não é evento: tipo desconhecido, JSON inválido, não texto", () => {
    expect(tipoDaMensagem(JSON.stringify({ tipo: "telemetria" }))).toBeNull();
    expect(tipoDaMensagem("não é json")).toBeNull();
    expect(tipoDaMensagem("null")).toBeNull();
    expect(tipoDaMensagem(new ArrayBuffer(2))).toBeNull();
  });
});

describe("consultasAfetadas", () => {
  it("cada evento recarrega as consultas que dependem dele", () => {
    expect(consultasAfetadas("posicao")).toEqual([chaves.posicoes]);
    expect(consultasAfetadas("dispositivo_status")).toEqual([chaves.dispositivos, chaves.posicoes]);
    expect(consultasAfetadas("alerta")).toEqual([chaves.alertas]);
    expect(consultasAfetadas("bloqueio")).toEqual([chaves.alertas]);
  });

  it("acionamento e mensagem desconhecida não recarregam nada", () => {
    expect(consultasAfetadas("acionamento")).toEqual([]);
    expect(consultasAfetadas(null)).toEqual([]);
  });
});

describe("atrasoDeReconexao", () => {
  it("dobra a cada tentativa e para em 30 s", () => {
    expect([0, 1, 2, 3].map(atrasoDeReconexao)).toEqual([1000, 2000, 4000, 8000]);
    expect(atrasoDeReconexao(10)).toBe(30_000);
  });
});
