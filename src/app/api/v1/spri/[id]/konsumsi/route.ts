// REST: POST /api/v1/spri/:id/konsumsi — tautkan kunjungan Rawat Inap hasil admisi → status
//   Dikonsumsi (keluar dari worklist; anti dobel-admisi). Dipanggil setelah DaftarKunjunganModal
//   (Rawat Inap) sukses.
// RBAC: registration.kunjungan:update (petugas loket/admisi). scopeKunjungan:false (id = SPRI).

import { route, reply } from "@/lib/http/route";
import { SpriIdParam, ConsumeSpriInput } from "@/lib/schemas/disposisi/disposisi";
import { spriService } from "@/lib/services/spri/spriService";

export const POST = route({
  resource: "registration.kunjungan",
  action: "update",
  scopeKunjungan: false,
  params: SpriIdParam,
  body: ConsumeSpriInput,
  handler: async ({ params, body, actor }) =>
    reply(await spriService.consume(params.id, body, actor), { message: "SPRI dikonsumsi — admisi Rawat Inap dibuat" }),
});
