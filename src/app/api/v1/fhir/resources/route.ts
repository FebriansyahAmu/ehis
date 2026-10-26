// GET /api/v1/fhir/resources?type= — daftar resource terpetakan per resourceType (env aktif).
// RBAC: fhir.sync:read.

import { route } from "@/lib/http/route";
import { ResourceListQuery } from "@/lib/schemas/fhir/resources";
import { listResources } from "@/lib/services/fhir/consoleService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  query: ResourceListQuery,
  handler: ({ query }) => listResources(query),
});
