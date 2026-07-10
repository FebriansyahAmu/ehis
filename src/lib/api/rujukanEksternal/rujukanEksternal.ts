// API Rujukan Eksternal / Rujukan Keluar (browser) — tab Disposisi RJ → Rujuk Eksternal.
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/kunjungan/:id/rujukan
//   GET daftar aktif (cetak ulang) · POST terbitkan · DELETE /:itemId batalkan (soft-delete).

import { api } from "@/lib/api/client";
import type {
  RujukanEksternalInput, RujukanEksternalDTO, RujukanDetail,
} from "@/lib/schemas/rujukanEksternal/rujukanEksternal";

export type { RujukanEksternalInput, RujukanEksternalDTO, RujukanDetail };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/rujukan`;

/** GET — daftar rujukan keluar aktif (terbaru dulu) untuk cetak ulang. */
export async function listRujukan(
  kunjunganId: string, signal?: AbortSignal,
): Promise<RujukanEksternalDTO[]> {
  const { data } = await api.get<RujukanEksternalDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — terbitkan rujukan (No. Rujukan auto server; selalu sukses mock). */
export async function createRujukan(
  kunjunganId: string, input: RujukanEksternalInput, signal?: AbortSignal,
): Promise<RujukanEksternalDTO> {
  const { data } = await api.post<RujukanEksternalDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** DELETE — batalkan rujukan (soft-delete). */
export async function deleteRujukan(
  kunjunganId: string, itemId: string, signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
