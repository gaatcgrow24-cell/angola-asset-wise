import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssets } from "@/lib/assets/store";
import { ArrowLeft, Camera, ScanLine } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  component: ScanPage,
  head: () => ({ meta: [{ title: "Escanear Etiqueta — Imobilizado.AO" }] }),
});

function ScanPage() {
  const { assets, ready } = useAssets();
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function resolve(raw: string) {
    const trimmed = raw.trim();
    // Pode ser uma URL completa (/ativos/<id>) ou código IMB-XXXX
    const urlMatch = trimmed.match(/\/ativos\/([^/?#]+)/);
    if (urlMatch) {
      const id = decodeURIComponent(urlMatch[1]);
      const exists = assets.find((a) => a.id === id);
      if (exists) {
        navigate({ to: "/ativos/$id", params: { id } });
        return true;
      }
    }
    const byCode = assets.find(
      (a) => a.code.toLowerCase() === trimmed.toLowerCase(),
    );
    if (byCode) {
      navigate({ to: "/ativos/$id", params: { id: byCode.id } });
      return true;
    }
    return false;
  }

  async function startScan() {
    setError(null);
    try {
      const el = document.getElementById("qr-reader");
      if (!el) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          if (resolve(decoded)) {
            scanner.stop().catch(() => {});
          } else {
            toast.error(`Código "${decoded}" não corresponde a nenhum ativo.`);
          }
        },
        () => {},
      );
    } catch (e: any) {
      setScanning(false);
      setError(
        e?.message ??
          "Não foi possível abrir a câmara. Verifique permissões do navegador.",
      );
    }
  }

  async function stopScan() {
    try {
      await scannerRef.current?.stop();
    } catch {}
    setScanning(false);
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    if (!resolve(manualCode)) {
      toast.error("Código não encontrado no inventário.");
    }
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-2xl space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <header>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">
            Inventário Físico
          </p>
          <h1 className="text-3xl font-display font-semibold mt-1">
            Escanear Etiqueta
          </h1>
          <p className="text-muted-foreground mt-1">
            Aponte a câmara ao QR Code ou código de barras colado no ativo.
          </p>
        </header>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div
            id="qr-reader"
            className="w-full aspect-square bg-black/90 flex items-center justify-center text-white/60 text-sm"
          >
            {!scanning && (
              <div className="text-center px-6">
                <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Câmara desligada</p>
              </div>
            )}
          </div>
          <div className="p-4 flex gap-2">
            {!scanning ? (
              <Button onClick={startScan} className="flex-1" size="lg">
                <Camera className="w-5 h-5 mr-2" />
                Iniciar Câmara
              </Button>
            ) : (
              <Button
                onClick={stopScan}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Parar
              </Button>
            )}
          </div>
          {error && (
            <p className="px-4 pb-4 text-sm text-destructive">{error}</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium mb-2">Inserir código manualmente</p>
          <form onSubmit={submitManual} className="flex gap-2">
            <Input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Ex.: IMB-0001"
              className="font-mono"
            />
            <Button type="submit">Abrir</Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
