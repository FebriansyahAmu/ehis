// REST: /api/v1/master/tarif-rad-catalog/:id — cabut 1 tarif rad (hard delete → "belum diisi").
// RBAC: resource `master.tarif`, action delete.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/master/tarifRadCatalog";
import { tarifRadCatalogService } from "@/lib/services/master/tarifRadCatalogService";

export const DELETE = route({
  resource: "master.tarif",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await tarifRadCatalogService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Tarif radiologi dihapus" });
  },
});
