// REST: rekam medis — Jadwal Kontrol, per-item.
//   DELETE /api/v1/kunjungan/:id/jadwal-kontrol/:itemId → batalkan (soft-delete; ber-noReferensi
//          → RencanaKontrol/Delete ke BPJS dulu, closed-loop)
// RBAC: clinical.rekammedis action UPDATE (bukan delete) — soft-delete = koreksi administratif
// (baris dipertahankan + stamp deleted_at); Perawat hanya punya read/create/update di rekammedis
// shared (alasan sama dgn discharge/edukasi/:itemId). ABAC careUnit ditegakkan route().

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/jadwalKontrol/jadwalKontrol";
import { jadwalKontrolService } from "@/lib/services/jadwalKontrol/jadwalKontrolService";

export const DELETE = route({
  resource: "clinical.rekammedis",
  action: "update",
  allowWhenLocked: true, // dokumen kepulangan — pembatalan surat kontrol pasca-Selesai sah
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await jadwalKontrolService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Jadwal kontrol dibatalkan" });
  },
});
