// REST: /api/v1/master/lab-test/:id — tes laboratorium tunggal.
//   PATCH  → ubah parsial (parameters = replace-all bila dikirim)
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateLabTestInput } from "@/lib/schemas/master/labTest";
import { labTestService } from "@/lib/services/master/labTestService";

export const PATCH = route({
  resource: "master.katalog",
  action: "update",
  params: IdParam,
  body: UpdateLabTestInput,
  handler: async ({ params, body, actor }) => {
    const dto = await labTestService.update(params.id, body, actor);
    return reply(dto, { message: `Tes "${dto.nama}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.katalog",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await labTestService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Tes laboratorium dihapus" });
  },
});
