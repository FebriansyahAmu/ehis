// REST: /api/v1/inventory/receipts/:id — detail penerimaan.
// RBAC: `inventory.pengiriman:read`. Route tipis.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/receipt";
import { receiptService } from "@/lib/services/inventory/receiptService";

export const GET = route({
  resource: "inventory.pengiriman",
  action: "read",
  params: IdParam,
  handler: async ({ params }) => reply(await receiptService.get(params.id)),
});
