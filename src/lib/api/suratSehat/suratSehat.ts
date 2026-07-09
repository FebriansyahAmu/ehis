// API Surat Keterangan Sehat (browser) — tab Surat & Dokumen. Tipe DI-REUSE dari schema
// server. Endpoint: /api/v1/kunjungan/:id/surat-sehat
//   GET daftar aktif · POST terbitkan · DELETE /:itemId batalkan (soft-delete).

import { api } from "@/lib/api/client";
import type { SuratSehatInput, SuratSehatDTO } from "@/lib/schemas/suratSehat/suratSehat";

export type { SuratSehatInput, SuratSehatDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/surat-sehat`;

/** GET — daftar surat keterangan sehat aktif (terbaru dulu). */
export async function listSuratSehat(
  kunjunganId: string, signal?: AbortSignal,
): Promise<SuratSehatDTO[]> {
  const { data } = await api.get<SuratSehatDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — terbitkan surat (nomor auto; TTE auto bila Dokter). */
export async function createSuratSehat(
  kunjunganId: string, input: SuratSehatInput, signal?: AbortSignal,
): Promise<SuratSehatDTO> {
  const { data } = await api.post<SuratSehatDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** DELETE — batalkan surat (soft-delete). */
export async function deleteSuratSehat(
  kunjunganId: string, itemId: string, signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
