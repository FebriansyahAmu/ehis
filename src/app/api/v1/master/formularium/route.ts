// REST: /api/v1/master/formularium — koleksi Formularium Unit (Obat ⇄ Ruangan).
//   GET  ?obatId=&locationId=&cursor=&limit=  → list/filter (cursor pagination)
//   POST { obatId, locationId }               → beri formularium (idempoten)
// RBAC: resource `master.mapping` (pane Mapping Hub) — read utk GET, update utk grant.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { FormulariumQuery, GrantFormulariumInput } from "@/lib/schemas/master/formularium";
import { formulariumService } from "@/lib/services/master/formulariumService";

export const GET = route({
  resource: "master.mapping",
  action: "read",
  query: FormulariumQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await formulariumService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "master.mapping",
  action: "update",
  body: GrantFormulariumInput,
  handler: async ({ body, actor }) => {
    const { edge, created } = await formulariumService.grant(body, actor);
    return reply(edge, {
      status: created ? 201 : 200,
      message: created ? "Obat masuk formularium unit" : "Formularium sudah ada",
    });
  },
});
