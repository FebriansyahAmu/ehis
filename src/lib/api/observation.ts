// API observasi TTV (browser). Tipe DI-REUSE dari schema server (`import type`) →
// kontrak FE↔BE selaras. Endpoint: /api/v1/kunjungan/:id/observasi (GET list · POST catat).

import { api } from "@/lib/api/client";
import type { ObservationInput, ObservationDTO, ObservationVitalSigns } from "@/lib/schemas/observation";

export type { ObservationInput, ObservationDTO, ObservationVitalSigns };

/** GET /kunjungan/:id/observasi — seluruh time-series TTV (terbaru dulu; [] bila kosong). */
export async function listObservasi(kunjunganId: string, signal?: AbortSignal): Promise<ObservationDTO[]> {
  const { data } = await api.get<ObservationDTO[]>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/observasi`,
    { signal },
  );
  return data ?? [];
}

/** POST /kunjungan/:id/observasi — catat satu pengukuran TTV (append). */
export async function recordObservasi(
  kunjunganId: string,
  input: ObservationInput,
  signal?: AbortSignal,
): Promise<ObservationDTO> {
  const { data } = await api.post<ObservationDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/observasi`,
    input,
    { signal },
  );
  return data;
}
