// REST: /api/v1/master/sdki/:id — diagnosa keperawatan tunggal.
//   PATCH  → ubah parsial (blok dataMayor/dataMinor/intervensi = replace utuh bila dikirim)
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateSdkiInput } from "@/lib/schemas/master/sdki";
import { sdkiService } from "@/lib/services/master/sdkiService";

export const PATCH = route({
  resource: "master.katalog",
  action: "update",
  params: IdParam,
  body: UpdateSdkiInput,
  handler: async ({ params, body, actor }) => {
    const dto = await sdkiService.update(params.id, body, actor);
    return reply(dto, { message: `Diagnosa "${dto.nama}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.katalog",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await sdkiService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Diagnosa dihapus" });
  },
});
