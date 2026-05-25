import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAssets, nextCode } from "@/lib/assets/store";
import { useOrg, useCurrentBranch } from "@/lib/org/store";
import {
  DEPRECIATION_CATEGORIES,
  CAE_SECTIONS,
  getCategory,
} from "@/lib/assets/depreciation-table";
import { depreciationSummary } from "@/lib/assets/depreciation";
import { fmtKz, fmtPct } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssetNature } from "@/lib/assets/types";
import { Checkbox } from "@/components/ui/checkbox";
import { useCustody } from "@/lib/custody/store";
import { toast } from "sonner";

export const Route = createFileRoute("/ativos/novo")({
  component: NovoAtivo,
  head: () => ({ meta: [{ title: "Novo Ativo — Imobilizado.AO" }] }),
});

function NovoAtivo() {
  const { assets, create } = useAssets();
  const { branches, departments, locations } = useOrg();
  const { branchId: ctxBranch } = useCurrentBranch();
  const { assign } = useCustody();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [nature, setNature] = useState<AssetNature>("corporeo");
  const [categoryId, setCategoryId] = useState<string>("g-3-1");
  const [caeSection, setCaeSection] = useState("K");
  const [branchId, setBranchId] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [locationId, setLocationId] = useState<string>("");
  const [acquisitionDate, setAcq] = useState(today);
  const [inServiceDate, setIn] = useState(today);
  const [acquisitionValue, setVal] = useState("0");
  const [residualValue, setRes] = useState("0");
  const [notes, setNotes] = useState("");
  // Responsável
  const [custName, setCustName] = useState("");
  const [custTaxId, setCustTaxId] = useState("");
  const [custDate, setCustDate] = useState(today);
  const [custSigned, setCustSigned] = useState(false);

  useEffect(() => {
    if (!branchId && branches.length > 0) {
      setBranchId(ctxBranch || branches[0].id);
    }
  }, [branches, branchId, ctxBranch]);

  const autoCode = useMemo(() => nextCode(assets), [assets]);
  const cat = getCategory(categoryId);

  const filteredCategories = DEPRECIATION_CATEGORIES.filter((c) => c.nature === nature)
    .slice()
    .sort((a, b) => a.description.localeCompare(b.description, "pt"));

  const brDepartments = departments.filter((d) => d.branchId === branchId);
  const depLocations = locations.filter((l) => l.departmentId === departmentId);

  const preview = cat
    ? depreciationSummary(
        {
          acquisitionValue: Number(acquisitionValue) || 0,
          residualValue: Number(residualValue) || 0,
          inServiceDate,
        },
        cat,
      )
    : null;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cat) return;
    if (!branchId) return toast.error("Seleccione a filial.");
    const aq = Number(acquisitionValue);
    const rv = Number(residualValue);
    if (!description) return toast.error("Descrição obrigatória.");
    if (!(aq > 0)) return toast.error("Valor de aquisição inválido.");
    if (rv < 0 || rv > aq)
      return toast.error("Valor residual deve estar entre 0 e o valor de aquisição.");
    if (new Date(inServiceDate) < new Date(acquisitionDate))
      return toast.error("Entrada em funcionamento não pode ser anterior à aquisição.");

    const a = create({
      code: code.trim() || autoCode,
      description: description.trim() + (notes ? ` — ${notes.trim()}` : ""),
      nature,
      categoryId,
      caeSection,
      branchId,
      departmentId: departmentId || undefined,
      locationId: locationId || undefined,
      acquisitionDate,
      inServiceDate,
      acquisitionValue: aq,
      residualValue: rv,
      custodian: custName.trim()
        ? {
            name: custName.trim(),
            taxId: custTaxId.trim() || undefined,
            assignedDate: custDate,
            responsibilityTermSigned: custSigned,
            termSignedDate: custSigned ? today : undefined,
          }
        : undefined,
    });
    if (custName.trim()) {
      assign({
        assetId: a.id,
        custodianName: custName.trim(),
        taxId: custTaxId.trim() || undefined,
        startDate: custDate,
        termSigned: custSigned,
        termSignedDate: custSigned ? today : undefined,
      });
    }
    toast.success(`Ativo ${a.code} registado.`);
    navigate({ to: "/ativos/$id", params: { id: a.id } });
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-5xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Cadastro</p>
          <h1 className="text-3xl font-display font-semibold mt-1">Registar Ativo Imobilizado</h1>
          <p className="text-muted-foreground mt-1">
            Conforme PGC Angolano e Decreto Presidencial n.º 207/15.
          </p>
        </header>

        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-display font-semibold">Identificação</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Código (Imobilizado ID)</Label>
                  <Input
                    placeholder={autoCode}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Deixe vazio para usar {autoCode}.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Natureza</Label>
                  <Select
                    value={nature}
                    onValueChange={(v) => {
                      const n = v as AssetNature;
                      setNature(n);
                      const first = DEPRECIATION_CATEGORIES.find((c) => c.nature === n);
                      if (first) setCategoryId(first.id);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corporeo">Corpóreo (Tangível)</SelectItem>
                      <SelectItem value="incorporeo">Incorpóreo (Intangível)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Descrição *</Label>
                <Input
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex.: Computador Portátil Dell Latitude 5520"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Classe — Decreto 207/15 (A-Z)</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-[420px]">
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.description} ({c.ratePct}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Setor de Atividade (CAE)</Label>
                  <Select value={caeSection} onValueChange={setCaeSection}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CAE_SECTIONS.map((s) => (
                        <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionais (serão anexadas à descrição)"
                  rows={2}
                />
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-display font-semibold">Localização Organizacional</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Filial / Sede *</Label>
                  <Select value={branchId} onValueChange={(v) => { setBranchId(v); setDepartmentId(""); setLocationId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} · {b.province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Departamento</Label>
                  <Select value={departmentId} onValueChange={(v) => { setDepartmentId(v); setLocationId(""); }} disabled={!branchId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {brDepartments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Localização Física</Label>
                  <Select value={locationId} onValueChange={setLocationId} disabled={!departmentId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {depLocations.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-display font-semibold">Valores e Datas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Data de Aquisição *</Label>
                  <Input type="date" value={acquisitionDate} onChange={(e) => setAcq(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Entrada em Funcionamento *</Label>
                  <Input type="date" value={inServiceDate} onChange={(e) => setIn(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">Início da amortização (Art.º 3.º n.º 2).</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Valor de Aquisição (Kz) *</Label>
                  <Input type="number" min="0" step="0.01" value={acquisitionValue} onChange={(e) => setVal(e.target.value)} required className="tabular" />
                </div>
                <div className="space-y-1.5">
                  <Label>Valor Residual (Kz)</Label>
                  <Input type="number" min="0" step="0.01" value={residualValue} onChange={(e) => setRes(e.target.value)} className="tabular" />
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-6 space-y-3 sticky top-6">
              <h3 className="font-display font-semibold">Pré-cálculo</h3>
              {cat && preview ? (
                <dl className="text-sm space-y-2">
                  <Row label="Classe" value={cat.section} />
                  <Row label="Conta PGC" value={cat.pgcAccount} mono />
                  <Row label="Taxa anual" value={fmtPct(cat.ratePct)} />
                  <Row label="Vida útil" value={`${cat.usefulLifeYears} anos`} />
                  <hr className="border-border" />
                  <Row label="Base amortizável" value={fmtKz(preview.depreciableBase)} />
                  <Row label="Quota anual" value={fmtKz(preview.annualDepreciation)} strong />
                  <Row label="Quota mensal" value={fmtKz(preview.monthlyDepreciation)} />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Selecione uma classe.</p>
              )}
              <div className="pt-3 flex gap-2">
                <Button type="submit" className="flex-1">Registar</Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/inventario">Cancelar</Link>
                </Button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </AppShell>
  );
}

function Row({ label, value, strong, mono }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right ${strong ? "font-semibold" : ""} ${mono ? "font-mono text-xs" : "tabular"}`}>{value}</dd>
    </div>
  );
}
