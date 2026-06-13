// REST: /api/v1/master/sdki — katalog keperawatan (SDKI/SLKI/SIKI).
//   GET  ?q=&kategori=&jenis=&status=&cursor=&limit=  → list + keyset cursor
//   POST                                              → tambah 1 diagnosa (201, kode auto D.NNNN)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply, paginated } from "@/lib/http/route";
import { SdkiQuery, CreateSdkiInput } from "@/lib/schemas/master/sdki";
import { sdkiService } from "@/lib/services/master/sdkiService";

export const GET = route({
  resource: "master.katalog",
  action: "read",
  query: SdkiQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await sdkiService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.katalog",
  action: "create",
  body: CreateSdkiInput,
  handler: async ({ body, actor }) =>
    reply(await sdkiService.create(body, actor), {
      status: 201,
      message: `Diagnosa "${body.nama}" ditambahkan`,
    }),
});
