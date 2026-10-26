// POST /api/v1/fhir/outbox/run — jalankan 1 tick outbox manual (≤50 job). RBAC: fhir.sync:create.

import { route, reply } from "@/lib/http/route";
import { OutboxRunInput } from "@/lib/schemas/fhir/outbox";
import { run } from "@/lib/services/fhir/outboxService";

export const POST = route({
  resource: "fhir.sync",
  action: "create",
  scopeKunjungan: false,
  body: OutboxRunInput,
  handler: async ({ body }) => {
    const r = await run(body.limit);
    return reply(r, {
      message: `${r.diproses} job diproses: ${r.acked} terkirim · ${r.dijadwalUlang} dijadwal ulang · ${r.failed} gagal · ${r.skipped} dilewati`,
    });
  },
});
