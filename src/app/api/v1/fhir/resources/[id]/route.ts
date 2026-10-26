// GET /api/v1/fhir/resources/:id — detail 1 peta resource + payload (dibangun ulang dari data
// terkini, tidak disimpan). Berisi PII klinis → hanya operator fhir.sync. RBAC: fhir.sync:read.

import { route } from "@/lib/http/route";
import { ResourceIdParam } from "@/lib/schemas/fhir/resources";
import { getResource } from "@/lib/services/fhir/consoleService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  params: ResourceIdParam,
  handler: ({ params, actor }) => getResource(params.id, actor),
});
