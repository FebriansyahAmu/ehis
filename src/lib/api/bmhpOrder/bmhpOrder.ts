// API bmhpOrder (browser) — order BMHP per kunjungan. Tipe DI-REUSE dari schema.
// Endpoint: /api/v1/kunjungan/:id/bmhp (GET daftar · POST buat order · :bmhpOrderId/cancel).

import { api } from "@/lib/api/client";
import { emitRecordChange } from "@/lib/realtime/recordBus";
import type {
  BmhpOrderBody, BmhpOrderDTO, BmhpOrderFarmasiDTO, FarmasiBmhpQuery,
} from "@/lib/schemas/bmhpOrder/bmhpOrder";

export type { BmhpOrderBody, BmhpOrderDTO, BmhpOrderFarmasiDTO, FarmasiBmhpQuery };

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
  emitRecordChange(kunjunganId, "order"); // header Total Tagihan re-akumulasi
  return data;
}

/** POST — batalkan order BMHP (hanya saat Menunggu) → status Dibatalkan. */
export async function cancelBmhpOrder(
  kunjunganId: string,
  bmhpOrderId: string,
  signal?: AbortSignal,
): Promise<BmhpOrderDTO> {
  const { data } = await api.post<BmhpOrderDTO>(`${base(kunjunganId)}/${encodeURIComponent(bmhpOrderId)}/cancel`, {}, { signal });
  emitRecordChange(kunjunganId, "order");
  return data;
}

/** GET — worklist Farmasi BMHP (lintas-kunjungan). */
export async function listFarmasiBmhp(
  query: FarmasiBmhpQuery = {},
  signal?: AbortSignal,
): Promise<BmhpOrderFarmasiDTO[]> {
  const { data } = await api.get<BmhpOrderFarmasiDTO[]>("/farmasi/bmhp", {
    query: { depoKode: query.depoKode, status: query.status, noRM: query.noRM },
    signal,
  });
  return data;
}

/** POST — Depo Farmasi menerima order BMHP (Menunggu → Selesai) + keluarkan stok (OUT). */
export async function receiveFarmasiBmhp(bmhpOrderId: string, signal?: AbortSignal): Promise<BmhpOrderFarmasiDTO> {
  const { data } = await api.post<BmhpOrderFarmasiDTO>(`/farmasi/bmhp/${encodeURIComponent(bmhpOrderId)}/receive`, {}, { signal });
  return data;
}
