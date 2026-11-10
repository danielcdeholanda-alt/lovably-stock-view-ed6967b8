import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Botão que abre a câmera e lê código de barras ou QR code. Leitores USB/Bluetooth já funcionam digitando direto no campo. */
export function LeitorCodigo({
  onLer,
  className,
}: {
  onLer: (valor: string) => void;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Ler código de barras ou QR code com a câmera"
        title="Ler com a câmera"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-sm border border-input bg-background px-2 text-muted-foreground transition hover:bg-accent hover:text-foreground",
          className,
        )}
      >
        <ScanLine className="size-4" />
      </button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ler código de barras / QR code</DialogTitle>
          </DialogHeader>
          {aberto && (
            <Camera
              onLer={(v) => {
                onLer(v);
                setAberto(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Camera({ onLer }: { onLer: (v: string) => void }) {
  const idRef = useRef(`leitor-${Math.random().toString(36).slice(2)}`);
  const [erro, setErro] = useState<string | null>(null);
  const lerRef = useRef(onLer);
  lerRef.current = onLer;

  useEffect(() => {
    let parar: (() => Promise<void>) | null = null;
    let ativo = true;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!ativo) return;
        const leitor = new Html5Qrcode(idRef.current, { verbose: false });
        let lido = false;
        await leitor.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (texto) => {
            if (lido) return;
            lido = true;
            lerRef.current(texto.trim());
          },
          () => {},
        );
        parar = async () => {
          try {
            if (leitor.isScanning) await leitor.stop();
            leitor.clear();
          } catch {
            /* ignorar */
          }
        };
        if (!ativo) await parar();
      } catch (e) {
        setErro(
          (e as Error)?.message?.includes("Permission")
            ? "Permissão da câmera negada. Libere o acesso à câmera no navegador."
            : "Não foi possível abrir a câmera neste dispositivo.",
        );
      }
    })();
    return () => {
      ativo = false;
      void parar?.();
    };
  }, []);

  return (
    <div className="space-y-2">
      <div id={idRef.current} className="overflow-hidden rounded-lg bg-muted" />
      {erro ? (
        <p className="text-sm text-dead">{erro}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Aponte a câmera para o código. Leitores de mão (USB/Bluetooth) funcionam direto no campo.
        </p>
      )}
    </div>
  );
}
