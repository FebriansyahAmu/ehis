// REST: /api/v1/lab/orders/:id/hasil — entry hasil pemeriksaan lab (per parameter).
//   GET  → hasil terbaru order (null bila belum ada)
//   POST → simpan hasil + transisi order → Divalidasi (atomik)
// RBAC: ancillary.lab.worklist (read/update) — analis/SpPK. Lintas-kunjungan (scopeKunjungan:false).

import { route, reply } from "@/lib/http/route";
import { LabOrderIdParam } from "@/lib/schemas/lab/labOrder";
import { SaveLabResultInput } from "@/lib/schemas/lab/labResult";
import { labResultService } from "@/lib/services/lab/labResultService";

export const GET = route({
  resource: "ancillary.lab.worklist",
  action: "read",
  scopeKunjungan: false,
  params: LabOrderIdParam,
  handler: ({ params, actor }) => labResultService.getHasil(params.id, actor),
});

export const POST = route({
  resource: "ancillary.lab.worklist",
  action: "update",
  scopeKunjungan: false,
  params: LabOrderIdParam,
  body: SaveLabResultInput,
  handler: async ({ params, body, actor }) =>
    reply(await labResultService.saveHasil(params.id, body, actor), { message: "Hasil lab tersimpan — menunggu validasi" }),
});
