// REST: rekam medis — tab Intake/Output, per-entri.
//   DELETE /api/v1/kunjungan/:id/intake-output/:itemId → soft-delete entri (entered-in-error)
// RBAC: clinical.rekammedis (delete). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/intakeOutput/intakeOutput";
import { intakeOutputService } from "@/lib/services/intakeOutput/intakeOutputService";

export const DELETE = route({
  resource: "clinical.rekammedis",
  action: "delete",
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await intakeOutputService.removeEntry(params.id, params.itemId, actor);
    return reply(null, { message: "Entri intake/output dihapus" });
  },
});
