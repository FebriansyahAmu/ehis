// REST: /api/v1/master/rad-catalog — katalog radiologi (per modalitas + protap/DRL/template).
//   GET  ?q=&modalitas=&kategori=&status=&cursor=&limit=  → list + keyset cursor
//   POST                                                  → tambah 1 (201, kode auto RAD-NNNN)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply, paginated } from "@/lib/http/route";
import { RadCatalogQuery, CreateRadCatalogInput } from "@/lib/schemas/master/radCatalog";
import { radCatalogService } from "@/lib/services/master/radCatalogService";

export const GET = route({
  resource: "master.katalog",
  action: "read",
  query: RadCatalogQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await radCatalogService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.katalog",
  action: "create",
  body: CreateRadCatalogInput,
  handler: async ({ body, actor }) =>
    reply(await radCatalogService.create(body, actor), {
      status: 201,
      message: `Pemeriksaan "${body.nama}" ditambahkan`,
    }),
});
