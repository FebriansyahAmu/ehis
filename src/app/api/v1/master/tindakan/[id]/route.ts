// REST: /api/v1/master/tindakan/:id — tindakan tunggal.
//   PATCH  → ubah parsial
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateTindakanInput } from "@/lib/schemas/master/tindakan";
import { tindakanService } from "@/lib/services/master/tindakanService";

export const PATCH = route({
  resource: "master.katalog",
  action: "update",
  params: IdParam,
  body: UpdateTindakanInput,
  handler: async ({ params, body, actor }) => {
    const dto = await tindakanService.update(params.id, body, actor);
    return reply(dto, { message: `Tindakan "${dto.nama}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.katalog",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await tindakanService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Tindakan dihapus" });
  },
});
