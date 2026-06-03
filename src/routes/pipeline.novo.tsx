import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { RequestIdField } from "@/components/RequestIdField";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export const Route = createFileRoute("/pipeline/novo")({
  component: NovoPipeline,
  head: () => ({ meta: [{ title: "Novo Registo · Pipeline" }] }),
});

const INCOTERMS = ["EXW", "FCA", "FOB", "CIF", "CIP", "DAP", "DDP"];

function NovoPipeline() {
  const { create } = usePipeline();
  const navigate = useNavigate();
  const [form, setForm] = useState<Omit<PipelineEntry, "id" | "createdAt" | "updatedAt">>({
    client: "",
    description: "",
    jobId: "",
    requestId: "",
    requestLink: "",
    requestAt: "",
    quotationNumber: "",
    quotationDate: "",
    quotationValueAoa: undefined,
    paymentTerms: "",
    incoterms: "",
    quotationStatus: "nao_emitido",
    orderNumber: "",
    orderContent: "",
    orderDate: "",
    orderValueAoa: undefined,
    orderPaymentTerms: "",
    orderStatus: "nao_emitido",
    remarks: "",
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client || !form.description || !form.jobId) {
      toast.error("Cliente, Descrição e Id Trabalho são obrigatórios");
      return;
    }
    try {
      await create({
        ...form,
        requestAt: form.requestAt ? new Date(form.requestAt).toISOString() : undefined,
        quotationStatus: form.quotationNumber ? "emitido" : form.quotationStatus,
        orderStatus: form.orderNumber ? "emitido" : form.orderStatus,
      });
      toast.success("Registo criado");
      navigate({ to: "/pipeline" });
    } catch {
      toast.error("Não foi possível criar o registo");
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/pipeline"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold">Novo Registo de Pipeline</h1>
          <p className="text-sm text-muted-foreground">Preencha as secções aplicáveis. Pode actualizar depois.</p>
        </div>

        <form onSubmit={submit} className="space-y-6">
          <Section title="Trabalho">
            <Field label="Cliente *"><Input value={form.client} onChange={(e) => set("client", e.target.value.toUpperCase())} placeholder="Ex.: AES" /></Field>
            <Field label="Descrição *" full><Input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Ex.: Recondicionamento de CCUs" /></Field>
            <Field label="Id. Trabalho *"><Input value={form.jobId} onChange={(e) => set("jobId", e.target.value)} placeholder="Ex.: 2212301430 AES" /></Field>
          </Section>

          <Section title="Pedido de Cotação">
            <Field label="Id Pedido"><RequestIdField value={form.requestId} onChange={(v) => set("requestId", v)} /></Field>
            <Field label="Link"><Input value={form.requestLink} onChange={(e) => set("requestLink", e.target.value)} placeholder="https://…" /></Field>
            <Field label="Data & Hora"><Input type="datetime-local" value={form.requestAt} onChange={(e) => set("requestAt", e.target.value)} /></Field>
          </Section>

          <Section title="Cotação">
            <Field label="Nº Cotação"><Input value={form.quotationNumber} onChange={(e) => set("quotationNumber", e.target.value)} placeholder="MS24017.PP01" /></Field>
            <Field label="Data Cotação"><Input type="date" value={form.quotationDate} onChange={(e) => set("quotationDate", e.target.value)} /></Field>
            <Field label="Valor (AOA)"><Input type="number" step="0.01" value={form.quotationValueAoa ?? ""} onChange={(e) => set("quotationValueAoa", e.target.value === "" ? undefined : Number(e.target.value))} /></Field>
            <Field label="Termos de Pagamento"><Input value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} placeholder="Net 30, 50/50…" /></Field>
            <Field label="Incoterms">
              <Select value={form.incoterms} onValueChange={(v) => set("incoterms", v)}>
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
            <Field label="Nº NE / Contrato"><Input value={form.orderNumber} onChange={(e) => set("orderNumber", e.target.value)} /></Field>
            <Field label="Data"><Input type="date" value={form.orderDate} onChange={(e) => set("orderDate", e.target.value)} /></Field>
            <Field label="Valor (AOA)"><Input type="number" step="0.01" value={form.orderValueAoa ?? ""} onChange={(e) => set("orderValueAoa", e.target.value === "" ? undefined : Number(e.target.value))} /></Field>
            <Field label="Termos de Pagamento"><Input value={form.orderPaymentTerms} onChange={(e) => set("orderPaymentTerms", e.target.value)} /></Field>
            <Field label="Conteúdo da Nota" full><Textarea rows={3} value={form.orderContent} onChange={(e) => set("orderContent", e.target.value)} /></Field>
          </Section>

          <Section title="Observações">
            <Field label="Notas" full><Textarea rows={3} value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></Field>
          </Section>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" asChild><Link to="/pipeline">Cancelar</Link></Button>
            <Button type="submit"><Save className="w-4 h-4 mr-2" /> Guardar</Button>
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
