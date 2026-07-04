// API Resume Medik (browser) — tab Pasien Pulang RI, sub Resume Medik. Tipe DI-REUSE
// dari schema server. Endpoint: /api/v1/kunjungan/:id/resume-medik
//   GET revisi terkini · POST simpan (append latest-wins) · POST /sign TTE DPJP.

import { api } from "@/lib/api/client";
import type {
  ResumeMedikInput, ResumeMedikDTO, DataKlinisSnapshot, AsalMasukDTO,
} from "@/lib/schemas/resumeMedik/resumeMedik";

export type { ResumeMedikInput, ResumeMedikDTO, DataKlinisSnapshot, AsalMasukDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/resume-medik`;

/** GET — revisi terkini resume medik (null = belum pernah diisi). */
export async function getResumeMedik(
  kunjunganId: string, signal?: AbortSignal,
): Promise<ResumeMedikDTO | null> {
  const { data } = await api.get<ResumeMedikDTO | null>(base(kunjunganId), { signal });
  return data;
}

/** POST — simpan resume (append latest-wins; revisi baru = TTE di-reset). */
export async function saveResumeMedik(
  kunjunganId: string, input: ResumeMedikInput, signal?: AbortSignal,
): Promise<ResumeMedikDTO> {
  const { data } = await api.post<ResumeMedikDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** GET — deteksi asal masuk dari rantai admisi (SPRI → kunjungan asal). */
export async function getAsalMasuk(
  kunjunganId: string, signal?: AbortSignal,
): Promise<AsalMasukDTO> {
  const { data } = await api.get<AsalMasukDTO>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/asal-masuk`, { signal },
  );
  return data;
}

/** POST — TTE sign-off DPJP (HANYA Dokter; ditegakkan server). */
export async function signResumeMedik(
  kunjunganId: string, signal?: AbortSignal,
): Promise<ResumeMedikDTO> {
  const { data } = await api.post<ResumeMedikDTO>(`${base(kunjunganId)}/sign`, {}, { signal });
  return data;
}
