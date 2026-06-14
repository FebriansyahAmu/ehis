// REST: rekam medis — tab Pemeriksaan, sub Anatomi, per-item.
//   PATCH  /api/v1/kunjungan/:id/penandaan-anatomi/:itemId → edit catatan area
//   DELETE /api/v1/kunjungan/:id/penandaan-anatomi/:itemId → soft-delete (lepas tanda)
// RBAC: clinical.pemeriksaan (update/delete). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { ItemParam, PenandaanAnatomiUpdate } from "@/lib/schemas/pemeriksaan/penandaanAnatomi";
import { penandaanAnatomiService } from "@/lib/services/pemeriksaan/penandaanAnatomiService";

export const PATCH = route({
  resource: "clinical.pemeriksaan",
  action: "update",
  params: ItemParam,
  body: PenandaanAnatomiUpdate,
  handler: async ({ params, body, actor }) =>
    reply(await penandaanAnatomiService.update(params.id, params.itemId, body, actor), {
      message: "Catatan area diperbarui",
    }),
});

export const DELETE = route({
  resource: "clinical.pemeriksaan",
  action: "delete",
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await penandaanAnatomiService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Tanda area dihapus" });
  },
});
