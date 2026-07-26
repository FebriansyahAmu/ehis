// REST: /api/v1/master/paket-layanan — katalog Paket Layanan (bundel).
//   GET  ?q=&kategori=&status=&cursor=&limit=  → list + keyset cursor
//   POST                                       → tambah 1 paket (201, kode auto PKT-NNNN)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error. RBAC `master.katalog`.

import { route, reply, paginated } from "@/lib/http/route";
import { PaketQuery, CreatePaketInput } from "@/lib/schemas/master/paketLayanan";
import { paketLayananService } from "@/lib/services/master/paketLayananService";

export const GET = route({
  resource: "master.katalog",
  action: "read",
  query: PaketQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await paketLayananService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.katalog",
  action: "create",
  body: CreatePaketInput,
  handler: async ({ body, actor }) =>
    reply(await paketLayananService.create(body, actor), {
      status: 201,
      message: `Paket "${body.nama}" ditambahkan`,
    }),
});
