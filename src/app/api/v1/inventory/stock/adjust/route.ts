// REST: /api/v1/inventory/stock/adjust — penyesuaian cepat stok 1 item (movement ADJUST).
// Alternatif ringan vs opname penuh. RBAC: `inventory.opname:create` (otoritas koreksi stok).

import { route, reply } from "@/lib/http/route";
import { AdjustStockInput } from "@/lib/schemas/inventory/stock";
import { stockService } from "@/lib/services/inventory/stockService";

export const POST = route({
  resource: "inventory.opname",
  action: "create",
  body: AdjustStockInput,
  handler: async ({ body, actor }) => reply(await stockService.adjust(body, actor), { message: "Stok disesuaikan" }),
});
