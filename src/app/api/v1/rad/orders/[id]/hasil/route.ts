// REST: /api/v1/rad/orders/:id/hasil — ekspertise/hasil radiologi (laporan tunggal).
//   GET  → hasil terbaru order (null bila belum ada)
//   POST → simpan ekspertise; finalize=true → transisi order → Divalidasi (atomik)
// RBAC: ancillary.rad.expertise (read/create) — radiolog SpRad. Lintas-kunjungan (scopeKunjungan:false).

import { route, reply } from "@/lib/http/route";
import { RadOrderIdParam } from "@/lib/schemas/rad/radOrder";
import { SaveRadResultInput } from "@/lib/schemas/rad/radResult";
import { radResultService } from "@/lib/services/rad/radResultService";

export const GET = route({
  resource: "ancillary.rad.expertise",
  action: "read",
  scopeKunjungan: false,
  params: RadOrderIdParam,
  handler: ({ params, actor }) => radResultService.getHasil(params.id, actor),
});

export const POST = route({
  resource: "ancillary.rad.expertise",
  action: "create",
  scopeKunjungan: false,
  params: RadOrderIdParam,
  body: SaveRadResultInput,
  handler: async ({ params, body, actor }) =>
    reply(await radResultService.saveHasil(params.id, body, actor), {
      message: body.finalize ? "Laporan diterbitkan — menunggu validasi" : "Draft ekspertise tersimpan",
    }),
});
