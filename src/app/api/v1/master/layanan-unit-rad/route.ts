// REST: /api/v1/master/layanan-unit-rad — koleksi mapping Layanan Unit RADIOLOGI (RadCatalog ⇄ Ruangan).
//   GET  ?radCatalogId=&locationId=&cursor=&limit=  → list/filter (cursor pagination)
//   POST { radCatalogId, locationId }               → beri layanan (idempoten)
// RBAC: resource `master.mapping` — read utk GET, update utk grant.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { LayananRadQuery, GrantLayananRadInput } from "@/lib/schemas/master/layananUnitRad";
import { layananUnitRadService } from "@/lib/services/master/layananUnitRadService";

export const GET = route({
  resource: "master.mapping",
  action: "read",
  query: LayananRadQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await layananUnitRadService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.mapping",
  action: "update",
  body: GrantLayananRadInput,
  handler: async ({ body, actor }) => {
    const { edge, created } = await layananUnitRadService.grant(body, actor);
    return reply(edge, {
      status: created ? 201 : 200,
      message: created ? "Layanan radiologi ditambahkan" : "Layanan radiologi sudah ada",
    });
  },
});
