// REST: GET /api/v1/spri — worklist admisi Rawat Inap (SPRI yang sudah terbit dari IGD).
//   ?status= → filter eksplisit; default = belum dikonsumsi (MenungguRef + Terbit).
// RBAC: registration.kunjungan:read (petugas loket/admisi). SPRI = artefak admisi (bukan
// clinical.*), lintas-kunjungan → scopeKunjungan:false.

import { route, reply } from "@/lib/http/route";
import { SpriQuery } from "@/lib/schemas/disposisi/disposisi";
import { spriService } from "@/lib/services/spri/spriService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: false,
  query: SpriQuery,
  handler: async ({ query, actor }) => reply(await spriService.listWorklist(query, actor)),
});
