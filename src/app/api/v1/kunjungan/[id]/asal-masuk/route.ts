// REST: rekam medis — deteksi ASAL MASUK kunjungan Rawat Inap (Resume Medik).
//   GET /api/v1/kunjungan/:id/asal-masuk → { terdeteksi, asalMasuk, tanggalMasuk,
//   diagnosisAsal, noKunjunganAsal }
// Diturunkan SERVER dari SPRI ter-konsumsi → kunjungan asal (IGD/Poliklinik) + dx utama;
// tanpa SPRI (admisi langsung/transfer) → terdeteksi=false (FE fallback manual).
// RBAC: clinical.rekammedis:read. ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/resumeMedik/resumeMedik";
import { resumeMedikService } from "@/lib/services/resumeMedik/resumeMedikService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) =>
    reply(await resumeMedikService.getAsalMasuk(params.id, actor)),
});
