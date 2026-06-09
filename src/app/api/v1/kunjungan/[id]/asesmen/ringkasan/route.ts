// REST: rekam medis — Asesmen Medis · RINGKASAN STATUS (read-only), shared IGD/RI/RJ.
//   GET /api/v1/kunjungan/:id/asesmen/ringkasan → flag terisi per sub-menu.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { ringkasanService } from "@/lib/services/asesmenMedis/ringkasanService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => ringkasanService.get(params.id, actor),
});
