// REST: rekam medis — tab Penandaan Gambar, per-item.
//   DELETE /api/v1/kunjungan/:id/penandaan-gambar/:itemId → soft-delete (lepas tanda)
// RBAC: clinical.pemeriksaan (delete). ABAC careUnit ditegakkan route() (clinical.* + params.id).
// Tanpa PATCH — koreksi = hapus + tambah baru (pola PemeriksaanPenunjang/InformedConsent).

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/penandaanGambar/penandaanGambar";
import { penandaanGambarService } from "@/lib/services/penandaanGambar/penandaanGambarService";

export const DELETE = route({
  resource: "clinical.pemeriksaan",
  action: "delete",
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await penandaanGambarService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Penanda gambar dihapus" });
  },
});
