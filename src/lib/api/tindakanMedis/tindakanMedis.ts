// API tindakan medis (browser) — tab Tindakan, per-item. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/tindakan (GET list · POST) · /:itemId (PATCH · DELETE).

import { api } from "@/lib/api/client";
import { emitRecordChange } from "@/lib/realtime/recordBus";
import type {
  TindakanMedisInput, TindakanMedisUpdate, TindakanMedisDTO,
} from "@/lib/schemas/tindakanMedis/tindakanMedis";

export type { TindakanMedisInput, TindakanMedisUpdate, TindakanMedisDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/tindakan`;

export async function getTindakanMedis(kunjunganId: string, signal?: AbortSignal): Promise<TindakanMedisDTO[]> {
  const { data } = await api.get<TindakanMedisDTO[]>(base(kunjunganId), { signal });
  return data;
}

export async function addTindakanMedis(
  kunjunganId: string,
  input: TindakanMedisInput,
  signal?: AbortSignal,
): Promise<TindakanMedisDTO> {
  const { data } = await api.post<TindakanMedisDTO>(base(kunjunganId), input, { signal });
  emitRecordChange(kunjunganId, "order"); // header Total Tagihan re-akumulasi
  return data;
}

export async function updateTindakanMedis(
  kunjunganId: string,
  itemId: string,
  input: TindakanMedisUpdate,
  signal?: AbortSignal,
): Promise<TindakanMedisDTO> {
  const { data } = await api.patch<TindakanMedisDTO>(
    `${base(kunjunganId)}/${encodeURIComponent(itemId)}`,
    input,
    { signal },
  );
  emitRecordChange(kunjunganId, "order"); // ubah jumlah → subtotal berubah
  return data;
}

export async function deleteTindakanMedis(
  kunjunganId: string,
  itemId: string,
  signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
  emitRecordChange(kunjunganId, "order");
}
