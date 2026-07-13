// API order lab (browser) — order pemeriksaan lab per kunjungan + worklist Lab. Tipe DI-REUSE dari schema.
// Endpoint: /api/v1/kunjungan/:id/lab (GET daftar · POST buat order) · /api/v1/lab/orders (GET worklist).
// Selaras api/resep/resep.ts.

import { api } from "@/lib/api/client";
import { emitRecordChange } from "@/lib/realtime/recordBus";
import type {
  LabOrderBody, LabOrderDTO, LabOrderWorklistDTO, LabWorklistQuery,
} from "@/lib/schemas/lab/labOrder";

export type { LabOrderBody, LabOrderDTO, LabOrderWorklistDTO, LabWorklistQuery };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/lab`;

/** GET — daftar order lab kunjungan. */
export async function listLabOrders(kunjunganId: string, signal?: AbortSignal): Promise<LabOrderDTO[]> {
  const { data } = await api.get<LabOrderDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — buat 1 order lab (header + items). */
export async function createLabOrder(
  kunjunganId: string,
  input: LabOrderBody,
  signal?: AbortSignal,
): Promise<LabOrderDTO> {
  const { data } = await api.post<LabOrderDTO>(base(kunjunganId), input, { signal });
  emitRecordChange(kunjunganId, "order"); // header Total Tagihan re-akumulasi
  return data;
}

/** POST — batalkan order lab (hanya saat Menunggu) → status Dibatalkan. */
export async function cancelLabOrder(
  kunjunganId: string,
  labId: string,
  signal?: AbortSignal,
): Promise<LabOrderDTO> {
  const { data } = await api.post<LabOrderDTO>(`${base(kunjunganId)}/${encodeURIComponent(labId)}/cancel`, {}, { signal });
  emitRecordChange(kunjunganId, "order");
  return data;
}

/** GET — worklist Lab (lintas-kunjungan). */
export async function listLabWorklist(
  query: LabWorklistQuery = {},
  signal?: AbortSignal,
): Promise<LabOrderWorklistDTO[]> {
  const { data } = await api.get<LabOrderWorklistDTO[]>("/lab/orders", {
    query: { labKode: query.labKode, status: query.status, noRM: query.noRM },
    signal,
  });
  return data;
}

/** GET — detail satu order lab (halaman Lab). */
export async function getLabOrder(labId: string, signal?: AbortSignal): Promise<LabOrderWorklistDTO> {
  const { data } = await api.get<LabOrderWorklistDTO>(`/lab/orders/${encodeURIComponent(labId)}`, { signal });
  return data;
}

/** POST — Lab menerima order non-Poli (Menunggu → Diterima) → masuk worklist. */
export async function receiveLabOrder(labId: string, signal?: AbortSignal): Promise<LabOrderDTO> {
  const { data } = await api.post<LabOrderDTO>(`/lab/orders/${encodeURIComponent(labId)}/receive`, {}, { signal });
  return data;
}
