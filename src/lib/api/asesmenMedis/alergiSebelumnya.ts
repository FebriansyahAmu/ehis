// API "Riwayat Alergi Sebelumnya" (browser) — alergi longitudinal lintas kunjungan pasien.
// GET /api/v1/kunjungan/:id/asesmen/alergi-sebelumnya. Tipe DI-REUSE dari schema server.

import { api } from "@/lib/api/client";
import type {
  AlergiSebelumnyaDTO, AlergiSebelumnyaItemDTO,
} from "@/lib/schemas/asesmenMedis/alergiSebelumnya";

export type { AlergiSebelumnyaDTO, AlergiSebelumnyaItemDTO };

export async function getAlergiSebelumnya(
  kunjunganId: string, signal?: AbortSignal,
): Promise<AlergiSebelumnyaDTO> {
  const { data } = await api.get<AlergiSebelumnyaDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/asesmen/alergi-sebelumnya`,
    { signal },
  );
  return data;
}
