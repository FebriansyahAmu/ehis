// REST: rekam medis — Asesmen Medis · Alergi (MODEL PER-ITEM, daftar hidup). Per-aksi:
//   GET   /api/v1/kunjungan/:id/asesmen/alergi  → { nka, items[] } (alergi aktif + NKA)
//   POST  /api/v1/kunjungan/:id/asesmen/alergi  → tambah 1 alergen (INSERT tunggal)
//   PATCH /api/v1/kunjungan/:id/asesmen/alergi  → set assertion NKA
// Hapus 1 alergen → DELETE /…/alergi/:itemId (route terpisah). Route TIPIS.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AlergiItemInput, AlergiNkaInput } from "@/lib/schemas/asesmenMedis/asesmenAlergi";
import { asesmenAlergiService } from "@/lib/services/asesmenMedis/asesmenAlergiService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenAlergiService.get(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: AlergiItemInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenAlergiService.addItem(params.id, body, actor), {
      status: 201,
      message: "Alergi ditambahkan",
    }),
});

export const PATCH = route({
  resource: "clinical.igd",
  action: "update",
  params: IdParam,
  body: AlergiNkaInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenAlergiService.setNka(params.id, body.nka, actor), {
      message: body.nka ? "NKA dikonfirmasi" : "Status NKA dibatalkan",
    }),
});
