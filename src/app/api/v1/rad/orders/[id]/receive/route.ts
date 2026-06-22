// REST: POST /api/v1/rad/orders/:id/receive — Rad MENERIMA order non-Poli (IGD/RI):
// status "Menunggu" → "Diterima" → masuk worklist. RBAC ancillary.rad.worklist:update
// (radiografer; penunjang berdiri-sendiri, lintas-kunjungan → scopeKunjungan:false). Guard: hanya Menunggu.
// ABAC SDM Assignment (penerima ter-assign Radiologi) ditegakkan di Service.

import { route, reply } from "@/lib/http/route";
import { RadOrderIdParam } from "@/lib/schemas/rad/radOrder";
import { radOrderService } from "@/lib/services/rad/radOrderService";

export const POST = route({
  resource: "ancillary.rad.worklist",
  action: "update",
  scopeKunjungan: false,
  params: RadOrderIdParam,
  handler: async ({ params, actor }) =>
    reply(await radOrderService.receive(params.id, actor), { message: "Order diterima — masuk worklist Radiologi" }),
});
