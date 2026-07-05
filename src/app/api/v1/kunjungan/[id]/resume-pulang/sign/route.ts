// REST: rekam medis — Resume Pulang, TTE sign-off DPJP.
//   POST /api/v1/kunjungan/:id/resume-pulang/sign → stamp TTE revisi terkini (sekali)
// RBAC route coarse: clinical.rekammedis:update — refinement "HANYA DPJP (Dokter)" ditegakkan
// Service (pola resumeMedik/careplan verify); penanda tangan = actor login (anti-spoof).
// allowWhenLocked: TTE lazim dibubuhkan pasca-pulang.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/resumePulang/resumePulang";
import { resumePulangService } from "@/lib/services/resumePulang/resumePulangService";

export const POST = route({
  resource: "clinical.rekammedis",
  action: "update",
  allowWhenLocked: true,
  params: IdParam,
  handler: async ({ params, actor }) =>
    reply(await resumePulangService.sign(params.id, actor), {
      message: "Resume pulang ditandatangani secara elektronik",
    }),
});
