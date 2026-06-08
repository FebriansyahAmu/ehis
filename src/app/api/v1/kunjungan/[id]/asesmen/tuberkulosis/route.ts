// REST: Asesmen Medis · Riwayat · Tuberkulosis. Shared IGD/RI/RJ.
//   GET/POST /api/v1/kunjungan/:id/asesmen/tuberkulosis

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenTuberkulosisInput } from "@/lib/schemas/asesmenMedis/asesmenTuberkulosis";
import { asesmenTuberkulosisService } from "@/lib/services/asesmenMedis/asesmenTuberkulosisService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenTuberkulosisService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: AsesmenTuberkulosisInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenTuberkulosisService.save(params.id, body, actor), {
      status: 201,
      message: "Riwayat tuberkulosis tersimpan",
    }),
});
