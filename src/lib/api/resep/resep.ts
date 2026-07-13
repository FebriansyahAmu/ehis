// API resep (browser) — order obat per kunjungan + worklist Farmasi. Tipe DI-REUSE dari schema.
// Endpoint: /api/v1/kunjungan/:id/resep (GET daftar · POST buat order) · /api/v1/farmasi/resep (GET worklist).

import { api } from "@/lib/api/client";
import { emitRecordChange } from "@/lib/realtime/recordBus";
import type {
  ResepOrderBody, ResepOrderDTO, ResepOrderFarmasiDTO, FarmasiResepQuery, FarmasiTelaahBody,
  FarmasiDispensingBody,
} from "@/lib/schemas/resep/resep";

export type {
  ResepOrderBody, ResepOrderDTO, ResepOrderFarmasiDTO, FarmasiResepQuery, FarmasiTelaahBody,
  FarmasiDispensingBody,
};

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/resep`;

/** GET — daftar order resep kunjungan. */
export async function listResep(kunjunganId: string, signal?: AbortSignal): Promise<ResepOrderDTO[]> {
  const { data } = await api.get<ResepOrderDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — buat 1 order resep (header + items). */
export async function createResep(
  kunjunganId: string,
  input: ResepOrderBody,
  signal?: AbortSignal,
): Promise<ResepOrderDTO> {
  const { data } = await api.post<ResepOrderDTO>(base(kunjunganId), input, { signal });
  emitRecordChange(kunjunganId, "order"); // header Total Tagihan re-akumulasi
  return data;
}

/** POST — batalkan order resep (hanya saat Menunggu) → status Dibatalkan. */
export async function cancelResep(
  kunjunganId: string,
  resepId: string,
  signal?: AbortSignal,
): Promise<ResepOrderDTO> {
  const { data } = await api.post<ResepOrderDTO>(`${base(kunjunganId)}/${encodeURIComponent(resepId)}/cancel`, {}, { signal });
  emitRecordChange(kunjunganId, "order");
  return data;
}

/** POST — Farmasi menerima order non-Poli (Menunggu → Diterima) → masuk worklist. */
export async function receiveFarmasiResep(resepId: string, signal?: AbortSignal): Promise<ResepOrderDTO> {
  const { data } = await api.post<ResepOrderDTO>(`/farmasi/resep/${encodeURIComponent(resepId)}/receive`, {}, { signal });
  return data;
}

/** GET — detail satu order resep (halaman Farmasi telaah/dispensing). */
export async function getFarmasiResep(resepId: string, signal?: AbortSignal): Promise<ResepOrderFarmasiDTO> {
  const { data } = await api.get<ResepOrderFarmasiDTO>(`/farmasi/resep/${encodeURIComponent(resepId)}`, { signal });
  return data;
}

/** POST — telaah resep (Diterima → Ditelaah | Dikembalikan). */
export async function telaahFarmasiResep(
  resepId: string,
  body: FarmasiTelaahBody,
  signal?: AbortSignal,
): Promise<ResepOrderFarmasiDTO> {
  const { data } = await api.post<ResepOrderFarmasiDTO>(`/farmasi/resep/${encodeURIComponent(resepId)}/telaah`, body, { signal });
  return data;
}

/** POST — dispensing & serah (Ditelaah → Selesai) + simpan snapshot dispensing. */
export async function dispensingFarmasiResep(
  resepId: string,
  body: FarmasiDispensingBody,
  signal?: AbortSignal,
): Promise<ResepOrderFarmasiDTO> {
  const { data } = await api.post<ResepOrderFarmasiDTO>(`/farmasi/resep/${encodeURIComponent(resepId)}/dispensing`, body, { signal });
  return data;
}

/** GET — worklist Farmasi (lintas-kunjungan). */
export async function listFarmasiResep(
  query: FarmasiResepQuery = {},
  signal?: AbortSignal,
): Promise<ResepOrderFarmasiDTO[]> {
  const { data } = await api.get<ResepOrderFarmasiDTO[]>("/farmasi/resep", {
    query: { depoKode: query.depoKode, status: query.status, noRM: query.noRM },
    signal,
  });
  return data;
}
