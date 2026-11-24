// REST: konfirmasi pasien sudah dipindah → bed asal dilepas, reservasi tujuan ditempati.
//   POST /api/v1/kunjungan/:id/mutasi/:mutasiId/selesai

import { route, reply } from "@/lib/http/route";
import { MutasiParam } from "@/lib/schemas/mutasi";
import { mutasiService } from "@/lib/services/mutasiService";

export const POST = route({
  resource: "clinical.rekammedis",
  action: "update",
  params: MutasiParam,
  handler: async ({ params, actor }) =>
    reply(await mutasiService.selesai(params.id, params.mutasiId, actor), {
      message: "Mutasi selesai — pasien dipindahkan",
    }),
});
