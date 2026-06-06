// REST: /api/v1/master/penugasan-ruangan/:id — penugasan tunggal.
//   DELETE → lepas penugasan (hard delete).
import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/penugasanRuangan";
import { penugasanRuanganService } from "@/lib/services/penugasanRuanganService";

export const DELETE = route({
  resource: "master.penugasan-ruangan",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await penugasanRuanganService.deletePenugasan(params.id, actor);
    return reply({ id: params.id }, { message: "Penugasan dilepas" });
  },
});
