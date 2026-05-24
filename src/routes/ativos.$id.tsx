import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useAssets } from "@/lib/assets/store";
import { useOrg } from "@/lib/org/store";
import { getCategory, CAE_SECTIONS } from "@/lib/assets/depreciation-table";
import {
  accumulatedUntil,
  depreciationSummary,
  projectedYearlySchedule,
  gainOrLoss,
} from "@/lib/assets/depreciation";
import { fmtKz, fmtDate, fmtPct } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ativos/$id")({
  component: AssetDetail,
  head: () => ({ meta: [{ title: "Ficha do Ativo — Imobilizado.AO" }] }),
});

function AssetDetail() {
  const { id } = Route.useParams();
  const { assets, ready, dispose, remove } = useAssets();
  const { branches, departments, locations, transfers } = useOrg();
  const navigate = useNavigate();
  const asset = assets.find((a) => a.id === id);
  const assetTransfers = transfers.filter((t) => t.assetId === id);
  const branch = asset ? branches.find((b) => b.id === asset.branchId) : undefined;
  const department = asset?.departmentId ? departments.find((d) => d.id === asset.departmentId) : undefined;
  const location = asset?.locationId ? locations.find((l) => l.id === asset.locationId) : undefined;
  const inTransitTo = asset?.inTransitToBranchId ? branches.find((b) => b.id === asset.inTransitToBranchId) : undefined;

  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [dispDate, setDispDate] = useState(today);
  const [dispValue, setDispValue] = useState("0");
  const [dispNote, setDispNote] = useState("");

  const cat = asset ? getCategory(asset.categoryId) : undefined;
  const cae = asset ? CAE_SECTIONS.find((c) => c.code === asset.caeSection) : undefined;

  const schedule = useMemo(
    () => (asset && cat ? projectedYearlySchedule(asset, cat) : []),
    [asset, cat],
  );

  if (!ready) {
    return <AppShell><div className="p-10 text-muted-foreground">A carregar…</div></AppShell>;
  }
  if (!asset || !cat) {
    return (
      <AppShell>
        <div className="p-10 space-y-4">
          <p className="text-muted-foreground">Ativo não encontrado.</p>
          <Button asChild><Link to="/inventario">Voltar ao inventário</Link></Button>
        </div>
      </AppShell>
    );
  }

  const { accumulated, netBookValue, monthsElapsed } = accumulatedUntil(asset, cat);
  const summary = depreciationSummary(asset, cat);
  const isClosed = asset.status !== "ativo";

  const previewGain = !isClosed
    ? gainOrLoss(netBookValue, Number(dispValue) || 0)
    : asset.disposalValue != null
      ? gainOrLoss(netBookValue, asset.disposalValue)
      : null;

  function handleDispose() {
    const v = Number(dispValue);
    if (v < 0) return toast.error("Valor de alienação inválido.");
    dispose(asset!.id, dispDate, v, dispNote);
    toast.success(v > 0 ? "Ativo alienado." : "Ativo abatido.");
    setOpen(false);
  }

  function handleDelete() {
    if (!confirm(`Eliminar definitivamente ${asset!.code}?`)) return;
    remove(asset!.id);
    navigate({ to: "/inventario" });
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-[1400px] space-y-6">
        <Link to="/inventario" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Inventário
        </Link>

        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-muted-foreground">{asset.code}</span>
              <Badge variant={asset.nature === "corporeo" ? "default" : "secondary"}>
                {asset.nature === "corporeo" ? "Corpóreo" : "Incorpóreo"}
              </Badge>
              {isClosed && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  {asset.status === "alienado" ? "Alienado" : "Abatido"}
                </Badge>
              )}
              {asset.status === "em_transito" && inTransitTo && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Em Trânsito → {inTransitTo.name}
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-display font-semibold mt-2">
              {asset.description}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {cat.section} — {cat.description} · {cae?.label ?? asset.caeSection}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {branch?.name ?? "—"}
              {department && <> · {department.name}</>}
              {location && <> · {location.name}</>}
            </p>
          </div>
          <div className="flex gap-2">
            {!isClosed && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Abater / Alienar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Abate ou Alienação</DialogTitle>
                    <DialogDescription>
                      Indique o valor de realização. Mais-valia se {">"} VCL, menos-valia se {"<"} VCL.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Data</Label>
                      <Input type="date" value={dispDate} onChange={(e) => setDispDate(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Valor de Realização (Kz)</Label>
                      <Input type="number" min="0" step="0.01" value={dispValue} onChange={(e) => setDispValue(e.target.value)} className="tabular" />
                      <p className="text-xs text-muted-foreground">VCL actual: {fmtKz(netBookValue)}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Observação</Label>
                      <Textarea rows={2} value={dispNote} onChange={(e) => setDispNote(e.target.value)} />
                    </div>
                    {previewGain && (
                      <div className={`rounded-lg p-3 border text-sm ${
                        previewGain.type === "mais-valia" ? "border-success/30 bg-success/10 text-success"
                        : previewGain.type === "menos-valia" ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-border bg-muted text-muted-foreground"
                      }`}>
                        <p className="font-semibold capitalize">{previewGain.type}</p>
                        <p className="tabular">{fmtKz(Math.abs(previewGain.amount))}</p>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleDispose}>Confirmar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric label="Valor de Aquisição" value={fmtKz(asset.acquisitionValue)} />
          <Metric label="Amortização Acumulada" value={fmtKz(accumulated)} tone="warning" />
          <Metric label="Valor Contabilístico Líquido" value={fmtKz(netBookValue)} tone="success" />
          <Metric label="Quota mensal" value={fmtKz(summary.monthlyDepreciation)} />
        </section>

        {isClosed && previewGain && asset.disposalValue != null && (
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display font-semibold mb-3">Registo de Abate / Alienação</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <Field label="Data" value={fmtDate(asset.disposalDate)} />
              <Field label="Valor de Realização" value={fmtKz(asset.disposalValue)} />
              <Field label="VCL na data" value={fmtKz(netBookValue)} />
              <Field
                label={previewGain.type === "neutro" ? "Resultado" : previewGain.type === "mais-valia" ? "Mais-valia" : "Menos-valia"}
                value={fmtKz(Math.abs(previewGain.amount))}
                tone={previewGain.type === "mais-valia" ? "success" : previewGain.type === "menos-valia" ? "destructive" : undefined}
              />
            </div>
            {asset.disposalNote && (
              <p className="mt-3 text-sm text-muted-foreground italic">"{asset.disposalNote}"</p>
            )}
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-3">
            <h2 className="font-display font-semibold">Ficha Técnica</h2>
            <Field label="Código" value={asset.code} mono />
            <Field label="Conta PGC" value={cat.pgcAccount} />
            <Field label="Secção (Decreto 207/15)" value={cat.section} />
            <Field label="CAE" value={cae?.label ?? asset.caeSection} />
            <Field label="Taxa anual" value={fmtPct(cat.ratePct)} />
            <Field label="Vida útil" value={`${cat.usefulLifeYears} anos`} />
            <Field label="Data Aquisição" value={fmtDate(asset.acquisitionDate)} />
            <Field label="Entrada em Funcionamento" value={fmtDate(asset.inServiceDate)} />
            <Field label="Valor Residual" value={fmtKz(asset.residualValue)} />
            <Field label="Imparidades" value={fmtKz(asset.impairmentLoss)} />
            <Field label="Meses amortizados" value={`${monthsElapsed} / ${cat.usefulLifeYears * 12}`} />
          </div>

          <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-6 pb-3">
              <h2 className="font-display font-semibold">Tabela de Amortização Projetada</h2>
              <p className="text-xs text-muted-foreground">
                Método das Quotas Constantes — início no mês de entrada em funcionamento.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exercício</TableHead>
                  <TableHead className="text-center">Meses</TableHead>
                  <TableHead className="text-right">Quota do ano</TableHead>
                  <TableHead className="text-right">Acumulada</TableHead>
                  <TableHead className="text-right">VCL no fim</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((r) => (
                  <TableRow key={r.year}>
                    <TableCell className="font-medium">{r.year}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{r.monthsInYear}</TableCell>
                    <TableCell className="text-right tabular">{fmtKz(r.yearDepreciation)}</TableCell>
                    <TableCell className="text-right tabular text-warning">{fmtKz(r.accumulated)}</TableCell>
                    <TableCell className="text-right tabular font-semibold">{fmtKz(r.netBookValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "destructive" }) {
  const toneCls =
    tone === "success" ? "text-success" :
    tone === "warning" ? "text-warning" :
    tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-xl font-display font-semibold tabular ${toneCls}`}>{value}</p>
    </div>
  );
}

function Field({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: "success" | "destructive" }) {
  const toneCls = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "";
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : "tabular"} ${toneCls}`}>{value}</span>
    </div>
  );
}
