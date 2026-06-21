// REST: POST /api/v1/lab/orders/:id/receive — Lab MENERIMA order non-Poli (IGD/RI):
// status "Menunggu" → "Diterima" → masuk worklist. RBAC ancillary.lab.worklist:update
// (analis; penunjang berdiri-sendiri, lintas-kunjungan → scopeKunjungan:false). Guard: hanya Menunggu.

import { route, reply } from "@/lib/http/route";
import { LabOrderIdParam } from "@/lib/schemas/lab/labOrder";
import { labOrderService } from "@/lib/services/lab/labOrderService";

export const POST = route({
  resource: "ancillary.lab.worklist",
  action: "update",
  scopeKunjungan: false,
  params: LabOrderIdParam,
  handler: async ({ params, actor }) =>
    reply(await labOrderService.receive(params.id, actor), { message: "Order diterima — masuk worklist Lab" }),
});
