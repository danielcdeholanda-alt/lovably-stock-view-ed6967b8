import { statusValidade, type ItemEstoque } from "@/data/estoque";
import { useEstrutura } from "@/lib/estrutura-queries";
import { cn } from "@/lib/utils";
import { AlertTriangle, Boxes, PackageCheck, Warehouse } from "lucide-react";

export function Kpis({ itens }: { itens: ItemEstoque[] }) {
  const { ruas, capacidadeTotal } = useEstrutura();
  const paletes = itens.length;
  const caixas = itens.reduce((s, i) => s + i.quantidade, 0);
  const ocupacao = capacidadeTotal ? Math.round((paletes / capacidadeTotal) * 100) : 0;
  const criticos = itens.filter((i) => statusValidade(i.validade) === "critico").length;
  const vencidos = itens.filter((i) => statusValidade(i.validade) === "vencido").length;
  const skus = new Set(itens.map((i) => i.codigo)).size;

  const cards = [
    {
      label: "Paletes em estoque",
      value: paletes.toLocaleString("pt-BR"),
      hint: `${caixas.toLocaleString("pt-BR")} caixas · ${ruas.length} ruas`,
      icon: Boxes,
      chip: "bg-primary/12 text-primary",
    },
    {
      label: "Ocupação do armazém",
      value: `${ocupacao}%`,
      hint: `${capacidadeTotal.toLocaleString("pt-BR")} posições de palete`,
      icon: Warehouse,
      chip: "bg-chart-3/12 text-chart-3",
      barra: ocupacao,
    },
    {
      label: "Validade crítica (≤30d)",
      value: criticos.toLocaleString("pt-BR"),
      hint: "priorizar a saída destes paletes",
      icon: AlertTriangle,
      chip: "bg-crit/12 text-crit",
    },
    {
      label: "Vencidos / SKUs ativos",
      value: `${vencidos.toLocaleString("pt-BR")} / ${skus}`,
      hint: "vencidos: bloquear e dar baixa",
      icon: PackageCheck,
      chip: vencidos ? "bg-dead/12 text-dead" : "bg-ok/12 text-ok",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm shadow-foreground/5"
        >
          <div className="flex items-center gap-3">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", c.chip)}>
              <c.icon className="size-5" />
            </span>
            <p className="min-w-0 text-xs font-medium text-muted-foreground">{c.label}</p>
          </div>
          <p className="mt-4 font-mono text-3xl font-bold leading-none tracking-tight">{c.value}</p>
          {c.barra !== undefined && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-chart-3"
                style={{ width: `${Math.min(100, c.barra)}%` }}
              />
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}
