// REST: /api/v1/master/template-anamnesis/:id — template tunggal.
//   PATCH  → ubah parsial
//   DELETE → soft-delete
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateTemplateAnamnesisInput } from "@/lib/schemas/master/templateAnamnesis";
import { templateAnamnesisService } from "@/lib/services/master/templateAnamnesisService";

export const PATCH = route({
  resource: "master.konfigurasi",
  action: "update",
  params: IdParam,
  body: UpdateTemplateAnamnesisInput,
  handler: async ({ params, body, actor }) => {
    const dto = await templateAnamnesisService.update(params.id, body, actor);
    return reply(dto, { message: `Template "${dto.label}" diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.konfigurasi",
  action: "delete",
  params: IdParam,
  handler: async ({ params, actor }) => {
    await templateAnamnesisService.remove(params.id, actor);
    return reply({ id: params.id }, { message: "Template dihapus" });
  },
});
