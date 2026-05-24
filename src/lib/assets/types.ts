// Domain types for Sistema de Gestão de Ativos Imobilizados
// Conforme PGC Angolano e Decreto Presidencial n.º 207/15

export type AssetNature = "corporeo" | "incorporeo";
export type AssetStatus =
  | "ativo"
  | "em_transito"
  | "abatido"
  | "alienado";

export interface DepreciationCategory {
  id: string;
  nature: AssetNature;
  group: string;
  section: string;
  description: string;
  ratePct: number;
  usefulLifeYears: number;
  pgcAccount: string;
}

export interface Asset {
  id: string;
  code: string;
  description: string;
  nature: AssetNature;
  categoryId: string;
  caeSection: string;
  // Hierarquia organizacional
  branchId: string;
  departmentId?: string;
  locationId?: string;
  inTransitToBranchId?: string;
  // Fiscal
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
