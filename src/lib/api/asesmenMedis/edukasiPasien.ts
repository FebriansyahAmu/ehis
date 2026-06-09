// API edukasi Pasien & Keluarga (browser). Tipe DI-REUSE dari schema server. Endpoint:
// /api/v1/kunjungan/:id/asesmen/edukasi/pasien (GET riwayat · POST simpan 1 catatan).

import { api } from "@/lib/api/client";
import type { EdukasiPasienInput, EdukasiPasienDTO } from "@/lib/schemas/asesmenMedis/edukasiPasien";

export type { EdukasiPasienInput, EdukasiPasienDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/edukasi/pasien`;

/** GET — riwayat edukasi pasien & keluarga (terbaru dulu). */
export async function getEdukasiPasienList(kunjunganId: string, signal?: AbortSignal): Promise<EdukasiPasienDTO[]> {
  const { data } = await api.get<EdukasiPasienDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — simpan 1 catatan edukasi (append). */
export async function recordEdukasiPasien(
  kunjunganId: string,
  input: EdukasiPasienInput,
  signal?: AbortSignal,
): Promise<EdukasiPasienDTO> {
  const { data } = await api.post<EdukasiPasienDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** DELETE — soft-delete 1 catatan edukasi. */
export async function deleteEdukasiPasien(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
