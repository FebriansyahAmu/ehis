// API serah terima shift (browser) — tab Serah Terima (handover SBAR, closed-loop). Tipe DI-REUSE
// dari schema server. Endpoint: /api/v1/kunjungan/:id/serah-terima (GET list · POST create) +
// /:itemId (PATCH "Terima" · DELETE soft).

import { api } from "@/lib/api/client";
import type { SerahTerimaInput, ReceiveInput, SerahTerimaDTO } from "@/lib/schemas/serahTerima/serahTerima";

export type { SerahTerimaInput, ReceiveInput, SerahTerimaDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/serah-terima`;

/** GET — daftar serah terima aktif per kunjungan. */
export async function getSerahTerima(kunjunganId: string, signal?: AbortSignal): Promise<SerahTerimaDTO[]> {
  const { data } = await api.get<SerahTerimaDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — perawat keluar menyusun SBAR (entry baru = belum diterima). */
export async function createSerahTerima(
  kunjunganId: string, input: SerahTerimaInput, signal?: AbortSignal,
): Promise<SerahTerimaDTO> {
  const { data } = await api.post<SerahTerimaDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** PATCH — perawat masuk "Terima" (stamp penerima + jam). */
export async function receiveSerahTerima(
  kunjunganId: string, itemId: string, input: ReceiveInput = {}, signal?: AbortSignal,
): Promise<SerahTerimaDTO> {
  const { data } = await api.patch<SerahTerimaDTO>(
    `${base(kunjunganId)}/${encodeURIComponent(itemId)}`, input, { signal },
  );
  return data;
}

/** DELETE — soft-delete (entered-in-error). */
export async function deleteSerahTerima(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
