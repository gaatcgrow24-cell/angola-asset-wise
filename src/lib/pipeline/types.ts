export type QuotationStatus = "nao_emitido" | "emitido";
export type OrderStatus = "nao_emitido" | "emitido";

export interface PipelineEntry {
  id: string;
  // TRABALHO
  client: string;
  description: string;
  jobId: string;
  // PEDIDO DE COTAÇÃO
  requestId: string;
  requestLink?: string;
  requestAt?: string; // ISO datetime
  // COTAÇÃO
  quotationNumber?: string;
  quotationDate?: string; // ISO date
  quotationValueAoa?: number;
  paymentTerms?: string;
  incoterms?: string;
  quotationStatus: QuotationStatus;
  // NOTA DE ENCOMENDA / CONTRATO
  orderNumber?: string;
  orderContent?: string;
  orderDate?: string;
  orderValueAoa?: number;
  orderPaymentTerms?: string;
  orderStatus: OrderStatus;
  // META
  remarks?: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}
