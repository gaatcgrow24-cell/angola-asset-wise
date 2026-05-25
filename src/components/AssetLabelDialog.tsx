import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
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
import { Printer, QrCode } from "lucide-react";

interface Props {
  assetId: string;
  assetCode: string;
  description: string;
  branchName?: string;
  departmentName?: string;
}

export function AssetLabelDialog({
  assetId,
  assetCode,
  description,
  branchName,
  departmentName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/ativos/${assetId}`
        : assetCode;
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "H",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [open, assetId, assetCode]);

  function handlePrint() {
    if (typeof window === "undefined") return;
    // marca o elemento e dispara impressão (CSS @media print esconde tudo o resto)
    document.body.classList.add("printing-label");
    window.print();
    setTimeout(() => document.body.classList.remove("printing-label"), 500);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <QrCode className="w-4 h-4 mr-2" />
          Gerar QR Code da Etiqueta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Etiqueta de Identificação</DialogTitle>
          <DialogDescription>
            Cole esta etiqueta no ativo físico. O QR Code abre directamente a
            ficha digital quando escaneado.
          </DialogDescription>
        </DialogHeader>

        <div
          ref={labelRef}
          id="printable-label"
          className="border-2 border-dashed border-border rounded-lg p-4 bg-white text-black"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR ${assetCode}`}
                  className="w-32 h-32"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-100 animate-pulse" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                Imobilizado.AO
              </p>
              <p className="font-mono text-lg font-bold mt-1 break-all">
                {assetCode}
              </p>
              <p className="text-xs font-medium mt-2 line-clamp-2">
                {description}
              </p>
              {branchName && (
                <p className="text-[10px] text-gray-600 mt-2">
                  {branchName}
                  {departmentName ? ` · ${departmentName}` : ""}
                </p>
              )}
              <p className="text-[9px] text-gray-400 mt-1">
                PGC · Decreto 207/15
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Etiqueta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
