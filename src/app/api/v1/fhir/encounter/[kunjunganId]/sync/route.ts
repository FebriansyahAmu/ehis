// POST /api/v1/fhir/encounter/:kunjunganId/sync — antre sinkron Encounter manual (backfill
// kunjungan lama). Dikirim oleh outbox worker. RBAC: fhir.sync:create.

import { route, reply } from "@/lib/http/route";
import { KunjunganIdParam } from "@/lib/schemas/fhir/outbox";
import { enqueueManual } from "@/lib/services/fhir/outboxService";

export const POST = route({
  resource: "fhir.sync",
  action: "create",
  scopeKunjungan: false,
  params: KunjunganIdParam,
  handler: async ({ params }) => reply(await enqueueManual(params.kunjunganId), { message: "Sinkron Encounter diantre" }),
});
