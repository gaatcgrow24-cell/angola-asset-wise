import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { usePipeline } from "@/lib/pipeline/store";
import type { PipelineEntry } from "@/lib/pipeline/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RequestIdField } from "@/components/RequestIdField";
import { toast } from "sonner";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

export const Route = createFileRoute("/pipeline/$id")({
  component: EditPipeline,
});

const INCOTERMS = ["EXW", "FCA", "FOB", "CIF", "CIP", "DAP", "DDP"];

function EditPipeline() {
  const { id } = useParams({ from: "/pipeline/$id" });
  const { entries, update, remove, ready } = usePipeline();
  const navigate = useNavigate();
  const [form, setForm] = useState<PipelineEntry | null>(null);

  useEffect(() => {
    if (!ready) return;
    const e = entries.find((x) => x.id === id);
    if (e) {
      setForm({
        ...e,
        requestAt: e.requestAt ? e.requestAt.slice(0, 16) : "",
      });
    }
  }, [ready, id, entries]);

  if (!form) {
    return (
      <AppShell>
        <div className="p-8 text-center text-muted-foreground">A carregar…</div>
      </AppShell>
    );
  }

  const set = <K extends keyof PipelineEntry>(k: K, v: PipelineEntry[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client || !form.description || !form.jobId) {
      toast.error("Cliente, Descrição e Id Trabalho são obrigatórios");
      return;
    }
    try {
      await update(form.id, {
        ...form,
        requestAt: form.requestAt ? new Date(form.requestAt).toISOString() : undefined,
        quotationStatus: form.quotationNumber ? "emitido" : form.quotationStatus,
        orderStatus: form.orderNumber ? "emitido" : form.orderStatus,
      });
      toast.success("Registo actualizado");
      navigate({ to: "/pipeline" });
    } catch {
      toast.error("Não foi possível guardar");
    }
  };

  const del = async () => {
    try {
      await remove(form.id);
      toast.success("Eliminado");
      navigate({ to: "/pipeline" });
    } catch {
      toast.error("Não foi possível eliminar");
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pipeline"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-1" /> Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar Registo</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acção não pode ser desfeita. Tens a certeza?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={del}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold">{form.client} · {form.jobId}</h1>
          <p className="text-sm text-muted-foreground">{form.description}</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Section title="Trabalho">
            <Field label="Cliente *"><Input value={form.client} onChange={(e) => set("client", e.target.value.toUpperCase())} /></Field>
            <Field label="Descrição *" full><Input value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <Field label="Id. Trabalho *"><Input value={form.jobId} onChange={(e) => set("jobId", e.target.value)} /></Field>
          </Section>

          <Section title="Pedido de Cotação">
            <Field label="Id Pedido"><Input value={form.requestId ?? ""} onChange={(e) => set("requestId", e.target.value)} /></Field>
            <Field label="Link"><Input value={form.requestLink ?? ""} onChange={(e) => set("requestLink", e.target.value)} /></Field>
            <Field label="Data & Hora"><Input type="datetime-local" value={form.requestAt ?? ""} onChange={(e) => set("requestAt", e.target.value)} /></Field>
          </Section>

          <Section title="Cotação">
            <Field label="Nº Cotação"><Input value={form.quotationNumber ?? ""} onChange={(e) => set("quotationNumber", e.target.value)} /></Field>
            <Field label="Data Cotação"><Input type="date" value={form.quotationDate ?? ""} onChange={(e) => set("quotationDate", e.target.value)} /></Field>
            <Field label="Valor (AOA)"><Input type="number" step="0.01" value={form.quotationValueAoa ?? ""} onChange={(e) => set("quotationValueAoa", e.target.value === "" ? undefined : Number(e.target.value))} /></Field>
            <Field label="Termos de Pagamento"><Input value={form.paymentTerms ?? ""} onChange={(e) => set("paymentTerms", e.target.value)} /></Field>
            <Field label="Incoterms">
              <Select value={form.incoterms ?? ""} onValueChange={(v) => set("incoterms", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>{INCOTERMS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Estado da Cotação">
              <Select value={form.quotationStatus} onValueChange={(v: "nao_emitido" | "emitido") => set("quotationStatus", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nao_emitido">Não Emitido</SelectItem>
                  <SelectItem value="emitido">Emitido</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </Section>

          <Section title="Nota de Encomenda / Contrato">
            <Field label="Nº NE / Contrato"><Input value={form.orderNumber ?? ""} onChange={(e) => set("orderNumber", e.target.value)} /></Field>
            <Field label="Data"><Input type="date" value={form.orderDate ?? ""} onChange={(e) => set("orderDate", e.target.value)} /></Field>
            <Field label="Valor (AOA)"><Input type="number" step="0.01" value={form.orderValueAoa ?? ""} onChange={(e) => set("orderValueAoa", e.target.value === "" ? undefined : Number(e.target.value))} /></Field>
            <Field label="Termos de Pagamento"><Input value={form.orderPaymentTerms ?? ""} onChange={(e) => set("orderPaymentTerms", e.target.value)} /></Field>
            <Field label="Conteúdo da Nota" full><Textarea rows={3} value={form.orderContent ?? ""} onChange={(e) => set("orderContent", e.target.value)} /></Field>
          </Section>

          <Section title="Observações">
            <Field label="Notas" full><Textarea rows={3} value={form.remarks ?? ""} onChange={(e) => set("remarks", e.target.value)} /></Field>
          </Section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" asChild><Link to="/pipeline">Cancelar</Link></Button>
            <Button type="submit"><Save className="w-4 h-4 mr-2" /> Guardar Alterações</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-3 space-y-1.5" : "space-y-1.5"}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
