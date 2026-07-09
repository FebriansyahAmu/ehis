// REST: rekam medis — Surat Keterangan Sehat, per-item.
//   DELETE /api/v1/kunjungan/:id/surat-sehat/:itemId → batalkan (soft-delete)
// RBAC: clinical.rekammedis action UPDATE (bukan delete) — soft-delete = koreksi administratif
// (baris dipertahankan + stamp deleted_at); Perawat punya read/create/update di rekammedis shared
// (alasan sama dgn surat-sakit/:itemId). ABAC careUnit ditegakkan route().

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/suratSehat/suratSehat";
import { suratSehatService } from "@/lib/services/suratSehat/suratSehatService";

export const DELETE = route({
  resource: "clinical.rekammedis",
  action: "update",
  allowWhenLocked: true, // dokumen surat keterangan — pembatalan pasca-Selesai sah
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await suratSehatService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Surat keterangan sehat dibatalkan" });
  },
});
