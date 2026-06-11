// REST: rekam medis — Asesmen Medis · Edukasi · End of Life (ACP), shared IGD/RI/RJ.
//   GET  /api/v1/kunjungan/:id/asesmen/edukasi/eol  → { plan, meetings[] }
//   POST /api/v1/kunjungan/:id/asesmen/edukasi/eol  → simpan care plan (append latest-wins)
// Hapus pertemuan & tambah pertemuan → /…/eol/meeting (route terpisah). Route TIPIS.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { EdukasiEolInput } from "@/lib/schemas/asesmenMedis/edukasiEol";
import { edukasiEolService } from "@/lib/services/asesmenMedis/edukasiEolService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => edukasiEolService.get(params.id, actor),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: EdukasiEolInput,
  handler: async ({ params, body, actor }) =>
    reply(await edukasiEolService.savePlan(params.id, body, actor), {
      status: 201,
      message: "Rencana perawatan lanjutan tersimpan",
    }),
});
