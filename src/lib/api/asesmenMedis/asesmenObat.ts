// API Asesmen·Riwayat·Pemberian Obat (browser). Endpoint: /kunjungan/:id/asesmen/obat.

import { api } from "@/lib/api/client";
import type { AsesmenObatInput, AsesmenObatDTO } from "@/lib/schemas/asesmenMedis/asesmenObat";

export type { AsesmenObatInput, AsesmenObatDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/obat`;

export async function getObat(kunjunganId: string, signal?: AbortSignal): Promise<AsesmenObatDTO | null> {
  const { data } = await api.get<AsesmenObatDTO | null>(base(kunjunganId), { signal });
  return data;
}

export async function saveObat(
  kunjunganId: string,
  input: AsesmenObatInput,
  signal?: AbortSignal,
): Promise<AsesmenObatDTO> {
  const { data } = await api.post<AsesmenObatDTO>(base(kunjunganId), input, { signal });
  return data;
}
