// API penandaan gambar (browser) — tab Penandaan Gambar (status lokalis). Tipe DI-REUSE dari
// schema server. Endpoint: /api/v1/kunjungan/:id/penandaan-gambar (GET list · POST) + /:itemId (DELETE).

import { api } from "@/lib/api/client";
import type { PenandaanGambarInput, PenandaanGambarDTO } from "@/lib/schemas/penandaanGambar/penandaanGambar";

export type { PenandaanGambarInput, PenandaanGambarDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/penandaan-gambar`;

/** GET — daftar penanda aktif per kunjungan. */
export async function getPenandaanGambar(kunjunganId: string, signal?: AbortSignal): Promise<PenandaanGambarDTO[]> {
  const { data } = await api.get<PenandaanGambarDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 penanda (pin / draw). */
export async function createPenandaanGambar(
  kunjunganId: string, input: PenandaanGambarInput, signal?: AbortSignal,
): Promise<PenandaanGambarDTO> {
  const { data } = await api.post<PenandaanGambarDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** DELETE — soft-delete (lepas tanda). */
export async function deletePenandaanGambar(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
