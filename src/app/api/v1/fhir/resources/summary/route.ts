// GET /api/v1/fhir/resources/summary — jumlah resource terpetakan per resourceType (env aktif).
// RBAC: fhir.sync:read.

import { route } from "@/lib/http/route";
import { summary } from "@/lib/services/fhir/consoleService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  handler: () => summary(),
});
