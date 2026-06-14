// REST: rekam medis — tab Pemeriksaan, sub Penunjang, per-item.
//   DELETE /api/v1/kunjungan/:id/pemeriksaan-penunjang/:itemId → soft-delete (hapus hasil)
// RBAC: clinical.pemeriksaan (delete). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { ItemParam } from "@/lib/schemas/pemeriksaan/pemeriksaanPenunjang";
import { pemeriksaanPenunjangService } from "@/lib/services/pemeriksaan/pemeriksaanPenunjangService";

export const DELETE = route({
  resource: "clinical.pemeriksaan",
  action: "delete",
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await pemeriksaanPenunjangService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Hasil penunjang dihapus" });
  },
});
