// REST: /api/v1/master/tarif-administrasi — koleksi Tarif Administrasi (Unit × Penjamin).
//   GET  ?unit=&penjaminKode=&cursor=&limit=  → list/filter (cursor)
//   POST { unit, penjaminKode, harga }        → set biaya administrasi (upsert by pair)
// RBAC: resource `master.tarif` — read utk GET, update utk upsert.

import { route, paginated, reply } from "@/lib/http/route";
import { TarifAdministrasiQuery, UpsertTarifAdministrasiInput } from "@/lib/schemas/master/tarifAdministrasi";
import { tarifAdministrasiService } from "@/lib/services/master/tarifAdministrasiService";

export const GET = route({
  resource: "master.tarif",
  action: "read",
  query: TarifAdministrasiQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await tarifAdministrasiService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.tarif",
  action: "update",
  body: UpsertTarifAdministrasiInput,
  handler: async ({ body, actor }) => {
    const dto = await tarifAdministrasiService.upsert(body, actor);
    return reply(dto, { message: "Tarif administrasi disimpan" });
  },
});
