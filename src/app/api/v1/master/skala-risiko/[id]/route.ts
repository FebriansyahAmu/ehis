// REST: /api/v1/master/skala-risiko/:id — skala risiko tunggal.
//   PATCH  → ubah parsial (items/interpretasi = replace utuh bila dikirim)
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateSkalaRisikoInput } from "@/lib/schemas/master/skalaRisiko";
import { skalaRisikoService } from "@/lib/services/master/skalaRisikoService";

export const PATCH = route({
  resource: "master.skala",
  action: "update",
  params: IdParam,
  body: UpdateSkalaRisikoInput,
  handler: async ({ params, body, actor }) => {
    const dto = await skalaRisikoService.update(params.id, body, actor);
    return reply(dto, { message: `Skala "${dto.nama}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.skala",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await skalaRisikoService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Skala dihapus" });
  },
});
