import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSignature, Printer } from "lucide-react";
import { fmtDate, fmtKz } from "@/lib/format";
import type { Asset } from "@/lib/assets/types";

interface Props {
  asset: Asset;
  branchName?: string;
}

export function ResponsibilityTermDialog({ asset, branchName }: Props) {
  const [open, setOpen] = useState(false);
  const today = new Date();

  function handlePrint() {
    if (typeof window === "undefined") return;
    document.body.classList.add("printing-term");
    window.print();
    setTimeout(() => document.body.classList.remove("printing-term"), 500);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSignature className="w-4 h-4 mr-2" />
          Termo de Responsabilidade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Termo de Responsabilidade</DialogTitle>
        </DialogHeader>

        <div
          id="printable-term"
          className="bg-white text-black p-8 rounded border border-border font-serif text-sm leading-relaxed"
        >
          <header className="text-center border-b border-black pb-4 mb-6">
            <p className="text-xs uppercase tracking-widest">República de Angola</p>
            <h2 className="text-xl font-bold mt-1">
              Termo de Responsabilidade por Bem Patrimonial
            </h2>
            <p className="text-xs mt-1">
              Decreto Presidencial n.º 207/15 · PGC Angolano
            </p>
          </header>

          <p className="mb-4">
            Pelo presente termo, o(a) colaborador(a) abaixo identificado(a) declara
            ter recebido em boas condições de uso e funcionamento o bem patrimonial
            adiante descrito, comprometendo-se a guardá-lo, conservá-lo e utilizá-lo
            exclusivamente para fins de serviço, respondendo por danos ou extravios
            decorrentes de uso indevido, negligência ou dolo.
          </p>

          <table className="w-full border border-black mb-4 text-xs">
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 font-bold w-1/3">Código do Bem</td>
                <td className="p-2 font-mono">{asset.code}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 font-bold">Descrição</td>
                <td className="p-2">{asset.description}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 font-bold">Filial / Unidade</td>
                <td className="p-2">{branchName ?? "—"}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 font-bold">Valor de Aquisição</td>
                <td className="p-2">{fmtKz(asset.acquisitionValue)}</td>
              </tr>
              <tr>
                <td className="border-r border-black p-2 font-bold">Data de Entrega</td>
                <td className="p-2">
                  {asset.custodian?.assignedDate
                    ? fmtDate(asset.custodian.assignedDate)
                    : fmtDate(today.toISOString())}
                </td>
              </tr>
            </tbody>
          </table>

          <h3 className="font-bold mt-6 mb-2">Identificação do Responsável</h3>
          <table className="w-full border border-black mb-6 text-xs">
            <tbody>
              <tr className="border-b border-black">
                <td className="border-r border-black p-2 font-bold w-1/3">Nome</td>
                <td className="p-2">{asset.custodian?.name ?? "_____________________________"}</td>
              </tr>
              <tr>
                <td className="border-r border-black p-2 font-bold">NIF</td>
                <td className="p-2 font-mono">{asset.custodian?.taxId ?? "_____________________________"}</td>
              </tr>
            </tbody>
          </table>

          <p className="text-xs italic mb-6">
            Em caso de cessação de funções, transferência ou substituição do equipamento,
            o(a) responsável compromete-se a devolver o bem nas mesmas condições em que
            o recebeu, salvo o desgaste natural decorrente da utilização normal.
          </p>

          <div className="grid grid-cols-2 gap-8 mt-12 text-xs">
            <div className="text-center">
              <div className="border-t border-black pt-1">O Responsável</div>
              <div className="mt-1 text-[10px]">(assinatura)</div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1">O Gestor do Património</div>
              <div className="mt-1 text-[10px]">(assinatura e carimbo)</div>
            </div>
          </div>

          <p className="text-[10px] text-center mt-8">
            Emitido em {fmtDate(today.toISOString())}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Termo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
