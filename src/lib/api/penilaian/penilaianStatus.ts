// API penilaian status klinis (browser) — tab Penilaian sub-menu Status. Tipe DI-REUSE dari schema
// server. Endpoint: /api/v1/kunjungan/:id/penilaian-status (GET list · POST).

import { api } from "@/lib/api/client";
import type {
  PenilaianStatusInput, PenilaianStatusDTO,
} from "@/lib/schemas/penilaian/penilaianStatus";

export type { PenilaianStatusInput, PenilaianStatusDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/penilaian-status`;

/** GET — riwayat penilaian status klinis per kunjungan (terbaru dulu). */
export async function getPenilaianStatus(kunjunganId: string, signal?: AbortSignal): Promise<PenilaianStatusDTO[]> {
  const { data } = await api.get<PenilaianStatusDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 penilaian status klinis (append-only). */
export async function createPenilaianStatus(
  kunjunganId: string, input: PenilaianStatusInput, signal?: AbortSignal,
): Promise<PenilaianStatusDTO> {
  const { data } = await api.post<PenilaianStatusDTO>(base(kunjunganId), input, { signal });
  return data;
}
