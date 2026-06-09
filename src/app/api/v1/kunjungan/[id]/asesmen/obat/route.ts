// REST: Asesmen Medis · Riwayat · Pemberian Obat. Shared IGD/RI/RJ.
//   GET/POST /api/v1/kunjungan/:id/asesmen/obat

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenObatInput } from "@/lib/schemas/asesmenMedis/asesmenObat";
import { asesmenObatService } from "@/lib/services/asesmenMedis/asesmenObatService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenObatService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: AsesmenObatInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenObatService.save(params.id, body, actor), {
      status: 201,
      message: "Riwayat pemberian obat tersimpan",
    }),
});
