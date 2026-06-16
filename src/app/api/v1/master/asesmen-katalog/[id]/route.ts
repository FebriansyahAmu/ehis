// REST: /api/v1/master/asesmen-katalog/:id — item asesmen tunggal.
//   PATCH  → ubah parsial (kode & kategori immutable)
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateAsesmenInput } from "@/lib/schemas/master/asesmenKatalog";
import { asesmenKatalogService } from "@/lib/services/master/asesmenKatalogService";

export const PATCH = route({
  resource: "master.katalog",
  action: "update",
  params: IdParam,
  body: UpdateAsesmenInput,
  handler: async ({ params, body, actor }) => {
    const dto = await asesmenKatalogService.update(params.id, body, actor);
    return reply(dto, { message: `Item "${dto.nama}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.katalog",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await asesmenKatalogService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Item dihapus" });
  },
});
