// REST: /api/v1/master/layanan-unit/:id — edge mapping tunggal.
//   DELETE → cabut layanan (hard delete).
// RBAC: `master.mapping:update` (mengubah mapping Hub).
import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/layananUnit";
import { layananUnitService } from "@/lib/services/master/layananUnitService";

export const DELETE = route({
  resource: "master.mapping",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await layananUnitService.revoke(params.id, actor);
    return reply({ id: params.id }, { message: "Layanan dicabut" });
  },
});
