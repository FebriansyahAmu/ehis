// REST: /api/v1/master/formularium-bmhp/:id — edge mapping tunggal.
//   DELETE → cabut ketersediaan (hard delete).
// RBAC: `master.mapping:update` (mengubah mapping Hub — sama dgn formularium obat; resource ini
// hanya punya aksi read/update, lihat rbacShared).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/formulariumBmhp";
import { formulariumBmhpService } from "@/lib/services/master/formulariumBmhpService";

export const DELETE = route({
  resource: "master.mapping",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await formulariumBmhpService.revoke(params.id, actor);
    return reply({ id: params.id }, { message: "Ketersediaan BMHP dicabut" });
  },
});
