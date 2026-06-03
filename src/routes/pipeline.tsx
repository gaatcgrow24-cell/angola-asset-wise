import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { usePipeline } from "@/lib/pipeline/store";
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
import { Search, Plus, ExternalLink, Briefcase, Download } from "lucide-react";

const CSV_HEADERS = [
  "Cliente", "Descrição", "Id Trabalho", "Id Pedido",
  "Nº Cotação", "Data Cotação", "Valor AOA", "Termos Pagamento",
  "Incoterms", "Nº NE/Contrato", "Data NE", "Estado",
];

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export const Route = createFileRoute("/pipeline")({
  component: PipelinePage,
  head: () => ({ meta: [{ title: "Pipeline Comercial — Imobilizado.AO" }] }),
});

function quoteBadge(s: string) {
  if (s === "emitido")
    return <Badge variant="outline" className="bg-success/15 text-success border-success/20">Emitido</Badge>;
  return <Badge variant="outline" className="bg-warning/15 text-warning border-warning/20">Não Emitido</Badge>;
}

function orderBadge(s: string) {
  if (s === "emitido")
    return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Emitido</Badge>;
  return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Pendente</Badge>;
}

function PipelinePage() {
  const { entries, ready } = usePipeline();
  const [q, setQ] = useState("");
  const [client, setClient] = useState("todos");
  const [quoteStatus, setQuoteStatus] = useState("todos");

  const clients = useMemo(
    () => Array.from(new Set(entries.map((e) => e.client))).sort(),
    [entries],
  );

  const rows = useMemo(() => {
    return entries.filter((e) => {
      if (e.archived) return false;
      if (client !== "todos" && e.client !== client) return false;
      if (quoteStatus !== "todos" && e.quotationStatus !== quoteStatus) return false;
      if (q) {
        const t = q.toLowerCase();
        if (
          !e.client.toLowerCase().includes(t) &&
          !e.description.toLowerCase().includes(t) &&
          !e.jobId.toLowerCase().includes(t) &&
          !(e.quotationNumber ?? "").toLowerCase().includes(t)
        )
          return false;
      }
      return true;
    });
  }, [entries, client, quoteStatus, q]);

  const totalAoa = rows.reduce((s, r) => s + (r.quotationValueAoa ?? 0), 0);

  return (
    <AppShell>
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Comercial</p>
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" /> Pipeline Comercial
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Registo unificado de Trabalhos, Pedidos de Cotação, Cotações e Notas de Encomenda.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportCsv(rows)}>
              <Download className="w-4 h-4 mr-2" /> Exportar CSV
            </Button>
            <Button asChild>
              <Link to="/pipeline/novo">
                <Plus className="w-4 h-4 mr-2" /> Novo Registo
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Registos Activos</p>
            <p className="mt-1 text-2xl font-display font-semibold">{rows.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Cotações Emitidas</p>
            <p className="mt-1 text-2xl font-display font-semibold">
              {rows.filter((r) => r.quotationStatus === "emitido").length}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Valor Cotado (Filtro)</p>
            <p className="mt-1 text-2xl font-display font-semibold">{fmtKz(totalAoa)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 border-b border-border flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Pesquisar cliente, trabalho, Nº cotação…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cliente" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Clientes</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={quoteStatus} onValueChange={setQuoteStatus}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Estado Cotação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Cotação: Todos</SelectItem>
                <SelectItem value="nao_emitido">Não Emitido</SelectItem>
                <SelectItem value="emitido">Emitido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead colSpan={3} className="text-[10px] uppercase tracking-widest text-muted-foreground border-r border-border">Trabalho</TableHead>
                  <TableHead colSpan={3} className="text-[10px] uppercase tracking-widest text-muted-foreground border-r border-border">Pedido de Cotação</TableHead>
                  <TableHead colSpan={5} className="text-[10px] uppercase tracking-widest text-muted-foreground border-r border-border">Cotação</TableHead>
                  <TableHead colSpan={3} className="text-[10px] uppercase tracking-widest text-muted-foreground">Nota Encom. / Contrato</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="border-r border-border">Id Trabalho</TableHead>
                  <TableHead>Id Pedido</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="border-r border-border">Data/Hora</TableHead>
                  <TableHead>Nº Cotação</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor (AOA)</TableHead>
                  <TableHead>Pagto</TableHead>
                  <TableHead className="border-r border-border">Incoterms</TableHead>
                  <TableHead>Nº NE/Contrato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!ready ? (
                  <TableRow><TableCell colSpan={14} className="text-center text-muted-foreground py-8">A carregar…</TableCell></TableRow>
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={14} className="text-center text-muted-foreground py-12">Nenhum registo encontrado.</TableCell></TableRow>
                ) : rows.map((e) => (
                  <TableRow key={e.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <Link to="/pipeline/$id" params={{ id: e.id }} className="hover:text-primary">
                        {e.client}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate" title={e.description}>{e.description}</TableCell>
                    <TableCell className="font-mono text-xs border-r border-border">{e.jobId}</TableCell>
                    <TableCell className="text-xs">{e.requestId || "—"}</TableCell>
                    <TableCell>
                      {e.requestLink ? (
                        <a href={e.requestLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary text-xs hover:underline">
                          Abrir <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs border-r border-border">{e.requestAt ? new Date(e.requestAt).toLocaleString("pt-AO", { dateStyle: "short", timeStyle: "short" }) : "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{e.quotationNumber ?? quoteBadge(e.quotationStatus)}</TableCell>
                    <TableCell className="text-xs">{fmtDate(e.quotationDate)}</TableCell>
                    <TableCell className="text-right tabular text-xs">{e.quotationValueAoa != null ? fmtKz(e.quotationValueAoa) : "—"}</TableCell>
                    <TableCell className="text-xs">{e.paymentTerms ?? "—"}</TableCell>
                    <TableCell className="text-xs border-r border-border">{e.incoterms ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{e.orderNumber ?? "—"}</TableCell>
                    <TableCell className="text-xs">{fmtDate(e.orderDate)}</TableCell>
                    <TableCell>{orderBadge(e.orderStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
