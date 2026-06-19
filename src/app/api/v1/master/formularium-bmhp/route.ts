// REST: /api/v1/master/formularium-bmhp — koleksi Ketersediaan Farmasi sub BMHP (BMHP ⇄ Ruangan).
//   GET  ?bmhpId=&locationId=&cursor=&limit=  → list/filter (cursor pagination)
//   POST { bmhpId, locationId }               → beri ketersediaan (idempoten)
// RBAC: resource `master.mapping` (pane Mapping Hub) — read utk GET, update utk grant.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { FormulariumBmhpQuery, GrantFormulariumBmhpInput } from "@/lib/schemas/master/formulariumBmhp";
import { formulariumBmhpService } from "@/lib/services/master/formulariumBmhpService";

export const GET = route({
  resource: "master.mapping",
  action: "read",
  query: FormulariumBmhpQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await formulariumBmhpService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.mapping",
  action: "update",
  body: GrantFormulariumBmhpInput,
  handler: async ({ body, actor }) => {
    const { edge, created } = await formulariumBmhpService.grant(body, actor);
    return reply(edge, {
      status: created ? 201 : 200,
      message: created ? "BMHP masuk daftar standar depo" : "Ketersediaan sudah ada",
    });
  },
});
