import { afterEach, describe, expect, it } from "vitest";
import {
  cadastrarDispositivo,
  cadastrarPessoa,
  normalizarIdDispositivo,
  normalizarMac,
  normalizarNome,
  posicoesAtuais,
  removerPessoa,
  restaurarDados,
  validarIdDispositivo,
  validarMac,
  validarMatricula,
  validarNome,
  vincularDispositivo,
} from "./dados";
import { DISPOSITIVOS, PESSOAS } from "./dados-mock";

// O mock vive em memória e `dados.ts` o altera no lugar: cada teste volta ao estado original.
afterEach(() => restaurarDados());

const livre = () => DISPOSITIVOS.find((d) => !d.pessoaId)!;
const semEsp = () => PESSOAS.find((p) => !p.dispositivoId)!;
const comEsp = () => PESSOAS.find((p) => p.dispositivoId)!;

describe("validações de campo", () => {
  it("normaliza nome, id e MAC", () => {
    expect(normalizarNome("  Ana   Maria  Lima ")).toBe("Ana Maria Lima");
    expect(normalizarIdDispositivo(" esp32-0b04 ")).toBe("ESP32-0B04");
    expect(normalizarMac("24-6f-28-ff-b0-04")).toBe("24:6F:28:FF:B0:04");
  });

  it("nome precisa de ao menos 3 caracteres", () => {
    expect(validarNome("Al")).not.toBeNull();
    expect(validarNome("Ana")).toBeNull();
  });

  it("matrícula: 6 dígitos e sem duplicidade", () => {
    expect(validarMatricula("12345")).toMatch(/6 dígitos/);
    expect(validarMatricula("abcdef")).toMatch(/6 dígitos/);
    expect(validarMatricula(PESSOAS[0].matricula)).toMatch(/já está cadastrada/);
    expect(validarMatricula("999999")).toBeNull();
  });

  it("id do ESP32: formato ESP32-XXXX hexadecimal e sem duplicidade", () => {
    expect(validarIdDispositivo("ESP32-ZZZZ")).toMatch(/formato/);
    expect(validarIdDispositivo(DISPOSITIVOS[0].id.toLowerCase())).toMatch(/já está cadastrado/);
    expect(validarIdDispositivo("esp32-0f0f")).toBeNull();
  });

  it("MAC: formato e sem duplicidade", () => {
    expect(validarMac("24:6F:28")).toMatch(/formato/);
    expect(validarMac(DISPOSITIVOS[0].mac)).toMatch(/já está cadastrado/);
    expect(validarMac("AA:BB:CC:DD:EE:FF")).toBeNull();
  });
});

describe("vínculo pessoa e ESP32 (1 para 1)", () => {
  it("vincula um ESP32 livre a quem está sem", async () => {
    const pessoa = semEsp();
    const d = livre();
    await vincularDispositivo(pessoa.id, d.id);
    expect(pessoa.dispositivoId).toBe(d.id);
    expect(d.pessoaId).toBe(pessoa.id);
  });

  it("recusa um ESP32 que já está com outra pessoa", async () => {
    const dono = comEsp();
    await expect(vincularDispositivo(semEsp().id, dono.dispositivoId!)).rejects.toThrow(/já está com/);
  });

  it("trocar de ESP32 solta o anterior", async () => {
    const pessoa = comEsp();
    const anterior = pessoa.dispositivoId!;
    const novo = livre();
    await vincularDispositivo(pessoa.id, novo.id);
    expect(DISPOSITIVOS.find((d) => d.id === anterior)!.pessoaId).toBeNull();
    expect(novo.pessoaId).toBe(pessoa.id);
  });

  it("desvincular devolve o ESP32 ao estoque", async () => {
    const pessoa = comEsp();
    const id = pessoa.dispositivoId!;
    await vincularDispositivo(pessoa.id, null);
    expect(pessoa.dispositivoId).toBeNull();
    expect(DISPOSITIVOS.find((d) => d.id === id)!.pessoaId).toBeNull();
  });
});

describe("cadastro e mapa", () => {
  it("cadastrar com ESP32 põe a pessoa no mapa; desvincular tira", async () => {
    const antes = (await posicoesAtuais()).length;
    const pessoa = await cadastrarPessoa({
      nome: "Teste Silva",
      matricula: "999999",
      funcao: "maquinista",
      turno: "A",
      dispositivoId: livre().id,
    });
    expect((await posicoesAtuais()).length).toBe(antes + 1);
    await vincularDispositivo(pessoa.id, null);
    expect((await posicoesAtuais()).length).toBe(antes);
  });

  it("remover a pessoa solta o ESP32 e some do mapa", async () => {
    const pessoa = comEsp();
    const id = pessoa.dispositivoId!;
    const antes = (await posicoesAtuais()).length;
    await removerPessoa(pessoa.id);
    expect(DISPOSITIVOS.find((d) => d.id === id)!.pessoaId).toBeNull();
    expect((await posicoesAtuais()).length).toBe(antes - 1);
  });

  it("cadastro inválido não deixa nada pela metade", async () => {
    const total = PESSOAS.length;
    await expect(
      cadastrarPessoa({ nome: "Teste Silva", matricula: "1", funcao: "maquinista", turno: "A", dispositivoId: null }),
    ).rejects.toThrow(/6 dígitos/);
    expect(PESSOAS.length).toBe(total);
  });

  it("cadastra um ESP32 avulso no estoque", async () => {
    const d = await cadastrarDispositivo("esp32-0f0f", "aa-bb-cc-dd-ee-ff");
    expect(d).toMatchObject({ id: "ESP32-0F0F", mac: "AA:BB:CC:DD:EE:FF", pessoaId: null });
  });
});
