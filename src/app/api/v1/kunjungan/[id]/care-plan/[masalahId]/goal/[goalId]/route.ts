// REST: rekam medis — tab Rencana Asuhan, goal (anak) per-item.
//   PATCH  /api/v1/kunjungan/:id/care-plan/:masalahId/goal/:goalId → edit goal (status/evaluasi/…)
//   DELETE /api/v1/kunjungan/:id/care-plan/:masalahId/goal/:goalId → soft-delete (entered-in-error)
// RBAC: clinical.careplan (update/delete). Mengembalikan DTO masalah ter-refresh (goals[]).
// ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { GoalParam, GoalUpdate } from "@/lib/schemas/carePlan/carePlan";
import { carePlanService } from "@/lib/services/carePlan/carePlanService";

export const PATCH = route({
  resource: "clinical.careplan",
  action: "update",
  params: GoalParam,
  body: GoalUpdate,
  handler: async ({ params, body, actor }) =>
    reply(await carePlanService.updateGoal(params.id, params.masalahId, params.goalId, body, actor), {
      message: "Goal rencana asuhan diperbarui",
    }),
});

export const DELETE = route({
  resource: "clinical.careplan",
  action: "delete",
  params: GoalParam,
  handler: async ({ params, actor }) =>
    reply(await carePlanService.removeGoal(params.id, params.masalahId, params.goalId, actor), {
      message: "Goal rencana asuhan dihapus",
    }),
});
