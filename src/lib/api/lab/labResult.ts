// API hasil lab (browser) — entry hasil per order (tab Entry Hasil). Tipe DI-REUSE dari schema.
// Endpoint: /api/v1/lab/orders/:id/hasil (GET hasil terbaru · POST simpan + transisi → Divalidasi).

import { api } from "@/lib/api/client";
import type { SaveLabResultBody, ValidateLabResultBody, LabResultDTO } from "@/lib/schemas/lab/labResult";

export type { SaveLabResultBody, ValidateLabResultBody, LabResultDTO };

const base = (labId: string) => `/lab/orders/${encodeURIComponent(labId)}/hasil`;

/** GET — hasil terbaru 1 order (null bila belum dientry). */
export async function getLabResult(labId: string, signal?: AbortSignal): Promise<LabResultDTO | null> {
  const { data } = await api.get<LabResultDTO | null>(base(labId), { signal });
  return data;
}

/** POST — simpan entry hasil (header + values) → order status Divalidasi. */
export async function saveLabResult(labId: string, input: SaveLabResultBody, signal?: AbortSignal): Promise<LabResultDTO> {
  const { data } = await api.post<LabResultDTO>(base(labId), input, { signal });
  return data;
}

/** POST — validasi hasil (SpPK) → order status Selesai (rilis). */
export async function validateLabResult(labId: string, input: ValidateLabResultBody, signal?: AbortSignal): Promise<LabResultDTO> {
  const { data } = await api.post<LabResultDTO>(`/lab/orders/${encodeURIComponent(labId)}/validasi`, input, { signal });
  return data;
}
