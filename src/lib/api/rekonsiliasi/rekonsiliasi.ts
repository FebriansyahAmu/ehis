// API rekonsiliasi (browser) — tab Rekonsiliasi, append-only. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/rekonsiliasi (GET riwayat · POST snapshot).

import { api } from "@/lib/api/client";
import type { RekonsiliasiInput, RekonsiliasiDTO } from "@/lib/schemas/rekonsiliasi/rekonsiliasi";

export type { RekonsiliasiInput, RekonsiliasiDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/rekonsiliasi`;

/** GET — riwayat rekonsiliasi (semua snapshot, terbaru dulu). */
export async function getRekonsiliasi(kunjunganId: string, signal?: AbortSignal): Promise<RekonsiliasiDTO[]> {
  const { data } = await api.get<RekonsiliasiDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — simpan 1 snapshot fase rekonsiliasi (append-only). */
export async function addRekonsiliasi(
  kunjunganId: string,
  input: RekonsiliasiInput,
  signal?: AbortSignal,
): Promise<RekonsiliasiDTO> {
  const { data } = await api.post<RekonsiliasiDTO>(base(kunjunganId), input, { signal });
  return data;
}
