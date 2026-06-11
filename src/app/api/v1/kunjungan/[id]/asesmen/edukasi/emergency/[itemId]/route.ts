// REST: rekam medis — Asesmen Medis · Edukasi · Emergency (per-item).
//   DELETE /api/v1/kunjungan/:id/asesmen/edukasi/emergency/:itemId → soft-delete 1 instruksi.

import { route, reply } from "@/lib/http/route";
import { EdukasiEmergencyItemParam } from "@/lib/schemas/asesmenMedis/edukasiEmergency";
import { edukasiEmergencyService } from "@/lib/services/asesmenMedis/edukasiEmergencyService";

export const DELETE = route({
  resource: "clinical.rekammedis",
  action: "delete",
  params: EdukasiEmergencyItemParam,
  handler: async ({ params, actor }) => {
    await edukasiEmergencyService.deleteItem(params.id, params.itemId, actor);
    return reply(null, { message: "Instruksi emergency dihapus" });
  },
});
