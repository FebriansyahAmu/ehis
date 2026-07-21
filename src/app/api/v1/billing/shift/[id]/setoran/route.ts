// REST: setoran kas shift kasir ke bendahara/keuangan.
//   POST /api/v1/billing/shift/:id/setoran → catat serah-terima uang tunai (1× per shift).
// Shift wajib sudah Closed; nomor STR + penyetor di-isi server (Service). RBAC billing.kasir:create
// (mutasi kas). scopeKunjungan default false (id = shiftId, bukan kunjunganId).

import { route } from "@/lib/http/route";
import { SetoranInput, ShiftParam } from "@/lib/schemas/billing/shift";
import { shiftService } from "@/lib/services/billing/shiftService";

export const POST = route({
  resource: "billing.kasir",
  action: "create",
  params: ShiftParam,
  body: SetoranInput,
  handler: ({ params, body, actor }) => shiftService.recordSetoran(params.id, body, actor),
});
