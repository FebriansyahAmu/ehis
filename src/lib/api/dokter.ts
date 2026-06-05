// API master/dokter (browser) — profil klinis Dokter = ekstensi 1:1 Pegawai. Tipe DI-REUSE
// dari schema server (`import type` → nol kode server ter-bundle, kontrak FE↔BE selaras).
// Endpoint: /api/v1/master/dokter (+ /:id · /tanpa-profil). Lihat BACKEND-MASTER-SUMBER-DAYA §B.4.
//
// Provisioning (B.10 #4): identitas datang dari Pegawai → tak ada "Tambah" dokter dari nol.
// Alur: cari pegawai profesi-dokter yang BELUM punya profil (listTanpaProfil) → lengkapi
// kredensial klinis (createDokter). Identitas TIDAK dikirim (G4).

import { api } from "@/lib/api/client";
import type {
  CreateDokterInput, UpdateDokterInput,
  DokterDTO, DokterListItemDTO, DokterTanpaProfilDTO,
  SpesialisKode, StatusPraktik,
} from "@/lib/schemas/dokter";

export type {
  DokterDTO, DokterListItemDTO, DokterTanpaProfilDTO,
  CreateDokterInput, UpdateDokterInput, SpesialisKode, StatusPraktik,
};

export interface ListDokterParams {
  q?: string;
  spesialis?: SpesialisKode;
  status?: StatusPraktik;
  cursor?: string;
  limit?: number;
}

/** GET /master/dokter — list/cari dokter (cursor pagination). */
export async function listDokter(
  params: ListDokterParams = {},
  signal?: AbortSignal,
): Promise<{ items: DokterListItemDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<DokterListItemDTO[]>("/master/dokter", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** GET /master/dokter/:id — detail (⋈ identitas Pegawai, NIK masked). */
export async function getDokter(id: string, signal?: AbortSignal): Promise<DokterDTO> {
  const { data } = await api.get<DokterDTO>(`/master/dokter/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** GET /master/dokter/tanpa-profil — pegawai dokter yang belum punya profil (bahan provisioning). */
export async function listTanpaProfil(signal?: AbortSignal): Promise<DokterTanpaProfilDTO[]> {
  const { data } = await api.get<DokterTanpaProfilDTO[]>("/master/dokter/tanpa-profil", { signal });
  return data;
}

/** POST /master/dokter — lengkapi profil klinis untuk pegawai dokter existing (provisioning). */
export async function createDokter(input: CreateDokterInput, signal?: AbortSignal): Promise<DokterDTO> {
  const { data } = await api.post<DokterDTO>("/master/dokter", input, { signal });
  return data;
}

/** PATCH /master/dokter/:id — ubah kredensial klinis (expectedVersion utk guard). */
export async function updateDokter(
  id: string,
  input: UpdateDokterInput,
  signal?: AbortSignal,
): Promise<DokterDTO> {
  const { data } = await api.patch<DokterDTO>(`/master/dokter/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** DELETE /master/dokter/:id?expectedVersion= — soft-delete profil (lepas pointer Pegawai). */
export async function deleteDokter(id: string, expectedVersion: number, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/dokter/${encodeURIComponent(id)}`, { query: { expectedVersion }, signal });
}
