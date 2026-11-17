import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { lerEtiqueta, type LeituraEtiqueta } from "@/lib/etiqueta.functions";

async function reduzirImagem(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Imagem inválida"));
      i.src = url;
    });
    const max = 1600;
    const escala = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const dataBR = (d: string | null) => (d ? d.split("-").reverse().join("/") : "—");

export function LeitorEtiqueta({ onAplicar }: { onAplicar: (l: LeituraEtiqueta) => void }) {
  const ler = useServerFn(lerEtiqueta);
  const inputRef = useRef<HTMLInputElement>(null);
  const [carregando, setCarregando] = useState(false);
  const [leitura, setLeitura] = useState<LeituraEtiqueta | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const escolher = async (file?: File) => {
    if (!file) return;
    setCarregando(true);
    setLeitura(null);
    try {
      const imagem = await reduzirImagem(file);
      setPreview(imagem);
      const r = await ler({ data: { imagem } });
      if (!r.ok) toast.error(r.erro);
      else setLeitura(r.leitura);
    } catch (e) {
      toast.error((e as Error).message || "Falha ao ler a etiqueta");
    } finally {
      setCarregando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const linhas: [string, string | null][] = leitura
    ? [
        ["Código", leitura.codigo],
        ["Produto", leitura.produto],
        ["Lote", leitura.lote],
        ["Validade", leitura.validade && dataBR(leitura.validade)],
        ["Fabricação", leitura.fabricacao && dataBR(leitura.fabricacao)],
      ]
    : [];

  return (
    <div className="rounded-sm border border-dashed border-border p-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => escolher(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={carregando}
        className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-xs font-medium transition hover:bg-accent disabled:opacity-50"
      >
        {carregando ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        {carregando ? "Lendo etiqueta…" : "Ler foto da etiqueta"}
      </button>
      <span className="ml-2 text-[11px] text-muted-foreground">
        A IA sugere produto, lote e validade — confira antes de salvar.
      </span>

      {leitura && (
        <div className="mt-2 flex gap-3 rounded-sm bg-muted/50 p-2">
          {preview && (
            <img src={preview} alt="Foto da etiqueta" className="h-20 w-20 shrink-0 rounded-sm object-cover" />
          )}
          <div className="min-w-0 flex-1 space-y-0.5 text-xs">
            <p className="flex items-center gap-1 font-medium">
              <Sparkles className="size-3.5 text-primary" /> Sugestões da leitura
            </p>
            {linhas.map(([k, v]) => (
              <p key={k}>
                <span className="text-muted-foreground">{k}:</span>{" "}
                <span className="font-mono">{v || "não identificado"}</span>
              </p>
            ))}
            {leitura.observacao && <p className="text-muted-foreground">{leitura.observacao}</p>}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onAplicar(leitura);
                  setLeitura(null);
                }}
                className="rounded-sm bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                Preencher formulário
              </button>
              <button
                type="button"
                onClick={() => setLeitura(null)}
                className="inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[11px] hover:bg-accent"
              >
                <X className="size-3" /> Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
