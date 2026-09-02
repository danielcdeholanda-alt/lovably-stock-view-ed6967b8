# Remover o alerta FEFO do dashboard

## Motivo
O alerta FEFO está gerando divergências. O pedido é removê-lo, sem tocar em nenhuma outra parte do app.

## Mudanças (somente o alerta FEFO)
1. `src/routes/_authenticated/dashboard.tsx`
   - Remover o `import { AlertaFefo }`.
   - Remover a linha `<AlertaFefo />` do JSX.
2. `src/components/estoque/AlertaFefo.tsx`
   - Excluir o arquivo do componente.
3. `src/lib/estoque-queries.ts`
   - Remover o hook `usePaletesForaDeOrdem` e o tipo `PaleteForaDeOrdem`, que existem exclusivamente para alimentar esse alerta.

## Fora de escrego
Nenhuma outra alteração de UI, lógica, banco ou regras de armazenagem. As regras FEFO/FIFO de saída (RPCs `registrar_saida_por_regra`, `previa_saida`, `sugerir_ruas_fefo`) continuam intactas — apenas o alerta visual some.

## Verificação
- `tsgo` sem erros após a remoção (sem importações órfãs).
