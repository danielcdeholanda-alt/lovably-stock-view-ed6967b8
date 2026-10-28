import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Network,
  Users,
  Warehouse,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePapel } from "@/lib/auth";
import { EstruturaProvider, useEstrutura } from "@/lib/estrutura-queries";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

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

const TITULOS: Record<string, string> = {
  "/dashboard": "Painel de estoque",
  "/estrutura": "Estrutura do galpão",
  "/usuarios": "Usuários",
  "/auditoria": "Auditoria",
  "/trocar-senha": "Trocar senha",
};

function Layout() {
  return (
    <EstruturaProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <MenuLateral />
          <SidebarInset className="min-w-0 bg-background">
            <Cabecalho />
            <Outlet />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </EstruturaProvider>
  );
}

function MenuLateral() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAdmin } = usePapel();
  const path = useRouterState({ select: (r) => r.location.pathname });

  const operacao = [{ to: "/dashboard", label: "Painel de estoque", icon: LayoutDashboard }];
  const admin = [
    { to: "/estrutura", label: "Estrutura", icon: Network },
    { to: "/usuarios", label: "Usuários", icon: Users },
    { to: "/auditoria", label: "Auditoria", icon: ClipboardList },
  ];
  const conta = [{ to: "/trocar-senha", label: "Trocar senha", icon: KeyRound }];

  const sair = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const grupo = (titulo: string, itens: typeof operacao) => (
    <SidebarGroup>
      <SidebarGroupLabel>{titulo}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {itens.map((i) => (
            <SidebarMenuItem key={i.to}>
              <SidebarMenuButton
                asChild
                isActive={path === i.to}
                tooltip={i.label}
                className="data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:shadow-sm"
              >
                <Link to={i.to}>
                  <i.icon />
                  <span>{i.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
            <Warehouse className="size-4" />
          </span>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-bold tracking-tight">Controle de Estoque</p>
            <p className="truncate text-[11px] text-muted-foreground">Almoxarifado · WMS</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {grupo("Operação", operacao)}
        {isAdmin && grupo("Administração", admin)}
        {grupo("Conta", conta)}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={sair} tooltip="Sair">
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function Cabecalho() {
  const { session } = usePapel();
  const { galpoes, galpaoId, setGalpaoId } = useEstrutura();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const email = session?.user.email ?? "";

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger className="shrink-0" />
          <h1 className="truncate text-base font-semibold tracking-tight">
            {TITULOS[path] ?? "Controle de Estoque"}
          </h1>
        </div>
        <div className="flex min-w-0 items-center gap-2">
          {galpoes.length > 0 && (
            <select
              value={galpaoId ?? ""}
              onChange={(e) => setGalpaoId(e.target.value)}
              className="max-w-[10rem] rounded-full border border-input bg-card px-3 py-1.5 text-xs"
              aria-label="Galpão"
            >
              {galpoes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          )}
          <span
            className="hidden max-w-[14rem] truncate text-xs text-muted-foreground md:inline"
            title={email}
          >
            {email}
          </span>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold uppercase text-primary">
            {email.slice(0, 1) || "?"}
          </span>
        </div>
      </div>
    </header>
  );
}
