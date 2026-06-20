// REST: POST /api/v1/farmasi/resep/:id/receive — Farmasi MENERIMA order non-Poli (IGD/RI):
// status "Menunggu" → "Diterima" → masuk worklist telaah. RBAC ancillary.farmasi.telaah:update
// (Apoteker; penunjang berdiri-sendiri, lintas-kunjungan → scopeKunjungan:false). Guard: hanya Menunggu.

import { route, reply } from "@/lib/http/route";
import { FarmasiResepIdParam } from "@/lib/schemas/resep/resep";
import { resepService } from "@/lib/services/resep/resepService";

export const POST = route({
  resource: "ancillary.farmasi.telaah",
  action: "update",
  scopeKunjungan: false,
  params: FarmasiResepIdParam,
  handler: async ({ params, actor }) =>
    reply(await resepService.receive(params.id, actor), { message: "Order diterima — masuk worklist telaah" }),
});
