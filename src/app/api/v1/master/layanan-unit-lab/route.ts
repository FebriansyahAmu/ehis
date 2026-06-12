// REST: /api/v1/master/layanan-unit-lab — koleksi mapping Layanan Unit LAB (LabTest ⇄ Ruangan).
//   GET  ?labTestId=&locationId=&cursor=&limit=  → list/filter (cursor pagination)
//   POST { labTestId, locationId }               → beri layanan (idempoten)
// RBAC: pakai resource `master.mapping` (pane Mapping Hub) — read utk GET, update utk grant.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { LayananLabQuery, GrantLayananLabInput } from "@/lib/schemas/master/layananUnitLab";
import { layananUnitLabService } from "@/lib/services/master/layananUnitLabService";

export const GET = route({
  resource: "master.mapping",
  action: "read",
  query: LayananLabQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await layananUnitLabService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.mapping",
  action: "update",
  body: GrantLayananLabInput,
  handler: async ({ body, actor }) => {
    const { edge, created } = await layananUnitLabService.grant(body, actor);
    return reply(edge, {
      status: created ? 201 : 200,
      message: created ? "Layanan lab ditambahkan" : "Layanan lab sudah ada",
    });
  },
});
