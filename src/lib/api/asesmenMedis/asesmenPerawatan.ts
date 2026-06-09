// API Asesmen·Riwayat·Perawatan & Tindakan (browser). Endpoint: /kunjungan/:id/asesmen/perawatan.

import { api } from "@/lib/api/client";
import type { AsesmenPerawatanInput, AsesmenPerawatanDTO } from "@/lib/schemas/asesmenMedis/asesmenPerawatan";

export type { AsesmenPerawatanInput, AsesmenPerawatanDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/perawatan`;

export async function getPerawatan(kunjunganId: string, signal?: AbortSignal): Promise<AsesmenPerawatanDTO | null> {
  const { data } = await api.get<AsesmenPerawatanDTO | null>(base(kunjunganId), { signal });
  return data;
}

export async function savePerawatan(
  kunjunganId: string,
  input: AsesmenPerawatanInput,
  signal?: AbortSignal,
): Promise<AsesmenPerawatanDTO> {
  const { data } = await api.post<AsesmenPerawatanDTO>(base(kunjunganId), input, { signal });
  return data;
}
