// REST: /api/v1/inventory/receipts/:id/post — POSTING penerimaan → stok bertambah (movement IN).
// RBAC: `inventory.pengiriman:update`. Idempoten (tolak bila sudah Selesai/Dibatalkan).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/inventory/receipt";
import { receiptService } from "@/lib/services/inventory/receiptService";

export const POST = route({
  resource: "inventory.pengiriman",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await receiptService.post(params.id, actor), { message: "Penerimaan diposting — stok diperbarui" }),
});
