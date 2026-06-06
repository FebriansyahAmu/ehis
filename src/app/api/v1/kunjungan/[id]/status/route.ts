// REST: PATCH /api/v1/kunjungan/:id/status — transisi worklist (BACKEND-ENCOUNTER §3).
//   body { action, expectedVersion? } → state machine di Service (version-guarded).
import { route } from "@/lib/http/route";
import { IdParam, TransitionInput } from "@/lib/schemas/kunjungan";
import { kunjunganService } from "@/lib/services/kunjunganService";

export const PATCH = route({
  resource: "registration.kunjungan",
  action: "update",
  params: IdParam,
  body: TransitionInput,
  handler: ({ params, body, actor }) =>
    kunjunganService.transition(params.id, body.action, body.expectedVersion, actor, body.bedId),
});
