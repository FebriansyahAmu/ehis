// REST: Asesmen Medis · Riwayat · Perawatan & Tindakan. Shared IGD/RI/RJ.
//   GET/POST /api/v1/kunjungan/:id/asesmen/perawatan

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenPerawatanInput } from "@/lib/schemas/asesmenMedis/asesmenPerawatan";
import { asesmenPerawatanService } from "@/lib/services/asesmenMedis/asesmenPerawatanService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenPerawatanService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: AsesmenPerawatanInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenPerawatanService.save(params.id, body, actor), {
      status: 201,
      message: "Riwayat perawatan & tindakan tersimpan",
    }),
});
