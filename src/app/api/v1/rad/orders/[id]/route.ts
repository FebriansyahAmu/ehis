// REST: GET /api/v1/rad/orders/:id — detail satu order rad (halaman Rad). Lintas-kunjungan.
// RBAC: gate ancillary.rad.worklist:read (radiografer/radiolog). scopeKunjungan:false (penunjang berdiri-sendiri).

import { route, reply } from "@/lib/http/route";
import { RadOrderIdParam } from "@/lib/schemas/rad/radOrder";
import { radOrderService } from "@/lib/services/rad/radOrderService";

export const GET = route({
  resource: "ancillary.rad.worklist",
  action: "read",
  scopeKunjungan: false,
  params: RadOrderIdParam,
  aksesLog: (o) => ({ kunjunganId: o.kunjunganId }), // log akses RM (pasien/unit diturunkan)
  handler: async ({ params, actor }) => reply(await radOrderService.getRadOne(params.id, actor)),
});
