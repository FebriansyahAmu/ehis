// API pemeriksaan fisik (browser) — tab Pemeriksaan. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/pemeriksaan-fisik (GET riwayat · POST append).

import { api } from "@/lib/api/client";
import type {
  PemeriksaanFisikInput, PemeriksaanFisikDTO,
} from "@/lib/schemas/pemeriksaan/pemeriksaanFisik";

export type { PemeriksaanFisikInput, PemeriksaanFisikDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/pemeriksaan-fisik`;

/** GET — riwayat pemeriksaan fisik per kunjungan (terbaru dulu). */
export async function getPemeriksaanFisik(kunjunganId: string, signal?: AbortSignal): Promise<PemeriksaanFisikDTO[]> {
  const { data } = await api.get<PemeriksaanFisikDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 pemeriksaan fisik (append-only). */
export async function createPemeriksaanFisik(
  kunjunganId: string, input: PemeriksaanFisikInput, signal?: AbortSignal,
): Promise<PemeriksaanFisikDTO> {
  const { data } = await api.post<PemeriksaanFisikDTO>(base(kunjunganId), input, { signal });
  return data;
}
