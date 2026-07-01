// REST: rekam medis — tab Rencana Asuhan, per-masalah.
//   PATCH  /api/v1/kunjungan/:id/care-plan/:masalahId → edit / verify (co-sign DPJP)
//   DELETE /api/v1/kunjungan/:id/care-plan/:masalahId → soft-delete (entered-in-error)
// RBAC: clinical.careplan (update/delete). Verify khusus DPJP ditegakkan Service.
// ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { MasalahParam, MasalahUpdate } from "@/lib/schemas/carePlan/carePlan";
import { carePlanService } from "@/lib/services/carePlan/carePlanService";

export const PATCH = route({
  resource: "clinical.careplan",
  action: "update",
  params: MasalahParam,
  body: MasalahUpdate,
  handler: async ({ params, body, actor }) =>
    reply(await carePlanService.updateMasalah(params.id, params.masalahId, body, actor), {
      message: "Masalah rencana asuhan diperbarui",
    }),
});

export const DELETE = route({
  resource: "clinical.careplan",
  action: "delete",
  params: MasalahParam,
  handler: async ({ params, actor }) => {
    await carePlanService.removeMasalah(params.id, params.masalahId, actor);
    return reply(null, { message: "Masalah rencana asuhan dihapus" });
  },
});
