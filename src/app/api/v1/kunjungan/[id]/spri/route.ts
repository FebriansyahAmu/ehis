// REST: GET /api/v1/kunjungan/:id/spri — riwayat SPRI pasien (semua SPRI milik pasien dari
// kunjungan konteks; semua status, terbaru dulu). Konsumsi KLINIS panel kanan Disposisi RJ.
// RBAC: clinical.rekammedis:read. ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/disposisi/disposisi";
import { spriService } from "@/lib/services/spri/spriService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await spriService.listRiwayatByKunjungan(params.id, actor)),
});
