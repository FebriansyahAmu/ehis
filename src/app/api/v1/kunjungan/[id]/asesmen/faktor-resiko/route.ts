// REST: Asesmen Medis · Riwayat · Faktor Resiko. Shared IGD/RI/RJ.
//   GET/POST /api/v1/kunjungan/:id/asesmen/faktor-resiko

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenFaktorResikoInput } from "@/lib/schemas/asesmenMedis/asesmenFaktorResiko";
import { asesmenFaktorResikoService } from "@/lib/services/asesmenMedis/asesmenFaktorResikoService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenFaktorResikoService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: AsesmenFaktorResikoInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenFaktorResikoService.save(params.id, body, actor), {
      status: 201,
      message: "Faktor resiko tersimpan",
    }),
});
