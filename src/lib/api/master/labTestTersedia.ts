// API master/lab-test-tersedia (browser) — katalog tes lab ter-assign untuk tab Order Lab klinis.
// Gate clinical.tindakan (Dokter/Perawat). Hanya tes ter-assign ke ruangan Laboratorium. Tipe
// DI-REUSE dari schema server. Selaras tindakanTersedia.ts.

import { api } from "@/lib/api/client";
import type { LabTestTersediaQuery, LabTestTersediaDTO } from "@/lib/schemas/master/labTestTersedia";

export type { LabTestTersediaQuery, LabTestTersediaDTO };

/** GET /master/lab-test-tersedia — tes lab ter-assign (opsional difilter ruangan; harga via penjamin+jenisRuangan). */
export async function listLabTestTersedia(
  params: LabTestTersediaQuery = {},
  signal?: AbortSignal,
): Promise<LabTestTersediaDTO[]> {
  const { data } = await api.get<LabTestTersediaDTO[]>("/master/lab-test-tersedia", {
    query: {
      ruanganKode: params.ruanganKode,
      penjaminKode: params.penjaminKode,
      jenisRuangan: params.jenisRuangan,
    },
    signal,
  });
  return data;
}
