// REST: GET /api/v1/kunjungan/:id/kecelakaan/suplesi-kandidat — SEP KLL terbit milik pasien
// (lintas kunjungan) sebagai kandidat No. SEP suplesi. Gate registration.kunjungan:read.
import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { kecelakaanService } from "@/lib/services/kecelakaan/kecelakaanService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await kecelakaanService.listSuplesiKandidat(params.id, actor)),
});
