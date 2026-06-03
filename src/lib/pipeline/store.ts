import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PipelineEntry, OrderStatus, QuotationStatus } from "./types";

// Row shape (snake_case) in Supabase
interface PipelineRow {
  id: string;
  client: string;
  description: string;
  job_id: string;
  request_id: string | null;
  request_link: string | null;
  request_at: string | null;
  quotation_number: string | null;
  quotation_date: string | null;
  quotation_value_aoa: number | string | null;
  payment_terms: string | null;
  incoterms: string | null;
  quotation_status: string;
  order_number: string | null;
  order_content: string | null;
  order_date: string | null;
  order_value_aoa: number | string | null;
  order_payment_terms: string | null;
  order_status: string;
  remarks: string | null;
  archived: boolean | null;
  created_at: string;
  updated_at: string;
}

const TABLE = "pipeline_entries";
// Untyped client (types.ts is regenerated async; cast to keep TS happy now).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

function fromRow(r: PipelineRow): PipelineEntry {
  return {
    id: r.id,
    client: r.client,
    description: r.description,
    jobId: r.job_id,
    requestId: r.request_id ?? "",
    requestLink: r.request_link ?? undefined,
    requestAt: r.request_at ?? undefined,
    quotationNumber: r.quotation_number ?? undefined,
    quotationDate: r.quotation_date ?? undefined,
    quotationValueAoa: r.quotation_value_aoa == null ? undefined : Number(r.quotation_value_aoa),
    paymentTerms: r.payment_terms ?? undefined,
    incoterms: r.incoterms ?? undefined,
    quotationStatus: (r.quotation_status as QuotationStatus) ?? "nao_emitido",
    orderNumber: r.order_number ?? undefined,
    orderContent: r.order_content ?? undefined,
    orderDate: r.order_date ?? undefined,
    orderValueAoa: r.order_value_aoa == null ? undefined : Number(r.order_value_aoa),
    orderPaymentTerms: r.order_payment_terms ?? undefined,
    orderStatus: (r.order_status as OrderStatus) ?? "nao_emitido",
    remarks: r.remarks ?? undefined,
    archived: r.archived ?? false,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toRow(e: Partial<PipelineEntry>): Partial<PipelineRow> {
  const row: Partial<PipelineRow> = {};
  if (e.client !== undefined) row.client = e.client;
  if (e.description !== undefined) row.description = e.description;
  if (e.jobId !== undefined) row.job_id = e.jobId;
  if (e.requestId !== undefined) row.request_id = e.requestId || null;
  if (e.requestLink !== undefined) row.request_link = e.requestLink || null;
  if (e.requestAt !== undefined) row.request_at = e.requestAt || null;
  if (e.quotationNumber !== undefined) row.quotation_number = e.quotationNumber || null;
  if (e.quotationDate !== undefined) row.quotation_date = e.quotationDate || null;
  if (e.quotationValueAoa !== undefined) row.quotation_value_aoa = e.quotationValueAoa ?? null;
  if (e.paymentTerms !== undefined) row.payment_terms = e.paymentTerms || null;
  if (e.incoterms !== undefined) row.incoterms = e.incoterms || null;
  if (e.quotationStatus !== undefined) row.quotation_status = e.quotationStatus;
  if (e.orderNumber !== undefined) row.order_number = e.orderNumber || null;
  if (e.orderContent !== undefined) row.order_content = e.orderContent || null;
  if (e.orderDate !== undefined) row.order_date = e.orderDate || null;
  if (e.orderValueAoa !== undefined) row.order_value_aoa = e.orderValueAoa ?? null;
  if (e.orderPaymentTerms !== undefined) row.order_payment_terms = e.orderPaymentTerms || null;
  if (e.orderStatus !== undefined) row.order_status = e.orderStatus;
  if (e.remarks !== undefined) row.remarks = e.remarks || null;
  if (e.archived !== undefined) row.archived = e.archived;
  return row;
}

async function fetchAll(): Promise<PipelineEntry[]> {
  const { data, error } = await sb
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[pipeline] fetch error", error);
    return [];
  }
  return ((data ?? []) as PipelineRow[]).map(fromRow);
}

export function usePipeline() {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const list = await fetchAll();
    setEntries(list);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    const h = () => void refresh();
    if (typeof window !== "undefined") {
      window.addEventListener("pipeline:changed", h);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("pipeline:changed", h);
      }
    };
  }, [refresh]);

  const notify = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pipeline:changed"));
    }
  };

  const create = useCallback(
    async (data: Omit<PipelineEntry, "id" | "createdAt" | "updatedAt">) => {
      const { data: inserted, error } = await sb
        .from(TABLE)
        .insert(toRow(data))
        .select()
        .single();
      if (error) {
        console.error("[pipeline] insert error", error);
        throw error;
      }
      notify();
      return fromRow(inserted as PipelineRow);
    },
    [],
  );

  const update = useCallback(async (id: string, patch: Partial<PipelineEntry>) => {
    const { error } = await sb.from(TABLE).update(toRow(patch)).eq("id", id);
    if (error) {
      console.error("[pipeline] update error", error);
      throw error;
    }
    notify();
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await sb.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error("[pipeline] delete error", error);
      throw error;
    }
    notify();
  }, []);

  return { entries, ready, create, update, remove };
}
