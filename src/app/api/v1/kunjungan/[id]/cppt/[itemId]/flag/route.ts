// REST: rekam medis — tab CPPT, penanda tindak lanjut.
//   PATCH /api/v1/kunjungan/:id/cppt/:itemId/flag → set status flag (idempoten)

import { route, reply } from "@/lib/http/route";
import { CpptItemParam, CpptFlagInput } from "@/lib/schemas/cppt/cppt";
import { cpptService } from "@/lib/services/cppt/cpptService";

export const PATCH = route({
  resource: "clinical.cppt",
  action: "update",
  params: CpptItemParam,
  body: CpptFlagInput,
  handler: async ({ params, body, actor }) =>
    reply(await cpptService.flag(params.id, params.itemId, body.flagged, actor), {
      message: body.flagged ? "Ditandai tindak lanjut" : "Penanda dihapus",
    }),
});
