// REST: POST /api/v1/kunjungan/:id/resep/:resepId/cancel — batalkan order resep (retraksi DPJP).
// Hanya saat status "Menunggu" (Farmasi belum menerima) → status Dibatalkan. RBAC clinical.resep:update
// (Dokter; Perawat hanya read). ABAC careUnit ditegakkan route() via params.id (kunjungan).

import { route, reply } from "@/lib/http/route";
import { ResepCancelParams } from "@/lib/schemas/resep/resep";
import { resepService } from "@/lib/services/resep/resepService";

export const POST = route({
  resource: "clinical.resep",
  action: "update",
  params: ResepCancelParams,
  handler: async ({ params, actor }) =>
    reply(await resepService.cancel(params.id, params.resepId, actor), { message: "Order resep dibatalkan" }),
});
