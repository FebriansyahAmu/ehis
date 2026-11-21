// GET /api/v1/fhir/log?localType=&localId=&kunjunganId=&cursor=&limit= — riwayat panggilan SatuSehat
// untuk 1 data (mode aktif), terbaru dulu, paginasi keyset. Metadata saja (isi via /log/:id).
// RBAC fhir.sync:read.

import { route } from "@/lib/http/route";
import { SendLogQuery } from "@/lib/schemas/fhir/sendLog";
import { listForTarget } from "@/lib/services/fhir/sendLogService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  query: SendLogQuery,
  handler: ({ query }) => listForTarget(query),
});
