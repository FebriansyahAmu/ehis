// REST: ringkas billing 1 kunjungan untuk konsumen KLINIS (widget + gate discharge rekam medis RI).
//   GET /api/v1/kunjungan/:id/billing/ringkas
// RBAC: clinical.rekammedis:read (staf medis lihat sisa tagihan pasiennya — BUKAN billing.invoice
// yang hanya milik Kasir). scopeKunjungan default ON (ABAC careUnit) karena resource clinical.*.

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params }) => billingInvoiceService.getRingkas(params.id),
});
