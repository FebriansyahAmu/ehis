// API Surat Keterangan Sakit (browser) — tab Surat & Dokumen. Tipe DI-REUSE dari schema
// server. Endpoint: /api/v1/kunjungan/:id/surat-sakit
//   GET daftar aktif · POST terbitkan · DELETE /:itemId batalkan (soft-delete).

import { api } from "@/lib/api/client";
import type { SuratSakitInput, SuratSakitDTO } from "@/lib/schemas/suratSakit/suratSakit";

export type { SuratSakitInput, SuratSakitDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/surat-sakit`;

/** GET — daftar surat keterangan sakit aktif (terbaru dulu). */
export async function listSuratSakit(
  kunjunganId: string, signal?: AbortSignal,
): Promise<SuratSakitDTO[]> {
  const { data } = await api.get<SuratSakitDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — terbitkan surat (nomor auto; tglSelesai di-hitung server). */
export async function createSuratSakit(
  kunjunganId: string, input: SuratSakitInput, signal?: AbortSignal,
): Promise<SuratSakitDTO> {
  const { data } = await api.post<SuratSakitDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** DELETE — batalkan surat (soft-delete). */
export async function deleteSuratSakit(
  kunjunganId: string, itemId: string, signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
