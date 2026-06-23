// REST: /api/v1/rad/orders/:id/akuisisi — akuisisi & dosis radiologi (OPSIONAL).
//   GET  → akuisisi terbaru order (null bila belum ada)
//   POST → simpan sesi akuisisi; transisi order Diterima → Diperiksa (atomik, opsional)
// RBAC: ancillary.rad.worklist (read/update) — radiografer pelaksana. Lintas-kunjungan (scopeKunjungan:false).
// ABAC SDM Assignment ditegakkan di Service (aktor harus ter-assign Radiologi).

import { route, reply } from "@/lib/http/route";
import { RadOrderIdParam } from "@/lib/schemas/rad/radOrder";
import { SaveRadAkuisisiInput } from "@/lib/schemas/rad/radAkuisisi";
import { radAkuisisiService } from "@/lib/services/rad/radAkuisisiService";

export const GET = route({
  resource: "ancillary.rad.worklist",
  action: "read",
  scopeKunjungan: false,
  params: RadOrderIdParam,
  handler: ({ params, actor }) => radAkuisisiService.getAkuisisi(params.id, actor),
});

export const POST = route({
  resource: "ancillary.rad.worklist",
  action: "update",
  scopeKunjungan: false,
  params: RadOrderIdParam,
  body: SaveRadAkuisisiInput,
  handler: async ({ params, body, actor }) =>
    reply(await radAkuisisiService.saveAkuisisi(params.id, body, actor), {
      message: "Akuisisi tersimpan",
    }),
});
