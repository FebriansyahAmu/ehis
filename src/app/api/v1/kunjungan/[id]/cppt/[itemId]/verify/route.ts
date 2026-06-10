// REST: rekam medis — tab CPPT, co-sign DPJP (SKP 2 · SNARS).
//   POST /api/v1/kunjungan/:id/cppt/:itemId/verify → verifikasi catatan
//   verifiedBy = nama DPJP dari actor (BUKAN free-text); verifiedAt = server.

import { route, reply } from "@/lib/http/route";
import { CpptItemParam } from "@/lib/schemas/cppt/cppt";
import { cpptService } from "@/lib/services/cppt/cpptService";

export const POST = route({
  resource: "clinical.cppt",
  action: "update",
  params: CpptItemParam,
  handler: async ({ params, actor }) =>
    reply(await cpptService.verify(params.id, params.itemId, actor), {
      message: "Catatan diverifikasi DPJP",
    }),
});
