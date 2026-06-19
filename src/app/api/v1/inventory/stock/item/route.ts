// REST: /api/v1/inventory/stock/item?jenis=&itemId= — detail item (saldo lintas-lokasi + batch FEFO
// + pergerakan terkini). RBAC: `inventory.barang:read`. Route tipis.

import { route, reply } from "@/lib/http/route";
import { ItemDetailQuery } from "@/lib/schemas/inventory/stock";
import { stockService } from "@/lib/services/inventory/stockService";

export const GET = route({
  resource: "inventory.barang",
  action: "read",
  query: ItemDetailQuery,
  handler: async ({ query }) => reply(await stockService.itemDetail(query.jenis, query.itemId)),
});
