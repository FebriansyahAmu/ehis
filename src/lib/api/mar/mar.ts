// API MAR (browser) — tab MAR RI. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/mar (GET agregat · POST catat pemberian).

import { api } from "@/lib/api/client";
import type { MarEntryInput, MarDTO, MarObatDTO, MarEntryDTO } from "@/lib/schemas/mar/mar";

export type { MarEntryInput, MarDTO, MarObatDTO, MarEntryDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/mar`;

/** GET — agregat { items (obat dari resep), entries (latest-wins per slot) }. */
export async function getMar(kunjunganId: string, signal?: AbortSignal): Promise<MarDTO> {
  const { data } = await api.get<MarDTO>(base(kunjunganId), { signal });
  return data;
}

/** POST — catat 1 pemberian obat (koreksi = kirim ulang slot sama). */
export async function addMarEntry(kunjunganId: string, input: MarEntryInput, signal?: AbortSignal): Promise<MarEntryDTO> {
  const { data } = await api.post<MarEntryDTO>(base(kunjunganId), input, { signal });
  return data;
}
