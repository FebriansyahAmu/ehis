// REST: PATCH /api/v1/spri/:id/revisi — revisi & kirim ulang SPRI ke BPJS (retry No. Referensi).
//   Hanya saat status MenungguRef. Boleh setelah kunjungan IGD terkunci (SPRI = administratif,
//   bukan clinical.* → tak kena lock).
// RBAC: registration.kunjungan:update (petugas loket/admisi). scopeKunjungan:false (id = SPRI).

import { route, reply } from "@/lib/http/route";
import { SpriIdParam } from "@/lib/schemas/disposisi/disposisi";
import { spriService } from "@/lib/services/spri/spriService";

export const PATCH = route({
  resource: "registration.kunjungan",
  action: "update",
  scopeKunjungan: false,
  params: SpriIdParam,
  handler: async ({ params, actor }) =>
    reply(await spriService.revise(params.id, actor), { message: "SPRI dikirim ulang ke BPJS" }),
});
