// REST: rekam medis — tab Serah Terima Shift, per-item.
//   PATCH  /api/v1/kunjungan/:id/serah-terima/:itemId → perawat masuk "Terima" (stamp penerima)
//   DELETE /api/v1/kunjungan/:id/serah-terima/:itemId → soft-delete (entered-in-error)
// RBAC: clinical.keperawatan (update/delete). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { ItemParam, ReceiveInput } from "@/lib/schemas/serahTerima/serahTerima";
import { serahTerimaService } from "@/lib/services/serahTerima/serahTerimaService";

export const PATCH = route({
  resource: "clinical.keperawatan",
  action: "update",
  params: ItemParam,
  body: ReceiveInput,
  handler: async ({ params, body, actor }) =>
    reply(await serahTerimaService.receive(params.id, params.itemId, body, actor), {
      message: "Serah terima diterima",
    }),
});

export const DELETE = route({
  resource: "clinical.keperawatan",
  action: "delete",
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await serahTerimaService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Serah terima dihapus" });
  },
});
