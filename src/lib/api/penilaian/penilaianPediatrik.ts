// API penilaian pediatrik (browser) — tab Penilaian sub-menu Pediatrik. Tipe DI-REUSE dari schema
// server. Endpoint: /api/v1/kunjungan/:id/penilaian-pediatrik (GET list · POST).

import { api } from "@/lib/api/client";
import type {
  PenilaianPediatrikInput, PenilaianPediatrikDTO,
} from "@/lib/schemas/penilaian/penilaianPediatrik";

export type { PenilaianPediatrikInput, PenilaianPediatrikDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/penilaian-pediatrik`;

/** GET — riwayat penilaian pediatrik per kunjungan (terbaru dulu). */
export async function getPenilaianPediatrik(kunjunganId: string, signal?: AbortSignal): Promise<PenilaianPediatrikDTO[]> {
  const { data } = await api.get<PenilaianPediatrikDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 penilaian pediatrik (append-only). */
export async function createPenilaianPediatrik(
  kunjunganId: string, input: PenilaianPediatrikInput, signal?: AbortSignal,
): Promise<PenilaianPediatrikDTO> {
  const { data } = await api.post<PenilaianPediatrikDTO>(base(kunjunganId), input, { signal });
  return data;
}
