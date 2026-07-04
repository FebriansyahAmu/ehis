// API Pengembalian Obat (browser) — tab Pasien Pulang RI, sub Kembalian Obat. Tipe DI-REUSE
// dari schema server. Endpoint: /api/v1/kunjungan/:id/pengembalian
//   GET list · POST create Draft · PATCH /:itemId koreksi · POST /:itemId/verify (Apoteker)
//   DELETE /:itemId hapus Draft.

import { api } from "@/lib/api/client";
import type {
  PengembalianCreateInput, PengembalianUpdateInput, PengembalianDTO,
} from "@/lib/schemas/pengembalian/pengembalian";

export type { PengembalianCreateInput, PengembalianUpdateInput, PengembalianDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/pengembalian`;

/** GET — dokumen pengembalian aktif per kunjungan (terbaru dulu). */
export async function listPengembalian(
  kunjunganId: string, signal?: AbortSignal,
): Promise<PengembalianDTO[]> {
  const { data } = await api.get<PengembalianDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — buat dokumen Draft (perawat penyerah = user login). */
export async function createPengembalian(
  kunjunganId: string, input: PengembalianCreateInput, signal?: AbortSignal,
): Promise<PengembalianDTO> {
  const { data } = await api.post<PengembalianDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** PATCH — koreksi Draft (replace-all items + catatan/tanggal). */
export async function updatePengembalian(
  kunjunganId: string, itemId: string, input: PengembalianUpdateInput, signal?: AbortSignal,
): Promise<PengembalianDTO> {
  const { data } = await api.patch<PengembalianDTO>(
    `${base(kunjunganId)}/${encodeURIComponent(itemId)}`, input, { signal },
  );
  return data;
}

/** POST — verifikasi penerimaan (HANYA Apoteker; ditegakkan server). */
export async function verifyPengembalian(
  kunjunganId: string, itemId: string, signal?: AbortSignal,
): Promise<PengembalianDTO> {
  const { data } = await api.post<PengembalianDTO>(
    `${base(kunjunganId)}/${encodeURIComponent(itemId)}/verify`, {}, { signal },
  );
  return data;
}

/** DELETE — hapus dokumen Draft (soft-delete). */
export async function deletePengembalian(
  kunjunganId: string, itemId: string, signal?: AbortSignal,
): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}
