// REST: /api/v1/master/icd — katalog ICD-10/ICD-9.
//   GET  ?jenis=&q=&status=&cursor=&limit=  → list + keyset cursor
//   POST                                    → tambah 1 kode (201)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply, paginated } from "@/lib/http/route";
import { IcdQuery, CreateIcdInput } from "@/lib/schemas/master/icd";
import { icdService } from "@/lib/services/master/icdService";

export const GET = route({
  resource: "master.icd",
  action: "read",
  query: IcdQuery,
  handler: async ({ query, actor }) => {
    const { items, cursor } = await icdService.list(query, actor);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.icd",
  action: "create",
  body: CreateIcdInput,
  handler: async ({ body, actor }) =>
    reply(await icdService.create(body, actor), {
      status: 201,
      message: `Kode ${body.kode} ditambahkan`,
    }),
});
