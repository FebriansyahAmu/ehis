// REST: /api/v1/master/lab-test — katalog pemeriksaan laboratorium (Tes → Parameter).
//   GET  ?q=&kategori=&status=&cursor=&limit=  → list + keyset cursor
//   POST                                       → tambah 1 tes (+parameter) (201)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply, paginated } from "@/lib/http/route";
import { LabTestQuery, CreateLabTestInput } from "@/lib/schemas/master/labTest";
import { labTestService } from "@/lib/services/master/labTestService";

export const GET = route({
  resource: "master.katalog",
  action: "read",
  query: LabTestQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await labTestService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.katalog",
  action: "create",
  body: CreateLabTestInput,
  handler: async ({ body, actor }) =>
    reply(await labTestService.create(body, actor), {
      status: 201,
      message: `Tes "${body.nama}" ditambahkan`,
    }),
});
