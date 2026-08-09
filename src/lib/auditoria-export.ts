import type { RegistroAuditoria } from "@/lib/estoque-queries";

export const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR");
export const dataBR = (iso?: string | null) =>
  iso
    ? new Date(iso.length <= 10 ? iso + "T00:00:00Z" : iso).toLocaleDateString("pt-BR", {
        timeZone: "UTC",
      })
    : "—";

const pos = (n?: number | null) => String(n ?? 0).padStart(2, "0");

export function origemDe(m: RegistroAuditoria) {
  return `${m.area}-${pos(m.rua)}-${pos(m.posicao)}`;
}
export function destinoDe(m: RegistroAuditoria) {
  if (!m.area_destino) return null;
  return `${m.area_destino}-${pos(m.rua_destino)}-${pos(m.posicao_destino)}`;
}

export const CABECALHO_AUDITORIA = [
  "Data/Hora",
  "Usuário",
  "Tipo",
  "Produto",
  "Descrição",
  "Lote",
  "Validade",
  "Palete",
  "Quantidade",
  "Qtd. anterior",
  "Galpão",
  "Área",
  "Rua",
  "Posição anterior",
  "Nova posição",
  "Motivo",
  "Observação",
];

/** Linhas completas (mesma fonte de dados para CSV e PDF). */
export function linhasAuditoria(registros: RegistroAuditoria[], galpaoNome?: string): string[][] {
  return registros.map((m) => [
    dataHora(m.data),
    m.usuario ?? "—",
    m.tipo,
    m.produtos?.codigo ?? "—",
    m.produtos?.nome ?? "—",
    m.lote ?? "—",
    dataBR(m.validade),
    m.palete_codigo ?? "—",
    String(m.quantidade),
    m.quantidade_anterior != null ? String(m.quantidade_anterior) : "—",
    galpaoNome ?? "—",
    m.area,
    String(m.rua),
    origemDe(m),
    destinoDe(m) ?? "—",
    m.motivo ?? "—",
    m.observacao ?? "—",
  ]);
}

const hoje = () => new Date().toISOString().slice(0, 10);

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportarCsv(registros: RegistroAuditoria[], galpaoNome?: string) {
  const csv = [CABECALHO_AUDITORIA, ...linhasAuditoria(registros, galpaoNome)]
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
    .join("\n");
  baixar(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    `auditoria-movimentacoes-${hoje()}.csv`,
  );
}

/** Colunas reduzidas para caber no PDF paisagem. */
const COLUNAS_PDF = [
  "Data/Hora",
  "Usuário",
  "Tipo",
  "Produto",
  "Lote",
  "Validade",
  "Palete",
  "Qtd.",
  "Pos. anterior",
  "Nova posição",
  "Motivo / Obs.",
];

export async function exportarPdf(
  registros: RegistroAuditoria[],
  opcoes: { galpaoNome?: string; filtros?: string[] } = {},
) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default;

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const larguraPag = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Auditoria de movimentações", 40, 40);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const sub = [
    opcoes.galpaoNome ? `Galpão: ${opcoes.galpaoNome}` : null,
    `Gerado em ${new Date().toLocaleString("pt-BR")}`,
    `${registros.length} registro(s)`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  doc.text(sub, 40, 56);

  let topo = 72;
  const filtros = (opcoes.filtros ?? []).filter(Boolean);
  if (filtros.length) {
    const texto = doc.splitTextToSize(`Filtros: ${filtros.join("  ·  ")}`, larguraPag - 80);
    doc.setTextColor(100);
    doc.text(texto, 40, topo);
    doc.setTextColor(0);
    topo += texto.length * 11 + 4;
  }

  const corpo = registros.map((m) => [
    dataHora(m.data),
    m.usuario ?? "—",
    m.tipo,
    `${m.produtos?.codigo ?? "—"}${m.produtos?.nome ? `\n${m.produtos.nome}` : ""}`,
    m.lote ?? "—",
    dataBR(m.validade),
    m.palete_codigo ?? "—",
    m.quantidade_anterior != null ? `${m.quantidade_anterior} > ${m.quantidade}` : String(m.quantidade),
    origemDe(m),
    destinoDe(m) ?? "—",
    m.motivo ?? m.observacao ?? "—",
  ]);

  autoTable(doc, {
    head: [COLUNAS_PDF],
    body: corpo,
    startY: topo,
    margin: { left: 40, right: 40, bottom: 34 },
    styles: { font: "helvetica", fontSize: 7.5, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 7.5 },
    alternateRowStyles: { fillColor: [245, 246, 248] },
    columnStyles: {
      0: { cellWidth: 78 },
      1: { cellWidth: 78 },
      2: { cellWidth: 52 },
      3: { cellWidth: 120 },
      4: { cellWidth: 50 },
      5: { cellWidth: 52 },
      6: { cellWidth: 62 },
      7: { cellWidth: 52 },
      8: { cellWidth: 62 },
      9: { cellWidth: 62 },
      10: { cellWidth: "auto" },
    },
  });

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Página ${i} de ${total}`,
      larguraPag - 40,
      doc.internal.pageSize.getHeight() - 16,
      { align: "right" },
    );
  }

  baixar(doc.output("blob"), `auditoria-movimentacoes-${hoje()}.pdf`);
}
