// REST: /api/v1/master/tarif-kamar/:id — cabut 1 tarif kamar (hard delete → "belum diisi").
// RBAC: resource `master.tarif`, action delete.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/tarifKamar";
import { tarifKamarService } from "@/lib/services/master/tarifKamarService";

export const DELETE = route({
  resource: "master.tarif",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await tarifKamarService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Tarif kamar dihapus" });
  },
});
