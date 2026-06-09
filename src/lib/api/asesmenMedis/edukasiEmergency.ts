// API edukasi Emergency (browser). Tipe DI-REUSE dari schema server. Endpoint:
// /api/v1/kunjungan/:id/asesmen/edukasi/emergency (GET riwayat · POST · DELETE :itemId).

import { api } from "@/lib/api/client";
import type { EdukasiEmergencyInput, EdukasiEmergencyDTO } from "@/lib/schemas/asesmenMedis/edukasiEmergency";

export type { EdukasiEmergencyInput, EdukasiEmergencyDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/edukasi/emergency`;

/** GET — riwayat instruksi emergency (terbaru dulu). */
export async function getEdukasiEmergencyList(kunjunganId: string, signal?: AbortSignal): Promise<EdukasiEmergencyDTO[]> {
  const { data } = await api.get<EdukasiEmergencyDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — simpan 1 instruksi (append). */
export async function recordEdukasiEmergency(
  kunjunganId: string,
  input: EdukasiEmergencyInput,
  signal?: AbortSignal,
): Promise<EdukasiEmergencyDTO> {
  const { data } = await api.post<EdukasiEmergencyDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** DELETE — soft-delete 1 instruksi. */
export async function deleteEdukasiEmergency(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
