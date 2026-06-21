// REST: POST /api/v1/lab/orders/:id/validasi — validasi hasil (SpPK) → rilis hasil.
// Stamp validator pada hasil terbaru + transisi order Divalidasi → Selesai (atomik).
// RBAC: ancillary.lab.validate:update (SpPK saja — Analis tak punya). Lintas-kunjungan (scopeKunjungan:false).

import { route, reply } from "@/lib/http/route";
import { LabOrderIdParam } from "@/lib/schemas/lab/labOrder";
import { ValidateLabResultInput } from "@/lib/schemas/lab/labResult";
import { labResultService } from "@/lib/services/lab/labResultService";

export const POST = route({
  resource: "ancillary.lab.validate",
  action: "update",
  scopeKunjungan: false,
  params: LabOrderIdParam,
  body: ValidateLabResultInput,
  handler: async ({ params, body, actor }) =>
    reply(await labResultService.validate(params.id, body, actor), { message: "Hasil tervalidasi & dirilis" }),
});
