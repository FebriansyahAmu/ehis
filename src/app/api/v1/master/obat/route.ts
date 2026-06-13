// REST: /api/v1/master/obat — katalog obat RS.
//   GET  ?q=&kategori=&status=&cursor=&limit=  → list + keyset cursor
//   POST                                       → tambah 1 obat (201)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply, paginated } from "@/lib/http/route";
import { ObatQuery, CreateObatInput } from "@/lib/schemas/master/obat";
import { obatService } from "@/lib/services/master/obatService";

export const GET = route({
  resource: "master.katalog",
  action: "read",
  query: ObatQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await obatService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.katalog",
  action: "create",
  body: CreateObatInput,
  handler: async ({ body, actor }) =>
    reply(await obatService.create(body, actor), {
      status: 201,
      message: `Obat "${body.namaGenerik}" ditambahkan`,
    }),
});
