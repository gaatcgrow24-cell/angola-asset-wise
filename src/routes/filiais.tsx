import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useOrg } from "@/lib/org/store";
import { useAssets } from "@/lib/assets/store";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Network,
  MapPin,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { BranchType } from "@/lib/org/types";

export const Route = createFileRoute("/filiais")({
  component: Filiais,
  head: () => ({ meta: [{ title: "Filiais — Imobilizado.AO" }] }),
});

function Filiais() {
  const { org, branches, departments, locations, createBranch, createDepartment, createLocation } = useOrg();
  const { assets } = useAssets();

  const countByBranch = useMemo(() => {
    const m = new Map<string, number>();
    assets.forEach((a) => m.set(a.branchId, (m.get(a.branchId) ?? 0) + 1));
    return m;
  }, [assets]);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 space-y-6 max-w-[1400px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">Organização</p>
            <h1 className="text-3xl font-display font-semibold mt-1">{org?.name}</h1>
            <p className="text-muted-foreground mt-1">NIF {org?.taxId} · {branches.length} unidades · {departments.length} departamentos</p>
          </div>
          <NovaFilialDialog onCreate={createBranch} />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {branches.map((br) => {
            const brDepts = departments.filter((d) => d.branchId === br.id);
            return (
              <div key={br.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-5 border-b border-border flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${br.type === "sede" ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                      {br.type === "sede" ? <Network className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display font-semibold">{br.name}</h2>
                        <Badge variant="outline" className="text-[10px] uppercase">{br.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{br.province} · cód. {br.code}</p>
                      {br.managerName && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Users className="w-3 h-3" />{br.managerName}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display font-semibold tabular">{countByBranch.get(br.id) ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">ativos</p>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {brDepts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem departamentos.</p>
                  ) : (
                    brDepts.map((d) => {
                      const locs = locations.filter((l) => l.departmentId === d.id);
                      return (
                        <div key={d.id} className="border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="font-medium text-sm">{d.name}</p>
                            <NovaLocalDialog departmentId={d.id} onCreate={createLocation} />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {locs.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Sem localizações.</span>
                            ) : (
                              locs.map((l) => (
                                <Badge key={l.id} variant="secondary" className="font-normal">
                                  <MapPin className="w-3 h-3 mr-1" />{l.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <NovoDeptoDialog branchId={br.id} onCreate={createDepartment} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function NovaFilialDialog({ onCreate }: { onCreate: (b: any) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<BranchType>("filial");
  const [province, setProvince] = useState("");
  const [managerName, setManager] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Nova Filial</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Filial / Delegação</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Nome *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Código</Label><Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={4} className="font-mono" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as BranchType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sede">Sede</SelectItem>
                  <SelectItem value="delegacao">Delegação</SelectItem>
                  <SelectItem value="filial">Filial Provincial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Província</Label><Input value={province} onChange={(e) => setProvince(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Responsável</Label><Input value={managerName} onChange={(e) => setManager(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => {
            if (!name || !province) return toast.error("Nome e província obrigatórios.");
            onCreate({ name, code: code || name.slice(0, 3).toUpperCase(), type, province, managerName });
            toast.success("Filial criada.");
            setOpen(false); setName(""); setCode(""); setProvince(""); setManager("");
          }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovoDeptoDialog({ branchId, onCreate }: { branchId: string; onCreate: (d: any) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full"><Plus className="w-3 h-3 mr-1" />Departamento</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Departamento</DialogTitle></DialogHeader>
        <div className="space-y-1.5"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => {
            if (!name) return toast.error("Nome obrigatório.");
            onCreate({ branchId, name });
            toast.success("Departamento criado.");
            setOpen(false); setName("");
          }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovaLocalDialog({ departmentId, onCreate }: { departmentId: string; onCreate: (l: any) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm" className="h-6 px-2 text-xs"><Plus className="w-3 h-3 mr-1" />Local</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Localização Física</DialogTitle></DialogHeader>
        <div className="space-y-1.5"><Label>Nome (ex.: Sala 201)</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => {
            if (!name) return toast.error("Nome obrigatório.");
            onCreate({ departmentId, name });
            toast.success("Localização criada.");
            setOpen(false); setName("");
          }}>Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
