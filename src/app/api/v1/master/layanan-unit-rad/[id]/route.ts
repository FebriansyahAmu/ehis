// REST: /api/v1/master/layanan-unit-rad/:id — edge mapping radiologi tunggal.
//   DELETE → cabut layanan (hard delete).
// RBAC: `master.mapping:update` (mengubah mapping Hub).
import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/layananUnitRad";
import { layananUnitRadService } from "@/lib/services/master/layananUnitRadService";

export const DELETE = route({
  resource: "master.mapping",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await layananUnitRadService.revoke(params.id, actor);
    return reply({ id: params.id }, { message: "Layanan radiologi dicabut" });
  },
});
