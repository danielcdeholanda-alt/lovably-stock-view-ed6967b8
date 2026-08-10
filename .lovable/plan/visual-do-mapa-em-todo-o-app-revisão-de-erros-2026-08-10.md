# Visual do mapa em todo o app + revisão de erros

Hoje só o Mapa de estoque tem o visual novo (superfície com brilho, cabeçalho, abas em pílula, cantos arredondados). O resto do app ainda usa cartões simples `rounded-md`. A ideia é padronizar tudo no mesmo estilo e, no caminho, corrigir os problemas encontrados no código.

## Parte 1 — Padronizar o visual

Criar um padrão reutilizável de "painel" (mesma receita do mapa) e aplicar em todas as telas:

- Cartão: canto arredondado maior, borda sutil, fundo com o gradiente/brilho do mapa e sombra suave.
- Cabeçalho: título com ícone dentro de um quadradinho destacado + subtítulo em texto secundário.
- Abas/filtros: pílulas dentro de uma barra arredondada (como as áreas A–F do mapa).
- Tabelas: cabeçalho fixo discreto, linhas com hover suave e números em fonte monoespaçada.

Telas afetadas:

- KPIs, Gráficos, Agrupamento de produtos, Tabela de estoque, Alerta FEFO, Painel de movimentação (abas viram pílulas).
- Auditoria (filtros, tabela e botões de exportar), Estrutura, Usuários, Trocar senha.
- Login, Redefinir senha e as telas de 404/erro, para não destoarem.

Sem mudança de cores da marca, de textos ou de qualquer regra de negócio — só apresentação.

## Parte 2 — Revisão de erros

Já identificado e será corrigido:

- **Erro de hidratação na tela de login**: a página `/auth` é renderizada no servidor mas depende de checagens do navegador (sessão e verificação de primeiro administrador), gerando divergência e o erro no console. Correção: marcar a rota como client-only, igual à rota inicial, e exibir um estado de carregamento enquanto a verificação roda.

Além disso, será feita uma varredura do restante do código procurando: imports não usados, dependências de efeitos/memos incorretas, chaves duplicadas em listas, tratamento de erro faltando em mutações, e acessos possivelmente nulos. O que for encontrado é corrigido; se algo exigir decisão de negócio, eu aviso em vez de mudar por conta própria.

## Detalhes técnicos

- `src/styles.css`: generalizar `mapa-surface` em uma utility `panel-surface` (mantendo `mapa-surface` como alias) e adicionar `panel-header`/`pill-tabs` para reuso.
- Novo `src/components/ui/painel.tsx` com `Painel`, `PainelHeader` e `PillTabs` para eliminar a repetição de `rounded-md border border-border bg-card` espalhada em 11 arquivos.
- Substituir esse padrão nos arquivos listados por `<Painel>`; sem alterar hooks, queries, RPCs ou lógica.
- `src/routes/auth.tsx`: adicionar `ssr: false` ao `createFileRoute` e renderizar fallback enquanto `bootstrap === null`.
- Verificação final com typecheck e lint.
