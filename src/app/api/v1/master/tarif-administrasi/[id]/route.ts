// REST: /api/v1/master/tarif-administrasi/:id — cabut 1 tarif administrasi (hard delete → "belum diisi").
// RBAC: resource `master.tarif`, action delete.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/tarifAdministrasi";
import { tarifAdministrasiService } from "@/lib/services/master/tarifAdministrasiService";

export const DELETE = route({
  resource: "master.tarif",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await tarifAdministrasiService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Tarif administrasi dihapus" });
  },
});
