import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/AuthProvider";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Iniciar Sessão — Imobilizado.AO" }] }),
});

function LoginPage() {
  const { signIn, signUp, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [loading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const fn = mode === "signin"
      ? signIn(email, password, remember)
      : signUp(email, password, fullName || email);
    const { error } = await fn;
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (mode === "signup") {
      toast.success("Conta criada. A iniciar sessão…");
    }
  }

  async function handleReset() {
    if (!resetEmail) return;
    const { error } = await resetPassword(resetEmail);
    if (error) toast.error(error);
    else {
      toast.success("Email de recuperação enviado.");
      setResetOpen(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="font-display font-semibold text-lg leading-tight">
              Imobilizado<span className="text-sidebar-primary">.AO</span>
            </p>
            <p className="text-xs text-sidebar-foreground/60">EAM Corporativo · PGC Angolano</p>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-display font-semibold leading-tight">
            Sistema de Gestão de Activos Imobilizados
          </h1>
          <p className="text-sidebar-foreground/70 max-w-md">
            Conformidade com o Plano Geral de Contabilidade e Decreto Presidencial n.º 207/15.
            Multi-filial, inventário físico por QR Code e amortização automática.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-sidebar-border/40 text-xs">
            <div><p className="text-sidebar-primary font-mono text-xl">PGC</p><p className="text-sidebar-foreground/60">Conforme</p></div>
            <div><p className="text-sidebar-primary font-mono text-xl">207/15</p><p className="text-sidebar-foreground/60">Decreto</p></div>
            <div><p className="text-sidebar-primary font-mono text-xl">EAM</p><p className="text-sidebar-foreground/60">Enterprise</p></div>
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/40">© República de Angola · Uso corporativo</p>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <p className="font-display font-semibold">Imobilizado.AO</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-primary font-semibold">
              {mode === "signin" ? "Acesso Corporativo" : "Nova Conta"}
            </p>
            <h2 className="text-3xl font-display font-semibold mt-1">
              {mode === "signin" ? "Iniciar Sessão" : "Criar Utilizador"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {mode === "signin"
                ? "Introduza as suas credenciais para aceder ao sistema."
                : "O primeiro utilizador registado é Administrador. Os seguintes são Técnicos."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex.: Maria António"
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail Corporativo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="utilizador@empresa.ao"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Palavra-passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>

            {mode === "signin" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                  <span className="text-muted-foreground">Lembrar-me</span>
                </label>
                <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-primary hover:underline">
                      Recuperar palavra-passe
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Recuperar palavra-passe</DialogTitle>
                      <DialogDescription>
                        Enviaremos um link de recuperação para o seu e-mail.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                      <Label htmlFor="reset_email">E-mail</Label>
                      <Input
                        id="reset_email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="utilizador@empresa.ao"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" onClick={handleReset}>Enviar link</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={busy}>
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            {mode === "signin" ? (
              <>Não tem conta?{" "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline font-medium">
                  Registar
                </button>
              </>
            ) : (
              <>Já tem conta?{" "}
                <button onClick={() => setMode("signin")} className="text-primary hover:underline font-medium">
                  Iniciar sessão
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
