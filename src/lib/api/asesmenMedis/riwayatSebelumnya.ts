// API "Riwayat Sebelumnya" (browser) — longitudinal 9 domain riwayat per kunjungan.
// GET /api/v1/kunjungan/:id/asesmen/riwayat-sebelumnya.

import { api } from "@/lib/api/client";
import type {
  RiwayatSebelumnyaDTO, RiwayatEpisodeDTO, RiwayatDomainKey,
} from "@/lib/schemas/asesmenMedis/riwayatSebelumnya";

export type { RiwayatSebelumnyaDTO, RiwayatEpisodeDTO, RiwayatDomainKey };

export async function getRiwayatSebelumnya(
  kunjunganId: string, signal?: AbortSignal,
): Promise<RiwayatSebelumnyaDTO> {
  const { data } = await api.get<RiwayatSebelumnyaDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/asesmen/riwayat-sebelumnya`,
    { signal },
  );
  return data;
}
