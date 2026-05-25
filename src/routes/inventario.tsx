import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useAssets } from "@/lib/assets/store";
import { useOrg, useCurrentBranch } from "@/lib/org/store";
import { getCategory, DEPRECIATION_CATEGORIES } from "@/lib/assets/depreciation-table";
import { accumulatedUntil } from "@/lib/assets/depreciation";
import { fmtKz, fmtDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { Search, ScanLine } from "lucide-react";

export const Route = createFileRoute("/inventario")({
  component: Inventario,
  head: () => ({ meta: [{ title: "Inventário — Imobilizado.AO" }] }),
});

function statusBadge(s: string) {
  if (s === "ativo")
    return <Badge className="bg-success/15 text-success border-success/20" variant="outline">Em uso</Badge>;
  if (s === "em_transito")
    return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Em Trânsito</Badge>;
  if (s === "alienado")
    return <Badge variant="outline" className="bg-accent/15 text-accent-foreground border-accent/20">Alienado</Badge>;
  return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Abatido</Badge>;
}

function Inventario() {
  const { assets, ready } = useAssets();
  const { branches } = useOrg();
  const { branchId: ctxBranch } = useCurrentBranch();
  const [q, setQ] = useState("");
  const [nature, setNature] = useState<string>("todos");
  const [status, setStatus] = useState<string>("todos");
  const [branchFilter, setBranchFilter] = useState<string>("ctx"); // ctx = usar contexto
  const [letter, setLetter] = useState<string>("todas");

  // alfabeto presente
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    DEPRECIATION_CATEGORIES.forEach((c) => set.add(c.description[0]?.toUpperCase() ?? "#"));
    return Array.from(set).sort();
  }, []);

  const effectiveBranch = branchFilter === "ctx" ? ctxBranch : branchFilter === "todas" ? "" : branchFilter;

  const rows = useMemo(() => {
    return assets.filter((a) => {
      if (effectiveBranch && a.branchId !== effectiveBranch) return false;
      if (nature !== "todos" && a.nature !== nature) return false;
      if (status !== "todos" && a.status !== status) return false;
      if (letter !== "todas") {
        const cat = getCategory(a.categoryId);
        if (!cat) return false;
        if ((cat.description[0]?.toUpperCase() ?? "#") !== letter) return false;
      }
      if (q) {
        const t = q.toLowerCase();
        if (!a.description.toLowerCase().includes(t) && !a.code.toLowerCase().includes(t))
          return false;
      }
      return true;
    });
  }, [assets, q, nature, status, effectiveBranch, letter]);

  // Agrupar por letra (A-Z) com base na descrição da Classe
  const grouped = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const a of rows) {
      const cat = getCategory(a.categoryId);
      const k = (cat?.description[0]?.toUpperCase() ?? "#");
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 space-y-6 max-w-[1500px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">Inventário</p>
            <h1 className="text-3xl font-display font-semibold mt-1">Ativos Imobilizados</h1>
            <p className="text-muted-foreground mt-1">
              {rows.length} de {assets.length} ativos · ordenação A-Z por classe
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="lg" className="shadow-lg">
              <Link to="/scan">
                <ScanLine className="w-5 h-5 mr-2" />
                Escanear Etiqueta
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/ativos/novo">+ Registar Ativo</Link>
            </Button>
          </div>
        </header>

        <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Pesquisar por código ou descrição…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-xs">Filial</SelectLabel>
                <SelectItem value="ctx">— Usar contexto activo —</SelectItem>
                <SelectItem value="todas">Todas as filiais</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={nature} onValueChange={setNature}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Tipo: Todos</SelectItem>
              <SelectItem value="corporeo">Corpóreos</SelectItem>
              <SelectItem value="incorporeo">Incorpóreos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Estado: Todos</SelectItem>
              <SelectItem value="ativo">Em uso</SelectItem>
              <SelectItem value="em_transito">Em Trânsito</SelectItem>
              <SelectItem value="alienado">Alienado</SelectItem>
              <SelectItem value="abatido">Abatido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Índice A-Z */}
        <div className="flex flex-wrap gap-1.5 px-1">
          <button
            onClick={() => setLetter("todas")}
            className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${letter === "todas" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
          >
            Todas
          </button>
          {availableLetters.map((L) => (
            <button
              key={L}
              onClick={() => setLetter(L)}
              className={`w-8 h-8 rounded text-xs font-semibold border transition-colors ${letter === L ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
            >
              {L}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Filial</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead className="text-right">Valor Aquisição</TableHead>
                <TableHead className="text-right">Amort. Acum.</TableHead>
                <TableHead className="text-right">VCL</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!ready && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">A carregar…</TableCell></TableRow>
              )}
              {ready && rows.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Nenhum ativo encontrado.</TableCell></TableRow>
              )}
              {grouped.flatMap(([L, items]) => [
                <TableRow key={`hdr-${L}`} className="bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={8} className="py-2">
                    <span className="font-display font-bold text-primary">{L}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{items.length} ativo(s)</span>
                  </TableCell>
                </TableRow>,
                ...items.map((a) => {
                  const cat = getCategory(a.categoryId);
                  const { accumulated, netBookValue } = cat
                    ? accumulatedUntil(a, cat)
                    : { accumulated: 0, netBookValue: a.acquisitionValue };
                  const br = branches.find((b) => b.id === a.branchId);
                  return (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">
                        <Link to="/ativos/$id" params={{ id: a.id }} className="hover:text-primary">{a.code}</Link>
                      </TableCell>
                      <TableCell>
                        <Link to="/ativos/$id" params={{ id: a.id }} className="hover:text-primary">
                          <p className="font-medium">{a.description}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(a.inServiceDate)}</p>
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-medium">{br?.name ?? "—"}</p>
                        <p className="text-muted-foreground">{br?.province}</p>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p>{cat?.description ?? "—"}</p>
                        <p className="text-muted-foreground">{cat ? `${cat.ratePct}% · ${cat.usefulLifeYears}a` : ""}</p>
                      </TableCell>
                      <TableCell className="text-right tabular">{fmtKz(a.acquisitionValue)}</TableCell>
                      <TableCell className="text-right tabular text-warning">{fmtKz(accumulated)}</TableCell>
                      <TableCell className="text-right tabular font-semibold">{fmtKz(netBookValue)}</TableCell>
                      <TableCell>{statusBadge(a.status)}</TableCell>
                    </TableRow>
                  );
                }),
              ])}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}
