import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCheck } from "lucide-react";
import { useCustody } from "@/lib/custody/store";
import { useAssets } from "@/lib/assets/store";
import { toast } from "sonner";
import type { Asset } from "@/lib/assets/types";

interface Props {
  asset: Asset;
}

export function CustodianDialog({ asset }: Props) {
  const { assign } = useCustody();
  const { update } = useAssets();
  const today = new Date().toISOString().slice(0, 10);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(asset.custodian?.name ?? "");
  const [taxId, setTaxId] = useState(asset.custodian?.taxId ?? "");
  const [date, setDate] = useState(today);
  const [signed, setSigned] = useState(false);
  const [note, setNote] = useState("");

  function handleSubmit() {
    if (!name.trim()) return toast.error("Nome do colaborador obrigatório.");
    assign({
      assetId: asset.id,
      custodianName: name.trim(),
      taxId: taxId.trim() || undefined,
      startDate: date,
      termSigned: signed,
      termSignedDate: signed ? today : undefined,
      note: note.trim() || undefined,
    });
    update(asset.id, {
      custodian: {
        name: name.trim(),
        taxId: taxId.trim() || undefined,
        assignedDate: date,
        responsibilityTermSigned: signed,
        termSignedDate: signed ? today : undefined,
        note: note.trim() || undefined,
      },
    });
    toast.success(`Ativo atribuído a ${name.trim()}.`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserCheck className="w-4 h-4 mr-2" />
          {asset.custodian ? "Reatribuir" : "Atribuir Responsável"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atribuição de Responsável</DialogTitle>
          <DialogDescription>
            Regista a entrega do ativo a um colaborador. A atribuição actual
            (se existir) será encerrada na data indicada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Colaborador / Usuário *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: João António Silva"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>NIF do Colaborador</Label>
              <Input
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="Opcional"
                className="font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data de Entrega</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Observação</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: Estado do equipamento, acessórios entregues…"
            />
          </div>
          <label className="flex items-start gap-2 pt-1 cursor-pointer">
            <Checkbox
              checked={signed}
              onCheckedChange={(v) => setSigned(v === true)}
            />
            <span className="text-sm">
              <span className="font-medium">Termo de Responsabilidade assinado</span>
              <span className="block text-xs text-muted-foreground">
                O colaborador declara responsabilizar-se pela guarda e bom uso do equipamento.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Confirmar Atribuição</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
