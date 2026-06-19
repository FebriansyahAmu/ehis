// REST: /api/v1/master/bmhp/:id — BMHP tunggal.
//   PATCH  → ubah parsial
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateBmhpInput } from "@/lib/schemas/master/bmhp";
import { bmhpService } from "@/lib/services/master/bmhpService";

export const PATCH = route({
  resource: "master.katalog",
  action: "update",
  params: IdParam,
  body: UpdateBmhpInput,
  handler: async ({ params, body, actor }) => {
    const dto = await bmhpService.update(params.id, body, actor);
    return reply(dto, { message: `BMHP "${dto.nama}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.katalog",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await bmhpService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "BMHP dihapus" });
  },
});
