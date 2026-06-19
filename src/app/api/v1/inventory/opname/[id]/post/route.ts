// REST: /api/v1/inventory/opname/:id/post — POSTING opname → movement OPNAME per selisih.
// RBAC: `inventory.opname:update`. Idempoten (tolak bila sudah Posted / ada item belum dihitung).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/opname";
import { opnameService } from "@/lib/services/inventory/opnameService";

export const POST = route({
  resource: "inventory.opname",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await opnameService.post(params.id, actor), { message: "Opname diposting — selisih ditulis sebagai penyesuaian stok" }),
});
