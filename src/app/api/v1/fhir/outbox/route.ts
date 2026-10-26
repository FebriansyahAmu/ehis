// GET /api/v1/fhir/outbox — daftar job sinkron SatuSehat (tanpa payload klinis). RBAC: fhir.sync:read.

import { route } from "@/lib/http/route";
import { OutboxListQuery } from "@/lib/schemas/fhir/outbox";
import { list } from "@/lib/services/fhir/outboxService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  query: OutboxListQuery,
  handler: ({ query }) => list(query),
});
