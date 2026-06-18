// REST: /api/v1/master/tarif-rad-catalog — koleksi Tarif Rad Catalog (RadCatalog × Penjamin × Jenis Ruangan).
//   GET  ?radCatalogId=&penjaminKode=&jenisRuangan=&cursor=&limit=  → list/filter (cursor)
//   POST { radCatalogId, penjaminKode, jenisRuangan, harga }        → set harga (upsert by triple)
// RBAC: resource `master.tarif` (tarif = uang, gate khusus) — read utk GET, update utk upsert.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { TarifRadQuery, UpsertTarifRadInput } from "@/lib/schemas/master/tarifRadCatalog";
import { tarifRadCatalogService } from "@/lib/services/master/tarifRadCatalogService";

export const GET = route({
  resource: "master.tarif",
  action: "read",
  query: TarifRadQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await tarifRadCatalogService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.tarif",
  action: "update",
  body: UpsertTarifRadInput,
  handler: async ({ body, actor }) => {
    const dto = await tarifRadCatalogService.upsert(body, actor);
    return reply(dto, { message: "Tarif radiologi disimpan" });
  },
});
