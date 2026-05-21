import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useAssets } from "@/lib/assets/store";
import { getCategory } from "@/lib/assets/depreciation-table";
import { accumulatedUntil } from "@/lib/assets/depreciation";
import { fmtKz, fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

export const Route = createFileRoute("/inventario")({
  component: Inventario,
  head: () => ({ meta: [{ title: "Inventário — Imobilizado.AO" }] }),
});

function statusBadge(s: string) {
  if (s === "ativo") return <Badge className="bg-success/15 text-success border-success/20" variant="outline">Em uso</Badge>;
  if (s === "alienado") return <Badge variant="outline" className="bg-accent/15 text-accent-foreground border-accent/20">Alienado</Badge>;
  return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Abatido</Badge>;
}

function Inventario() {
  const { assets, ready } = useAssets();
  const [q, setQ] = useState("");
  const [nature, setNature] = useState<string>("todos");
  const [status, setStatus] = useState<string>("todos");

  const rows = useMemo(() => {
    return assets.filter((a) => {
      if (nature !== "todos" && a.nature !== nature) return false;
      if (status !== "todos" && a.status !== status) return false;
      if (q) {
        const t = q.toLowerCase();
        if (
          !a.description.toLowerCase().includes(t) &&
          !a.code.toLowerCase().includes(t)
        )
          return false;
      }
      return true;
    });
  }, [assets, q, nature, status]);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 space-y-6 max-w-[1500px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">
              Inventário
            </p>
            <h1 className="text-3xl font-display font-semibold mt-1">
              Ativos Imobilizados
            </h1>
            <p className="text-muted-foreground mt-1">
              {rows.length} de {assets.length} ativos
            </p>
          </div>
          <Button asChild>
            <Link to="/ativos/novo">+ Registar Ativo</Link>
          </Button>
        </header>

        <div className="rounded-xl border border-border bg-card p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por código ou descrição…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={nature} onValueChange={setNature}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Tipo: Todos</SelectItem>
              <SelectItem value="corporeo">Corpóreos</SelectItem>
              <SelectItem value="incorporeo">Incorpóreos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Estado: Todos</SelectItem>
              <SelectItem value="ativo">Em uso</SelectItem>
              <SelectItem value="alienado">Alienado</SelectItem>
              <SelectItem value="abatido">Abatido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Valor Aquisição</TableHead>
                <TableHead className="text-right">Amort. Acum.</TableHead>
                <TableHead className="text-right">VCL</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!ready && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    A carregar…
                  </TableCell>
                </TableRow>
              )}
              {ready && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                    Nenhum ativo encontrado.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((a) => {
                const cat = getCategory(a.categoryId);
                const { accumulated, netBookValue } = cat
                  ? accumulatedUntil(a, cat)
                  : { accumulated: 0, netBookValue: a.acquisitionValue };
                return (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-muted/40"
                  >
                    <TableCell className="font-mono text-xs">
                      <Link to="/ativos/$id" params={{ id: a.id }} className="hover:text-primary">
                        {a.code}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link to="/ativos/$id" params={{ id: a.id }} className="hover:text-primary">
                        <p className="font-medium">{a.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(a.inServiceDate)}
                        </p>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.nature === "corporeo" ? "default" : "secondary"}>
                        {a.nature === "corporeo" ? "Corpóreo" : "Incorpóreo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      <p>{cat?.description ?? "—"}</p>
                      <p className="text-muted-foreground">
                        {cat ? `${cat.ratePct}% · ${cat.usefulLifeYears}a` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {fmtKz(a.acquisitionValue)}
                    </TableCell>
                    <TableCell className="text-right tabular text-warning">
                      {fmtKz(accumulated)}
                    </TableCell>
                    <TableCell className="text-right tabular font-semibold">
                      {fmtKz(netBookValue)}
                    </TableCell>
                    <TableCell>{statusBadge(a.status)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
