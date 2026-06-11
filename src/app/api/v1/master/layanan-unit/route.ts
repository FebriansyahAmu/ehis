// REST: /api/v1/master/layanan-unit — koleksi mapping Layanan Unit (Tindakan ⇄ Ruangan).
//   GET  ?tindakanId=&locationId=&cursor=&limit=  → list/filter (cursor pagination)
//   POST { tindakanId, locationId }               → beri layanan (idempoten)
// RBAC: pakai resource `master.mapping` (pane Mapping Hub) — read utk GET, update utk grant.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { LayananQuery, GrantLayananInput } from "@/lib/schemas/master/layananUnit";
import { layananUnitService } from "@/lib/services/master/layananUnitService";

export const GET = route({
  resource: "master.mapping",
  action: "read",
  query: LayananQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await layananUnitService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.mapping",
  action: "update",
  body: GrantLayananInput,
  handler: async ({ body, actor }) => {
    const { edge, created } = await layananUnitService.grant(body, actor);
    return reply(edge, {
      status: created ? 201 : 200,
      message: created ? "Layanan ditambahkan" : "Layanan sudah ada",
    });
  },
});
