// REST: Asesmen Medis · Riwayat · Penyakit Dahulu (TODO-CLINICAL Domain 3, shared IGD/RI/RJ).
//   GET  /api/v1/kunjungan/:id/asesmen/penyakit-dahulu  → terbaru (null bila belum ada)
//   POST /api/v1/kunjungan/:id/asesmen/penyakit-dahulu  → simpan (append)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenPenyakitDahuluInput } from "@/lib/schemas/asesmenMedis/asesmenPenyakitDahulu";
import { asesmenPenyakitDahuluService } from "@/lib/services/asesmenMedis/asesmenPenyakitDahuluService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenPenyakitDahuluService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: AsesmenPenyakitDahuluInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenPenyakitDahuluService.save(params.id, body, actor), {
      status: 201,
      message: "Riwayat penyakit dahulu tersimpan",
    }),
});
