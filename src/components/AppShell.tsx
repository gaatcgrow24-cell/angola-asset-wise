import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  BookOpen,
  Building2,
  Network,
  ArrowLeftRight,
  ListOrdered,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrg, useCurrentBranch } from "@/lib/org/store";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventario", label: "Inventário", icon: Boxes },
  { to: "/ativos/novo", label: "Novo Ativo", icon: PlusCircle },
  { to: "/transferencias", label: "Transferências", icon: ArrowLeftRight },
  { to: "/filiais", label: "Filiais", icon: Network },
  { to: "/classes", label: "Classes A-Z", icon: ListOrdered },
  { to: "/tabela-taxas", label: "Tabela de Taxas", icon: BookOpen },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { branches } = useOrg();
  const { branchId, setBranchId } = useCurrentBranch();

  const sede = branches.find((b) => b.type === "sede");
  const others = branches.filter((b) => b.type !== "sede");

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden lg:flex w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-display font-semibold text-base leading-tight">
                Imobilizado<span className="text-sidebar-primary">.AO</span>
              </p>
              <p className="text-xs text-sidebar-foreground/60">EAM · PGC · Decreto 207/15</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/50 mb-1.5 px-1">
            Filial Activa
          </p>
          <Select value={branchId || "__all__"} onValueChange={(v) => setBranchId(v === "__all__" ? "" : v)}>
            <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Vista Consolidada (Sede)</SelectItem>
              {sede && (
                <SelectGroup>
                  <SelectLabel className="text-xs">Sede</SelectLabel>
                  <SelectItem value={sede.id}>{sede.name}</SelectItem>
                </SelectGroup>
              )}
              {others.length > 0 && (
                <SelectGroup>
                  <SelectLabel className="text-xs">Filiais / Delegações</SelectLabel>
                  {others.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} · {b.province}
                    </SelectItem>
                  ))}
                </SelectGroup>
              )}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 mt-2">
          {nav.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-sidebar-border text-xs text-sidebar-foreground/50">
          <p>República de Angola</p>
          <p>Método das Quotas Constantes</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden border-b border-border bg-card px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
          <p className="font-display font-semibold flex-1">Imobilizado.AO</p>
          <Select value={branchId || "__all__"} onValueChange={(v) => setBranchId(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Consolidada</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        <nav className="lg:hidden border-b border-border bg-card px-2 py-2 flex gap-1 overflow-x-auto">
          {nav.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
