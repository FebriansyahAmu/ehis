// REST: Asesmen Medis · Riwayat · Ginekologi. Shared IGD/RI/RJ.
//   GET/POST /api/v1/kunjungan/:id/asesmen/ginekologi

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenGinekologiInput } from "@/lib/schemas/asesmenMedis/asesmenGinekologi";
import { asesmenGinekologiService } from "@/lib/services/asesmenMedis/asesmenGinekologiService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenGinekologiService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: AsesmenGinekologiInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenGinekologiService.save(params.id, body, actor), {
      status: 201,
      message: "Riwayat ginekologi tersimpan",
    }),
});
