// API master/penugasan-ruangan (browser) — SDM Assignment (Pegawai ⇄ Ruangan). Tipe DI-REUSE
// dari schema server. Endpoint: /api/v1/master/penugasan-ruangan (+ /:id). Lihat §C doc.

import { api } from "@/lib/api/client";
import type { CreatePenugasanInput, PenugasanRuanganDTO } from "@/lib/schemas/penugasanRuangan";

export type { PenugasanRuanganDTO, CreatePenugasanInput };

export interface ListPenugasanParams {
  locationId?: string;
  pegawaiId?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/penugasan-ruangan — list/filter (cursor pagination). */
export async function listPenugasan(
  params: ListPenugasanParams = {},
  signal?: AbortSignal,
): Promise<{ items: PenugasanRuanganDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<PenugasanRuanganDTO[]>("/master/penugasan-ruangan", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** POST /master/penugasan-ruangan — tugaskan pegawai ke ruangan (idempoten). */
export async function createPenugasan(input: CreatePenugasanInput, signal?: AbortSignal): Promise<PenugasanRuanganDTO> {
  const { data } = await api.post<PenugasanRuanganDTO>("/master/penugasan-ruangan", input, { signal });
  return data;
}

/** DELETE /master/penugasan-ruangan/:id — lepas penugasan. */
export async function deletePenugasan(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/penugasan-ruangan/${encodeURIComponent(id)}`, { signal });
}
