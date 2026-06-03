// API pendaftaran/pasien (browser). Tipe DI-REUSE dari schema server (`import type` →
// nol kode server ter-bundle, kontrak FE↔BE selalu selaras). Endpoint: /api/v1/patients.

import { api } from "@/lib/api/client";
import type {
  RegisterPatientInput,
  CompletePatientInput,
  UpdatePenjaminInput,
  PatientDTO,
} from "@/lib/schemas/patient";

export type { PatientDTO, RegisterPatientInput, CompletePatientInput, UpdatePenjaminInput };

export interface SearchPatientsParams {
  q?: string;
  by?: "nik" | "rm" | "nama";
  cursor?: string;
  limit?: number;
}

export interface RegisterResult {
  patient: PatientDTO;
  /** Pesan sukses dari server (untuk toast). */
  message?: string;
  /** true = baru dibuat (201); false = sudah ada → dikembalikan (200, dedup). */
  created: boolean;
}

/** POST /patients — daftar pasien (server dedup-first by NIK/paspor). */
export async function registerPatient(input: RegisterPatientInput, signal?: AbortSignal): Promise<RegisterResult> {
  const r = await api.post<PatientDTO>("/patients", input, { signal });
  return { patient: r.data, message: r.message, created: r.status === 201 };
}

/** GET /patients — cari/list (cursor pagination). */
export async function searchPatients(
  params: SearchPatientsParams,
  signal?: AbortSignal,
): Promise<{ items: PatientDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<PatientDTO[]>("/patients", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** GET /patients/:id. */
export async function getPatient(id: string, signal?: AbortSignal): Promise<PatientDTO> {
  const { data } = await api.get<PatientDTO>(`/patients/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** PATCH /patients/:id — lengkapi data draft (kirim expectedVersion). */
export async function completePatient(
  id: string,
  input: CompletePatientInput,
  signal?: AbortSignal,
): Promise<PatientDTO> {
  const { data } = await api.patch<PatientDTO>(`/patients/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** PATCH /patients/:id/penjamin — ubah jaminan aktif (jadi primer). */
export async function updatePenjamin(
  id: string,
  input: UpdatePenjaminInput,
  signal?: AbortSignal,
): Promise<PatientDTO> {
  const { data } = await api.patch<PatientDTO>(
    `/patients/${encodeURIComponent(id)}/penjamin`,
    input,
    { signal },
  );
  return data;
}
