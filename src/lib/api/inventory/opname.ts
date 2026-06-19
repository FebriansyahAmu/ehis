// API inventory/opname (browser) — Stok Opname. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/inventory/opname (+ /:id GET·PATCH, /:id/post).

import { api } from "@/lib/api/client";
import type {
  CreateOpnameInput, SaveOpnameCountsInput, OpnameQuery, OpnameDTO,
} from "@/lib/schemas/inventory/opname";

export type { CreateOpnameInput, SaveOpnameCountsInput, OpnameQuery, OpnameDTO };

export interface OpnameListPage {
  items: OpnameDTO[];
  cursor: string | null;
}

/** GET /inventory/opname — list terfilter + cursor. */
export async function listOpname(query: OpnameQuery = {}, signal?: AbortSignal): Promise<OpnameListPage> {
  const { data, meta } = await api.get<OpnameDTO[]>("/inventory/opname", {
    query: { q: query.q, status: query.status, locationId: query.locationId, cursor: query.cursor, limit: query.limit },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** GET /inventory/opname/:id — detail. */
export async function getOpname(id: string, signal?: AbortSignal): Promise<OpnameDTO> {
  const { data } = await api.get<OpnameDTO>(`/inventory/opname/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** POST /inventory/opname — mulai sesi (snapshot saldo lokasi). */
export async function createOpname(input: CreateOpnameInput, signal?: AbortSignal): Promise<OpnameDTO> {
  const { data } = await api.post<OpnameDTO>("/inventory/opname", input, { signal });
  return data;
}

/** PATCH /inventory/opname/:id — simpan hitungan fisik (qtyFisik/alasan). */
export async function saveOpnameCounts(id: string, input: SaveOpnameCountsInput, signal?: AbortSignal): Promise<OpnameDTO> {
  const { data } = await api.patch<OpnameDTO>(`/inventory/opname/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** POST /inventory/opname/:id/post — posting → movement OPNAME per selisih. */
export async function postOpname(id: string, signal?: AbortSignal): Promise<OpnameDTO> {
  const { data } = await api.post<OpnameDTO>(`/inventory/opname/${encodeURIComponent(id)}/post`, {}, { signal });
  return data;
}
