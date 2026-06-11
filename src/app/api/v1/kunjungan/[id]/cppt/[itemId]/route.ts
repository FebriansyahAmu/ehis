// REST: rekam medis — tab CPPT (per-item).
//   PATCH  /api/v1/kunjungan/:id/cppt/:itemId → koreksi isi catatan (membatalkan co-sign)
//   DELETE /api/v1/kunjungan/:id/cppt/:itemId → soft-delete (entered-in-error)

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

export const DELETE = route({
  resource: "clinical.cppt",
  action: "delete",
  params: CpptItemParam,
  handler: async ({ params, actor }) => {
    await cpptService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Catatan CPPT dihapus" });
  },
});
