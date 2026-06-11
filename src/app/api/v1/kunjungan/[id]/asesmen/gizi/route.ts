// REST: rekam medis — Asesmen Medis · Skrining Gizi (MUST), shared IGD/RI/RJ.
//   GET  /api/v1/kunjungan/:id/asesmen/gizi  → riwayat skrining (terbaru dulu)
//   POST /api/v1/kunjungan/:id/asesmen/gizi  → simpan 1 skrining (append)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenGiziInput } from "@/lib/schemas/asesmenMedis/asesmenGizi";
import { asesmenGiziService } from "@/lib/services/asesmenMedis/asesmenGiziService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenGiziService.list(params.id, actor),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: AsesmenGiziInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenGiziService.record(params.id, body, actor), {
      status: 201,
      message: "Skrining gizi tersimpan",
    }),
});
