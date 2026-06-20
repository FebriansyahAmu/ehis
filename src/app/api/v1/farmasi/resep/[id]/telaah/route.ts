// REST: POST /api/v1/farmasi/resep/:id/telaah — Apoteker menelaah resep:
// status "Diterima" → "Ditelaah" (Disetujui) | "Dikembalikan" (ditolak ke DPJP).
// RBAC ancillary.farmasi.telaah:update (Apoteker; lintas-kunjungan → scopeKunjungan:false).
// Guard: hanya order berstatus "Diterima". Fondasi: snapshot telaah belum dipersist.

import { route, reply } from "@/lib/http/route";
import { FarmasiResepIdParam, FarmasiTelaahInput } from "@/lib/schemas/resep/resep";
import { resepService } from "@/lib/services/resep/resepService";

export const POST = route({
  resource: "ancillary.farmasi.telaah",
  action: "update",
  scopeKunjungan: false,
  params: FarmasiResepIdParam,
  body: FarmasiTelaahInput,
  handler: async ({ params, body, actor }) =>
    reply(await resepService.telaah(params.id, body, actor), {
      message: body.result === "Disetujui" ? "Resep ditelaah — siap dispensasi" : "Resep dikembalikan ke DPJP",
    }),
});
