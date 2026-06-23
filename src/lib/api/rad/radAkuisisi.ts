// API akuisisi & dosis radiologi (browser) — tab Akuisisi (opsional). Tipe DI-REUSE dari schema.
// Endpoint: /api/v1/rad/orders/:id/akuisisi (GET terbaru · POST simpan + transisi → Diperiksa).
// Selaras api/rad/radResult.ts.

import { api } from "@/lib/api/client";
import type { SaveRadAkuisisiBody, RadAkuisisiDTO } from "@/lib/schemas/rad/radAkuisisi";

export type { SaveRadAkuisisiBody, RadAkuisisiDTO };

const base = (radId: string) => `/rad/orders/${encodeURIComponent(radId)}/akuisisi`;

/** GET — akuisisi terbaru 1 order (null bila belum ada). */
export async function getRadAkuisisi(radId: string, signal?: AbortSignal): Promise<RadAkuisisiDTO | null> {
  const { data } = await api.get<RadAkuisisiDTO | null>(base(radId), { signal });
  return data;
}

/** POST — simpan sesi akuisisi → order status Diperiksa (opsional). */
export async function saveRadAkuisisi(radId: string, input: SaveRadAkuisisiBody, signal?: AbortSignal): Promise<RadAkuisisiDTO> {
  const { data } = await api.post<RadAkuisisiDTO>(base(radId), input, { signal });
  return data;
}
