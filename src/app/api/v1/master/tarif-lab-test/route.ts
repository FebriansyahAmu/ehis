// REST: /api/v1/master/tarif-lab-test — koleksi Tarif Lab Test (LabTest × Penjamin × Jenis Ruangan).
//   GET  ?labTestId=&penjaminKode=&jenisRuangan=&cursor=&limit=  → list/filter (cursor)
//   POST { labTestId, penjaminKode, jenisRuangan, harga }        → set harga (upsert by triple)
// RBAC: resource `master.tarif` (tarif = uang, gate khusus) — read utk GET, update utk upsert.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { TarifLabQuery, UpsertTarifLabInput } from "@/lib/schemas/master/tarifLabTest";
import { tarifLabTestService } from "@/lib/services/master/tarifLabTestService";

export const GET = route({
  resource: "master.tarif",
  action: "read",
  query: TarifLabQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await tarifLabTestService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.tarif",
  action: "update",
  body: UpsertTarifLabInput,
  handler: async ({ body, actor }) => {
    const dto = await tarifLabTestService.upsert(body, actor);
    return reply(dto, { message: "Tarif lab disimpan" });
  },
});
