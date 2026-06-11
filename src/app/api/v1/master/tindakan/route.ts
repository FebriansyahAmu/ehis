// REST: /api/v1/master/tindakan — katalog tindakan medis.
//   GET  ?q=&kategori=&kompleksitas=&status=&cursor=&limit=  → list + keyset cursor
//   POST                                                     → tambah 1 tindakan (201)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply, paginated } from "@/lib/http/route";
import { TindakanQuery, CreateTindakanInput } from "@/lib/schemas/master/tindakan";
import { tindakanService } from "@/lib/services/master/tindakanService";

export const GET = route({
  resource: "master.katalog",
  action: "read",
  query: TindakanQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await tindakanService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.katalog",
  action: "create",
  body: CreateTindakanInput,
  handler: async ({ body, actor }) =>
    reply(await tindakanService.create(body, actor), {
      status: 201,
      message: `Tindakan "${body.nama}" ditambahkan`,
    }),
});
