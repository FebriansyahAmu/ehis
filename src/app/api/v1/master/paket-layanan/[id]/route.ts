// REST: /api/v1/master/paket-layanan/:id — paket layanan tunggal.
//   PATCH  → ubah parsial (items = replace utuh bila dikirim)
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdatePaketInput } from "@/lib/schemas/master/paketLayanan";
import { paketLayananService } from "@/lib/services/master/paketLayananService";

export const PATCH = route({
  resource: "master.katalog",
  action: "update",
  params: IdParam,
  body: UpdatePaketInput,
  handler: async ({ params, body, actor }) => {
    const dto = await paketLayananService.update(params.id, body, actor);
    return reply(dto, { message: `Paket "${dto.nama}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.katalog",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await paketLayananService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Paket dihapus" });
  },
});
