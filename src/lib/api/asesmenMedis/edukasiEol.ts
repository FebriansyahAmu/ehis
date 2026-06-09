// API edukasi End of Life (browser). Tipe DI-REUSE dari schema server. Endpoint:
// /api/v1/kunjungan/:id/asesmen/edukasi/eol (GET agregat · POST plan)
// /api/v1/kunjungan/:id/asesmen/edukasi/eol/meeting (POST · DELETE :itemId).

import { api } from "@/lib/api/client";
import type {
  EdukasiEolInput, EdukasiEolMeetingInput,
  EdukasiEolDTO, EdukasiEolPlanDTO, EdukasiEolMeetingDTO,
} from "@/lib/schemas/asesmenMedis/edukasiEol";

export type { EdukasiEolInput, EdukasiEolMeetingInput, EdukasiEolDTO, EdukasiEolPlanDTO, EdukasiEolMeetingDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/asesmen/edukasi/eol`;

/** GET — care plan terbaru + log pertemuan. */
export async function getEdukasiEol(kunjunganId: string, signal?: AbortSignal): Promise<EdukasiEolDTO> {
  const { data } = await api.get<EdukasiEolDTO>(base(kunjunganId), { signal });
  return data;
}

/** POST — simpan care plan (append latest-wins). */
export async function saveEdukasiEol(
  kunjunganId: string,
  input: EdukasiEolInput,
  signal?: AbortSignal,
): Promise<EdukasiEolPlanDTO> {
  const { data } = await api.post<EdukasiEolPlanDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** POST — tambah 1 catatan pertemuan keluarga. */
export async function addEolMeeting(
  kunjunganId: string,
  input: EdukasiEolMeetingInput,
  signal?: AbortSignal,
): Promise<EdukasiEolMeetingDTO> {
  const { data } = await api.post<EdukasiEolMeetingDTO>(`${base(kunjunganId)}/meeting`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 pertemuan. */
export async function deleteEolMeeting(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/meeting/${encodeURIComponent(itemId)}`, { signal });
}
