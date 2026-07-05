// API Resume Pulang (browser) — tab Pasien Pulang RI, sub Resume Pulang. Tipe DI-REUSE
// dari schema server. Endpoint: /api/v1/kunjungan/:id/resume-pulang
//   GET revisi terkini · POST simpan (append latest-wins) · POST /sign TTE DPJP.

import { api } from "@/lib/api/client";
import type {
  ResumePulangInput, ResumePulangDTO,
} from "@/lib/schemas/resumePulang/resumePulang";

export type { ResumePulangInput, ResumePulangDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/resume-pulang`;

/** GET — revisi terkini resume pulang (null = belum pernah diisi). */
export async function getResumePulang(
  kunjunganId: string, signal?: AbortSignal,
): Promise<ResumePulangDTO | null> {
  const { data } = await api.get<ResumePulangDTO | null>(base(kunjunganId), { signal });
  return data;
}

/** POST — simpan resume (append latest-wins; revisi baru = TTE di-reset). */
export async function saveResumePulang(
  kunjunganId: string, input: ResumePulangInput, signal?: AbortSignal,
): Promise<ResumePulangDTO> {
  const { data } = await api.post<ResumePulangDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** POST — TTE sign-off DPJP (HANYA Dokter; ditegakkan server). */
export async function signResumePulang(
  kunjunganId: string, signal?: AbortSignal,
): Promise<ResumePulangDTO> {
  const { data } = await api.post<ResumePulangDTO>(`${base(kunjunganId)}/sign`, {}, { signal });
  return data;
}
