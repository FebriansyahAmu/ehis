// REST: rekam medis — tab Keperawatan, per-item.
//   PATCH  /api/v1/kunjungan/:id/asuhan-keperawatan/:itemId → edit / verify (co-sign) / evaluasi shift
//   DELETE /api/v1/kunjungan/:id/asuhan-keperawatan/:itemId → soft-delete (entered-in-error)
// RBAC: clinical.keperawatan (update/delete). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { ItemParam, AsuhanKeperawatanUpdate } from "@/lib/schemas/keperawatan/asuhanKeperawatan";
import { asuhanKeperawatanService } from "@/lib/services/keperawatan/asuhanKeperawatanService";

export const PATCH = route({
  resource: "clinical.keperawatan",
  action: "update",
  params: ItemParam,
  body: AsuhanKeperawatanUpdate,
  handler: async ({ params, body, actor }) =>
    reply(await asuhanKeperawatanService.update(params.id, params.itemId, body, actor), {
      message: "Asuhan keperawatan diperbarui",
    }),
});

export const DELETE = route({
  resource: "clinical.keperawatan",
  action: "delete",
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await asuhanKeperawatanService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Asuhan keperawatan dihapus" });
  },
});
