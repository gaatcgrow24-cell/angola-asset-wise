import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, TrendingDown, Layers, Calendar } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { useAssets } from "@/lib/assets/store";
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
} from "recharts";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [{ title: "Dashboard — Imobilizado.AO" }],
  }),
});

function Dashboard() {
  const { assets, ready } = useAssets();

  if (!ready) {
    return (
      <AppShell>
        <div className="p-8 text-muted-foreground">A carregar…</div>
      </AppShell>
    );
  }

  const active = assets.filter((a) => a.status === "ativo");
  let totalAcq = 0;
  let totalAccum = 0;
  let totalNBV = 0;
  let yearDeprTotal = 0;
  const yearMap = new Map<number, number>(); // ano -> VCL agregado

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
  }

  const chartData = Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, vcl]) => ({ year, vcl: Math.round(vcl) }));

  const recent = [...assets]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 space-y-8 max-w-[1400px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">
              Exercício {new Date().getUTCFullYear()}
            </p>
            <h1 className="text-3xl lg:text-4xl font-display font-semibold mt-1">
              Painel de Imobilizado
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão consolidada conforme o Plano Geral de Contabilidade Angolano.
            </p>
          </div>
          <Button asChild>
            <Link to="/ativos/novo">+ Registar Ativo</Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Valor Bruto do Imobilizado"
            value={fmtKz(totalAcq)}
            hint={`${active.length} ativos em uso`}
            accent="primary"
            icon={<Wallet className="w-5 h-5 text-primary" />}
          />
          <StatCard
            label="Amortização Acumulada"
            value={fmtKz(totalAccum)}
            hint="Desde entrada em funcionamento"
            accent="warning"
            icon={<TrendingDown className="w-5 h-5 text-warning" />}
          />
          <StatCard
            label="Valor Contabilístico Líquido"
            value={fmtKz(totalNBV)}
            hint="VCL = Aquisição − Amort. − Imparidades"
            accent="success"
            icon={<Layers className="w-5 h-5 text-success" />}
          />
          <StatCard
            label="Amortização do Exercício"
            value={fmtKz(yearDeprTotal)}
            hint="Quotas constantes · Art.º 6.º"
            accent="accent"
            icon={<Calendar className="w-5 h-5 text-foreground" />}
          />
        </div>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 rounded-xl border border-border bg-card p-6">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-lg">
                  Ciclo de vida do imobilizado
                </h2>
                <p className="text-xs text-muted-foreground">
                  Projeção do Valor Contabilístico Líquido agregado por exercício
                </p>
              </div>
            </div>
            <div className="h-72">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Sem ativos para projetar.
                </div>
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
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => fmtKz(v)}
                    />
                    <Area
                      type="monotone"
                      dataKey="vcl"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="url(#vcl)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display font-semibold text-lg mb-4">
              Últimos registos
            </h2>
            <ul className="space-y-3">
              {recent.length === 0 && (
                <li className="text-sm text-muted-foreground">Nenhum ativo.</li>
              )}
              {recent.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/ativos/$id"
                    params={{ id: a.id }}
                    className="block rounded-lg border border-border p-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{a.description}</p>
                        <p className="text-xs text-muted-foreground font-mono">{a.code}</p>
                      </div>
                      <Badge variant={a.nature === "corporeo" ? "default" : "secondary"}>
                        {a.nature === "corporeo" ? "Corpóreo" : "Incorpóreo"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Aquisição: {fmtDate(a.acquisitionDate)} · {fmtKz(a.acquisitionValue)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
