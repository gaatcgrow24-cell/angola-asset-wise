import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAssets } from "@/lib/assets/store";
import { ArrowLeft, Camera, ScanLine, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  component: ScanPage,
  head: () => ({ meta: [{ title: "Escanear Etiqueta — Imobilizado.AO" }] }),
});

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 1320;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

function ScanPage() {
  const { assets, ready } = useAssets();
  const navigate = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown");

  useEffect(() => {
    if (!navigator.permissions || !(navigator.permissions as any).query) return;
    (navigator.permissions as any)
      .query({ name: "camera" })
      .then((res: PermissionStatus) => {
        setPermission(res.state as any);
        res.onchange = () => setPermission(res.state as any);
      })
      .catch(() => {});
  }, []);

  function resolve(raw: string): boolean {
    const trimmed = raw.trim();
    const urlMatch = trimmed.match(/\/ativos\/([^/?#]+)/);
    if (urlMatch) {
      const id = decodeURIComponent(urlMatch[1]);
      if (assets.find((a) => a.id === id)) {
        navigate({ to: "/ativos/$id", params: { id } });
        return true;
      }
    }
    const byCode = assets.find((a) => a.code.toLowerCase() === trimmed.toLowerCase());
    if (byCode) {
      navigate({ to: "/ativos/$id", params: { id: byCode.id } });
      return true;
    }
    return false;
  }

  async function startScan() {
    setError(null);
    setStarting(true);
    handledRef.current = false;
    try {
      const el = document.getElementById("qr-reader");
      if (!el) return;
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: { ideal: "environment" } },
        { fps: 12, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          if (handledRef.current) return;
          if (resolve(decoded)) {
            handledRef.current = true;
            playBeep();
            scanner.stop().catch(() => {});
            setScanning(false);
          } else {
            // Avoid toast spam — only show once every 2s
            const now = Date.now();
            if (!(window as any).__lastScanWarn || now - (window as any).__lastScanWarn > 2000) {
              (window as any).__lastScanWarn = now;
              toast.error(`Código "${decoded}" não corresponde a nenhum ativo.`);
            }
          }
        },
        () => {},
      );
      setScanning(true);
      setStarting(false);
    } catch (e: any) {
      setStarting(false);
      setScanning(false);
      const name = e?.name ?? "";
      if (name === "NotAllowedError" || /Permission/i.test(String(e?.message))) {
        setPermission("denied");
        setError(
          "Acesso à câmara bloqueado. Por favor, permita o acesso à câmara nas configurações do seu navegador e tente novamente.",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("Nenhuma câmara encontrada neste dispositivo. Use o campo manual abaixo.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setError("A câmara está a ser usada por outra aplicação. Feche-a e tente novamente.");
      } else {
        setError(e?.message ?? "Não foi possível abrir a câmara. Verifique permissões do navegador.");
      }
    }
  }

  async function stopScan() {
    try { await scannerRef.current?.stop(); } catch {}
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
    if (!manualCode.trim()) return;
    if (!resolve(manualCode)) {
      toast.error("Código não encontrado no inventário.");
    }
  }

  return (
    <AppShell>
      <div className="p-6 lg:p-10 max-w-2xl space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <header>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Inventário Físico</p>
          <h1 className="text-3xl font-display font-semibold mt-1">Escanear Etiqueta</h1>
          <p className="text-muted-foreground mt-1">
            Aponte a câmara ao QR Code ou código de barras do activo. Detecção contínua com redirecionamento automático.
          </p>
        </header>

        {permission === "denied" && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Acesso à câmara bloqueado</p>
              <p className="text-muted-foreground mt-1">
                Por favor, permita o acesso à câmara nas configurações do seu navegador
                (ícone de cadeado na barra de endereço) e recarregue a página.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div
            id="qr-reader"
            className="w-full aspect-square bg-black/90 flex items-center justify-center text-white/60 text-sm"
          >
            {!scanning && !starting && (
              <div className="text-center px-6">
                <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Câmara desligada</p>
              </div>
            )}
          </div>
          <div className="p-4 flex gap-2">
            {!scanning ? (
              <Button onClick={startScan} className="flex-1" size="lg" disabled={starting}>
                <Camera className="w-5 h-5 mr-2" />
                {starting ? "A iniciar…" : "Iniciar Câmara"}
              </Button>
            ) : (
              <Button onClick={stopScan} variant="outline" className="flex-1" size="lg">
                Parar
              </Button>
            )}
          </div>
          {error && <p className="px-4 pb-4 text-sm text-destructive">{error}</p>}
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
