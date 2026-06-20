// REST: /api/v1/inventory/opname/:id/cancel — BATALKAN sesi opname (sebelum posting) → Dibatalkan.
// RBAC: `inventory.opname:update`. Tolak bila sudah Posted / sudah Dibatalkan. Tak menyentuh ledger.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/opname";
import { opnameService } from "@/lib/services/inventory/opnameService";

export const POST = route({
  resource: "inventory.opname",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await opnameService.cancel(params.id, actor), { message: "Sesi opname dibatalkan" }),
});
