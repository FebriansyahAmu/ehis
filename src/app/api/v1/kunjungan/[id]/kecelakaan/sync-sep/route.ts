// REST: POST /api/v1/kunjungan/:id/kecelakaan/sync-sep — jembatan Data Kecelakaan → SEP.jaminan.
// Menyalin lakaLantas + No. LP + tgl kejadian + kronologi + suplesi ke SEP aktif kunjungan
// (lokasiLaka DITUNDA). Gate registration.kunjungan:update. Route TIPIS.
import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { kecelakaanService } from "@/lib/services/kecelakaan/kecelakaanService";

export const POST = route({
  resource: "registration.kunjungan",
  action: "update",
  params: IdParam,
  handler: async ({ params, actor }) =>
    reply(await kecelakaanService.syncToSep(params.id, actor), {
      message: "Jaminan kecelakaan disinkronkan ke SEP",
    }),
});
