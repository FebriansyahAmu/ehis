// REST: rekam medis — Asesmen Medis · Alergi (per-item).
//   DELETE /api/v1/kunjungan/:id/asesmen/alergi/:itemId → soft-delete 1 alergen.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { AlergiItemParam } from "@/lib/schemas/asesmenMedis/asesmenAlergi";
import { asesmenAlergiService } from "@/lib/services/asesmenMedis/asesmenAlergiService";

export const DELETE = route({
  resource: "clinical.rekammedis",
  action: "delete",
  params: AlergiItemParam,
  handler: async ({ params, actor }) => {
    await asesmenAlergiService.deleteItem(params.id, params.itemId, actor);
    return reply(null, { message: "Alergi dihapus" });
  },
});
