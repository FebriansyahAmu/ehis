// API Asesmen·Riwayat·Tuberkulosis (browser). Endpoint: /kunjungan/:id/asesmen/tuberkulosis.

import { api } from "@/lib/api/client";
import type { AsesmenTuberkulosisInput, AsesmenTuberkulosisDTO } from "@/lib/schemas/asesmenMedis/asesmenTuberkulosis";

export type { AsesmenTuberkulosisInput, AsesmenTuberkulosisDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/tuberkulosis`;

export async function getTuberkulosis(kunjunganId: string, signal?: AbortSignal): Promise<AsesmenTuberkulosisDTO | null> {
  const { data } = await api.get<AsesmenTuberkulosisDTO | null>(base(kunjunganId), { signal });
  return data;
}

export async function saveTuberkulosis(
  kunjunganId: string,
  input: AsesmenTuberkulosisInput,
  signal?: AbortSignal,
): Promise<AsesmenTuberkulosisDTO> {
  const { data } = await api.post<AsesmenTuberkulosisDTO>(base(kunjunganId), input, { signal });
  return data;
}
