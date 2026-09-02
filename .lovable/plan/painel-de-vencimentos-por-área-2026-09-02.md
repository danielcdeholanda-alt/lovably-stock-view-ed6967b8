# Painel de Vencimentos por Área

## Objetivo
Novo painel no dashboard que lista produtos próximos do vencimento, agrupados por área, com alertas visuais conforme a proximidade da data de hoje.

## O que será criado

### Novo componente: `src/components/estoque/VencimentosPainel.tsx`
- Usa os dados já carregados pelo `useEstoque` (paletes do galpão ativo) e a lógica existente `diasParaVencer()` / `statusValidade()` de `src/data/estoque.ts` — sem nova consulta ao banco.
- Mostra apenas paletes com status **disponível** e validade em `vencido`, `crítico (≤30d)` ou `atenção (≤90d)`, ordenados pela validade mais próxima.
- **Alerta de topo**: faixa de destaque quando houver itens vencidos ou críticos, ex.: "5 paletes vencidos · 12 vencem em até 30 dias", usando os tokens `--dead` e `--warn`.
- **Agrupamento por área** (abas ou seções A, B, C...): cada área mostra contadores (vencidos / críticos / atenção) e a lista dos paletes com código do produto, nome, lote, endereço (área-rua-posição), validade e dias restantes com cor por severidade.
- Visual no padrão atual do app: componentes `Painel`/`PainelHeader` de `src/components/ui/painel.tsx` (superfície com gradiente, cantos arredondados).
- Estado vazio amigável: "Nenhum produto próximo do vencimento" quando tudo estiver regular.

### Integração
- Incluir `<VencimentosPainel itens={itens} />` em `src/routes/_authenticated/dashboard.tsx`, posicionado logo após o mapa do estoque.
- Nenhuma alteração em banco de dados, RPCs ou demais componentes.

## Detalhes técnicos
- Reutiliza `STATUS_LABEL` e os tokens semânticos (`--dead`, `--warn`, `--ok`) já definidos em `src/styles.css`.
- Datas calculadas em UTC, consistente com o restante do app.
- Atualização automática: o painel reage à mesma query `paletes`, então entradas/saídas refletem sem recarregar.
