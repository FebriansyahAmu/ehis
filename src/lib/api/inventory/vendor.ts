// API inventory/vendor (browser) — Rekanan. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/inventory/vendors (+ /:id).

import { api } from "@/lib/api/client";
import type {
  CreateVendorInput, UpdateVendorInput, VendorQuery, VendorDTO,
} from "@/lib/schemas/inventory/vendor";

export type { CreateVendorInput, UpdateVendorInput, VendorQuery, VendorDTO };

export interface VendorListPage {
  items: VendorDTO[];
  cursor: string | null;
}

/** GET /inventory/vendors — list terfilter + cursor. */
export async function listVendors(query: VendorQuery = {}, signal?: AbortSignal): Promise<VendorListPage> {
  const { data, meta } = await api.get<VendorDTO[]>("/inventory/vendors", {
    query: { q: query.q, jenis: query.jenis, status: query.status, cursor: query.cursor, limit: query.limit },
    signal,
  });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil semua rekanan (konsumen non-paginasi). */
export async function fetchAllVendors(signal?: AbortSignal): Promise<VendorDTO[]> {
  const { items } = await listVendors({ limit: 300 }, signal);
  return items;
}

/** POST /inventory/vendors — tambah rekanan. */
export async function createVendor(input: CreateVendorInput, signal?: AbortSignal): Promise<VendorDTO> {
  const { data } = await api.post<VendorDTO>("/inventory/vendors", input, { signal });
  return data;
}

/** PATCH /inventory/vendors/:id — ubah rekanan. */
export async function updateVendor(id: string, input: UpdateVendorInput, signal?: AbortSignal): Promise<VendorDTO> {
  const { data } = await api.patch<VendorDTO>(`/inventory/vendors/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE /inventory/vendors/:id — soft-delete rekanan. */
export async function deleteVendor(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/inventory/vendors/${encodeURIComponent(id)}`, { signal });
}
