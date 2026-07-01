// REST: rekam medis — tab Intake/Output, target DPJP (restriksi intake + target balance).
//   POST /api/v1/kunjungan/:id/intake-output/target → set target (latest-wins, baris baru)
// RBAC: clinical.rekammedis (update). ABAC careUnit ditegakkan route() (clinical.* + params.id).
// Segmen statis "target" berprioritas di atas dinamis [itemId] (Next.js).

import { route, reply } from "@/lib/http/route";
import { IdParam, IOTargetInput } from "@/lib/schemas/intakeOutput/intakeOutput";
import { intakeOutputService } from "@/lib/services/intakeOutput/intakeOutputService";

export const POST = route({
  resource: "clinical.rekammedis",
  action: "update",
  params: IdParam,
  body: IOTargetInput,
  handler: async ({ params, body, actor }) =>
    reply(await intakeOutputService.setTarget(params.id, body, actor), {
      message: "Target balance cairan disimpan",
    }),
});
