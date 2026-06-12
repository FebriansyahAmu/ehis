// REST: /api/v1/master/tarif-tindakan — koleksi Tarif Tindakan (Tindakan × Penjamin × Jenis Ruangan).
//   GET  ?tindakanId=&penjaminKode=&jenisRuangan=&cursor=&limit=  → list/filter (cursor)
//   POST { tindakanId, penjaminKode, jenisRuangan, harga }        → set harga (upsert by triple)
// RBAC: resource `master.tarif` (tarif = uang, gate khusus) — read utk GET, update utk upsert.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { TarifQuery, UpsertTarifInput } from "@/lib/schemas/master/tarifTindakan";
import { tarifTindakanService } from "@/lib/services/master/tarifTindakanService";

export const GET = route({
  resource: "master.tarif",
  action: "read",
  query: TarifQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await tarifTindakanService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.tarif",
  action: "update",
  body: UpsertTarifInput,
  handler: async ({ body, actor }) => {
    const dto = await tarifTindakanService.upsert(body, actor);
    return reply(dto, { message: "Tarif disimpan" });
  },
});
