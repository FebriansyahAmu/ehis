// REST: penyesuaian invoice level (Slice 2d — Fase 1).
//   PATCH /api/v1/kunjungan/:id/billing/invoice/adjustment  { diskonInvoice, materai, ppnPct, alasan?, expectedVersion? }
// RBAC: billing.invoice:update (staf billing, lintas-unit; scopeKunjungan default false).
// Charge tetap PROYEKSI — hanya diskon/materai/PPN level-invoice yang disimpan (Invoice.*).

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { InvoiceAdjustmentInput } from "@/lib/schemas/billing/payment";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const PATCH = route({
  resource: "billing.invoice",
  action: "update",
  params: IdParam,
  body: InvoiceAdjustmentInput,
  handler: ({ params, body, actor }) => billingInvoiceService.setAdjustment(params.id, body, actor),
});
