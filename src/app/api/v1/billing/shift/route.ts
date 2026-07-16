// REST: shift kasir (papan + buka).
//   GET  /api/v1/billing/shift        → papan { active, open, recentClosed } (RBAC billing.kasir:read)
//   POST /api/v1/billing/shift        → buka shift (RBAC billing.kasir:create)
// Totals shift Open = proyeksi billing.payment (live); Closed = snapshot.

import { route } from "@/lib/http/route";
import { OpenShiftInput } from "@/lib/schemas/billing/shift";
import { shiftService } from "@/lib/services/billing/shiftService";

export const GET = route({
  resource: "billing.kasir",
  action: "read",
  handler: ({ actor }) => shiftService.board(actor),
});

export const POST = route({
  resource: "billing.kasir",
  action: "create",
  status: 201,
  body: OpenShiftInput,
  handler: ({ body, actor }) => shiftService.openShift(body, actor),
});
