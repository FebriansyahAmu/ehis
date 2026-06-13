// REST: /api/v1/master/obat/:id — obat tunggal.
//   PATCH  → ubah parsial (kfa = replace utuh bila dikirim)
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateObatInput } from "@/lib/schemas/master/obat";
import { obatService } from "@/lib/services/master/obatService";

export const PATCH = route({
  resource: "master.katalog",
  action: "update",
  params: IdParam,
  body: UpdateObatInput,
  handler: async ({ params, body, actor }) => {
    const dto = await obatService.update(params.id, body, actor);
    return reply(dto, { message: `Obat "${dto.namaGenerik}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.katalog",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await obatService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Obat dihapus" });
  },
});
