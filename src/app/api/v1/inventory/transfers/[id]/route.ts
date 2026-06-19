// REST: /api/v1/inventory/transfers/:id — detail transfer.
// RBAC: `inventory.pengiriman:read`. Route tipis.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/transfer";
import { transferService } from "@/lib/services/inventory/transferService";

export const GET = route({
  resource: "inventory.pengiriman",
  action: "read",
  params: IdParam,
  handler: async ({ params }) => reply(await transferService.get(params.id)),
});
