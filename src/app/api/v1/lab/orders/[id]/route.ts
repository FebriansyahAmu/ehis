// REST: GET /api/v1/lab/orders/:id — detail satu order lab (halaman Lab). Lintas-kunjungan.
// RBAC: gate ancillary.lab.worklist:read (analis/SpPK). scopeKunjungan:false (penunjang berdiri-sendiri).

import { route, reply } from "@/lib/http/route";
import { LabOrderIdParam } from "@/lib/schemas/lab/labOrder";
import { labOrderService } from "@/lib/services/lab/labOrderService";

export const GET = route({
  resource: "ancillary.lab.worklist",
  action: "read",
  scopeKunjungan: false,
  params: LabOrderIdParam,
  handler: async ({ params, actor }) => reply(await labOrderService.getLabOne(params.id, actor)),
});
