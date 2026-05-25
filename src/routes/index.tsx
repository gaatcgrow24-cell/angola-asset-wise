import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet,
  TrendingDown,
  Layers,
  Calendar,
  Network,
  ArrowLeftRight,
  ScanLine,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { useAssets } from "@/lib/assets/store";
import { useOrg, useCurrentBranch } from "@/lib/org/store";
import { getCategory } from "@/lib/assets/depreciation-table";
import {
  accumulatedUntil,
  currentYearDepreciation,
  projectedYearlySchedule,
} from "@/lib/assets/depreciation";
import { fmtKz, fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — Imobilizado.AO" }] }),
});

function Dashboard() {
  const { assets, ready } = useAssets();
  const { branches, transfers } = useOrg();
  const { branchId } = useCurrentBranch();

  if (!ready) {
    return <AppShell><div className="p-8 text-muted-foreground">A carregar…</div></AppShell>;
  }

  const currentBranch = branches.find((b) => b.id === branchId);
  const isConsolidated = !branchId;
  const scoped = isConsolidated ? assets : assets.filter((a) => a.branchId === branchId);
  const active = scoped.filter((a) => a.status === "ativo" || a.status === "em_transito");

  let totalAcq = 0;
  let totalAccum = 0;
  let totalNBV = 0;
  let yearDeprTotal = 0;
  const yearMap = new Map<number, number>();
  const branchAggregate = new Map<string, { count: number; gross: number; nbv: number }>();

  for (const a of active) {
    const cat = getCategory(a.categoryId);
    if (!cat) continue;
    const { accumulated, netBookValue } = accumulatedUntil(a, cat);
    totalAcq += a.acquisitionValue;
    totalAccum += accumulated;
    totalNBV += netBookValue;
    yearDeprTotal += currentYearDepreciation(a, cat);

    const sched = projectedYearlySchedule(a, cat);
    sched.forEach((r) => {
      yearMap.set(r.year, (yearMap.get(r.year) ?? 0) + r.netBookValue);
    });

    const agg = branchAggregate.get(a.branchId) ?? { count: 0, gross: 0, nbv: 0 };
    agg.count += 1;
    agg.gross += a.acquisitionValue;
    agg.nbv += netBookValue;
    branchAggregate.set(a.branchId, agg);
  }

  const chartData = Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, vcl]) => ({ year, vcl: Math.round(vcl) }));

  const branchChartData = branches
    .map((b) => {
      const agg = branchAggregate.get(b.id) ?? { count: 0, gross: 0, nbv: 0 };
      return {
        name: b.code,
        fullName: b.name,
        ativos: agg.count,
        bruto: Math.round(agg.gross),
        vcl: Math.round(agg.nbv),
      };
    })
    .filter((d) => isConsolidated || branches.find((b) => b.code === d.name)?.id === branchId);

  const recent = [...scoped].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const pendingTransfers = transfers.filter((t) => t.status === "em_transito").slice(0, 5);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 space-y-8 max-w-[1500px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {isConsolidated ? (
                <Badge variant="outline" className="border-primary text-primary">
                  <Network className="w-3 h-3 mr-1" /> Vista Consolidada
                </Badge>
              ) : (
                <Badge variant="outline" className="border-accent text-accent-foreground">
                  {currentBranch?.name} · {currentBranch?.province}
                </Badge>
              )}
              <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                Exercício {new Date().getUTCFullYear()}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-display font-semibold mt-2">
              {isConsolidated ? "Painel Executivo do Grupo" : `Painel · ${currentBranch?.name}`}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isConsolidated
                ? `Consolidação de ${branches.length} unidades operacionais`
                : "Visualização isolada da filial seleccionada"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="lg" variant="default" className="bg-primary hover:bg-primary/90 shadow-lg">
              <Link to="/scan">
                <ScanLine className="w-5 h-5 mr-2" />
                Escanear Etiqueta
              </Link>
            </Button>
            <Button asChild variant="outline"><Link to="/ativos/novo">+ Registar Ativo</Link></Button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Valor Bruto do Imobilizado" value={fmtKz(totalAcq)} hint={`${active.length} ativos em uso`} accent="primary" icon={<Wallet className="w-5 h-5 text-primary" />} />
          <StatCard label="Amortização Acumulada" value={fmtKz(totalAccum)} hint="Desde entrada em funcionamento" accent="warning" icon={<TrendingDown className="w-5 h-5 text-warning" />} />
          <StatCard label="Valor Contabilístico Líquido" value={fmtKz(totalNBV)} hint="VCL = Aquisição − Amort. − Imparidades" accent="success" icon={<Layers className="w-5 h-5 text-success" />} />
          <StatCard label="Amortização do Exercício" value={fmtKz(yearDeprTotal)} hint="Quotas constantes · Art.º 6.º" accent="accent" icon={<Calendar className="w-5 h-5 text-foreground" />} />
        </div>

        {isConsolidated && (
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-lg">Total de Ativos por Filial</h2>
                <p className="text-xs text-muted-foreground">Valor bruto (Kz) e VCL distribuído pelas unidades operacionais</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/filiais">Gerir filiais</Link>
              </Button>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={branchChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number, name: string) => [fmtKz(v), name === "bruto" ? "Valor Bruto" : "VCL"]}
                    labelFormatter={(l) => branchChartData.find((b) => b.name === l)?.fullName ?? l}
                  />
                  <Bar dataKey="bruto" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="vcl" fill="var(--color-success)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-lg">Gráfico de Depreciação</h2>
                <p className="text-xs text-muted-foreground">Projeção do VCL agregado por exercício até final da vida útil</p>
              </div>
            </div>
            <div className="h-72">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Sem ativos para projetar.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="vcl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="year" stroke="var(--color-muted-foreground)" fontSize={12} />
                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                    <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => fmtKz(v)} />
                    <Area type="monotone" dataKey="vcl" stroke="var(--color-primary)" strokeWidth={2} fill="url(#vcl)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display font-semibold text-lg">Em Trânsito</h2>
                <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
              </div>
              {pendingTransfers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem transferências pendentes.</p>
              ) : (
                <ul className="space-y-2">
                  {pendingTransfers.map((t) => {
                    const a = assets.find((x) => x.id === t.assetId);
                    const from = branches.find((b) => b.id === t.fromBranchId);
                    const to = branches.find((b) => b.id === t.toBranchId);
                    return (
                      <li key={t.id} className="text-xs border border-border rounded-lg p-2">
                        <p className="font-medium truncate">{a?.description ?? t.assetId}</p>
                        <p className="text-muted-foreground mt-0.5">
                          {from?.code} → {to?.code} · {fmtDate(t.sentDate)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                <Link to="/transferencias">Ver todas</Link>
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display font-semibold text-lg mb-4">Últimos registos</h2>
              <ul className="space-y-3">
                {recent.length === 0 && <li className="text-sm text-muted-foreground">Nenhum ativo.</li>}
                {recent.map((a) => (
                  <li key={a.id}>
                    <Link to="/ativos/$id" params={{ id: a.id }} className="block rounded-lg border border-border p-3 hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{a.description}</p>
                          <p className="text-xs text-muted-foreground font-mono">{a.code}</p>
                        </div>
                        <Badge variant={a.nature === "corporeo" ? "default" : "secondary"}>
                          {a.nature === "corporeo" ? "Corp." : "Incorp."}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {fmtDate(a.acquisitionDate)} · {fmtKz(a.acquisitionValue)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
