// REST: /api/v1/master/icd/:id — kode ICD tunggal.
//   PATCH  → ubah parsial (jenis tetap)
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateIcdInput } from "@/lib/schemas/master/icd";
import { icdService } from "@/lib/services/master/icdService";

export const PATCH = route({
  resource: "master.icd",
  action: "update",
  params: IdParam,
  body: UpdateIcdInput,
  handler: async ({ params, body, actor }) => {
    const dto = await icdService.update(params.id, body, actor);
    return reply(dto, { message: `Kode ${dto.kode} diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.icd",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await icdService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Kode ICD dihapus" });
  },
});
