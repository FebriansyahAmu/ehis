// REST: /api/v1/master/asesmen-katalog — master katalog asesmen klinis (referensi dropdown).
//   GET  ?q=&kategori=&status=&limit=  → list (filter)
//   POST                               → tambah 1 item (201, kode auto <PREFIX>-NNN)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error. Gate master.katalog.

import { route, reply } from "@/lib/http/route";
import { AsesmenQuery, CreateAsesmenInput } from "@/lib/schemas/master/asesmenKatalog";
import { asesmenKatalogService } from "@/lib/services/master/asesmenKatalogService";

export const GET = route({
  resource: "master.katalog",
  action: "read",
  query: AsesmenQuery,
  handler: async ({ query }) => {
    const { items } = await asesmenKatalogService.list(query);
    return reply(items);
  },
});

export const POST = route({
  resource: "master.katalog",
  action: "create",
  body: CreateAsesmenInput,
  handler: async ({ body, actor }) =>
    reply(await asesmenKatalogService.create(body, actor), {
      status: 201,
      message: `Item "${body.nama}" ditambahkan`,
    }),
});
