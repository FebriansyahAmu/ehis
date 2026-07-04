// REST: rekam medis — Pengembalian Obat, verifikasi penerimaan fisik.
//   POST /api/v1/kunjungan/:id/pengembalian/:itemId/verify → Draft → Diverifikasi (stamp sekali)
// RBAC route coarse: clinical.pengembalian:update (Dokter/Perawat/Apoteker) — refinement
// "HANYA APOTEKER" ditegakkan Service (pola careplan verify Dokter-only); apotekerPenerima =
// actor login. Apoteker lolos careUnit ABAC via isAncillaryActor.

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/pengembalian/pengembalian";
import { pengembalianService } from "@/lib/services/pengembalian/pengembalianService";

export const POST = route({
  resource: "clinical.pengembalian",
  action: "update",
  allowWhenLocked: true, // verifikasi Apoteker lazim terjadi SETELAH pasien pulang
  params: ItemParam,
  handler: async ({ params, actor }) =>
    reply(await pengembalianService.verify(params.id, params.itemId, actor), {
      message: "Pengembalian diverifikasi",
    }),
});
