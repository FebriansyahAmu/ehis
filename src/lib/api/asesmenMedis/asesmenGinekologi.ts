// API Asesmen·Riwayat·Ginekologi (browser). Endpoint: /kunjungan/:id/asesmen/ginekologi.

import { api } from "@/lib/api/client";
import type { AsesmenGinekologiInput, AsesmenGinekologiDTO } from "@/lib/schemas/asesmenMedis/asesmenGinekologi";

export type { AsesmenGinekologiInput, AsesmenGinekologiDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/ginekologi`;

export async function getGinekologi(kunjunganId: string, signal?: AbortSignal): Promise<AsesmenGinekologiDTO | null> {
  const { data } = await api.get<AsesmenGinekologiDTO | null>(base(kunjunganId), { signal });
  return data;
}

export async function saveGinekologi(
  kunjunganId: string,
  input: AsesmenGinekologiInput,
  signal?: AbortSignal,
): Promise<AsesmenGinekologiDTO> {
  const { data } = await api.post<AsesmenGinekologiDTO>(base(kunjunganId), input, { signal });
  return data;
}
