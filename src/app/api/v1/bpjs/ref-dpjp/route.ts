// GET /api/v1/bpjs/ref-dpjp — picker referensi DPJP BPJS (search + filter spesialis).
// RBAC: master.mapping:read.

import { route } from "@/lib/http/route";
import { RefDpjpQuery } from "@/lib/schemas/bpjs/dpjpMapping";
import { searchRef } from "@/lib/services/bpjs/dpjpMappingService";

export const GET = route({
  resource: "master.mapping",
  action: "read",
  scopeKunjungan: false,
  query: RefDpjpQuery,
  handler: ({ query }) => searchRef(query),
});
