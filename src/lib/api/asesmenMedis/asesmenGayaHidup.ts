// API Asesmen·Riwayat·Gaya Hidup (browser). Endpoint: /kunjungan/:id/asesmen/gaya-hidup.

import { api } from "@/lib/api/client";
import type { AsesmenGayaHidupInput, AsesmenGayaHidupDTO } from "@/lib/schemas/asesmenMedis/asesmenGayaHidup";

export type { AsesmenGayaHidupInput, AsesmenGayaHidupDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/gaya-hidup`;

export async function getGayaHidup(kunjunganId: string, signal?: AbortSignal): Promise<AsesmenGayaHidupDTO | null> {
  const { data } = await api.get<AsesmenGayaHidupDTO | null>(base(kunjunganId), { signal });
  return data;
}

export async function saveGayaHidup(
  kunjunganId: string,
  input: AsesmenGayaHidupInput,
  signal?: AbortSignal,
): Promise<AsesmenGayaHidupDTO> {
  const { data } = await api.post<AsesmenGayaHidupDTO>(base(kunjunganId), input, { signal });
  return data;
}
