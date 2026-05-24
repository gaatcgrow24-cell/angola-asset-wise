// Modelo organizacional — Sede / Delegações / Filiais Provinciais
// Hierarquia: Organização → Filial → Departamento → Localização Física

export type BranchType = "sede" | "delegacao" | "filial";

export interface Organization {
  id: string;
  name: string;
  taxId: string; // NIF
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  type: BranchType;
  province: string;
  address?: string;
  managerName?: string;
}

export interface Department {
  id: string;
  branchId: string;
  name: string;
}

export interface PhysicalLocation {
  id: string;
  departmentId: string;
  name: string; // ex.: "Sala 201", "Armazém A"
}

export type TransferStatus = "em_transito" | "recebido" | "cancelado";

export interface Transfer {
  id: string;
  assetId: string;
  fromBranchId: string;
  toBranchId: string;
  fromDepartmentId?: string;
  toDepartmentId?: string;
  reason: string;
  sentBy: string;
  sentDate: string;
  receivedBy?: string;
  receivedDate?: string;
  status: TransferStatus;
  note?: string;
}
