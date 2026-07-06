// REST: GET /api/v1/patients/:id/jadwal-kontrol — jadwal kontrol (surat kontrol) PASIEN lintas
//   kunjungan (terbaru dulu) → picker No. SKDP saat penerbitan SEP Rawat Jalan (kontrol pasca
//   rawat inap/jalan). RBAC: registration.kunjungan:read (loket/admisi). Lintas-kunjungan +
//   patient-level → scopeKunjungan:false.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/patient";
import { jadwalKontrolService } from "@/lib/services/jadwalKontrol/jadwalKontrolService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: false,
  params: IdParam,
  handler: async ({ params, actor }) => reply(await jadwalKontrolService.listByPatient(params.id, actor)),
});
