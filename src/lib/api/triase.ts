// API triase (browser). Tipe DI-REUSE dari schema server (`import type`) → kontrak
// FE↔BE selaras. Endpoint: /api/v1/kunjungan/:id/triase (GET terbaru · POST simpan).

import { api } from "@/lib/api/client";
import type { TriaseInput, TriaseDTO } from "@/lib/schemas/triase";

export type { TriaseInput, TriaseDTO };

/** GET /kunjungan/:id/triase — pengkajian triase terbaru (null bila belum ada). */
export async function getTriase(kunjunganId: string, signal?: AbortSignal): Promise<TriaseDTO | null> {
  const { data } = await api.get<TriaseDTO | null>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/triase`,
    { signal },
  );
  return data;
}

/** POST /kunjungan/:id/triase — simpan pengkajian baru (append) + sinkron triaseLevel. */
export async function saveTriase(
  kunjunganId: string,
  input: TriaseInput,
  signal?: AbortSignal,
): Promise<TriaseDTO> {
  const { data } = await api.post<TriaseDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/triase`,
    input,
    { signal },
  );
  return data;
}
