// API Asesmen·Riwayat·Faktor Resiko (browser). Endpoint: /kunjungan/:id/asesmen/faktor-resiko.

import { api } from "@/lib/api/client";
import type { AsesmenFaktorResikoInput, AsesmenFaktorResikoDTO } from "@/lib/schemas/asesmenMedis/asesmenFaktorResiko";

export type { AsesmenFaktorResikoInput, AsesmenFaktorResikoDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/faktor-resiko`;

export async function getFaktorResiko(kunjunganId: string, signal?: AbortSignal): Promise<AsesmenFaktorResikoDTO | null> {
  const { data } = await api.get<AsesmenFaktorResikoDTO | null>(base(kunjunganId), { signal });
  return data;
}

export async function saveFaktorResiko(
  kunjunganId: string,
  input: AsesmenFaktorResikoInput,
  signal?: AbortSignal,
): Promise<AsesmenFaktorResikoDTO> {
  const { data } = await api.post<AsesmenFaktorResikoDTO>(base(kunjunganId), input, { signal });
  return data;
}
