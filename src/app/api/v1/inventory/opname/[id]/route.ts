// REST: /api/v1/inventory/opname/:id — detail (GET) + simpan hitungan fisik (PATCH).
// RBAC: `inventory.opname` (read / update). Route tipis.

import { route, reply } from "@/lib/http/route";
import { IdParam, SaveOpnameCountsInput } from "@/lib/schemas/inventory/opname";
import { opnameService } from "@/lib/services/inventory/opnameService";

export const GET = route({
  resource: "inventory.opname",
  action: "read",
  params: IdParam,
  handler: async ({ params }) => reply(await opnameService.get(params.id)),
});

export const PATCH = route({
  resource: "inventory.opname",
  action: "update",
  params: IdParam,
  body: SaveOpnameCountsInput,
  handler: async ({ params, body, actor }) => reply(await opnameService.saveCounts(params.id, body, actor), { message: "Hitungan disimpan" }),
});
