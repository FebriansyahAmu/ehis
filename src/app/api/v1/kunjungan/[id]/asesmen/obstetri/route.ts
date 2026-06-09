// REST: Asesmen Medis · Riwayat · Obstetri. Shared IGD/RI/RJ.
//   GET/POST /api/v1/kunjungan/:id/asesmen/obstetri

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenObstetriInput } from "@/lib/schemas/asesmenMedis/asesmenObstetri";
import { asesmenObstetriService } from "@/lib/services/asesmenMedis/asesmenObstetriService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenObstetriService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: AsesmenObstetriInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenObstetriService.save(params.id, body, actor), {
      status: 201,
      message: "Riwayat obstetri tersimpan",
    }),
});
