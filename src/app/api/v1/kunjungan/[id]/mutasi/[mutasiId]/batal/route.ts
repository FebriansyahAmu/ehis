// REST: batalkan mutasi yang masih Diajukan → reservasi bed tujuan dilepas.
//   POST /api/v1/kunjungan/:id/mutasi/:mutasiId/batal  { alasan }

import { route, reply } from "@/lib/http/route";
import { BatalMutasiInput, MutasiParam } from "@/lib/schemas/mutasi";
import { mutasiService } from "@/lib/services/mutasiService";

export const POST = route({
  resource: "clinical.rekammedis",
  action: "update",
  params: MutasiParam,
  body: BatalMutasiInput,
  handler: async ({ params, body, actor }) =>
    reply(await mutasiService.batal(params.id, params.mutasiId, body, actor), {
      message: "Mutasi dibatalkan — reservasi bed dilepas",
    }),
});
