// REST: Asesmen Medis · Riwayat · Gaya Hidup (sub "Lainnya"). Shared IGD/RI/RJ.
//   GET/POST /api/v1/kunjungan/:id/asesmen/gaya-hidup

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenGayaHidupInput } from "@/lib/schemas/asesmenMedis/asesmenGayaHidup";
import { asesmenGayaHidupService } from "@/lib/services/asesmenMedis/asesmenGayaHidupService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenGayaHidupService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: AsesmenGayaHidupInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenGayaHidupService.save(params.id, body, actor), {
      status: 201,
      message: "Riwayat gaya hidup tersimpan",
    }),
});
