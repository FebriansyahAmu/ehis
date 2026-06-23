// REST: GET /api/v1/kunjungan/:id/rad/:radId/hasil — hasil radiologi (klinis, read-only) untuk
// Riwayat Order Rad di tab klinis. RBAC clinical.tindakan:read (selaras read order rad); ABAC
// careUnit ditegakkan route() via params.id (kunjungan). Verifikasi order ∈ kunjungan di Service.

import { route, reply } from "@/lib/http/route";
import { RadCancelParams } from "@/lib/schemas/rad/radOrder";
import { radResultService } from "@/lib/services/rad/radResultService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  params: RadCancelParams,
  handler: async ({ params, actor }) =>
    reply(await radResultService.getHasilForKunjungan(params.id, params.radId, actor)),
});
