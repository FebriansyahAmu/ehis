// REST: konsultan menerima konsultasi (stamp sekali).
//   POST /api/v1/konsultasi/:id/terima → Terkirim → Diterima (penerima = actor)
// RBAC: clinical.konsultasi:update (Dokter). scopeKunjungan:false (params.id = konsultasiId).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/konsultasi/konsultasi";
import { konsultasiService } from "@/lib/services/konsultasi/konsultasiService";

export const POST = route({
  resource: "clinical.konsultasi",
  action: "update",
  scopeKunjungan: false,
  params: IdParam,
  handler: async ({ params, actor }) =>
    reply(await konsultasiService.terima(params.id, actor), { message: "Konsultasi diterima" }),
});
