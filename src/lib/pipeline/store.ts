import { useCallback, useEffect, useState } from "react";
import type { PipelineEntry } from "./types";

const KEY = "pipeline.entries.v1";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function seed(): PipelineEntry[] {
  const now = new Date().toISOString();
  return [
    {
      id: uuid(),
      client: "AES",
      description: "Recondicionamento de CCUs",
      jobId: "2212301430 AES",
      requestId: "(EMAIL)",
      requestLink: "https://metallum.box.com/s/pqj5pxxz9fbe3pes52r7034u8u0imif7",
      requestAt: "2022-12-30T14:30:00.000Z",
      quotationStatus: "nao_emitido",
      paymentTerms: "Net 30",
      incoterms: "EXW",
      orderNumber: "AES-MTL_CTT01ANX01",
      orderDate: "2023-06-07",
      orderStatus: "nao_emitido",
      remarks: "Acordo de troca de serviços pendente.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      client: "CML",
      description: "Fabricação de Spreader Bar",
      jobId: "2408131106 CML",
      requestId: "(WHATSAPP)",
      requestLink: "https://metallum.app.box.com/file/1620374535811",
      requestAt: "2024-08-13T11:06:00.000Z",
      quotationNumber: "MS24017.PP01",
      quotationDate: "2024-09-11",
      quotationValueAoa: 3125250,
      paymentTerms: "50 / 50",
      incoterms: "DDP",
      quotationStatus: "emitido",
      orderStatus: "nao_emitido",
      remarks: "Falta insistir para pagamento.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      client: "ICO",
      description: "Decapagem e Pintura de Estrutura",
      jobId: "2412302141 ICO",
      requestId: "(EMAIL)",
      requestLink: "https://metallum.box.com/s/uiomezp92k9ph93ts4n7gcra91fktwtt",
      requestAt: "2024-12-30T21:41:00.000Z",
      quotationNumber: "MS24042.Rev1",
      quotationDate: "2024-12-31",
      quotationValueAoa: 2305875,
      paymentTerms: "Net 15",
      incoterms: "EXW",
      quotationStatus: "emitido",
      orderStatus: "nao_emitido",
      remarks: "Emitir factura.",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function load(): PipelineEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as PipelineEntry[];
  } catch {
    return [];
  }
}

function save(list: PipelineEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("pipeline:changed"));
}

export function usePipeline() {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(load());
    setReady(true);
    const h = () => setEntries(load());
    window.addEventListener("pipeline:changed", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("pipeline:changed", h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const create = useCallback((data: Omit<PipelineEntry, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const entry: PipelineEntry = { ...data, id: uuid(), createdAt: now, updatedAt: now };
    save([entry, ...load()]);
    return entry;
  }, []);

  const update = useCallback((id: string, patch: Partial<PipelineEntry>) => {
    const now = new Date().toISOString();
    save(load().map((e) => (e.id === id ? { ...e, ...patch, updatedAt: now } : e)));
  }, []);

  const remove = useCallback((id: string) => {
    save(load().filter((e) => e.id !== id));
  }, []);

  return { entries, ready, create, update, remove };
}
