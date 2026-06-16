// REST: /api/v1/master/status-enum/:id — entri enum tunggal.
//   PATCH  → ubah parsial (kode & groupKey immutable)
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateEnumEntryInput } from "@/lib/schemas/master/statusEnum";
import { statusEnumService } from "@/lib/services/master/statusEnumService";

export const PATCH = route({
  resource: "master.konfigurasi",
  action: "update",
  params: IdParam,
  body: UpdateEnumEntryInput,
  handler: async ({ params, body, actor }) => {
    const dto = await statusEnumService.update(params.id, body, actor);
    return reply(dto, { message: `Entri "${dto.label}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.konfigurasi",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await statusEnumService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Entri dihapus" });
  },
});
