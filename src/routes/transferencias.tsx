import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAssets } from "@/lib/assets/store";
import { useOrg } from "@/lib/org/store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, XCircle, Plus } from "lucide-react";

export const Route = createFileRoute("/transferencias")({
  component: Transferencias,
  head: () => ({ meta: [{ title: "Transferências — Imobilizado.AO" }] }),
});

function Transferencias() {
  const { assets, startTransit, completeTransit, cancelTransit } = useAssets();
  const { branches, departments, transfers, createTransfer, completeTransfer, cancelTransfer } = useOrg();

  const [filter, setFilter] = useState<string>("em_transito");
  const filtered = useMemo(
    () => transfers.filter((t) => (filter === "todas" ? true : t.status === filter)),
    [transfers, filter],
  );

  function receberTransferencia(transferId: string, assetId: string, toBranchId: string, toDepartmentId?: string) {
    const receivedBy = prompt("Quem está a receber?") || "Recebido";
    completeTransfer(transferId, receivedBy, new Date().toISOString().slice(0, 10));
    completeTransit(assetId, toBranchId, toDepartmentId);
    toast.success("Transferência confirmada como recebida.");
  }

  function cancelar(transferId: string, assetId: string) {
    cancelTransfer(transferId);
    cancelTransit(assetId);
    toast.info("Transferência cancelada.");
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-10 space-y-6 max-w-[1500px]">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">Movimentações entre Filiais</p>
            <h1 className="text-3xl font-display font-semibold mt-1">Transferências de Ativos</h1>
            <p className="text-muted-foreground mt-1">
              Rastreabilidade completa: quem enviou, quem recebeu, data e motivo
            </p>
          </div>
          <NovaTransferenciaDialog
            assets={assets.filter((a) => a.status === "ativo")}
            branches={branches}
            departments={departments}
            onCreate={(payload) => {
              const tr = createTransfer(payload);
              startTransit(payload.assetId, payload.toBranchId);
              toast.success(`Transferência ${tr.id.slice(0, 6)} iniciada.`);
            }}
          />
        </header>

        <div className="flex gap-2">
          {[
            { v: "em_transito", label: "Em Trânsito" },
            { v: "recebido", label: "Recebidas" },
            { v: "cancelado", label: "Canceladas" },
            { v: "todas", label: "Todas" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setFilter(opt.v)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border ${filter === opt.v ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ativo</TableHead>
                <TableHead>Origem → Destino</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Enviado por</TableHead>
                <TableHead>Recebido por</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Sem transferências.</TableCell></TableRow>
              )}
              {filtered.map((t) => {
                const a = assets.find((x) => x.id === t.assetId);
                const from = branches.find((b) => b.id === t.fromBranchId);
                const to = branches.find((b) => b.id === t.toBranchId);
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      {a ? (
                        <Link to="/ativos/$id" params={{ id: a.id }} className="hover:text-primary">
                          <p className="font-medium text-sm">{a.description}</p>
                          <p className="text-xs text-muted-foreground font-mono">{a.code}</p>
                        </Link>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <span>{from?.code}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">{to?.code}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{from?.name} → {to?.name}</p>
                    </TableCell>
                    <TableCell className="text-xs max-w-[220px]">{t.reason}</TableCell>
                    <TableCell className="text-xs">
                      <p className="font-medium">{t.sentBy}</p>
                      <p className="text-muted-foreground">{fmtDate(t.sentDate)}</p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.receivedBy ? (
                        <>
                          <p className="font-medium">{t.receivedBy}</p>
                          <p className="text-muted-foreground">{fmtDate(t.receivedDate)}</p>
                        </>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {t.status === "em_transito" && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Em Trânsito</Badge>}
                      {t.status === "recebido" && <Badge variant="outline" className="bg-success/15 text-success border-success/20">Recebido</Badge>}
                      {t.status === "cancelado" && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Cancelado</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.status === "em_transito" && a && (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => receberTransferencia(t.id, a.id, t.toBranchId, t.toDepartmentId)}>
                            <CheckCircle2 className="w-3 h-3 mr-1" />Receber
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => cancelar(t.id, a.id)}>
                            <XCircle className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
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

function NovaTransferenciaDialog({
  assets,
  branches,
  departments,
  onCreate,
}: {
  assets: any[];
  branches: any[];
  departments: any[];
  onCreate: (p: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [assetId, setAssetId] = useState("");
  const [toBranchId, setToBranchId] = useState("");
  const [toDepartmentId, setToDept] = useState("");
  const [reason, setReason] = useState("");
  const [sentBy, setSentBy] = useState("");
  const [sentDate, setSentDate] = useState(today);

  const asset = assets.find((a) => a.id === assetId);
  const targetDepts = departments.filter((d) => d.branchId === toBranchId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-1" />Nova Transferência</Button></DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Iniciar Transferência entre Filiais</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Ativo *</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar ativo" /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {assets.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.code} — {a.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {asset && (
              <p className="text-xs text-muted-foreground">
                Origem actual: {branches.find((b) => b.id === asset.branchId)?.name}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Filial de Destino *</Label>
              <Select value={toBranchId} onValueChange={(v) => { setToBranchId(v); setToDept(""); }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {branches.filter((b) => b.id !== asset?.branchId).map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Departamento Destino</Label>
              <Select value={toDepartmentId} onValueChange={setToDept} disabled={!toBranchId}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {targetDepts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Enviado por *</Label><Input value={sentBy} onChange={(e) => setSentBy(e.target.value)} placeholder="Nome do responsável" /></div>
            <div className="space-y-1.5"><Label>Data de envio</Label><Input type="date" value={sentDate} onChange={(e) => setSentDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Motivo *</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Ex.: Realocação para apoio à filial de Benguela" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => {
            if (!assetId || !toBranchId || !sentBy || !reason) return toast.error("Preencha todos os campos obrigatórios.");
            onCreate({ assetId, fromBranchId: asset.branchId, toBranchId, toDepartmentId: toDepartmentId || undefined, reason, sentBy, sentDate });
            setOpen(false);
            setAssetId(""); setToBranchId(""); setToDept(""); setReason(""); setSentBy("");
          }}>Iniciar Trânsito</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
