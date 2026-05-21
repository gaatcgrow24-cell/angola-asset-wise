import type { DepreciationCategory } from "./types";

// Tabela nativa de taxas de amortização — Decreto Presidencial n.º 207/15
// (Excerto representativo. Pode ser expandido conforme necessidade.)
export const DEPRECIATION_CATEGORIES: DepreciationCategory[] = [
  // === INCORPÓREOS — Secção N ===
  {
    id: "n-investigacao",
    nature: "incorporeo",
    section: "N",
    description: "Despesas de investigação e desenvolvimento",
    ratePct: 20,
    usefulLifeYears: 5,
    pgcAccount: "431 — Despesas de Investigação e Desenvolvimento",
  },
  {
    id: "n-patentes",
    nature: "incorporeo",
    section: "N",
    description: "Patentes, marcas e propriedade industrial",
    ratePct: 20,
    usefulLifeYears: 5,
    pgcAccount: "432 — Propriedade Industrial",
  },
  {
    id: "n-software",
    nature: "incorporeo",
    section: "N",
    description: "Software e licenças informáticas",
    ratePct: 33.33,
    usefulLifeYears: 3,
    pgcAccount: "433 — Software",
  },
  {
    id: "n-trespasse",
    nature: "incorporeo",
    section: "N",
    description: "Trespasse / Goodwill",
    ratePct: 10,
    usefulLifeYears: 10,
    pgcAccount: "434 — Trespasses",
  },

  // === CORPÓREOS — Secção G ===
  // Edifícios
  {
    id: "g-1-3",
    nature: "corporeo",
    section: "G 1.3",
    description: "Edifícios Comerciais e Administrativos",
    ratePct: 4,
    usefulLifeYears: 25,
    pgcAccount: "421 — Edifícios e Outras Construções",
  },
  {
    id: "g-1-1",
    nature: "corporeo",
    section: "G 1.1",
    description: "Edifícios Industriais",
    ratePct: 5,
    usefulLifeYears: 20,
    pgcAccount: "421 — Edifícios e Outras Construções",
  },
  // Equipamento de informática
  {
    id: "g-3-1",
    nature: "corporeo",
    section: "G 3.1",
    description: "Computadores e Equipamentos de Informática",
    ratePct: 33.33,
    usefulLifeYears: 3,
    pgcAccount: "424 — Equipamento Básico",
  },
  {
    id: "g-3-4",
    nature: "corporeo",
    section: "G 3.4",
    description: "Impressoras e periféricos",
    ratePct: 33.33,
    usefulLifeYears: 3,
    pgcAccount: "424 — Equipamento Básico",
  },
  // Viaturas
  {
    id: "g-4-1-2",
    nature: "corporeo",
    section: "G 4.1.2",
    description: "Viaturas Ligeiras de Passageiros",
    ratePct: 25,
    usefulLifeYears: 4,
    pgcAccount: "425 — Equipamento de Transporte",
  },
  {
    id: "g-4-1-3",
    nature: "corporeo",
    section: "G 4.1.3",
    description: "Viaturas Pesadas de Mercadorias",
    ratePct: 20,
    usefulLifeYears: 5,
    pgcAccount: "425 — Equipamento de Transporte",
  },
  // Mobiliário
  {
    id: "g-5-1",
    nature: "corporeo",
    section: "G 5.1",
    description: "Mobiliário e Equipamento Administrativo",
    ratePct: 10,
    usefulLifeYears: 10,
    pgcAccount: "426 — Equipamento Administrativo",
  },
  // Equipamento básico geral
  {
    id: "g-2-1",
    nature: "corporeo",
    section: "G 2.1",
    description: "Máquinas e Equipamento Industrial",
    ratePct: 12.5,
    usefulLifeYears: 8,
    pgcAccount: "424 — Equipamento Básico",
  },
];

// Setores de Atividade Económica (CAE) — exemplos representativos
export const CAE_SECTIONS: { code: string; label: string }[] = [
  { code: "A", label: "A — Agricultura, produção animal, caça e silvicultura" },
  { code: "B", label: "B — Pesca" },
  { code: "C", label: "C — Indústrias extractivas" },
  { code: "D", label: "D — Indústrias transformadoras" },
  { code: "E", label: "E — Electricidade, gás e água" },
  { code: "F", label: "F — Construção" },
  { code: "G", label: "G — Comércio por grosso e a retalho" },
  { code: "H", label: "H — Alojamento e restauração" },
  { code: "I", label: "I — Transportes, armazenagem e comunicações" },
  { code: "J", label: "J — Actividades financeiras" },
  { code: "K", label: "K — Actividades imobiliárias, alugueres e serviços às empresas" },
  { code: "L", label: "L — Administração pública, defesa e segurança social" },
  { code: "M", label: "M — Educação" },
  { code: "N", label: "N — Saúde e acção social" },
  { code: "O", label: "O — Outras actividades de serviços colectivos" },
];

export function getCategory(id: string): DepreciationCategory | undefined {
  return DEPRECIATION_CATEGORIES.find((c) => c.id === id);
}
