// REST: /api/v1/inventory/stock?locationId= — Daftar Barang (saldo per item di lokasi + katalog).
// RBAC: `inventory.barang:read`. Route tipis.

import { route, reply } from "@/lib/http/route";
import { StockListQuery } from "@/lib/schemas/inventory/stock";
import { stockService } from "@/lib/services/inventory/stockService";

export const GET = route({
  resource: "inventory.barang",
  action: "read",
  query: StockListQuery,
  handler: async ({ query }) => reply(await stockService.listStock(query.locationId)),
});
