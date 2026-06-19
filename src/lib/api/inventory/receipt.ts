// API inventory/receipt (browser) — Penerimaan (GoodsReceipt). Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/inventory/receipts (+ /:id, /:id/post).

import { api } from "@/lib/api/client";
import type {
  CreateGoodsReceiptInput, GoodsReceiptQuery, GoodsReceiptDTO,
} from "@/lib/schemas/inventory/receipt";

export type { CreateGoodsReceiptInput, GoodsReceiptQuery, GoodsReceiptDTO };

export interface ReceiptListPage {
  items: GoodsReceiptDTO[];
  cursor: string | null;
}

/** GET /inventory/receipts — list terfilter + cursor. */
export async function listReceipts(query: GoodsReceiptQuery = {}, signal?: AbortSignal): Promise<ReceiptListPage> {
  const { data, meta } = await api.get<GoodsReceiptDTO[]>("/inventory/receipts", {
    query: { q: query.q, status: query.status, vendorId: query.vendorId, locationId: query.locationId, cursor: query.cursor, limit: query.limit },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** GET /inventory/receipts/:id — detail. */
export async function getReceipt(id: string, signal?: AbortSignal): Promise<GoodsReceiptDTO> {
  const { data } = await api.get<GoodsReceiptDTO>(`/inventory/receipts/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** POST /inventory/receipts — buat draft penerimaan. */
export async function createReceipt(input: CreateGoodsReceiptInput, signal?: AbortSignal): Promise<GoodsReceiptDTO> {
  const { data } = await api.post<GoodsReceiptDTO>("/inventory/receipts", input, { signal });
  return data;
}

/** POST /inventory/receipts/:id/post — posting → stok bertambah (movement IN). */
export async function postReceipt(id: string, signal?: AbortSignal): Promise<GoodsReceiptDTO> {
  const { data } = await api.post<GoodsReceiptDTO>(`/inventory/receipts/${encodeURIComponent(id)}/post`, {}, { signal });
  return data;
}
