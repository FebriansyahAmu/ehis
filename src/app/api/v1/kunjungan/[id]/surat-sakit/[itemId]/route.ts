// REST: rekam medis — Surat Keterangan Sakit, per-item.
//   DELETE /api/v1/kunjungan/:id/surat-sakit/:itemId → batalkan (soft-delete)
// RBAC: clinical.rekammedis action UPDATE (bukan delete) — soft-delete = koreksi administratif
// (baris dipertahankan + stamp deleted_at); Perawat punya read/create/update di rekammedis shared
// (alasan sama dgn jadwal-kontrol/:itemId). ABAC careUnit ditegakkan route().

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/suratSakit/suratSakit";
import { suratSakitService } from "@/lib/services/suratSakit/suratSakitService";

export const DELETE = route({
  resource: "clinical.rekammedis",
  action: "update",
  allowWhenLocked: true, // dokumen kepulangan — pembatalan surat pasca-Selesai sah
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await suratSakitService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Surat keterangan sakit dibatalkan" });
  },
});
