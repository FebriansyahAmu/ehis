// API bmhpOrder (browser) — order BMHP per kunjungan. Tipe DI-REUSE dari schema.
// Endpoint: /api/v1/kunjungan/:id/bmhp (GET daftar · POST buat order · :bmhpOrderId/cancel).

import { api } from "@/lib/api/client";
import type { BmhpOrderBody, BmhpOrderDTO } from "@/lib/schemas/bmhpOrder/bmhpOrder";

export type { BmhpOrderBody, BmhpOrderDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/bmhp`;

/** GET — daftar order BMHP kunjungan. */
export async function listBmhpOrders(kunjunganId: string, signal?: AbortSignal): Promise<BmhpOrderDTO[]> {
  const { data } = await api.get<BmhpOrderDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — buat 1 order BMHP (header + items). */
export async function createBmhpOrder(
  kunjunganId: string,
  input: BmhpOrderBody,
  signal?: AbortSignal,
): Promise<BmhpOrderDTO> {
  const { data } = await api.post<BmhpOrderDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** POST — batalkan order BMHP (hanya saat Menunggu) → status Dibatalkan. */
export async function cancelBmhpOrder(
  kunjunganId: string,
  bmhpOrderId: string,
  signal?: AbortSignal,
): Promise<BmhpOrderDTO> {
  const { data } = await api.post<BmhpOrderDTO>(`${base(kunjunganId)}/${encodeURIComponent(bmhpOrderId)}/cancel`, {}, { signal });
  return data;
}
