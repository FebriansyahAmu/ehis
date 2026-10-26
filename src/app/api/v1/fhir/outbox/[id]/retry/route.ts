// POST /api/v1/fhir/outbox/:id/retry — antre ulang job Failed/Skipped (mis. setelah onboarding
// practitioner/location dilengkapi). RBAC: fhir.sync:update.

import { route, reply } from "@/lib/http/route";
import { OutboxIdParam } from "@/lib/schemas/fhir/outbox";
import { retry } from "@/lib/services/fhir/outboxService";

export const POST = route({
  resource: "fhir.sync",
  action: "update",
  scopeKunjungan: false,
  params: OutboxIdParam,
  handler: async ({ params }) => reply(await retry(params.id), { message: "Job diantre ulang" }),
});
