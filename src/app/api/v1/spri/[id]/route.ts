// REST: PATCH /api/v1/spri/:id — revisi konten SPRI (UpdateSPRI ke BPJS bila ada No. Referensi).
//       DELETE /api/v1/spri/:id — batalkan SPRI (DeleteSPRI ke BPJS bila ada No. Referensi).
//   Tak berlaku utk SPRI yang sudah dikonsumsi (admisi dibuat) → batalkan via Batalkan Order RI.
// RBAC: registration.kunjungan:update (petugas loket/admisi). scopeKunjungan:false (id = SPRI).

import { route, reply } from "@/lib/http/route";
import { SpriIdParam, EditSpriInput } from "@/lib/schemas/disposisi/disposisi";
import { spriService } from "@/lib/services/spri/spriService";

export const PATCH = route({
  resource: "registration.kunjungan",
  action: "update",
  scopeKunjungan: false,
  params: SpriIdParam,
  body: EditSpriInput,
  handler: async ({ params, body, actor }) =>
    reply(await spriService.editSpri(params.id, body, actor), { message: "SPRI diperbarui" }),
});

export const DELETE = route({
  resource: "registration.kunjungan",
  action: "update",
  scopeKunjungan: false,
  params: SpriIdParam,
  handler: async ({ params, actor }) =>
    reply(await spriService.cancelSpri(params.id, actor), { message: "SPRI dibatalkan" }),
});
