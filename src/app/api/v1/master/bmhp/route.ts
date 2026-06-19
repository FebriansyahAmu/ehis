// REST: /api/v1/master/bmhp — katalog BMHP/BHP RS.
//   GET  ?q=&kategori=&status=&cursor=&limit=  → list + keyset cursor
//   POST                                       → tambah 1 BMHP (201)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error. Gate `master.katalog`.

import { route, reply, paginated } from "@/lib/http/route";
import { BmhpQuery, CreateBmhpInput } from "@/lib/schemas/master/bmhp";
import { bmhpService } from "@/lib/services/master/bmhpService";

export const GET = route({
  resource: "master.katalog",
  action: "read",
  query: BmhpQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await bmhpService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.katalog",
  action: "create",
  body: CreateBmhpInput,
  handler: async ({ body, actor }) =>
    reply(await bmhpService.create(body, actor), {
      status: 201,
      message: `BMHP "${body.nama}" ditambahkan`,
    }),
});
