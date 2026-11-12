# Tela: Histórico

**Responsável:** _nome aqui_ · **Rota:** `/historico` · **Especificação:** [docs/telas.md](../../../../../documentos/docs/telas.md#3-histórico)

## Arquivos desta tela (só você mexe)

```
historico/
  page.tsx                     entrada da rota (não precisa mexer)
  _components/HistoricoView.tsx   filtros + tabela
```

## Dados (de `@/lib/dados`)

- `historico(filtros)` · leituras filtradas, mais recentes primeiro. Filtros: `nome`, `turno`, `funcao`, `status`, `trecho`, `dia` (tipo `FiltrosHistorico` em `@/lib/tipos`)
- `listarTrechos()` · opções do filtro de trecho

Os dados fictícios cobrem o dia **2026-10-07**, das 06h às 22h, uma leitura a cada 10 min por pessoa, **em ordem cronológica**. (Antes eram gerados pessoa por pessoa e nunca ordenados, então a tabela mostrava uma pessoa de cada vez em vez do turno acontecendo.)

## Já feito

- Todos os filtros acima
- Tabela com horário, pessoa, função, turno, trecho, velocidade e status, em ordem cronológica
- Paginação de 50 em 50

## A fazer

- [ ] Ajustar ao mockup
- [ ] Filtro por faixa de horário
- [ ] Ordenar clicando no cabeçalho
- [ ] Exportar CSV
- [ ] Resumo do dia de uma pessoa (tempo em cada status) e percurso num mini-mapa
