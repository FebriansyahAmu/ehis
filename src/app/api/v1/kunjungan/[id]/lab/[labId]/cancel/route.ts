// REST: POST /api/v1/kunjungan/:id/lab/:labId/cancel — batalkan order lab (retraksi DPJP).
// Hanya saat status "Menunggu" (Lab belum menerima) → status Dibatalkan. RBAC clinical.tindakan:update.
// ABAC careUnit ditegakkan route() via params.id (kunjungan).

import { route, reply } from "@/lib/http/route";
import { LabCancelParams } from "@/lib/schemas/lab/labOrder";
import { labOrderService } from "@/lib/services/lab/labOrderService";

export const POST = route({
  resource: "clinical.tindakan",
  action: "update",
  params: LabCancelParams,
  handler: async ({ params, actor }) =>
    reply(await labOrderService.cancel(params.id, params.labId, actor), { message: "Order lab dibatalkan" }),
});
