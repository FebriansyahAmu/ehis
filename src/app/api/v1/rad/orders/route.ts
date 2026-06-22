// REST: /api/v1/rad/orders — worklist order rad masuk ke Radiologi (lintas-kunjungan).
//   GET ?radKode=&status=&noRM= → daftar order (header + pasien + items) untuk diproses.
// RBAC: gate ancillary.rad.worklist:read (radiografer/radiolog) — penunjang berdiri-sendiri.
// Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).

import { route, reply } from "@/lib/http/route";
import { RadWorklistQuery } from "@/lib/schemas/rad/radOrder";
import { radOrderService } from "@/lib/services/rad/radOrderService";

export const GET = route({
  resource: "ancillary.rad.worklist",
  action: "read",
  scopeKunjungan: false,
  query: RadWorklistQuery,
  handler: async ({ query, actor }) => reply(await radOrderService.listForRad(query, actor)),
});
