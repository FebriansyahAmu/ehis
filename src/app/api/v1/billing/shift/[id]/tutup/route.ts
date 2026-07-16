// REST: tutup shift kasir.
//   PATCH /api/v1/billing/shift/:id/tutup → snapshot totals + hitung selisih server → Closed.
// RBAC billing.kasir:create (mutasi kas; resource billing.kasir hanya read/create). scopeKunjungan
// default false (id = shiftId, bukan kunjunganId).

import { route } from "@/lib/http/route";
import { CloseShiftInput, ShiftParam } from "@/lib/schemas/billing/shift";
import { shiftService } from "@/lib/services/billing/shiftService";

export const PATCH = route({
  resource: "billing.kasir",
  action: "create",
  params: ShiftParam,
  body: CloseShiftInput,
  handler: ({ params, body, actor }) => shiftService.closeShift(params.id, body, actor),
});
