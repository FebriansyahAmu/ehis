// REST: GET /api/v1/kunjungan/:id/lab/:labId/hasil — hasil pemeriksaan lab (klinis, read-only)
// untuk Riwayat Order Lab di tab klinis. RBAC clinical.tindakan:read (selaras read order lab);
// ABAC careUnit ditegakkan route() via params.id (kunjungan). Verifikasi order ∈ kunjungan di Service.

import { route, reply } from "@/lib/http/route";
import { LabCancelParams } from "@/lib/schemas/lab/labOrder";
import { labResultService } from "@/lib/services/lab/labResultService";

export const GET = route({
  resource: "clinical.tindakan",
  action: "read",
  params: LabCancelParams,
  handler: async ({ params, actor }) =>
    reply(await labResultService.getHasilForKunjungan(params.id, params.labId, actor)),
});
