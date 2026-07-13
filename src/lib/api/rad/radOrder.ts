// API order radiologi (browser) — order pemeriksaan rad per kunjungan + worklist Rad. Tipe DI-REUSE
// dari schema. Endpoint: /api/v1/kunjungan/:id/rad (GET daftar · POST buat order) ·
// /api/v1/rad/orders (GET worklist). Selaras api/lab/labOrder.ts.

import { api } from "@/lib/api/client";
import { emitRecordChange } from "@/lib/realtime/recordBus";
import type {
  RadOrderBody, RadOrderDTO, RadOrderWorklistDTO, RadWorklistQuery,
} from "@/lib/schemas/rad/radOrder";

export type { RadOrderBody, RadOrderDTO, RadOrderWorklistDTO, RadWorklistQuery };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/rad`;

/** GET — daftar order rad kunjungan. */
export async function listRadOrders(kunjunganId: string, signal?: AbortSignal): Promise<RadOrderDTO[]> {
  const { data } = await api.get<RadOrderDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — buat 1 order rad (header + items). */
export async function createRadOrder(
  kunjunganId: string,
  input: RadOrderBody,
  signal?: AbortSignal,
): Promise<RadOrderDTO> {
  const { data } = await api.post<RadOrderDTO>(base(kunjunganId), input, { signal });
  emitRecordChange(kunjunganId, "order"); // header Total Tagihan re-akumulasi
  return data;
}

/** POST — batalkan order rad (hanya saat Menunggu) → status Dibatalkan. */
export async function cancelRadOrder(
  kunjunganId: string,
  radId: string,
  signal?: AbortSignal,
): Promise<RadOrderDTO> {
  const { data } = await api.post<RadOrderDTO>(`${base(kunjunganId)}/${encodeURIComponent(radId)}/cancel`, {}, { signal });
  emitRecordChange(kunjunganId, "order");
  return data;
}

/** GET — worklist Rad (lintas-kunjungan). */
export async function listRadWorklist(
  query: RadWorklistQuery = {},
  signal?: AbortSignal,
): Promise<RadOrderWorklistDTO[]> {
  const { data } = await api.get<RadOrderWorklistDTO[]>("/rad/orders", {
    query: { radKode: query.radKode, status: query.status, noRM: query.noRM },
    signal,
  });
  return data;
}

/** GET — detail satu order rad (halaman Rad). */
export async function getRadOrder(radId: string, signal?: AbortSignal): Promise<RadOrderWorklistDTO> {
  const { data } = await api.get<RadOrderWorklistDTO>(`/rad/orders/${encodeURIComponent(radId)}`, { signal });
  return data;
}

/** POST — Rad menerima order non-Poli (Menunggu → Diterima) → masuk worklist. */
export async function receiveRadOrder(radId: string, signal?: AbortSignal): Promise<RadOrderDTO> {
  const { data } = await api.post<RadOrderDTO>(`/rad/orders/${encodeURIComponent(radId)}/receive`, {}, { signal });
  return data;
}
