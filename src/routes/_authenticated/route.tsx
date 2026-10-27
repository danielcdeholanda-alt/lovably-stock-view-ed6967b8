import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Warehouse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePapel } from "@/lib/auth";
import { EstruturaProvider, useEstrutura } from "@/lib/estrutura-queries";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (
      data.user.user_metadata?.senha_provisoria === true &&
      location.pathname !== "/trocar-senha"
    ) {
      throw redirect({ to: "/trocar-senha" });
    }
    return { user: data.user };
  },
  component: Layout,
});

function Layout() {
  return (
    <EstruturaProvider>
      <div className="min-h-screen bg-background">
        <Cabecalho />
        <Outlet />
      </div>
    </EstruturaProvider>
  );
}

function Cabecalho() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { session, isAdmin } = usePapel();
  const { galpoes, galpaoId, setGalpaoId } = useEstrutura();

  const sair = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-card/90 shadow-sm shadow-background/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30">
            <Warehouse className="size-5" />
          </span>
          <div>
            <h1 className="text-base font-bold tracking-tight">Controle de Estoque</h1>
            <p className="text-xs text-muted-foreground">{session?.user.email}</p>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1.5 rounded-full border border-border/70 bg-background/60 p-1 text-xs">
          {galpoes.length > 0 && (
            <select
              value={galpaoId ?? ""}
              onChange={(e) => setGalpaoId(e.target.value)}
              className="rounded-full border border-input bg-card px-2 py-1.5 text-xs"
              aria-label="Galpão"
            >
              {galpoes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          )}
          <Link
            to="/dashboard"
            className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground [&.active]:shadow-sm"
          >
            Painel
          </Link>
          {isAdmin && (
            <>
              <Link
                to="/estrutura"
                className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground [&.active]:shadow-sm"
              >
                Estrutura
              </Link>
              <Link
                to="/usuarios"
                className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground [&.active]:shadow-sm"
              >
                Usuários
              </Link>
              <Link
                to="/auditoria"
                className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground [&.active]:shadow-sm"
              >
                Auditoria
              </Link>
            </>
          )}
          <Link
            to="/trocar-senha"
            className="rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground [&.active]:shadow-sm"
          >
            Trocar senha
          </Link>
          <button
            type="button"
            onClick={sair}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}
