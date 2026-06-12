// REST: rekam medis — tab Tindakan, per-item.
//   PATCH  /api/v1/kunjungan/:id/tindakan/:itemId → ubah jumlah / pelaksana
//   DELETE /api/v1/kunjungan/:id/tindakan/:itemId → soft-delete (entered-in-error)
// RBAC: clinical.tindakan (update/delete). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { TindakanItemParam, TindakanMedisUpdate } from "@/lib/schemas/tindakanMedis/tindakanMedis";
import { tindakanMedisService } from "@/lib/services/tindakanMedis/tindakanMedisService";

export const PATCH = route({
  resource: "clinical.tindakan",
  action: "update",
  params: TindakanItemParam,
  body: TindakanMedisUpdate,
  handler: async ({ params, body, actor }) =>
    reply(await tindakanMedisService.update(params.id, params.itemId, body, actor), {
      message: "Tindakan diperbarui",
    }),
});

export const DELETE = route({
  resource: "clinical.tindakan",
  action: "delete",
  params: TindakanItemParam,
  handler: async ({ params, actor }) => {
    await tindakanMedisService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Tindakan dihapus" });
  },
});
