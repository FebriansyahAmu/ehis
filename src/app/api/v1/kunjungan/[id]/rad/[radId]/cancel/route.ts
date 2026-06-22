// REST: POST /api/v1/kunjungan/:id/rad/:radId/cancel — batalkan order rad (retraksi DPJP).
// Hanya saat status "Menunggu" (Rad belum menerima) → status Dibatalkan. RBAC clinical.tindakan:update.
// ABAC careUnit ditegakkan route() via params.id (kunjungan).

import { route, reply } from "@/lib/http/route";
import { RadCancelParams } from "@/lib/schemas/rad/radOrder";
import { radOrderService } from "@/lib/services/rad/radOrderService";

export const POST = route({
  resource: "clinical.tindakan",
  action: "update",
  params: RadCancelParams,
  handler: async ({ params, actor }) =>
    reply(await radOrderService.cancel(params.id, params.radId, actor), { message: "Order radiologi dibatalkan" }),
});
