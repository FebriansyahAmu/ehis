// REST: POST /api/v1/farmasi/resep/:id/dispensing — Apoteker dispensing & serah:
// status "Ditelaah" → "Selesai" (obat disiapkan + diserahkan). RBAC
// ancillary.farmasi.serah:update (Apoteker; lintas-kunjungan → scopeKunjungan:false).
// Guard: hanya order berstatus "Ditelaah". Fondasi: lot/ED/serah-terima belum dipersist.

import { route, reply } from "@/lib/http/route";
import { FarmasiResepIdParam } from "@/lib/schemas/resep/resep";
import { resepService } from "@/lib/services/resep/resepService";

export const POST = route({
  resource: "ancillary.farmasi.serah",
  action: "update",
  scopeKunjungan: false,
  params: FarmasiResepIdParam,
  handler: async ({ params, actor }) =>
    reply(await resepService.dispensing(params.id, actor), { message: "Obat diserahkan — order selesai" }),
});
