// API Discharge Planning (browser) — tab Discharge Planning RI. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/discharge/asesmen (GET revisi terkini · POST simpan)
//         · /api/v1/kunjungan/:id/discharge/edukasi (GET log · POST catat sesi · DELETE /:itemId)
//         · /api/v1/kunjungan/:id/discharge/checklist (GET revisi terkini · POST simpan).

import { api } from "@/lib/api/client";
import type {
  DischargeAsesmenInput, DischargeAsesmenDTO,
} from "@/lib/schemas/discharge/dischargeAsesmen";
import type {
  DischargeEdukasiInput, DischargeEdukasiDTO,
} from "@/lib/schemas/discharge/dischargeEdukasi";
import type {
  DischargeChecklistInput, DischargeChecklistDTO,
} from "@/lib/schemas/discharge/dischargeChecklist";

export type { DischargeAsesmenInput, DischargeAsesmenDTO };
export type { DischargeEdukasiInput, DischargeEdukasiDTO };
export type { DischargeChecklistInput, DischargeChecklistDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/discharge`;

/** GET — asesmen pemulangan terkini (null = belum pernah diisi). */
export async function getDischargeAsesmen(
  kunjunganId: string, signal?: AbortSignal,
): Promise<DischargeAsesmenDTO | null> {
  const { data } = await api.get<DischargeAsesmenDTO | null>(`${base(kunjunganId)}/asesmen`, { signal });
  return data;
}

/** POST — simpan asesmen (append latest-wins; draft parsial sah). */
export async function saveDischargeAsesmen(
  kunjunganId: string, input: DischargeAsesmenInput, signal?: AbortSignal,
): Promise<DischargeAsesmenDTO> {
  const { data } = await api.post<DischargeAsesmenDTO>(`${base(kunjunganId)}/asesmen`, input, { signal });
  return data;
}

/** GET — semua log edukasi aktif (terbaru dulu; FE grup per topik). */
export async function listDischargeEdukasi(
  kunjunganId: string, signal?: AbortSignal,
): Promise<DischargeEdukasiDTO[]> {
  const { data } = await api.get<DischargeEdukasiDTO[]>(`${base(kunjunganId)}/edukasi`, { signal });
  return data;
}

/** POST — catat 1 sesi edukasi (petugas = user login, server-otoritatif). */
export async function addDischargeEdukasi(
  kunjunganId: string, input: DischargeEdukasiInput, signal?: AbortSignal,
): Promise<DischargeEdukasiDTO> {
  const { data } = await api.post<DischargeEdukasiDTO>(`${base(kunjunganId)}/edukasi`, input, { signal });
  return data;
}

/** DELETE — hapus (soft-delete) 1 log edukasi; koreksi = hapus + catat baru. */
export async function deleteDischargeEdukasi(
  kunjunganId: string, itemId: string, signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/edukasi/${encodeURIComponent(itemId)}`, { signal });
}

/** GET — checklist kesiapan terkini (null = belum pernah diisi). */
export async function getDischargeChecklist(
  kunjunganId: string, signal?: AbortSignal,
): Promise<DischargeChecklistDTO | null> {
  const { data } = await api.get<DischargeChecklistDTO | null>(`${base(kunjunganId)}/checklist`, { signal });
  return data;
}

/** POST — simpan checklist (append latest-wins; snapshot penuh items + catatan DPJP). */
export async function saveDischargeChecklist(
  kunjunganId: string, input: DischargeChecklistInput, signal?: AbortSignal,
): Promise<DischargeChecklistDTO> {
  const { data } = await api.post<DischargeChecklistDTO>(`${base(kunjunganId)}/checklist`, input, { signal });
  return data;
}
