import type { ComponentProps, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Classe base dos painéis — mesmo acabamento do Mapa de estoque. */
export const painelCls =
  "panel-surface rounded-xl border border-border bg-card shadow-lg shadow-background/40";

/** Barra arredondada que envolve abas/filtros em pílula. */
export const pillBarCls =
  "flex flex-wrap gap-1.5 rounded-full border border-border/70 bg-background/40 p-1";

/** Classe de uma pílula de aba/filtro. */
export function pillCls(ativo: boolean) {
  return cn(
    "rounded-full px-3 py-1 text-xs font-medium transition",
    ativo
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
  );
}

export function Painel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn(painelCls, "overflow-hidden", className)} {...props} />;
}

export function PainelHeader({
  titulo,
  descricao,
  icone: Icone,
  acoes,
  className,
}: {
  titulo: ReactNode;
  descricao?: ReactNode;
  icone?: ElementType;
  acoes?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pb-4 pt-5", className)}
    >
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
          {Icone && (
            <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Icone className="size-4" />
            </span>
          )}
          <span className="min-w-0 truncate">{titulo}</span>
        </h2>
        {descricao && <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>}
      </div>
      {acoes}
    </header>
  );
}
