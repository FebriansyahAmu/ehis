// REST: rekam medis — tab CPPT (per-item).
//   PATCH /api/v1/kunjungan/:id/cppt/:itemId → koreksi isi catatan (membatalkan co-sign)

import { route, reply } from "@/lib/http/route";
import { CpptItemParam, CpptItemUpdate } from "@/lib/schemas/cppt/cppt";
import { cpptService } from "@/lib/services/cppt/cpptService";

export const PATCH = route({
  resource: "clinical.cppt",
  action: "update",
  params: CpptItemParam,
  body: CpptItemUpdate,
  handler: async ({ params, body, actor }) =>
    reply(await cpptService.update(params.id, params.itemId, body, actor), {
      message: "Catatan CPPT diperbarui",
    }),
});
