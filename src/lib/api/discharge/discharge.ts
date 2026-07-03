// API Discharge Planning (browser) — tab Discharge Planning RI. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/discharge/asesmen (GET revisi terkini · POST simpan).
// Step Edukasi & Checklist menyusul (sibling /discharge/*).

import { api } from "@/lib/api/client";
import type {
  DischargeAsesmenInput, DischargeAsesmenDTO,
} from "@/lib/schemas/discharge/dischargeAsesmen";

export type { DischargeAsesmenInput, DischargeAsesmenDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/discharge`;

/** GET — asesmen pemulangan terkini (null = belum pernah diisi). */
export async function getDischargeAsesmen(
  kunjunganId: string, signal?: AbortSignal,
): Promise<DischargeAsesmenDTO | null> {
  const { data } = await api.get<DischargeAsesmenDTO | null>(`${base(kunjunganId)}/asesmen`, { signal });
  return data;
}

/** POST — simpan asesmen (append latest-wins; draft parsial sah). */
export async function saveDischargeAsesmen(
  kunjunganId: string, input: DischargeAsesmenInput, signal?: AbortSignal,
): Promise<DischargeAsesmenDTO> {
  const { data } = await api.post<DischargeAsesmenDTO>(`${base(kunjunganId)}/asesmen`, input, { signal });
  return data;
}
