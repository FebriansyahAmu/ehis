// REST: rekam medis — Rujukan Eksternal, per-item.
//   DELETE /api/v1/kunjungan/:id/rujukan/:itemId → batalkan (soft-delete)
// RBAC: clinical.rekammedis action UPDATE (soft-delete = koreksi administratif; baris
// dipertahankan + stamp deleted_at). ABAC careUnit ditegakkan route().

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/rujukanEksternal/rujukanEksternal";
import { rujukanEksternalService } from "@/lib/services/rujukanEksternal/rujukanEksternalService";

export const DELETE = route({
  resource: "clinical.rekammedis",
  action: "update",
  allowWhenLocked: true, // pembatalan dokumen disposisi pasca-Selesai sah
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await rujukanEksternalService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Surat rujukan dibatalkan" });
  },
});
