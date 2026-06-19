// API inventory/transfer (browser) — Transfer antar lokasi farmasi. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/inventory/transfers (+ /:id, /:id/post, /:id/cancel).

import { api } from "@/lib/api/client";
import type {
  CreateStockTransferInput, StockTransferQuery, StockTransferDTO,
} from "@/lib/schemas/inventory/transfer";

export type { CreateStockTransferInput, StockTransferQuery, StockTransferDTO };

export interface TransferListPage {
  items: StockTransferDTO[];
  cursor: string | null;
}

/** GET /inventory/transfers — list terfilter + cursor. */
export async function listTransfers(query: StockTransferQuery = {}, signal?: AbortSignal): Promise<TransferListPage> {
  const { data, meta } = await api.get<StockTransferDTO[]>("/inventory/transfers", {
    query: { q: query.q, status: query.status, fromLocationId: query.fromLocationId, toLocationId: query.toLocationId, cursor: query.cursor, limit: query.limit },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** GET /inventory/transfers/:id — detail. */
export async function getTransfer(id: string, signal?: AbortSignal): Promise<StockTransferDTO> {
  const { data } = await api.get<StockTransferDTO>(`/inventory/transfers/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** POST /inventory/transfers — buat draft (reservasi sumber). */
export async function createTransfer(input: CreateStockTransferInput, signal?: AbortSignal): Promise<StockTransferDTO> {
  const { data } = await api.post<StockTransferDTO>("/inventory/transfers", input, { signal });
  return data;
}

/** POST /inventory/transfers/:id/post — posting → movement TRANSFER (sumber − / tujuan +). */
export async function postTransfer(id: string, signal?: AbortSignal): Promise<StockTransferDTO> {
  const { data } = await api.post<StockTransferDTO>(`/inventory/transfers/${encodeURIComponent(id)}/post`, {}, { signal });
  return data;
}

/** POST /inventory/transfers/:id/cancel — batalkan draft (lepas reservasi). */
export async function cancelTransfer(id: string, signal?: AbortSignal): Promise<StockTransferDTO> {
  const { data } = await api.post<StockTransferDTO>(`/inventory/transfers/${encodeURIComponent(id)}/cancel`, {}, { signal });
  return data;
}
