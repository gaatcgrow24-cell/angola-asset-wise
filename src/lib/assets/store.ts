import { useCallback, useEffect, useState } from "react";
import type { Asset } from "./types";
import { DEPRECIATION_CATEGORIES } from "./depreciation-table";

const STORAGE_KEY = "imob.assets.v2";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function seed(): Asset[] {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const mk = (m: number, d = 1) => {
    const dt = new Date(today.getUTCFullYear(), today.getUTCMonth() - m, d);
    return iso(dt);
  };
  return [
    {
      id: uuid(),
      code: "IMB-0001",
      description: "Computador Portátil Dell Latitude",
      nature: "corporeo",
      categoryId: "g-3-1",
      caeSection: "K",
      acquisitionDate: mk(14),
      inServiceDate: mk(14),
      acquisitionValue: 850000,
      residualValue: 50000,
      impairmentLoss: 0,
      status: "ativo",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      code: "IMB-0002",
      description: "Viatura Ligeira Toyota Hilux",
      nature: "corporeo",
      categoryId: "g-4-1-2",
      caeSection: "I",
      acquisitionDate: mk(8),
      inServiceDate: mk(7),
      acquisitionValue: 18500000,
      residualValue: 1500000,
      impairmentLoss: 0,
      status: "ativo",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      code: "IMB-0003",
      description: "Licença ERP — Software de Gestão (I&D / Propriedade Industrial)",
      nature: "incorporeo",
      categoryId: "n-1",
      caeSection: "K",
      acquisitionDate: mk(4),
      inServiceDate: mk(4),
      acquisitionValue: 3200000,
      residualValue: 0,
      impairmentLoss: 0,
      status: "ativo",
      createdAt: new Date().toISOString(),
    },
    {
      id: uuid(),
      code: "IMB-0004",
      description: "Edifício Sede — Luanda",
      nature: "corporeo",
      categoryId: "g-1-3",
      caeSection: "K",
      acquisitionDate: mk(30),
      inServiceDate: mk(28),
      acquisitionValue: 245000000,
      residualValue: 25000000,
      impairmentLoss: 0,
      status: "ativo",
      createdAt: new Date().toISOString(),
    },
  ];
}

function load(): Asset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as Asset[];
  } catch {
    return [];
  }
}

function save(assets: Asset[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

let listeners: Array<() => void> = [];
function emit() {
  listeners.forEach((l) => l());
}

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAssets(load());
    setReady(true);
    const l = () => setAssets(load());
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  const create = useCallback(
    (input: Omit<Asset, "id" | "createdAt" | "status" | "impairmentLoss"> & {
      impairmentLoss?: number;
    }) => {
      const current = load();
      const asset: Asset = {
        ...input,
        impairmentLoss: input.impairmentLoss ?? 0,
        id: uuid(),
        status: "ativo",
        createdAt: new Date().toISOString(),
      };
      const next = [...current, asset];
      save(next);
      emit();
      return asset;
    },
    [],
  );

  const update = useCallback((id: string, patch: Partial<Asset>) => {
    const current = load();
    const next = current.map((a) => (a.id === id ? { ...a, ...patch } : a));
    save(next);
    emit();
  }, []);

  const remove = useCallback((id: string) => {
    const next = load().filter((a) => a.id !== id);
    save(next);
    emit();
  }, []);

  const dispose = useCallback(
    (id: string, disposalDate: string, disposalValue: number, note: string) => {
      const current = load();
      const next = current.map((a) =>
        a.id === id
          ? {
              ...a,
              status:
                disposalValue > 0
                  ? ("alienado" as const)
                  : ("abatido" as const),
              disposalDate,
              disposalValue,
              disposalNote: note,
            }
          : a,
      );
      save(next);
      emit();
    },
    [],
  );

  return { assets, ready, create, update, remove, dispose, categories: DEPRECIATION_CATEGORIES };
}

export function nextCode(assets: Asset[]): string {
  const max = assets
    .map((a) => parseInt(a.code.replace(/\D/g, ""), 10) || 0)
    .reduce((a, b) => Math.max(a, b), 0);
  return `IMB-${String(max + 1).padStart(4, "0")}`;
}
