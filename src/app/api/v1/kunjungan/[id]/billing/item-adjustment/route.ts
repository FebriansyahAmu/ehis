// REST: penyesuaian per-baris charge (Slice 2d Fase 2).
//   POST   /api/v1/kunjungan/:id/billing/item-adjustment          set diskon/void 1 baris (upsert)
//   DELETE /api/v1/kunjungan/:id/billing/item-adjustment?sourceRef=…   hapus penyesuaian baris
// RBAC: billing.invoice:update. Charge = PROYEKSI → overlay disimpan di billing.ItemAdjustment.

import { z } from "zod";
import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { ItemAdjustmentInput } from "@/lib/schemas/billing/payment";
import { billingInvoiceService } from "@/lib/services/billing/billingInvoiceService";

export const POST = route({
  resource: "billing.invoice",
  action: "update",
  params: IdParam,
  body: ItemAdjustmentInput,
  handler: ({ params, body, actor }) => billingInvoiceService.setItemAdjustment(params.id, body, actor),
});

export const DELETE = route({
  resource: "billing.invoice",
  action: "update",
  params: IdParam,
  query: z.object({ sourceRef: z.string().trim().min(1).max(200) }),
  handler: ({ params, query, actor }) =>
    billingInvoiceService.removeItemAdjustment(params.id, query.sourceRef, actor),
});
