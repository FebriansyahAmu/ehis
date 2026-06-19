// REST: /api/v1/inventory/transfers/:id/cancel — batalkan draft → lepas reservasi.
// RBAC: `inventory.pengiriman:update`.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/transfer";
import { transferService } from "@/lib/services/inventory/transferService";

export const POST = route({
  resource: "inventory.pengiriman",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await transferService.cancel(params.id, actor), { message: "Transfer dibatalkan — reservasi dilepas" }),
});
