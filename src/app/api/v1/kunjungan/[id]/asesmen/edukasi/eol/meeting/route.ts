// REST: rekam medis — Asesmen Medis · Edukasi · EOL · Family Meeting log.
//   POST /api/v1/kunjungan/:id/asesmen/edukasi/eol/meeting → tambah 1 pertemuan (append)

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { EdukasiEolMeetingInput } from "@/lib/schemas/asesmenMedis/edukasiEol";
import { edukasiEolService } from "@/lib/services/asesmenMedis/edukasiEolService";

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: EdukasiEolMeetingInput,
  handler: async ({ params, body, actor }) =>
    reply(await edukasiEolService.addMeeting(params.id, body, actor), {
      status: 201,
      message: "Catatan pertemuan tersimpan",
    }),
});
