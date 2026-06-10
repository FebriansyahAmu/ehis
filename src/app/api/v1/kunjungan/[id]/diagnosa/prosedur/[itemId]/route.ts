// REST: rekam medis — tab Diagnosa · prosedur ICD-9-CM (per-item).
//   DELETE /api/v1/kunjungan/:id/diagnosa/prosedur/:itemId → soft-delete

import { route, reply } from "@/lib/http/route";
import { DiagnosaItemParam } from "@/lib/schemas/diagnosa/diagnosa";
import { diagnosaService } from "@/lib/services/diagnosa/diagnosaService";

export const DELETE = route({
  resource: "clinical.diagnosa",
  action: "delete",
  params: DiagnosaItemParam,
  handler: async ({ params, actor }) => {
    await diagnosaService.deleteProsedur(params.id, params.itemId, actor);
    return reply(null, { message: "Prosedur dihapus" });
  },
});
