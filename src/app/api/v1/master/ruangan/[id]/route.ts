// REST: /api/v1/master/ruangan/:id — Ruangan tunggal (BACKEND-MASTER-SUMBER-DAYA §A.4.4).
//   PATCH                       → ubah + version guard
//   DELETE ?expectedVersion=    → soft-delete (guard: tak punya bed) + version guard
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateRuanganInput, DeleteQuery } from "@/lib/schemas/ruangan";
import { ruanganService } from "@/lib/services/ruanganService";

export const PATCH = route({
  resource: "master.ruangan",
  action: "update",
  params: IdParam,
  body: UpdateRuanganInput,
  handler: async ({ params, body, actor }) => {
    const loc = await ruanganService.updateRuangan(params.id, body, actor);
    return reply(loc, { message: `Ruangan ${loc.name} diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.ruangan",
  action: "delete",
  params: IdParam,
  query: DeleteQuery,
  handler: async ({ params, query, actor }) => {
    await ruanganService.deleteRuangan(params.id, query.expectedVersion, actor);
    return reply({ id: params.id }, { message: "Ruangan dihapus" });
  },
});
