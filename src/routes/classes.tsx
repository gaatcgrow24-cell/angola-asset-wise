import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { DEPRECIATION_CATEGORIES } from "@/lib/assets/depreciation-table";
import type { DepreciationCategory } from "@/lib/assets/types";
import { Badge } from "@/components/ui/badge";
import { useAssets } from "@/lib/assets/store";

export const Route = createFileRoute("/classes")({
  component: Classes,
  head: () => ({
    meta: [
      { title: "Classes de Ativos A-Z — Decreto 207/15" },
      { name: "description", content: "Classes padrão do Decreto Presidencial n.º 207/15, organizadas alfabeticamente de A a Z." },
    ],
  }),
});

function Classes() {
  const { assets } = useAssets();

  // Conta ativos por categoria
  const countByCat = useMemo(() => {
    const m = new Map<string, number>();
    assets.forEach((a) => m.set(a.categoryId, (m.get(a.categoryId) ?? 0) + 1));
    return m;
  }, [assets]);

  // Agrupa por letra (descrição da classe)
  const grouped = useMemo(() => {
    const map = new Map<string, DepreciationCategory[]>();
    [...DEPRECIATION_CATEGORIES]
      .sort((a, b) => a.description.localeCompare(b.description, "pt"))
      .forEach((c) => {
        const L = (c.description[0] ?? "#").toUpperCase();
        const arr = map.get(L) ?? [];
        arr.push(c);
        map.set(L, arr);
      });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, []);

  const letters = grouped.map(([L]) => L);

  return (
    <AppShell>
      <div className="p-6 lg:p-10 space-y-6 max-w-[1400px]">
        <header>
          <p className="text-xs uppercase tracking-widest text-primary font-semibold">Catálogo</p>
          <h1 className="text-3xl font-display font-semibold mt-1">Classes de Ativos — A a Z</h1>
          <p className="text-muted-foreground mt-1 max-w-3xl">
            Catálogo alfabético das classes padrão do Decreto Presidencial n.º 207/15
            (Edifícios, Viaturas Ligeiras, Viaturas Pesadas, Equipamento de Informática,
            Ferramentas, Software, etc.) — {DEPRECIATION_CATEGORIES.length} rubricas.
          </p>
        </header>

        {/* Navegador A-Z */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border py-2 -mx-6 px-6 lg:-mx-10 lg:px-10">
          <div className="flex flex-wrap gap-1">
            {letters.map((L) => (
              <a
                key={L}
                href={`#letra-${L}`}
                className="w-8 h-8 rounded text-xs font-bold border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary flex items-center justify-center"
              >
                {L}
              </a>
            ))}
          </div>
        </div>

        {grouped.map(([L, items]) => (
          <section key={L} id={`letra-${L}`} className="scroll-mt-24">
            <div className="flex items-baseline gap-3 mb-3">
              <h2 className="text-4xl font-display font-bold text-primary">{L}</h2>
              <span className="text-sm text-muted-foreground">{items.length} classe(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {items.map((c) => {
                const count = countByCat.get(c.id) ?? 0;
                return (
                  <div key={c.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">{c.section}</Badge>
                      <div className="text-right">
                        <p className="text-lg font-display font-bold text-primary tabular leading-none">{c.ratePct}%</p>
                        <p className="text-[10px] text-muted-foreground">{c.usefulLifeYears} anos</p>
                      </div>
                    </div>
                    <p className="font-medium text-sm mt-2 leading-snug">{c.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">{c.pgcAccount}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
                      <span className="text-[11px] text-muted-foreground">{c.nature === "corporeo" ? "Corpóreo" : "Incorpóreo"}</span>
                      {count > 0 && <Badge variant="secondary" className="text-[10px]">{count} ativo(s)</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
