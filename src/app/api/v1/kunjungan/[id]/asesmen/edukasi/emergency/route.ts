// REST: rekam medis — Asesmen Medis · Edukasi · Emergency (HPK 2), shared IGD/RI/RJ.
//   GET  /api/v1/kunjungan/:id/asesmen/edukasi/emergency  → riwayat instruksi (terbaru dulu)
//   POST /api/v1/kunjungan/:id/asesmen/edukasi/emergency  → simpan 1 instruksi (append)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { EdukasiEmergencyInput } from "@/lib/schemas/asesmenMedis/edukasiEmergency";
import { edukasiEmergencyService } from "@/lib/services/asesmenMedis/edukasiEmergencyService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => edukasiEmergencyService.list(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: EdukasiEmergencyInput,
  handler: async ({ params, body, actor }) =>
    reply(await edukasiEmergencyService.record(params.id, body, actor), {
      status: 201,
      message: "Instruksi emergency tersimpan",
    }),
});
