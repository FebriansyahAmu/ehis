// API master/penugasan-ruangan (browser) — SDM Assignment (Pegawai ⇄ Ruangan). Tipe DI-REUSE
// dari schema server. Endpoint: /api/v1/master/penugasan-ruangan (+ /:id). Lihat §C doc.

import { api } from "@/lib/api/client";
import type { CreatePenugasanInput, PenugasanRuanganDTO, PetugasDTO } from "@/lib/schemas/penugasanRuangan";

export type { PenugasanRuanganDTO, CreatePenugasanInput, PetugasDTO };

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

export interface RuanganSayaDTO {
  locationId: string;
  ruanganKode: string;
  ruanganNama: string;
}

/** GET /master/poli-saya — ruangan tempat user login di-assign (self-scoped, gate klinis). */
export async function listRuanganSaya(signal?: AbortSignal): Promise<RuanganSayaDTO[]> {
  const { data } = await api.get<RuanganSayaDTO[]>("/master/poli-saya", { signal });
  return data;
}

/** GET /kunjungan/:id/petugas — roster petugas ruangan kunjungan (gate kunjungan:read, konsumen klinis). */
export async function listPetugasKunjungan(
  kunjunganId: string,
  profesi?: string,
  signal?: AbortSignal,
): Promise<PetugasDTO[]> {
  const { data } = await api.get<PetugasDTO[]>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/petugas`,
    { query: { profesi }, signal },
  );
  return data;
}
