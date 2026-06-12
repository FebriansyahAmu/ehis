// REST: /api/v1/master/tarif-tindakan/:id — cabut 1 tarif (hard delete → "belum diisi").
// RBAC: resource `master.tarif`, action delete.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/tarifTindakan";
import { tarifTindakanService } from "@/lib/services/master/tarifTindakanService";

export const DELETE = route({
  resource: "master.tarif",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await tarifTindakanService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Tarif dihapus" });
  },
});
