// REST: /api/v1/inventory/dashboard/overview — agregat Beranda Inventory (KPI + low stock + expiring
// + pergerakan terkini). RBAC: `inventory.view:read`. Route tipis.

import { route, reply } from "@/lib/http/route";
import { dashboardService } from "@/lib/services/inventory/dashboardService";

export const GET = route({
  resource: "inventory.view",
  action: "read",
  handler: async () => reply(await dashboardService.overview()),
});
