// REST: proyeksi billing 1 kunjungan (READ-ONLY, Slice 1).
//   GET /api/v1/kunjungan/:id/billing → charge diproyeksikan dari order klinis + total.
// RBAC: billing.invoice:read (staf billing/kasir — LINTAS-unit; scopeKunjungan default false utk
// resource non-clinical, jadi tanpa careUnit lock). Sumber = tabel order (harga snapshot).

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { billingProjectionService } from "@/lib/services/billing/billingProjectionService";

export const GET = route({
  resource: "billing.invoice",
  action: "read",
  params: IdParam,
  handler: ({ params }) => billingProjectionService.projectByKunjungan(params.id),
});
