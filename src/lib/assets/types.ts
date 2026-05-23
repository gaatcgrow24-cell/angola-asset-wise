// Domain types for Sistema de Gestão de Ativos Imobilizados
// Conforme PGC Angolano e Decreto Presidencial n.º 207/15

export type AssetNature = "corporeo" | "incorporeo";
export type AssetStatus = "ativo" | "abatido" | "alienado";

export interface DepreciationCategory {
  id: string;
  nature: AssetNature;
  group: string;            // ex.: "G — Comércio, serviços gerais e elementos comuns"
  section: string;          // ex.: "G 3.1"
  description: string;
  ratePct: number;          // taxa anual %
  usefulLifeYears: number;  // vida útil em anos
  pgcAccount: string;       // conta PGC Classe 4
}

export interface Asset {
  id: string;
  code: string;
  description: string;
  nature: AssetNature;
  categoryId: string;
  caeSection: string;
  acquisitionDate: string;
  inServiceDate: string;
  acquisitionValue: number;
  residualValue: number;
  impairmentLoss: number;
  status: AssetStatus;
  disposalDate?: string;
  disposalValue?: number;
  disposalNote?: string;
  createdAt: string;
}

export interface AssetWithCategory extends Asset {
  category: DepreciationCategory;
}
