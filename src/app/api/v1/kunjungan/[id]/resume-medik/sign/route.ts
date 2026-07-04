// REST: rekam medis — Resume Medik, TTE sign-off DPJP.
//   POST /api/v1/kunjungan/:id/resume-medik/sign → stamp TTE revisi terkini (sekali)
// RBAC route coarse: clinical.rekammedis:update — refinement "HANYA DPJP (Dokter)"
// ditegakkan Service (pola careplan verify); penanda tangan = actor login (anti-spoof).
// Revisi baru pasca-sign dibuat TANPA TTE → wajib tanda tangan ulang.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/resumeMedik/resumeMedik";
import { resumeMedikService } from "@/lib/services/resumeMedik/resumeMedikService";

export const POST = route({
  resource: "clinical.rekammedis",
  action: "update",
  allowWhenLocked: true, // TTE DPJP pada resume lazim dibubuhkan pasca-pulang
  params: IdParam,
  handler: async ({ params, actor }) =>
    reply(await resumeMedikService.sign(params.id, actor), {
      message: "Resume medik ditandatangani secara elektronik",
    }),
});
