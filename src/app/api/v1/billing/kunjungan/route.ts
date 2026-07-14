// REST: worklist "Tagihan Kunjungan" (READ-ONLY, Slice 1).
//   GET /api/v1/billing/kunjungan → daftar kunjungan yang punya order + total proyeksi.
// RBAC: billing.invoice:read (staf billing/kasir, lintas-unit). Sumber = agregat order (harga snapshot).

import { z } from "zod";
import { route } from "@/lib/http/route";
import { billingProjectionService } from "@/lib/services/billing/billingProjectionService";

const Query = z.object({
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export const GET = route({
  resource: "billing.invoice",
  action: "read",
  query: Query,
  handler: ({ query }) => billingProjectionService.listKunjunganBilling(query.limit),
});
