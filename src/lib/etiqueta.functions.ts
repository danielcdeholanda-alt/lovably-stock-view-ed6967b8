import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type LeituraEtiqueta = {
  codigo: string | null;
  produto: string | null;
  lote: string | null;
  validade: string | null;
  fabricacao: string | null;
  observacao: string | null;
};

const INSTRUCOES = `Você lê fotos de etiquetas de paletes/caixas de um almoxarifado brasileiro.
Extraia somente o que estiver visível na etiqueta; nunca invente. Use null quando não encontrar.
- codigo: código do produto com 10 dígitos (padrão TTTT000SSS, ex.: 0401000089). Retorne só dígitos.
- produto: descrição/nome do produto.
- lote: identificação do lote (LOTE, L., Batch).
- validade: data de validade (VAL, VENC, EXP) no formato AAAA-MM-DD.
- fabricacao: data de fabricação (FAB, MFG) no formato AAAA-MM-DD.
- observacao: avisos de leitura (ex.: data ilegível), em português, ou null.
Datas brasileiras vêm como DD/MM/AAAA.`;

export const lerEtiqueta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imagem: string }) => {
    if (typeof input?.imagem !== "string" || !/^data:image\/(png|jpe?g|webp|gif);base64,/.test(input.imagem))
      throw new Error("Envie uma imagem PNG, JPG ou WEBP.");
    if (input.imagem.length > 8_000_000) throw new Error("Imagem muito grande (máx. ~6 MB).");
    return input;
  })
  .handler(async ({ data }): Promise<{ ok: true; leitura: LeituraEtiqueta } | { ok: false; erro: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, erro: "Leitura por IA não configurada." };
    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText, Output, jsonSchema } = await import("ai");

    let runId: string | undefined;
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input, init) => {
        const headers = new Headers(init?.headers);
        if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
        const res = await fetch(input, { ...init, headers });
        runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
        if (!res.ok) {
          const txt = await res.clone().text().catch(() => "");
          console.error("AI gateway", res.status, txt.slice(0, 500));
        }
        return res;
      },
    });

    const campo: { type: ("string" | "null")[] } = { type: ["string", "null"] };
    const schema = jsonSchema<LeituraEtiqueta>({
      type: "object",
      additionalProperties: false,
      required: ["codigo", "produto", "lote", "validade", "fabricacao", "observacao"],
      properties: {
        codigo: campo,
        produto: campo,
        lote: campo,
        validade: campo,
        fabricacao: campo,
        observacao: campo,
      },
    });

    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        instructions: INSTRUCOES,
        maxRetries: 0,
        output: Output.object({ schema }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Leia esta etiqueta e preencha os campos." },
              { type: "file", data: new URL(data.imagem), mediaType: data.imagem.slice(5, data.imagem.indexOf(";")) },
            ],
          },
        ],
        providerOptions: {
          openai: {
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            store: false,
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const leitura = (await result.output) as LeituraEtiqueta;
      return { ok: true, leitura };
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      console.error("lerEtiqueta", e);
      if (status === 429) return { ok: false, erro: "Muitas leituras seguidas. Aguarde um pouco e tente de novo." };
      if (status === 402) return { ok: false, erro: "Créditos de IA esgotados no workspace." };
      if (status === 403) return { ok: false, erro: "Leitura por IA bloqueada para este workspace." };
      return { ok: false, erro: "Não foi possível ler a etiqueta. Tente outra foto ou preencha manualmente." };
    }
  });
