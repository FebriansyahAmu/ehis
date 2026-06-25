// API spri (browser) — worklist admisi Rawat Inap (SPRI). Tipe DI-REUSE dari schema.
// Endpoint: GET /api/v1/spri · PATCH /spri/:id/revisi · POST /spri/:id/konsumsi.

import { api } from "@/lib/api/client";
import type { SpriDTO, SpriQuery, SpriStatus } from "@/lib/schemas/disposisi/disposisi";

export type { SpriDTO, SpriQuery, SpriStatus };

/** GET — worklist admisi (default belum dikonsumsi: MenungguRef + Terbit). */
export async function listSpri(query: SpriQuery = {}, signal?: AbortSignal): Promise<SpriDTO[]> {
  const { data } = await api.get<SpriDTO[]>("/spri", { query: { status: query.status }, signal });
  return data;
}

/** PATCH — revisi & kirim ulang ke BPJS (retry No. Referensi). */
export async function reviseSpri(id: string, signal?: AbortSignal): Promise<SpriDTO> {
  const { data } = await api.patch<SpriDTO>(`/spri/${encodeURIComponent(id)}/revisi`, {}, { signal });
  return data;
}

/** POST — konsumsi SPRI (tautkan kunjungan Rawat Inap hasil admisi). */
export async function consumeSpri(id: string, riKunjunganId: string, signal?: AbortSignal): Promise<SpriDTO> {
  const { data } = await api.post<SpriDTO>(`/spri/${encodeURIComponent(id)}/konsumsi`, { riKunjunganId }, { signal });
  return data;
}
