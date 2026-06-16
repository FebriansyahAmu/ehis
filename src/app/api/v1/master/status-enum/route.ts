// REST: /api/v1/master/status-enum — master katalog enum lintas-modul (9 grup × entri).
//   GET  ?q=&groupKey=&status=&limit=  → list (filter)
//   POST                               → tambah 1 entri (201, kode auto <PREFIX>-NNN)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error. Gate master.konfigurasi.

import { route, reply } from "@/lib/http/route";
import { EnumQuery, CreateEnumEntryInput } from "@/lib/schemas/master/statusEnum";
import { statusEnumService } from "@/lib/services/master/statusEnumService";

export const GET = route({
  resource: "master.konfigurasi",
  action: "read",
  query: EnumQuery,
  handler: async ({ query }) => {
    const { items } = await statusEnumService.list(query);
    return reply(items);
  },
});

export const POST = route({
  resource: "master.konfigurasi",
  action: "create",
  body: CreateEnumEntryInput,
  handler: async ({ body, actor }) =>
    reply(await statusEnumService.create(body, actor), {
      status: 201,
      message: `Entri "${body.label}" ditambahkan`,
    }),
});
