// Domain types for Sistema de Gestão de Ativos Imobilizados
// Conforme PGC Angolano e Decreto Presidencial n.º 207/15

export type AssetNature = "corporeo" | "incorporeo";
export type AssetStatus = "ativo" | "abatido" | "alienado";

export interface DepreciationCategory {
  id: string;
  nature: AssetNature;
  section: string;          // ex.: "G 3.1"
  description: string;
  ratePct: number;          // taxa anual %
  usefulLifeYears: number;  // vida útil em anos
  pgcAccount: string;       // conta PGC Classe 1
}

export interface Asset {
  id: string;               // UUID interno
  code: string;             // Código Único (Imobilizado ID)
  description: string;
  nature: AssetNature;
  categoryId: string;
  caeSection: string;       // Setor Atividade Económica (CAE)
  acquisitionDate: string;  // ISO YYYY-MM-DD
  inServiceDate: string;    // Data de entrada em funcionamento
  acquisitionValue: number; // Kz
  residualValue: number;    // Kz
  impairmentLoss: number;   // Perdas por imparidade acumuladas
  status: AssetStatus;
  // Para abate/alienação
  disposalDate?: string;
  disposalValue?: number;
  disposalNote?: string;
  createdAt: string;
}

export interface AssetWithCategory extends Asset {
  category: DepreciationCategory;
}
