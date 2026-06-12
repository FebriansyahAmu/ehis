// API master/tindakan-tersedia (browser) — katalog tindakan ter-assign untuk tab Tindakan klinis.
// Gate clinical.tindakan (Dokter/Perawat). Lab/Rad tidak termuat. Tipe DI-REUSE dari schema server.

import { api } from "@/lib/api/client";
import type { TindakanTersediaQuery, TindakanTersediaDTO } from "@/lib/schemas/master/tindakanTersedia";

export type { TindakanTersediaQuery, TindakanTersediaDTO };

/** GET /master/tindakan-tersedia — tindakan ter-assign (opsional difilter ruangan; harga via penjamin+jenisRuangan). */
export async function listTindakanTersedia(
  params: TindakanTersediaQuery = {},
  signal?: AbortSignal,
): Promise<TindakanTersediaDTO[]> {
  const { data } = await api.get<TindakanTersediaDTO[]>("/master/tindakan-tersedia", {
    query: {
      ruanganKode: params.ruanganKode,
      penjaminKode: params.penjaminKode,
      jenisRuangan: params.jenisRuangan,
    },
    signal,
  });
  return data;
}
