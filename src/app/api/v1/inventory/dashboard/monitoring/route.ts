// REST: /api/v1/inventory/dashboard/monitoring — agregat Monitoring (KPI + reorder + kedaluwarsa +
// nilai per lokasi + barang paling bergerak). RBAC: `inventory.monitoring:read`. Route tipis.

import { route, reply } from "@/lib/http/route";
import { dashboardService } from "@/lib/services/inventory/dashboardService";

export const GET = route({
  resource: "inventory.monitoring",
  action: "read",
  handler: async () => reply(await dashboardService.monitoring()),
});
