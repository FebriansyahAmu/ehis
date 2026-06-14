// API penilaian nyeri (browser) — tab Penilaian sub-menu Nyeri (asesmen komprehensif).
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/kunjungan/:id/penilaian-nyeri (GET · POST).
// Skor NRS terkini dibaca dari Observation/TTV (lihat lib/api/observation.ts), bukan di sini.

import { api } from "@/lib/api/client";
import type {
  PenilaianNyeriInput, PenilaianNyeriDTO,
} from "@/lib/schemas/penilaian/penilaianNyeri";

export type { PenilaianNyeriInput, PenilaianNyeriDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/penilaian-nyeri`;

/** GET — riwayat asesmen nyeri per kunjungan (terbaru dulu). */
export async function getPenilaianNyeri(kunjunganId: string, signal?: AbortSignal): Promise<PenilaianNyeriDTO[]> {
  const { data } = await api.get<PenilaianNyeriDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 asesmen nyeri (append-only). */
export async function createPenilaianNyeri(
  kunjunganId: string, input: PenilaianNyeriInput, signal?: AbortSignal,
): Promise<PenilaianNyeriDTO> {
  const { data } = await api.post<PenilaianNyeriDTO>(base(kunjunganId), input, { signal });
  return data;
}
