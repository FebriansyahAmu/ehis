// REST: /api/v1/inventory/transfers — Transfer antar lokasi farmasi (StockTransfer).
//   GET  ?status=&fromLocationId=&toLocationId=&cursor=&limit= → list
//   POST { fromLocationId, toLocationId, lines[] }              → buat draft (reservasi sumber)
// RBAC: `inventory.pengiriman` (read / create). Route tipis.

import { route, paginated, reply } from "@/lib/http/route";
import { StockTransferQuery, CreateStockTransferInput } from "@/lib/schemas/inventory/transfer";
import { transferService } from "@/lib/services/inventory/transferService";

export const GET = route({
  resource: "inventory.pengiriman",
  action: "read",
  query: StockTransferQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await transferService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "inventory.pengiriman",
  action: "create",
  body: CreateStockTransferInput,
  handler: async ({ body, actor }) => reply(await transferService.create(body, actor), { status: 201, message: "Draft transfer dibuat — stok sumber direservasi" }),
});
