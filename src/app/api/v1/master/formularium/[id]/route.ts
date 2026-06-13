// REST: /api/v1/master/formularium/:id — edge mapping tunggal.
//   DELETE → cabut formularium (hard delete).
// RBAC: `master.mapping:update` (mengubah mapping Hub — sama dgn layanan-unit; resource ini hanya
// punya aksi read/update, lihat rbacShared).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/formularium";
import { formulariumService } from "@/lib/services/master/formulariumService";

export const DELETE = route({
  resource: "master.mapping",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await formulariumService.revoke(params.id, actor);
    return reply({ id: params.id }, { message: "Formularium dicabut" });
  },
});
