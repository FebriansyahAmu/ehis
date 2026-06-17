// REST: /api/v1/master/tarif-lab-test/:id — cabut 1 tarif lab (hard delete → "belum diisi").
// RBAC: resource `master.tarif`, action delete.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/tarifLabTest";
import { tarifLabTestService } from "@/lib/services/master/tarifLabTestService";

export const DELETE = route({
  resource: "master.tarif",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await tarifLabTestService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Tarif lab dihapus" });
  },
});
