import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  accent?: "primary" | "accent" | "success" | "warning";
  icon?: React.ReactNode;
}

export function StatCard({ label, value, hint, accent = "primary", icon }: StatCardProps) {
  const accentMap = {
    primary: "from-primary/10 to-transparent text-primary",
    accent: "from-accent/15 to-transparent text-accent-foreground",
    success: "from-success/10 to-transparent text-success",
    warning: "from-warning/10 to-transparent text-warning",
  };
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
      <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", accentMap[accent])} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </p>
          <p className="mt-2 text-2xl font-display font-semibold text-foreground tabular">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-background/60 border border-border flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
