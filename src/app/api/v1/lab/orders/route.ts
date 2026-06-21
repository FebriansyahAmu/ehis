// REST: /api/v1/lab/orders — worklist order lab masuk ke Laboratorium (lintas-kunjungan).
//   GET ?labKode=&status=&noRM= → daftar order (header + pasien + items) untuk diproses.
// RBAC: gate ancillary.lab.worklist:read (analis/SpPK) — penunjang berdiri-sendiri.
// Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).

import { route, reply } from "@/lib/http/route";
import { LabWorklistQuery } from "@/lib/schemas/lab/labOrder";
import { labOrderService } from "@/lib/services/lab/labOrderService";

export const GET = route({
  resource: "ancillary.lab.worklist",
  action: "read",
  scopeKunjungan: false,
  query: LabWorklistQuery,
  handler: async ({ query, actor }) => reply(await labOrderService.listForLab(query, actor)),
});
