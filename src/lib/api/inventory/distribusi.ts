// API inventory/distribusi (browser) — Distribusi/amprahan. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/inventory/distribusi (+ /:id, /:id/fulfill, /:id/cancel).

import { api } from "@/lib/api/client";
import type {
  CreateDistribusiInput, DistribusiQuery, DistribusiDTO,
} from "@/lib/schemas/inventory/distribusi";

export type { CreateDistribusiInput, DistribusiQuery, DistribusiDTO };

export interface DistribusiListPage {
  items: DistribusiDTO[];
  cursor: string | null;
}

/** GET /inventory/distribusi — list terfilter + cursor. */
export async function listDistribusi(query: DistribusiQuery = {}, signal?: AbortSignal): Promise<DistribusiListPage> {
  const { data, meta } = await api.get<DistribusiDTO[]>("/inventory/distribusi", {
    query: { q: query.q, status: query.status, fromLocationId: query.fromLocationId, toLocationId: query.toLocationId, cursor: query.cursor, limit: query.limit },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** GET /inventory/distribusi/:id — detail. */
export async function getDistribusi(id: string, signal?: AbortSignal): Promise<DistribusiDTO> {
  const { data } = await api.get<DistribusiDTO>(`/inventory/distribusi/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** POST /inventory/distribusi — buat draft (reservasi sumber). */
export async function createDistribusi(input: CreateDistribusiInput, signal?: AbortSignal): Promise<DistribusiDTO> {
  const { data } = await api.post<DistribusiDTO>("/inventory/distribusi", input, { signal });
  return data;
}

/** POST /inventory/distribusi/:id/fulfill — penuhi → movement TRANSFER + isi qtyKeluar. */
export async function fulfillDistribusi(id: string, signal?: AbortSignal): Promise<DistribusiDTO> {
  const { data } = await api.post<DistribusiDTO>(`/inventory/distribusi/${encodeURIComponent(id)}/fulfill`, {}, { signal });
  return data;
}

/** POST /inventory/distribusi/:id/cancel — batalkan draft (lepas reservasi). */
export async function cancelDistribusi(id: string, signal?: AbortSignal): Promise<DistribusiDTO> {
  const { data } = await api.post<DistribusiDTO>(`/inventory/distribusi/${encodeURIComponent(id)}/cancel`, {}, { signal });
  return data;
}
