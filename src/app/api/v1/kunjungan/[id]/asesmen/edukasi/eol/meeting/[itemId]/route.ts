// REST: rekam medis — Asesmen Medis · Edukasi · EOL · Family Meeting (per-item).
//   DELETE /api/v1/kunjungan/:id/asesmen/edukasi/eol/meeting/:itemId → soft-delete 1 pertemuan.

import { route, reply } from "@/lib/http/route";
import { EdukasiEolMeetingParam } from "@/lib/schemas/asesmenMedis/edukasiEol";
import { edukasiEolService } from "@/lib/services/asesmenMedis/edukasiEolService";

export const DELETE = route({
  resource: "clinical.igd",
  action: "delete",
  params: EdukasiEolMeetingParam,
  handler: async ({ params, actor }) => {
    await edukasiEolService.deleteMeeting(params.id, params.itemId, actor);
    return reply(null, { message: "Catatan pertemuan dihapus" });
  },
});
