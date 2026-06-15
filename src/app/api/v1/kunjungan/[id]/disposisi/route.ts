// REST: rekam medis — tab Pasien Pulang (disposisi / outcome episode).
//   GET /api/v1/kunjungan/:id/disposisi → disposisi terbaru (berlaku) atau null.
// PENULISAN disposisi via PATCH /kunjungan/:id/status action "complete" (atomik + kunci).
// RBAC: clinical.keperawatan (read). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/disposisi/disposisi";
import { disposisiService } from "@/lib/services/disposisi/disposisiService";

export const GET = route({
  resource: "clinical.keperawatan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await disposisiService.getLatest(params.id, actor)),
});
