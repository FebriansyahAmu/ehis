// API master/paket-layanan (browser) — Master Paket Layanan (katalog bundel).
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/master/paket-layanan (+ /:id) +
// konsumen /paket-layanan-tersedia (gate registration.kunjungan:read). Pola paralel tarifKamar.ts.

import { api } from "@/lib/api/client";
import type { CreatePaketInput, UpdatePaketInput, PaketDTO } from "@/lib/schemas/master/paketLayanan";

export type { CreatePaketInput, UpdatePaketInput, PaketDTO };

export interface ListPaketParams {
  q?: string;
  kategori?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/paket-layanan — list/filter (cursor pagination). Gate master.katalog. */
export async function listPaketLayanan(
  params: ListPaketParams = {},
  signal?: AbortSignal,
): Promise<{ items: PaketDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<PaketDTO[]>("/master/paket-layanan", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** GET /master/paket-layanan-tersedia — paket AKTIF utk KONSUMSI (gate registration.kunjungan:read,
 *  bukan master.katalog). Dipakai registrasi → Ubah Paket → Paket Layanan. */
export async function listPaketLayananTersedia(signal?: AbortSignal): Promise<PaketDTO[]> {
  const { data } = await api.get<PaketDTO[]>("/master/paket-layanan-tersedia", { signal });
  return data;
}

/** POST /master/paket-layanan — tambah paket (kode auto PKT-NNNN). */
export async function createPaketLayanan(input: CreatePaketInput, signal?: AbortSignal): Promise<PaketDTO> {
  const { data } = await api.post<PaketDTO>("/master/paket-layanan", input, { signal });
  return data;
}

/** PATCH /master/paket-layanan/:id — ubah parsial. */
export async function updatePaketLayanan(id: string, input: UpdatePaketInput, signal?: AbortSignal): Promise<PaketDTO> {
  const { data } = await api.patch<PaketDTO>(`/master/paket-layanan/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE /master/paket-layanan/:id — soft-delete. */
export async function deletePaketLayanan(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/paket-layanan/${encodeURIComponent(id)}`, { signal });
}
