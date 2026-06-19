// REST: /api/v1/inventory/stock/policy — atur kebijakan reorder (min/ROP/max) per item × lokasi.
// RBAC: `inventory.barang:update`. Route tipis.

import { route, reply } from "@/lib/http/route";
import { SetStockPolicyInput } from "@/lib/schemas/inventory/stock";
import { stockService } from "@/lib/services/inventory/stockService";

export const PATCH = route({
  resource: "inventory.barang",
  action: "update",
  body: SetStockPolicyInput,
  handler: async ({ body }) => reply(await stockService.setPolicy(body), { message: "Kebijakan stok diperbarui" }),
});
