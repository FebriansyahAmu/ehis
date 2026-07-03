// REST: rekam medis — Discharge Planning step 2: Edukasi, per-log.
//   DELETE /api/v1/kunjungan/:id/discharge/edukasi/:itemId → soft-delete (koreksi log)
// RBAC: clinical.rekammedis action UPDATE (bukan delete) — soft-delete = koreksi catatan
// (baris dipertahankan + stamp deleted_at, aksi tulis korektif bukan destruktif); Perawat
// (penulis utama edukasi) hanya punya read/create/update di rekammedis shared, dan grant
// delete rekammedis terlalu luas hanya demi log ini. ABAC careUnit ditegakkan route().

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/discharge/dischargeEdukasi";
import { dischargeEdukasiService } from "@/lib/services/discharge/dischargeEdukasiService";

export const DELETE = route({
  resource: "clinical.rekammedis",
  action: "update",
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await dischargeEdukasiService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Log edukasi dihapus" });
  },
});
