// REST: /api/v1/master/tarif-kamar — koleksi Tarif Ruang Rawat (Kelas × Penjamin).
//   GET  ?kelas=&penjaminKode=&cursor=&limit=  → list/filter (cursor)
//   POST { kelas, penjaminKode, harga }        → set harga/hari (upsert by pair)
// RBAC: resource `master.tarif` (tarif = uang, gate khusus) — read utk GET, update utk upsert.

import { route, paginated, reply } from "@/lib/http/route";
import { TarifKamarQuery, UpsertTarifKamarInput } from "@/lib/schemas/master/tarifKamar";
import { tarifKamarService } from "@/lib/services/master/tarifKamarService";

export const GET = route({
  resource: "master.tarif",
  action: "read",
  query: TarifKamarQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await tarifKamarService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.tarif",
  action: "update",
  body: UpsertTarifKamarInput,
  handler: async ({ body, actor }) => {
    const dto = await tarifKamarService.upsert(body, actor);
    return reply(dto, { message: "Tarif kamar disimpan" });
  },
});
