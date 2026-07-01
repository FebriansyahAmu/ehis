// REST: rekam medis — tab Rencana Asuhan, goal (anak) per masalah.
//   POST /api/v1/kunjungan/:id/care-plan/:masalahId/goal → tambah 1 goal (201)
// RBAC: clinical.careplan (create). Mengembalikan DTO masalah ter-refresh (goals[]).
// ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { MasalahParam, GoalInput } from "@/lib/schemas/carePlan/carePlan";
import { carePlanService } from "@/lib/services/carePlan/carePlanService";

export const POST = route({
  resource: "clinical.careplan",
  action: "create",
  params: MasalahParam,
  body: GoalInput,
  handler: async ({ params, body, actor }) =>
    reply(await carePlanService.addGoal(params.id, params.masalahId, body, actor), {
      status: 201,
      message: "Goal rencana asuhan ditambahkan",
    }),
});
