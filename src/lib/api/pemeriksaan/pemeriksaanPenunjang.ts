// API pemeriksaan penunjang (browser) — tab Pemeriksaan sub Penunjang. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/pemeriksaan-penunjang (GET list · POST) + /:itemId (DELETE).

import { api } from "@/lib/api/client";
import type {
  PemeriksaanPenunjangInput, PemeriksaanPenunjangDTO,
} from "@/lib/schemas/pemeriksaan/pemeriksaanPenunjang";

export type { PemeriksaanPenunjangInput, PemeriksaanPenunjangDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/pemeriksaan-penunjang`;

/** GET — daftar hasil penunjang aktif per kunjungan (terbaru dulu). */
export async function getPemeriksaanPenunjang(kunjunganId: string, signal?: AbortSignal): Promise<PemeriksaanPenunjangDTO[]> {
  const { data } = await api.get<PemeriksaanPenunjangDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 hasil penunjang. */
export async function createPemeriksaanPenunjang(
  kunjunganId: string, input: PemeriksaanPenunjangInput, signal?: AbortSignal,
): Promise<PemeriksaanPenunjangDTO> {
  const { data } = await api.post<PemeriksaanPenunjangDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** DELETE — soft-delete (hapus hasil penunjang). */
export async function deletePemeriksaanPenunjang(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
