// API master/rad-catalog-tersedia (browser) — katalog pemeriksaan radiologi ter-assign untuk tab Order Rad klinis.
// Gate clinical.tindakan (Dokter/Perawat). Hanya pemeriksaan ter-assign ke ruangan Radiologi. Tipe
// DI-REUSE dari schema server. Selaras labTestTersedia.ts.

import { api } from "@/lib/api/client";
import type { RadCatalogTersediaQuery, RadCatalogTersediaDTO } from "@/lib/schemas/master/radCatalogTersedia";

export type { RadCatalogTersediaQuery, RadCatalogTersediaDTO };

/** GET /master/rad-catalog-tersedia — pemeriksaan rad ter-assign (opsional difilter ruangan; harga via penjamin+jenisRuangan). */
export async function listRadCatalogTersedia(
  params: RadCatalogTersediaQuery = {},
  signal?: AbortSignal,
): Promise<RadCatalogTersediaDTO[]> {
  const { data } = await api.get<RadCatalogTersediaDTO[]>("/master/rad-catalog-tersedia", {
    query: {
      ruanganKode: params.ruanganKode,
      penjaminKode: params.penjaminKode,
      jenisRuangan: params.jenisRuangan,
    },
    signal,
  });
  return data;
}
