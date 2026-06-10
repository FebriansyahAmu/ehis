// REST: rekam medis — tab Diagnosa (per-item).
//   PATCH  /api/v1/kunjungan/:id/diagnosa/:itemId → ubah tipe/status/alasan/analisa
//   DELETE /api/v1/kunjungan/:id/diagnosa/:itemId → soft-delete

import { route, reply } from "@/lib/http/route";
import { DiagnosaItemParam, DiagnosaItemUpdate } from "@/lib/schemas/diagnosa/diagnosa";
import { diagnosaService } from "@/lib/services/diagnosa/diagnosaService";

export const PATCH = route({
  resource: "clinical.diagnosa",
  action: "update",
  params: DiagnosaItemParam,
  body: DiagnosaItemUpdate,
  handler: async ({ params, body, actor }) =>
    reply(await diagnosaService.updateDiagnosa(params.id, params.itemId, body, actor), {
      message: "Diagnosis diperbarui",
    }),
});

export const DELETE = route({
  resource: "clinical.diagnosa",
  action: "delete",
  params: DiagnosaItemParam,
  handler: async ({ params, actor }) => {
    await diagnosaService.deleteDiagnosa(params.id, params.itemId, actor);
    return reply(null, { message: "Diagnosis dihapus" });
  },
});
