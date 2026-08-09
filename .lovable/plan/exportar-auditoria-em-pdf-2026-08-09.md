# Exportar auditoria em PDF

Adicionar a exportação em PDF na página de Auditoria, ao lado do CSV existente, usando exatamente os mesmos registros já filtrados na tela (período, usuário, tipo, produto, lote, palete, área, rua e posição).

## O que muda na tela

- O botão atual "Exportar CSV" ganha um vizinho "Exportar PDF".
- Ambos ficam desabilitados quando não há resultados.
- O PDF gerado abre o download direto, com nome `auditoria-movimentacoes-AAAA-MM-DD.pdf`.

## Conteúdo do PDF

- Cabeçalho: título "Auditoria de movimentações", nome do galpão, data/hora de geração e total de registros.
- Linha de filtros aplicados (só os que estiverem preenchidos), para que o documento seja autoexplicativo.
- Tabela em paisagem com as colunas essenciais: Data/Hora, Usuário, Tipo, Produto, Lote, Validade, Palete, Quantidade, Posição anterior, Nova posição, Motivo/Observação.
- Rodapé com numeração "Página X de Y".

## Detalhes técnicos

- Instalar `jspdf` e `jspdf-autotable`; geração 100% no navegador (nenhuma chamada extra ao banco).
- Extrair a montagem das linhas (hoje dentro de `exportar` em `src/routes/_authenticated/auditoria.tsx`) para um helper compartilhado, para CSV e PDF usarem a mesma fonte de dados.
- Novo módulo `src/lib/auditoria-export.ts` com `linhasAuditoria()`, `exportarCsv()` e `exportarPdf()`.
- Import dinâmico do `jspdf` dentro da função de exportação, evitando peso no carregamento inicial e problemas de SSR.
- Acentuação: usar a fonte padrão do jsPDF com codificação adequada (helvetica WinAnsi cobre português) e validar visualmente no preview.
