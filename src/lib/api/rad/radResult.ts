// API hasil radiologi (browser) — entry ekspertise per order (tab Entry Hasil). Tipe DI-REUSE dari schema.
// Endpoint: /api/v1/rad/orders/:id/hasil (GET hasil terbaru · POST simpan + transisi → Divalidasi).
// Selaras api/lab/labResult.ts.

import { api } from "@/lib/api/client";
import type { SaveRadResultBody, ValidateRadResultBody, RadResultDTO } from "@/lib/schemas/rad/radResult";

export type { SaveRadResultBody, ValidateRadResultBody, RadResultDTO };

const base = (radId: string) => `/rad/orders/${encodeURIComponent(radId)}/hasil`;

/** GET — hasil terbaru 1 order (null bila belum dientry). */
export async function getRadResult(radId: string, signal?: AbortSignal): Promise<RadResultDTO | null> {
  const { data } = await api.get<RadResultDTO | null>(base(radId), { signal });
  return data;
}

/** GET — hasil rad klinis (Riwayat Order Rad di tab klinis). Gate clinical.tindakan:read
 *  + ABAC careUnit (lewat kunjungan). null bila belum ada hasil. */
export async function getRadResultForKunjungan(
  kunjunganId: string,
  radId: string,
  signal?: AbortSignal,
): Promise<RadResultDTO | null> {
  const { data } = await api.get<RadResultDTO | null>(
    `/kunjungan/${encodeURIComponent(kunjunganId)}/rad/${encodeURIComponent(radId)}/hasil`,
    { signal },
  );
  return data;
}

/** POST — simpan entry hasil (header + items) → order status Divalidasi. */
export async function saveRadResult(radId: string, input: SaveRadResultBody, signal?: AbortSignal): Promise<RadResultDTO> {
  const { data } = await api.post<RadResultDTO>(base(radId), input, { signal });
  return data;
}

/** POST — validasi hasil (radiolog) → order status Selesai (rilis). */
export async function validateRadResult(radId: string, input: ValidateRadResultBody, signal?: AbortSignal): Promise<RadResultDTO> {
  const { data } = await api.post<RadResultDTO>(`/rad/orders/${encodeURIComponent(radId)}/validasi`, input, { signal });
  return data;
}
