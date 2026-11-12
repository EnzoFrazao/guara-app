# Tela: Cadastro (pessoa ↔ ESP32)

**Responsável:** Luick Vieira · **Rota:** `/cadastro` · **Especificação:** [docs/telas.md](../../../../../documentos/docs/telas.md#4-cadastro)

## Arquivos desta tela (só você mexe)

```
cadastro/
  page.tsx                              entrada da rota (não precisa mexer)
  _components/CadastroView.tsx          resumo, tabela de vínculo e estoque
  _components/NovoCadastroWizard.tsx    o cadastro em 4 passos
```

## Por que não tem login

Decisão do time: **o protótipo não tem tela de login**, de propósito.

- Quem avalia abre a URL e o sistema já está funcionando, sem atrito nos primeiros segundos do pitch.
- Com todos os dados no front, qualquer senha estaria dentro do JavaScript que o navegador baixa. Não protegeria nada.
- A separação que importa já existe por construção: **não existe tela de operário**. As 4 telas são todas do ponto de vista de quem coordena. O operário entra no sistema como *dado*, pela tag ESP32, nunca como usuário.

O que ficou no lugar do login: um **admin fixo** (`ADMIN_ATUAL` em `dados-mock.ts`, lido por `adminAtual()`), mostrado no rodapé da Sidebar com o selo "Administrador", e o aviso no topo desta tela explicando que o operário não acessa o sistema.

Se mais pra frente o time quiser *mostrar* controle de acesso no pitch, a ideia é um `/login` **decorativo e não obrigatório** (um link "Entrar", com o sistema funcionando sem passar por ele). Não está feito.

## Dados (de `@/lib/dados`)

- `listarPessoas()`, `listarDispositivos()`
- `adminAtual()` · síncrono, devolve o admin fixo
- `vincularDispositivo(pessoaId, dispositivoId)` · passe `null` para desvincular
- `cadastrarPessoa({ nome, matricula, funcao, turno, dispositivoId })` · `dispositivoId` pode ser `null`
- `cadastrarDispositivo(id, mac)` · usado no estoque (avulso) e no passo 3 do wizard
- `removerPessoa(pessoaId)` · exclui e devolve o ESP32 dela ao estoque
- `restaurarDados()` · volta pessoas e dispositivos ao estado de `dados-mock.ts`

As **validações ficam em `dados.ts`**, não na tela, porque é lá que um backend entraria depois:

| Regra | Onde |
|---|---|
| Vínculo 1 para 1 (um ESP32 por pessoa) | `aplicarVinculo` |
| Nome com ao menos 3 letras | `validarNome` |
| Matrícula com 6 dígitos e sem repetir | `validarMatricula` |
| Id da etiqueta no formato `ESP32-XXXX` (4 hex), sem repetir | `validarIdDispositivo` |
| MAC no formato `24:6F:28:FF:B0:04`, sem repetir | `validarMac` |

Os `validar*` são exportados para o wizard barrar **passo a passo**, e `cadastrarPessoa` / `cadastrarDispositivo` chamam os mesmos no fim. Uma regra, um lugar. A tela só mostra a mensagem que vem de lá.

## O wizard

4 passos: **Pessoa** (nome, matrícula) → **Função e turno** → **Dispositivo** → **Conferir**.

No passo do dispositivo dá para usar um do estoque, cadastrar um novo na hora (já sai vinculado) ou seguir sem — nesse caso a tela avisa que a pessoa não vai aparecer no mapa. Não dá para avançar com um passo inválido. A tabela abaixo do wizard continua servindo para trocar e desvincular depois.

## Persistência

Pessoas e dispositivos são guardados no **`localStorage`** do navegador (chave `guara.cadastro.v1`), para o que foi cadastrado sobreviver ao F5 durante a demonstração. **Continua sendo tudo front:** não há servidor nem banco. `dados-mock.ts` é a semente; o botão "Restaurar dados originais" no pé da tela limpa o navegador e volta ao estado inicial — use antes de apresentar.

## Já feito

- Cartões de resumo: pessoas cadastradas, com ESP32, sem ESP32, ESP32 livres
- Wizard de 4 passos, com validação por passo
- Quem sai do wizard com ESP32 aparece no mapa e no dashboard na hora, "aguardando programação", num ponto do pátio fixo pelo id (`leituraInicial` em `dados-mock.ts`); quem é desvinculado na tabela sai deles. Ainda não entra no histórico, que só tem as leituras geradas
- Cadastro de dispositivo novo dentro do próprio wizard
- Tabela com busca (nome ou matrícula), filtro por função e turno
- Vincular, trocar e desvincular pelo seletor da linha, com a bateria do dispositivo
- Excluir pessoa, com confirmação em dois passos na própria linha
- **Dois caminhos para cadastrar um ESP32**, de propósito: avulso, pelo formulário do cartão
  "Estoque de ESP32 livres" (o lote de tags costuma chegar antes das pessoas), e já vinculado,
  pelo passo 3 do wizard (quem recebe a tag na hora do cadastro). Os dois chamam
  `cadastrarDispositivo`, então as regras de id e MAC são as mesmas
- Estoque de ESP32 livres, com bateria e último sinal
- Mensagens de erro e de confirmação

## A fazer

- [ ] Ajustar ao mockup, quando houver (`documentos/docs/mockups/cadastro.png`)
- [ ] Ler o id do ESP32 por QR code na etiqueta (evolução da especificação)
- [ ] Histórico de trocas de dispositivo
- [ ] Trocar a exclusão por inativação (o campo `ativo` existe em `Pessoa` e ainda não é usado). Hoje `removerPessoa` apaga de vez; num sistema real isso perderia o registro do turno, então o certo é inativar e esconder das telas operacionais

## Arquivos compartilhados que esta tela mexeu

Avisar o time (regra 2 do [README do frontend](../../../README.md)):

- `src/lib/tipos.ts` · tipo `Admin` novo
- `src/lib/dados-mock.ts` · `ADMIN_ATUAL`
- `src/lib/dados.ts` · persistência no `localStorage`, validações, `adminAtual()`, `restaurarDados()`
- `src/lib/rotulos.ts` · `COR_BATERIA` e `faixaBateria()`, reaproveitáveis no dashboard
- `src/components/Sidebar.tsx` · bloco de identidade do admin no rodapé
