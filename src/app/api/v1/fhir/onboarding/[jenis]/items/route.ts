// GET /api/v1/fhir/onboarding/:jenis/items — daftar data lokal 1 langkah Prerequisites
// (organization | location | practitioner | patient) + status peta IHS di mode aktif.
// ?q= cari kode/nama · ?status=semua|terpetakan|belum · ?page=&pageSize=. RBAC fhir.sync:read.

import { route } from "@/lib/http/route";
import { PrereqItemsParams, PrereqItemsQuery } from "@/lib/schemas/fhir/onboarding";
import { listItems } from "@/lib/services/fhir/prerequisiteService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  params: PrereqItemsParams,
  query: PrereqItemsQuery,
  handler: ({ params, query }) => listItems(params.jenis, query),
});
