// REST: POST /api/v1/kunjungan/:id/bmhp/:bmhpOrderId/cancel — batalkan order BMHP (retraksi pemohon).
// Hanya saat status "Menunggu" (Farmasi belum menerima) → status Dibatalkan. RBAC clinical.tindakan:update
// (Dokter & Perawat). ABAC careUnit ditegakkan route() via params.id (kunjungan).

import { route, reply } from "@/lib/http/route";
import { BmhpCancelParams } from "@/lib/schemas/bmhpOrder/bmhpOrder";
import { bmhpOrderService } from "@/lib/services/bmhpOrder/bmhpOrderService";

export const POST = route({
  resource: "clinical.tindakan",
  action: "update",
  params: BmhpCancelParams,
  handler: async ({ params, actor }) =>
    reply(await bmhpOrderService.cancel(params.id, params.bmhpOrderId, actor), { message: "Order BMHP dibatalkan" }),
});
