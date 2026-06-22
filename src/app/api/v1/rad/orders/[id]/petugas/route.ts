// REST: GET /api/v1/rad/orders/:id/petugas — roster petugas Radiologi (SDM Assignment ke Location
// Radiologi). FE memakainya untuk: cek penerima/radiografer/radiolog sudah ter-assign, serta sumber
// dropdown validator (filter dokter di klien). RBAC ancillary.rad.worklist:read (penunjang
// berdiri-sendiri, lintas-kunjungan → scopeKunjungan:false).

import { route } from "@/lib/http/route";
import { RadOrderIdParam } from "@/lib/schemas/rad/radOrder";
import { radOrderService } from "@/lib/services/rad/radOrderService";

export const GET = route({
  resource: "ancillary.rad.worklist",
  action: "read",
  scopeKunjungan: false,
  params: RadOrderIdParam,
  handler: ({ params, actor }) => radOrderService.listPetugas(params.id, actor),
});
