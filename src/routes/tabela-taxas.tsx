import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import {
  DEPRECIATION_CATEGORIES,
} from "@/lib/assets/depreciation-table";
import type { DepreciationCategory } from "@/lib/assets/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/tabela-taxas")({
  component: TabelaTaxas,
  head: () => ({
    meta: [
      { title: "Tabela de Taxas — Decreto 207/15" },
      {
        name: "description",
        content:
          "Tabela integral de taxas de reintegrações e amortizações do Decreto Presidencial n.º 207/15 de 5 de Novembro.",
      },
    ],
  }),
});

function groupBy(rows: DepreciationCategory[]): Map<string, DepreciationCategory[]> {
  const m = new Map<string, DepreciationCategory[]>();
  for (const r of rows) {
    const arr = m.get(r.group) ?? [];
    arr.push(r);
    m.set(r.group, arr);
  }
  return m;
}

function TabelaTaxas() {
  const grouped = useMemo(() => groupBy(DEPRECIATION_CATEGORIES), []);
  const total = DEPRECIATION_CATEGORIES.length;

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-[1400px] space-y-8">
        <header>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">
            Referência fiscal
          </p>
          <h1 className="text-3xl font-display font-semibold mt-1">
            Tabela de Taxas de Reintegrações e Amortizações
          </h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Anexo integral do Decreto Presidencial n.º 207/15, de 5 de Novembro
            — método das quotas constantes (Art.º 6.º). {total} rubricas
            classificadas por sector de actividade.
          </p>
        </header>

        {Array.from(grouped.entries()).map(([group, rows]) => (
          <Section key={group} title={group} rows={rows} />
        ))}
      </div>
    </AppShell>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: DepreciationCategory[];
}) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
        <h2 className="font-display font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground tabular">
          {rows.length} rubricas
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[110px]">Secção</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="hidden md:table-cell">Conta PGC</TableHead>
            <TableHead className="text-right w-[100px]">Taxa</TableHead>
            <TableHead className="text-right w-[110px]">Vida útil</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs whitespace-nowrap">
                  {c.section}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{c.description}</TableCell>
              <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                {c.pgcAccount}
              </TableCell>
              <TableCell className="text-right tabular font-semibold text-primary">
                {c.ratePct}%
              </TableCell>
              <TableCell className="text-right tabular">
                {c.usefulLifeYears} anos
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
