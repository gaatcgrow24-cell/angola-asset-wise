// Histórico de custódia (responsáveis pelos ativos)
import { useCallback, useEffect, useState } from "react";

export interface CustodyRecord {
  id: string;
  assetId: string;
  custodianName: string;
  taxId?: string;
  startDate: string;
  endDate?: string;
  termSigned: boolean;
  termSignedDate?: string;
  note?: string;
}

const STORAGE_KEY = "imob.custody.v1";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load(): CustodyRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustodyRecord[]) : [];
  } catch {
    return [];
  }
}

function save(records: CustodyRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

let listeners: Array<() => void> = [];
const emit = () => listeners.forEach((l) => l());

export function useCustody() {
  const [records, setRecords] = useState<CustodyRecord[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecords(load());
    setReady(true);
    const l = () => setRecords(load());
    listeners.push(l);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  // Encerra registo activo (se existir) e abre um novo
  const assign = useCallback(
    (input: {
      assetId: string;
      custodianName: string;
      taxId?: string;
      startDate: string;
      termSigned: boolean;
      termSignedDate?: string;
      note?: string;
    }) => {
      const current = load();
      const closed = current.map((r) =>
        r.assetId === input.assetId && !r.endDate
          ? { ...r, endDate: input.startDate }
          : r,
      );
      const record: CustodyRecord = { id: uuid(), ...input };
      const next = [...closed, record];
      save(next);
      emit();
      return record;
    },
    [],
  );

  // Encerra atribuição activa sem abrir nova (ex.: devolução ao stock)
  const release = useCallback((assetId: string, endDate: string) => {
    const next = load().map((r) =>
      r.assetId === assetId && !r.endDate ? { ...r, endDate } : r,
    );
    save(next);
    emit();
  }, []);

  const forAsset = useCallback(
    (assetId: string) =>
      records
        .filter((r) => r.assetId === assetId)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [records],
  );

  return { records, ready, assign, release, forAsset };
}
