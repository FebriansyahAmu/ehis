// REST: GET /api/v1/lab/orders/:id/petugas — roster petugas Lab (SDM Assignment ke Location
// Laboratorium). FE memakainya untuk: cek penerima (Penerimaan) & analis (Entry Hasil) sudah
// ter-assign, serta sumber dropdown validator (filter dokter di klien). RBAC
// ancillary.lab.worklist:read (penunjang berdiri-sendiri, lintas-kunjungan → scopeKunjungan:false).

import { route } from "@/lib/http/route";
import { LabOrderIdParam } from "@/lib/schemas/lab/labOrder";
import { labOrderService } from "@/lib/services/lab/labOrderService";

export const GET = route({
  resource: "ancillary.lab.worklist",
  action: "read",
  scopeKunjungan: false,
  params: LabOrderIdParam,
  handler: ({ params, actor }) => labOrderService.listPetugas(params.id, actor),
});
