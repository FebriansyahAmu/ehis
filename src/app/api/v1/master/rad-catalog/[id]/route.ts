// REST: /api/v1/master/rad-catalog/:id — pemeriksaan radiologi tunggal.
//   PATCH  → ubah parsial (blok tat/persiapan/kontras/drl/reporting = replace utuh bila dikirim)
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateRadCatalogInput } from "@/lib/schemas/master/radCatalog";
import { radCatalogService } from "@/lib/services/master/radCatalogService";

export const PATCH = route({
  resource: "master.katalog",
  action: "update",
  params: IdParam,
  body: UpdateRadCatalogInput,
  handler: async ({ params, body, actor }) => {
    const dto = await radCatalogService.update(params.id, body, actor);
    return reply(dto, { message: `Pemeriksaan "${dto.nama}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.katalog",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await radCatalogService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Pemeriksaan dihapus" });
  },
});
