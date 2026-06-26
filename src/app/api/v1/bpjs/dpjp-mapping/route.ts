// GET /api/v1/bpjs/dpjp-mapping — board: semua dokter RS + status mapping kode DPJP BPJS.
// RBAC: master.mapping:read.

import { route } from "@/lib/http/route";
import { listBoard } from "@/lib/services/bpjs/dpjpMappingService";

export const GET = route({
  resource: "master.mapping",
  action: "read",
  scopeKunjungan: false,
  handler: () => listBoard(),
});
