// REST: /api/v1/inventory/receipts — Penerimaan (GoodsReceipt).
//   GET  ?status=&vendorId=&locationId=&cursor=&limit= → list
//   POST { vendorId, toLocationId, lines[], ... }        → buat draft (kode GRN-NNN auto)
// RBAC: `inventory.pengiriman` (read / create). Route tipis.

import { route, paginated, reply } from "@/lib/http/route";
import { GoodsReceiptQuery, CreateGoodsReceiptInput } from "@/lib/schemas/inventory/receipt";
import { receiptService } from "@/lib/services/inventory/receiptService";

export const GET = route({
  resource: "inventory.pengiriman",
  action: "read",
  query: GoodsReceiptQuery,
  handler: async ({ query }) => {
    const { items, cursor } = await receiptService.list(query);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "inventory.pengiriman",
  action: "create",
  body: CreateGoodsReceiptInput,
  handler: async ({ body, actor }) => reply(await receiptService.create(body, actor), { status: 201, message: "Draft penerimaan dibuat" }),
});
