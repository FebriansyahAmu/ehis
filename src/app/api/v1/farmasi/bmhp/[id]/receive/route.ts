// REST: POST /api/v1/farmasi/bmhp/:id/receive — Depo Farmasi MENERIMA order BMHP:
// status "Menunggu" → "Selesai" + KELUARKAN stok (OUT) dari depo (konsumsi langsung, tanpa telaah).
// RBAC ancillary.farmasi.serah:update (Apoteker; penunjang berdiri-sendiri, lintas-kunjungan →
// scopeKunjungan:false). Guard: hanya status "Menunggu".

import { route, reply } from "@/lib/http/route";
import { BmhpOrderIdParam } from "@/lib/schemas/bmhpOrder/bmhpOrder";
import { bmhpOrderService } from "@/lib/services/bmhpOrder/bmhpOrderService";

export const POST = route({
  resource: "ancillary.farmasi.serah",
  action: "update",
  scopeKunjungan: false,
  params: BmhpOrderIdParam,
  handler: async ({ params, actor }) =>
    reply(await bmhpOrderService.receive(params.id, actor), { message: "Order BMHP diterima — barang dikeluarkan dari depo" }),
});
