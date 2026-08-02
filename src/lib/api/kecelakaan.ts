// API Data Kecelakaan (browser). Tipe DI-REUSE dari schema server (`import type`).
// Endpoint: /api/v1/kunjungan/:id/kecelakaan.

import { api } from "@/lib/api/client";
import type { UpsertKecelakaanInput, KecelakaanDTO } from "@/lib/schemas/kecelakaan/kecelakaan";

export type { UpsertKecelakaanInput, KecelakaanDTO };

/** GET /kunjungan/:id/kecelakaan — data kecelakaan (null bila belum ada). */
export async function getKecelakaan(kunjunganId: string, signal?: AbortSignal): Promise<KecelakaanDTO | null> {
  const { data } = await api.get<KecelakaanDTO | null>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/kecelakaan`,
    { signal },
  );
  return data;
}

/** POST /kunjungan/:id/kecelakaan — simpan/ganti data kecelakaan (upsert). */
export async function saveKecelakaan(
  kunjunganId: string,
  input: UpsertKecelakaanInput,
  signal?: AbortSignal,
): Promise<{ data: KecelakaanDTO; message?: string }> {
  const r = await api.post<KecelakaanDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/kecelakaan`,
    input,
    { signal },
  );
  return { data: r.data, message: r.message };
}
