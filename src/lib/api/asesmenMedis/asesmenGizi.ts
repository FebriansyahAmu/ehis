// API skrining gizi (browser). Tipe DI-REUSE dari schema server. Endpoint:
// /api/v1/kunjungan/:id/asesmen/gizi (GET riwayat · POST simpan 1 skrining).

import { api } from "@/lib/api/client";
import type { AsesmenGiziInput, AsesmenGiziDTO } from "@/lib/schemas/asesmenMedis/asesmenGizi";

export type { AsesmenGiziInput, AsesmenGiziDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/gizi`;

/** GET — riwayat skrining gizi (terbaru dulu). */
export async function getGiziList(kunjunganId: string, signal?: AbortSignal): Promise<AsesmenGiziDTO[]> {
  const { data } = await api.get<AsesmenGiziDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — simpan 1 skrining (append). */
export async function recordGizi(
  kunjunganId: string,
  input: AsesmenGiziInput,
  signal?: AbortSignal,
): Promise<AsesmenGiziDTO> {
  const { data } = await api.post<AsesmenGiziDTO>(base(kunjunganId), input, { signal });
  return data;
}
