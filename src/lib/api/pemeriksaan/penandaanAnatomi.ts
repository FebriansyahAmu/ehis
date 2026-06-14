// API penandaan anatomi (browser) — tab Pemeriksaan sub Anatomi. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/penandaan-anatomi (GET list · POST) + /:itemId (PATCH · DELETE).

import { api } from "@/lib/api/client";
import type {
  PenandaanAnatomiInput, PenandaanAnatomiUpdate, PenandaanAnatomiDTO,
} from "@/lib/schemas/pemeriksaan/penandaanAnatomi";

export type { PenandaanAnatomiInput, PenandaanAnatomiUpdate, PenandaanAnatomiDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/penandaan-anatomi`;

/** GET — daftar penanda area aktif per kunjungan. */
export async function getPenandaanAnatomi(kunjunganId: string, signal?: AbortSignal): Promise<PenandaanAnatomiDTO[]> {
  const { data } = await api.get<PenandaanAnatomiDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tandai 1 area tubuh. */
export async function createPenandaanAnatomi(
  kunjunganId: string, input: PenandaanAnatomiInput, signal?: AbortSignal,
): Promise<PenandaanAnatomiDTO> {
  const { data } = await api.post<PenandaanAnatomiDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** PATCH — edit catatan area. */
export async function updatePenandaanAnatomi(
  kunjunganId: string, itemId: string, input: PenandaanAnatomiUpdate, signal?: AbortSignal,
): Promise<PenandaanAnatomiDTO> {
  const { data } = await api.patch<PenandaanAnatomiDTO>(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete (lepas tanda area). */
export async function deletePenandaanAnatomi(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
