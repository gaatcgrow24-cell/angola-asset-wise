import { useCallback, useEffect, useState } from "react";
import type {
  Branch,
  Department,
  Organization,
  PhysicalLocation,
  Transfer,
} from "./types";

const KEYS = {
  org: "imob.org.v1",
  branches: "imob.branches.v1",
  departments: "imob.departments.v1",
  locations: "imob.locations.v1",
  transfers: "imob.transfers.v1",
  currentBranch: "imob.currentBranch.v1",
};

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

// ===== Seed =====
function seedOrg(): Organization {
  return { id: "org-1", name: "Empresa Demo de Angola, S.A.", taxId: "5417000000" };
}

function seedBranches(): Branch[] {
  return [
    { id: "br-sede", code: "SED", name: "Sede Luanda", type: "sede", province: "Luanda", address: "Rua Rainha Ginga, Luanda", managerName: "Direção-Geral" },
    { id: "br-benguela", code: "BEN", name: "Filial Benguela", type: "filial", province: "Benguela", managerName: "Coord. Benguela" },
    { id: "br-huambo", code: "HBO", name: "Filial Huambo", type: "filial", province: "Huambo", managerName: "Coord. Huambo" },
    { id: "br-lobito", code: "LOB", name: "Delegação Lobito", type: "delegacao", province: "Benguela", managerName: "Resp. Lobito" },
  ];
}

function seedDepartments(): Department[] {
  const departments: Department[] = [];
  for (const br of seedBranches()) {
    departments.push(
      { id: `dep-${br.id}-adm`, branchId: br.id, name: "Administração" },
      { id: `dep-${br.id}-fin`, branchId: br.id, name: "Financeiro" },
      { id: `dep-${br.id}-ti`, branchId: br.id, name: "Tecnologias de Informação" },
      { id: `dep-${br.id}-ops`, branchId: br.id, name: "Operações" },
    );
  }
  return departments;
}

function seedLocations(): PhysicalLocation[] {
  const out: PhysicalLocation[] = [];
  for (const d of seedDepartments()) {
    out.push(
      { id: `loc-${d.id}-1`, departmentId: d.id, name: "Sala Principal" },
      { id: `loc-${d.id}-2`, departmentId: d.id, name: "Armazém" },
    );
  }
  return out;
}

function load<T>(key: string, fallback: () => T): T {
  if (typeof window === "undefined") return fallback();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const v = fallback();
      localStorage.setItem(key, JSON.stringify(v));
      return v;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback();
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

let listeners: Array<() => void> = [];
function emit() {
  listeners.forEach((l) => l());
}

export function useOrg() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<PhysicalLocation[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(() => {
    setOrg(load(KEYS.org, seedOrg));
    setBranches(load(KEYS.branches, seedBranches));
    setDepartments(load(KEYS.departments, seedDepartments));
    setLocations(load(KEYS.locations, seedLocations));
    setTransfers(load(KEYS.transfers, () => [] as Transfer[]));
  }, []);

  useEffect(() => {
    reload();
    setReady(true);
    listeners.push(reload);
    return () => {
      listeners = listeners.filter((l) => l !== reload);
    };
  }, [reload]);

  const createBranch = useCallback((b: Omit<Branch, "id">) => {
    const next = [...load(KEYS.branches, seedBranches), { ...b, id: uuid() }];
    save(KEYS.branches, next);
    emit();
  }, []);

  const createDepartment = useCallback((d: Omit<Department, "id">) => {
    const next = [...load(KEYS.departments, seedDepartments), { ...d, id: uuid() }];
    save(KEYS.departments, next);
    emit();
  }, []);

  const createLocation = useCallback((l: Omit<PhysicalLocation, "id">) => {
    const next = [...load(KEYS.locations, seedLocations), { ...l, id: uuid() }];
    save(KEYS.locations, next);
    emit();
  }, []);

  const createTransfer = useCallback((t: Omit<Transfer, "id" | "status">) => {
    const transfer: Transfer = { ...t, id: uuid(), status: "em_transito" };
    const next = [transfer, ...load(KEYS.transfers, () => [] as Transfer[])];
    save(KEYS.transfers, next);
    emit();
    return transfer;
  }, []);

  const completeTransfer = useCallback(
    (id: string, receivedBy: string, receivedDate: string) => {
      const next = load(KEYS.transfers, () => [] as Transfer[]).map((t) =>
        t.id === id ? { ...t, status: "recebido" as const, receivedBy, receivedDate } : t,
      );
      save(KEYS.transfers, next);
      emit();
    },
    [],
  );

  const cancelTransfer = useCallback((id: string) => {
    const next = load(KEYS.transfers, () => [] as Transfer[]).map((t) =>
      t.id === id ? { ...t, status: "cancelado" as const } : t,
    );
    save(KEYS.transfers, next);
    emit();
  }, []);

  return {
    org,
    branches,
    departments,
    locations,
    transfers,
    ready,
    createBranch,
    createDepartment,
    createLocation,
    createTransfer,
    completeTransfer,
    cancelTransfer,
  };
}

// === Filial Activa (contexto de visualização) ===
// "" = Vista Consolidada (Sede vê tudo).
export function useCurrentBranch() {
  const [branchId, setBranchIdState] = useState<string>("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    setBranchIdState(localStorage.getItem(KEYS.currentBranch) ?? "");
    const l = () =>
      setBranchIdState(localStorage.getItem(KEYS.currentBranch) ?? "");
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);
  const setBranchId = useCallback((id: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEYS.currentBranch, id);
    setBranchIdState(id);
    emit();
  }, []);
  return { branchId, setBranchId };
}
