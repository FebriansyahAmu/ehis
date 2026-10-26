// API IHS Patient SatuSehat (browser). Tipe DI-REUSE dari schema server (`import type`).
// Konsumen: badge IHS registrasi · konsol /ehis-fhir (FH9).

import { api } from "@/lib/api/client";
import type { NikLookupDTO, PatientBatchDTO, PatientIhsDTO } from "@/lib/schemas/fhir/patient";

export type { NikLookupDTO, PatientBatchDTO, PatientIhsDTO };

/** Status peta IHS pasien (tanpa panggilan SatuSehat). */
export async function getPatientIhs(patientId: string, signal?: AbortSignal): Promise<PatientIhsDTO> {
  const { data } = await api.get<PatientIhsDTO>(`/fhir/patient/${patientId}`, { signal });
  return data;
}

/** Resolve IHS pasien by NIK (idempoten; `force` = ulang). */
export async function resolvePatientIhs(patientId: string, opts: { force?: boolean } = {}): Promise<PatientIhsDTO> {
  const { data } = await api.post<PatientIhsDTO>(`/fhir/patient/${patientId}/resolve`, opts);
  return data;
}

/** Batch resolve pasien belum terpetakan (≤100/panggilan). Ulangi selama `sisa`. */
export async function resolvePatientBatch(limit = 25): Promise<PatientBatchDTO> {
  const { data } = await api.post<PatientBatchDTO>("/fhir/patient/resolve-batch", { limit });
  return data;
}

/** Cek NIK ke SatuSehat tanpa menyimpan. */
export async function lookupNik(nik: string): Promise<NikLookupDTO> {
  const { data } = await api.post<NikLookupDTO>("/fhir/patient-lookup", { nik });
  return data;
}
