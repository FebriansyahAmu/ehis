// REST: kandidat kasir (dropdown Buka Shift).
//   GET /api/v1/billing/kasir-users → [{ pegawaiId, nama }] user role "Kasir" + unitKerja kasir.
// RBAC billing.kasir:read.

import { route } from "@/lib/http/route";
import { shiftService } from "@/lib/services/billing/shiftService";

export const GET = route({
  resource: "billing.kasir",
  action: "read",
  handler: () => shiftService.listKasirUsers(),
});
