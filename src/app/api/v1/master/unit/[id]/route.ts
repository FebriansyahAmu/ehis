// REST: /api/v1/master/unit/:id — Unit (Organization) tunggal.
//   PATCH                       → ubah + anti-cycle + version guard (root read-only)
//   DELETE ?expectedVersion=    → soft-delete (guard: tak punya sub-unit/ruangan)
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateUnitInput, DeleteQuery } from "@/lib/schemas/ruangan";
import { ruanganService } from "@/lib/services/ruanganService";

export const PATCH = route({
  resource: "master.ruangan",
  action: "update",
  params: IdParam,
  body: UpdateUnitInput,
  handler: async ({ params, body, actor }) => {
    const unit = await ruanganService.updateUnit(params.id, body, actor);
    return reply(unit, { message: `Unit ${unit.name} diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.ruangan",
  action: "delete",
  params: IdParam,
  query: DeleteQuery,
  handler: async ({ params, query, actor }) => {
    await ruanganService.deleteUnit(params.id, query.expectedVersion, actor);
    return reply({ id: params.id }, { message: "Unit dihapus" });
  },
});
