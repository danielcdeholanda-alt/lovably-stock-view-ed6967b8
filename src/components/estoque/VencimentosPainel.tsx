import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Hourglass } from "lucide-react";
import { Painel, PainelHeader, pillBarCls, pillCls } from "@/components/ui/painel";
import {
  STATUS_LABEL,
  diasParaVencer,
  statusValidade,
  type ItemEstoque,
  type StatusValidade,
} from "@/data/estoque";
import { cn } from "@/lib/utils";

const SEVERIDADE_ORDEM: StatusValidade[] = ["vencido", "critico", "atencao"];

const sevCls: Record<StatusValidade, string> = {
  vencido: "border-dead/40 bg-dead/10 text-dead",
  critico: "border-dead/40 bg-dead/10 text-dead",
  atencao: "border-warn/40 bg-warn/10 text-warn",
  ok: "border-ok/40 bg-ok/10 text-ok",
};

function fmtData(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

type Linha = ItemEstoque & { dias: number; sev: StatusValidade };

export function VencimentosPainel({ itens }: { itens: ItemEstoque[] }) {
  const [areaSel, setAreaSel] = useState<string | null>(null);

  const linhas = useMemo<Linha[]>(
    () =>
      itens
        .filter((i) => i.status === "disponivel")
        .map((i) => ({ ...i, dias: diasParaVencer(i.validade), sev: statusValidade(i.validade) }))
        .filter((i) => i.sev !== "ok")
        .sort((a, b) => a.dias - b.dias),
    [itens],
  );

  const porArea = useMemo(() => {
    const m = new Map<string, Linha[]>();
    for (const l of linhas) {
      const arr = m.get(l.area) ?? [];
      arr.push(l);
      m.set(l.area, arr);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [linhas]);

  const totais = useMemo(() => {
    const t = { vencido: 0, critico: 0, atencao: 0 };
    for (const l of linhas) if (l.sev !== "ok") t[l.sev as keyof typeof t]++;
    return t;
  }, [linhas]);

  const areaAtiva = areaSel && porArea.some(([a]) => a === areaSel) ? areaSel : (porArea[0]?.[0] ?? null);
  const linhasArea = porArea.find(([a]) => a === areaAtiva)?.[1] ?? [];

  return (
    <Painel>
      <PainelHeader
        icone={Hourglass}
        titulo="Vencimentos por área"
        descricao="Paletes disponíveis com validade vencida, crítica (≤30 dias) ou em atenção (≤90 dias), comparados com a data de hoje."
      />

      <div className="flex flex-col gap-4 px-5 pb-5">
        {linhas.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg border border-ok/40 bg-ok/10 px-4 py-3 text-sm text-ok">
            <CheckCircle2 className="size-4 shrink-0" />
            Nenhum produto próximo do vencimento.
          </p>
        ) : (
          <>
            {(totais.vencido > 0 || totais.critico > 0) && (
              <p className="flex items-center gap-2 rounded-lg border border-dead/40 bg-dead/10 px-4 py-3 text-sm font-medium text-dead">
                <AlertTriangle className="size-4 shrink-0 animate-pulse" />
                Alerta: {totais.vencido > 0 && `${totais.vencido} palete(s) vencido(s)`}
                {totais.vencido > 0 && totais.critico > 0 && " · "}
                {totais.critico > 0 && `${totais.critico} vence(m) em até 30 dias`}
                {" — priorize a saída."}
              </p>
            )}

            <div className={pillBarCls}>
              {porArea.map(([area, arr]) => {
                const v = arr.filter((l) => l.sev === "vencido").length;
                const c = arr.filter((l) => l.sev === "critico").length;
                const at = arr.filter((l) => l.sev === "atencao").length;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setAreaSel(area)}
                    className={cn(pillCls(area === areaAtiva), "flex items-center gap-1.5")}
                  >
                    Área {area}
                    <span className="flex items-center gap-1 text-[10px] font-semibold">
                      {v > 0 && <span className="rounded-full bg-dead/20 px-1.5 text-dead">{v}</span>}
                      {c > 0 && <span className="rounded-full bg-dead/10 px-1.5 text-dead">{c}</span>}
                      {at > 0 && <span className="rounded-full bg-warn/15 px-1.5 text-warn">{at}</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <ul className="flex flex-col gap-1.5">
              {linhasArea.map((l) => (
                <li
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      <span className="font-mono text-xs text-muted-foreground">{l.codigo}</span>{" "}
                      {l.produto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {l.endereco ?? `${l.area}-${l.rua}-${l.posicao}`} · Palete {l.paleteCodigo}
                      {l.lote ? ` · Lote ${l.lote}` : ""} · {l.quantidade} un
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{fmtData(l.validade)}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        sevCls[l.sev],
                      )}
                      title={STATUS_LABEL[l.sev]}
                    >
                      {l.dias < 0
                        ? `vencido há ${-l.dias}d`
                        : l.dias === 0
                          ? "vence hoje"
                          : `${l.dias}d restantes`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Painel>
  );
}

// Mantido para referência de severidade em outros painéis.
export const ordemSeveridade = SEVERIDADE_ORDEM;
