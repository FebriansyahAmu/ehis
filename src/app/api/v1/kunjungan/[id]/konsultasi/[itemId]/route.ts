// REST: rekam medis — batalkan permintaan konsultasi (sisi PEMINTA).
//   DELETE /api/v1/kunjungan/:id/konsultasi/:itemId → soft-delete, HANYA saat masih Terkirim
// RBAC: clinical.konsultasi:delete (Dokter). ABAC careUnit di route().

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/konsultasi/konsultasi";
import { konsultasiService } from "@/lib/services/konsultasi/konsultasiService";

export const DELETE = route({
  resource: "clinical.konsultasi",
  action: "delete",
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await konsultasiService.batal(params.id, params.itemId, actor);
    return reply(null, { message: "Permintaan konsultasi dibatalkan" });
  },
});
