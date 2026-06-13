// API master/obat-tersedia (browser) — katalog obat ter-formularium untuk Rekonsiliasi / Resep.
// Gate clinical.resep (Dokter/Perawat). Tipe DI-REUSE dari schema server. Selaras tindakanTersedia.ts.

import { api } from "@/lib/api/client";
import type { ObatTersediaQuery, ObatTersediaDTO } from "@/lib/schemas/master/obatTersedia";

export type { ObatTersediaQuery, ObatTersediaDTO };

/** GET /master/obat-tersedia — obat ter-formularium (opsional difilter ruangan). */
export async function listObatTersedia(
  params: ObatTersediaQuery = {},
  signal?: AbortSignal,
): Promise<ObatTersediaDTO[]> {
  const { data } = await api.get<ObatTersediaDTO[]>("/master/obat-tersedia", {
    query: { ruanganKode: params.ruanganKode },
    signal,
  });
  return data;
}
