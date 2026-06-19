// REST: /api/v1/inventory/locations — lokasi farmasi (Depo/Gudang) untuk dropdown Daftar Barang.
// RBAC: `inventory.barang:read`. Route tipis.

import { route, reply } from "@/lib/http/route";
import { stockService } from "@/lib/services/inventory/stockService";

export const GET = route({
  resource: "inventory.barang",
  action: "read",
  handler: async () => reply(await stockService.listLocations()),
});
