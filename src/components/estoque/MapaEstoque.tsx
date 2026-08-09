import { useMemo, useState } from "react";
import { Boxes, MousePointerClick, PackageSearch } from "lucide-react";
import { statusValidade, type CelulaPalete, type ItemEstoque } from "@/data/estoque";
import { useEstrutura } from "@/lib/estrutura-queries";
import { AcoesPalete } from "@/components/estoque/AcoesPalete";
import { cn } from "@/lib/utils";

function corPalete(c: CelulaPalete) {
  if (!c.item) return "bg-secondary/50";
  const s = statusValidade(c.item.validade);
  if (s === "vencido") return "bg-dead";
  if (s === "critico") return "bg-crit";
  if (s === "atencao") return "bg-warn";
  return "bg-ok";
}

const LEGENDA: Array<[string, string]> = [
  ["bg-secondary/50", "Livre"],
  ["bg-ok", "Regular"],
  ["bg-warn", "Atenção ≤90d"],
  ["bg-crit", "Crítico ≤30d"],
  ["bg-dead", "Vencido"],
];

export function MapaEstoque({ itens }: { itens: ItemEstoque[] }) {
  const estrutura = useEstrutura();
  const AREAS = estrutura.areas;
  const [areaSel, setArea] = useState<string>("");
  const area = areaSel || AREAS[0] || "";
  const [sel, setSel] = useState<CelulaPalete | null>(null);
  const [paleteAcao, setPaleteAcao] = useState<ItemEstoque | null>(null);

  const mapa = useMemo(
    () => (area ? estrutura.buildMapaArea(itens, area) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itens, area, estrutura.ruas],
  );
  const ruas = estrutura.ruasDaArea(area);
  const capacidade = estrutura.capacidadeArea(area);
  const ocupados = itens.filter((i) => i.area === area).length;
  const ocupacao = capacidade ? Math.round((ocupados / capacidade) * 100) : 0;

  return (
    <section className="mapa-surface overflow-hidden rounded-xl border border-border bg-card shadow-lg shadow-background/40">
      <header className="flex flex-wrap items-start justify-between gap-4 px-5 pb-4 pt-5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
              <Boxes className="size-4" />
            </span>
            Mapa de estoque
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Paletes no chão · Área {area} · {ruas.length} ruas
          </p>
        </div>

        <div className="w-full max-w-xs shrink-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Ocupação
            </span>
            <span className="font-mono text-sm font-semibold text-foreground">{ocupacao}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-[width] duration-500"
              style={{ width: `${Math.min(ocupacao, 100)}%` }}
            />
          </div>
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {ocupados.toLocaleString("pt-BR")} / {capacidade.toLocaleString("pt-BR")} posições
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4">
        <div className="flex flex-wrap gap-1.5 rounded-full border border-border/70 bg-background/40 p-1">
          {AREAS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                setArea(a);
                setSel(null);
              }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition",
                a === area
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {a}
            </button>
          ))}
        </div>

        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {LEGENDA.map(([c, l]) => (
            <li key={l} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-full", c)} />
              {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="max-h-[560px] overflow-auto border-y border-border/70 bg-background/30 px-5 py-4">
        <div className="space-y-1">
          {mapa.map((linha, i) => {
            const ocupadosRua = linha.filter((c) => c.item).length;
            return (
              <div
                key={ruas[i].rua}
                className="mapa-rua group flex items-center gap-[3px] rounded-md py-0.5 pr-2 transition-colors hover:bg-accent/30"
              >
                <span className="sticky left-0 z-10 w-16 shrink-0 pr-2 text-right font-mono text-[10px] tabular-nums text-muted-foreground transition-colors group-hover:text-foreground">
                  {area}-{String(ruas[i].rua).padStart(2, "0")}
                </span>
                {linha.map((c) => {
                  const ativo = sel?.rua === c.rua && sel?.posicao === c.posicao;
                  return (
                    <button
                      key={`${c.posicao}-${c.nivel ?? 1}`}
                      type="button"
                      onClick={() => {
                        setSel(c);
                        if (c.item) setPaleteAcao(c.item);
                      }}
                      title={`${c.area}-${c.rua} · palete ${c.posicao}${
                        c.item ? ` · ${c.item.codigo} (clique para retirar ou transferir)` : " · livre"
                      }`}
                      className={cn(
                        "mapa-celula h-3.5 w-3.5 shrink-0 rounded-[3px] transition-all duration-150",
                        corPalete(c),
                        !c.item && "opacity-70",
                        ativo && "scale-125 ring-2 ring-ring ring-offset-1 ring-offset-background",
                      )}
                    />
                  );
                })}
                <span className="ml-2 shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground/70 opacity-0 transition-opacity group-hover:opacity-100">
                  {ocupadosRua}/{linha.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-4 text-sm">
        {sel ? (
          sel.item ? (
            <div className="grid gap-3 rounded-lg border border-border/70 bg-background/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Info
                label="Posição"
                value={`${sel.area}-${String(sel.rua).padStart(2, "0")}-${String(sel.posicao).padStart(2, "0")}`}
              />
              <Info label="Produto" value={`${sel.item.codigo} — ${sel.item.produto}`} />
              <Info label="Quantidade" value={`${sel.item.quantidade} caixas`} />
              <Info
                label="Validade"
                value={new Date(sel.item.validade + "T00:00:00Z").toLocaleDateString("pt-BR")}
              />
              <p className="col-span-full text-xs text-muted-foreground">{sel.item.descricao}</p>
              <button
                type="button"
                onClick={() => setPaleteAcao(sel.item!)}
                className="col-span-full inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                <PackageSearch className="size-3.5" />
                Retirar ou transferir
              </button>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-muted-foreground">
              <span className="size-2.5 rounded-full bg-secondary" />
              {sel.area}-{String(sel.rua).padStart(2, "0")} · palete {sel.posicao} — posição livre.
            </p>
          )
        ) : (
          <p className="flex items-center gap-2 text-muted-foreground">
            <MousePointerClick className="size-3.5 text-primary" />
            Clique em uma posição ocupada para ver detalhes e solicitar retirada ou transferência.
          </p>
        )}
      </div>

      <AcoesPalete
        item={paleteAcao}
        aberto={!!paleteAcao}
        onFechar={() => {
          setPaleteAcao(null);
          setSel(null);
        }}
      />
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="truncate font-medium" title={value}>
        {value}
      </p>
    </div>
  );
}
