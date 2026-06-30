// REST: /api/v1/master/template-anamnesis — koleksi template anamnesis.
//   GET  ?q=&kategori=&modul=&status=&cursor=&limit=  → list + keyset cursor
//   POST                                              → tambah 1 template (201)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply, paginated } from "@/lib/http/route";
import { TemplateAnamnesisQuery, CreateTemplateAnamnesisInput } from "@/lib/schemas/master/templateAnamnesis";
import { templateAnamnesisService } from "@/lib/services/master/templateAnamnesisService";

export const GET = route({
  resource: "master.konfigurasi",
  action: "read",
  query: TemplateAnamnesisQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await templateAnamnesisService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.konfigurasi",
  action: "create",
  body: CreateTemplateAnamnesisInput,
  handler: async ({ body, actor }) =>
    reply(await templateAnamnesisService.create(body, actor), {
      status: 201,
      message: `Template "${body.label}" ditambahkan`,
    }),
});
