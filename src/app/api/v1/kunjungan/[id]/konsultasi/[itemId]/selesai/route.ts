// REST: rekam medis — konfirmasi selesai konsultasi (sisi PEMINTA, read-back DPJP · SNARS SKP 2).
//   POST /api/v1/kunjungan/:id/konsultasi/:itemId/selesai → Dijawab → Selesai (stamp actor)
// RBAC: clinical.konsultasi:update (Dokter). ABAC careUnit di route().

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/konsultasi/konsultasi";
import { konsultasiService } from "@/lib/services/konsultasi/konsultasiService";

export const POST = route({
  resource: "clinical.konsultasi",
  action: "update",
  params: ItemParam,
  handler: async ({ params, actor }) =>
    reply(await konsultasiService.selesai(params.id, params.itemId, actor), {
      message: "Konsultasi dikonfirmasi selesai",
    }),
});
