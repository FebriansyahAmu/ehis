// REST: /api/v1/master/layanan-unit-lab/:id — edge mapping lab tunggal.
//   DELETE → cabut layanan (hard delete).
// RBAC: `master.mapping:update` (mengubah mapping Hub).
import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/layananUnitLab";
import { layananUnitLabService } from "@/lib/services/master/layananUnitLabService";

export const DELETE = route({
  resource: "master.mapping",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await layananUnitLabService.revoke(params.id, actor);
    return reply({ id: params.id }, { message: "Layanan lab dicabut" });
  },
});
