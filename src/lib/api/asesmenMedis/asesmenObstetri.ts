// API Asesmen·Riwayat·Obstetri (browser). Endpoint: /kunjungan/:id/asesmen/obstetri.

import { api } from "@/lib/api/client";
import type { AsesmenObstetriInput, AsesmenObstetriDTO } from "@/lib/schemas/asesmenMedis/asesmenObstetri";

export type { AsesmenObstetriInput, AsesmenObstetriDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/obstetri`;

export async function getObstetri(kunjunganId: string, signal?: AbortSignal): Promise<AsesmenObstetriDTO | null> {
  const { data } = await api.get<AsesmenObstetriDTO | null>(base(kunjunganId), { signal });
  return data;
}

export async function saveObstetri(
  kunjunganId: string,
  input: AsesmenObstetriInput,
  signal?: AbortSignal,
): Promise<AsesmenObstetriDTO> {
  const { data } = await api.post<AsesmenObstetriDTO>(base(kunjunganId), input, { signal });
  return data;
}
