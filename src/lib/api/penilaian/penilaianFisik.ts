// API penilaian fisik (browser) — tab Penilaian sub-menu Fisik. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/penilaian-fisik (GET riwayat · POST append).

import { api } from "@/lib/api/client";
import type {
  PenilaianFisikInput, PenilaianFisikDTO,
} from "@/lib/schemas/penilaian/penilaianFisik";

export type { PenilaianFisikInput, PenilaianFisikDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/penilaian-fisik`;

/** GET — riwayat penilaian fisik per kunjungan (terbaru dulu). */
export async function getPenilaianFisik(kunjunganId: string, signal?: AbortSignal): Promise<PenilaianFisikDTO[]> {
  const { data } = await api.get<PenilaianFisikDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 penilaian fisik (append-only). */
export async function createPenilaianFisik(
  kunjunganId: string, input: PenilaianFisikInput, signal?: AbortSignal,
): Promise<PenilaianFisikDTO> {
  const { data } = await api.post<PenilaianFisikDTO>(base(kunjunganId), input, { signal });
  return data;
}
