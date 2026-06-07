// API master/triase-igd (browser). Protokol triase (matrix level×parameter). Tipe DI-REUSE
// dari schema server (`import type`) → kontrak FE↔BE selalu selaras. Endpoint: /api/v1/master/triase-igd.

import { api } from "@/lib/api/client";
import type {
  CreateTriaseInput, UpdateTriaseInput, TriaseRecordDTO,
} from "@/lib/schemas/triaseProtocol";

export type { TriaseRecordDTO };

/** GET /master/triase-igd — list protokol (full, dgn matrix). */
export async function listTriaseProtocols(signal?: AbortSignal): Promise<TriaseRecordDTO[]> {
  const { data } = await api.get<TriaseRecordDTO[]>("/master/triase-igd", { signal });
  return data;
}

/** GET /master/triase-igd/:id — detail full. */
export async function getTriaseProtocol(id: string, signal?: AbortSignal): Promise<TriaseRecordDTO> {
  const { data } = await api.get<TriaseRecordDTO>(`/master/triase-igd/${encodeURIComponent(id)}`, { signal });
  return data;
}

/** GET /master/triase-igd/default — protokol default aktif (konsumen klinis). null bila belum ada. */
export async function getDefaultTriaseProtocol(signal?: AbortSignal): Promise<TriaseRecordDTO | null> {
  const { data } = await api.get<TriaseRecordDTO | null>("/master/triase-igd/default", { signal });
  return data;
}

/** POST /master/triase-igd — buat protokol baru. */
export async function createTriaseProtocol(input: CreateTriaseInput, signal?: AbortSignal): Promise<TriaseRecordDTO> {
  const { data } = await api.post<TriaseRecordDTO>("/master/triase-igd", input, { signal });
  return data;
}

/** PATCH /master/triase-igd/:id — ubah identitas + replace matrix (kirim expectedVersion). */
export async function updateTriaseProtocol(
  id: string,
  input: UpdateTriaseInput,
  signal?: AbortSignal,
): Promise<TriaseRecordDTO> {
  const { data } = await api.patch<TriaseRecordDTO>(`/master/triase-igd/${encodeURIComponent(id)}`, input, { signal });
  return data;
}

/** PATCH /master/triase-igd/:id/default — jadikan protokol ini default. */
export async function setDefaultTriaseProtocol(
  id: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<TriaseRecordDTO> {
  const { data } = await api.patch<TriaseRecordDTO>(
    `/master/triase-igd/${encodeURIComponent(id)}/default`,
    { expectedVersion },
    { signal },
  );
  return data;
}

/** DELETE /master/triase-igd/:id?expectedVersion= — soft-delete protokol. */
export async function deleteTriaseProtocol(id: string, expectedVersion: number, signal?: AbortSignal): Promise<void> {
  await api.del<null>(`/master/triase-igd/${encodeURIComponent(id)}`, { query: { expectedVersion }, signal });
}
