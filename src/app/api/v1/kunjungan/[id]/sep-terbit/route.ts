// REST: rekam medis — SEP TERBIT milik pasien kunjungan ini (lintas kunjungan, terbaru dulu).
//   GET /api/v1/kunjungan/:id/sep-terbit → picker No. SEP (mis. Jadwal Kontrol
//       RencanaKontrol/insert di tab Pasien Pulang); flag `kunjunganIni` = SEP kunjungan aktif.
// RBAC: clinical.rekammedis (read). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/jadwalKontrol/jadwalKontrol";
import { jadwalKontrolService } from "@/lib/services/jadwalKontrol/jadwalKontrolService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await jadwalKontrolService.listSepTerbit(params.id, actor)),
});
