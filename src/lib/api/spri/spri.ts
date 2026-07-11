// API spri (browser) — worklist admisi Rawat Inap (SPRI). Tipe DI-REUSE dari schema.
// Endpoint: GET /api/v1/spri · PATCH /spri/:id/revisi · POST /spri/:id/konsumsi.

import { api } from "@/lib/api/client";
import type { SpriDTO, SpriQuery, SpriStatus, EditSpriInput, CreateSpriInput } from "@/lib/schemas/disposisi/disposisi";

export type { SpriDTO, SpriQuery, SpriStatus, EditSpriInput, CreateSpriInput };

/** GET — worklist admisi (default belum dikonsumsi: MenungguRef + Terbit). */
export async function listSpri(query: SpriQuery = {}, signal?: AbortSignal): Promise<SpriDTO[]> {
  const { data } = await api.get<SpriDTO[]>("/spri", { query: { status: query.status }, signal });
  return data;
}

/** POST — buat SPRI mandiri dari worklist admisi (rawat inap terencana). No. Referensi terbit server. */
export async function createSpri(input: CreateSpriInput, signal?: AbortSignal): Promise<SpriDTO> {
  const { data } = await api.post<SpriDTO>("/spri", input, { signal });
  return data;
}

/** GET — riwayat SPRI pasien (dari kunjungan konteks; semua status, terbaru dulu). Gate klinis. */
export async function listSpriRiwayat(kunjunganId: string, signal?: AbortSignal): Promise<SpriDTO[]> {
  const { data } = await api.get<SpriDTO[]>(`/kunjungan/${encodeURIComponent(kunjunganId)}/spri`, { signal });
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

/** PATCH — revisi konten SPRI (kirim UpdateSPRI ke BPJS bila sudah ada No. Referensi). */
export async function editSpri(id: string, input: EditSpriInput, signal?: AbortSignal): Promise<SpriDTO> {
  const { data } = await api.patch<SpriDTO>(`/spri/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE — batalkan SPRI (kirim DeleteSPRI ke BPJS bila sudah ada No. Referensi). */
export async function cancelSpri(id: string, signal?: AbortSignal): Promise<SpriDTO> {
  const { data } = await api.del<SpriDTO>(`/spri/${encodeURIComponent(id)}`, { signal });
  return data;
}
