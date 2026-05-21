import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { DEPRECIATION_CATEGORIES } from "@/lib/assets/depreciation-table";
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
  head: () => ({ meta: [{ title: "Tabela de Taxas — Decreto 207/15" }] }),
});

function TabelaTaxas() {
  const corp = DEPRECIATION_CATEGORIES.filter((c) => c.nature === "corporeo");
  const inc = DEPRECIATION_CATEGORIES.filter((c) => c.nature === "incorporeo");

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-[1300px] space-y-8">
        <header>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">
            Referência fiscal
          </p>
          <h1 className="text-3xl font-display font-semibold mt-1">
            Tabela de Taxas de Amortização
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Decreto Presidencial n.º 207/15 de 5 de Novembro — método das quotas
            constantes (Art.º 6.º). Excerto representativo carregado no sistema.
          </p>
        </header>

        <Section title="Ativos Incorpóreos — Secção N" rows={inc} />
        <Section title="Ativos Corpóreos — Secção G" rows={corp} />
      </div>
    </AppShell>
  );
}

function Section({ title, rows }: { title: string; rows: typeof DEPRECIATION_CATEGORIES }) {
  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="font-display font-semibold">{title}</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Secção</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Conta PGC</TableHead>
            <TableHead className="text-right">Taxa</TableHead>
            <TableHead className="text-right">Vida útil</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <TableRow key={c.id}>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">{c.section}</Badge>
              </TableCell>
              <TableCell className="font-medium">{c.description}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{c.pgcAccount}</TableCell>
              <TableCell className="text-right tabular font-semibold text-primary">{c.ratePct}%</TableCell>
              <TableCell className="text-right tabular">{c.usefulLifeYears} anos</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
