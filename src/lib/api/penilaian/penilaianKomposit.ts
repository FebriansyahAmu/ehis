// API penilaian komposit (browser) — tab Penilaian sub-menu Jantung / Kanker. Tipe DI-REUSE dari
// schema server. Endpoint: /api/v1/kunjungan/:id/penilaian-komposit (GET list?jenis= · POST).

import { api } from "@/lib/api/client";
import type {
  PenilaianKompositInput, PenilaianKompositDTO,
} from "@/lib/schemas/penilaian/penilaianKomposit";

export type { PenilaianKompositInput, PenilaianKompositDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/penilaian-komposit`;

/** GET — riwayat penilaian komposit per kunjungan (filter jenis, terbaru dulu). */
export async function getPenilaianKomposit(
  kunjunganId: string, jenis: "Jantung" | "Kanker", signal?: AbortSignal,
): Promise<PenilaianKompositDTO[]> {
  const { data } = await api.get<PenilaianKompositDTO[]>(
    `${base(kunjunganId)}?jenis=${encodeURIComponent(jenis)}`, { signal },
  );
  return data;
}

/** POST — tambah 1 penilaian komposit (append-only snapshot). */
export async function createPenilaianKomposit(
  kunjunganId: string, input: PenilaianKompositInput, signal?: AbortSignal,
): Promise<PenilaianKompositDTO> {
  const { data } = await api.post<PenilaianKompositDTO>(base(kunjunganId), input, { signal });
  return data;
}
