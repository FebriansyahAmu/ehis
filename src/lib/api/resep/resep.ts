// API resep (browser) — order obat per kunjungan + worklist Farmasi. Tipe DI-REUSE dari schema.
// Endpoint: /api/v1/kunjungan/:id/resep (GET daftar · POST buat order) · /api/v1/farmasi/resep (GET worklist).

import { api } from "@/lib/api/client";
import type {
  ResepOrderBody, ResepOrderDTO, ResepOrderFarmasiDTO, FarmasiResepQuery,
} from "@/lib/schemas/resep/resep";

export type { ResepOrderBody, ResepOrderDTO, ResepOrderFarmasiDTO, FarmasiResepQuery };

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
  return data;
}

/** POST — batalkan order resep (hanya saat Menunggu) → status Dibatalkan. */
export async function cancelResep(
  kunjunganId: string,
  resepId: string,
  signal?: AbortSignal,
): Promise<ResepOrderDTO> {
  const { data } = await api.post<ResepOrderDTO>(`${base(kunjunganId)}/${encodeURIComponent(resepId)}/cancel`, {}, { signal });
  return data;
}

/** GET — worklist Farmasi (lintas-kunjungan). */
export async function listFarmasiResep(
  query: FarmasiResepQuery = {},
  signal?: AbortSignal,
): Promise<ResepOrderFarmasiDTO[]> {
  const { data } = await api.get<ResepOrderFarmasiDTO[]>("/farmasi/resep", {
    query: { depoKode: query.depoKode, status: query.status },
    signal,
  });
  return data;
}
