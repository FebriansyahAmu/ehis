// REST: POST /api/v1/rad/orders/:id/validasi — validasi hasil (SpRad) → rilis laporan.
// Stamp validator pada hasil terbaru + transisi order Divalidasi → Selesai (atomik).
// RBAC: ancillary.rad.expertise:update (radiolog SpRad). Lintas-kunjungan (scopeKunjungan:false).

import { route, reply } from "@/lib/http/route";
import { RadOrderIdParam } from "@/lib/schemas/rad/radOrder";
import { ValidateRadResultInput } from "@/lib/schemas/rad/radResult";
import { radResultService } from "@/lib/services/rad/radResultService";

export const POST = route({
  resource: "ancillary.rad.expertise",
  action: "update",
  scopeKunjungan: false,
  params: RadOrderIdParam,
  body: ValidateRadResultInput,
  handler: async ({ params, body, actor }) =>
    reply(await radResultService.validate(params.id, body, actor), { message: "Laporan tervalidasi & dirilis" }),
});
