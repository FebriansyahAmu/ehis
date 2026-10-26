// GET /api/v1/fhir/status — kesehatan integrasi SatuSehat (mode/config/token/circuit/outbox/audit).
// Tanpa nilai rahasia. RBAC: fhir.sync:read (konsol operator interop).

import { route } from "@/lib/http/route";
import { getStatus } from "@/lib/services/fhir/statusService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  handler: () => getStatus(),
});
