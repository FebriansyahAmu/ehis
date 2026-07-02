// REST: rekam medis — tab Konsultasi (sisi PEMINTA, kunjungan asal).
//   GET  /api/v1/kunjungan/:id/konsultasi → daftar konsultasi kunjungan
//   POST /api/v1/kunjungan/:id/konsultasi → kirim permintaan SBAR (201; dokterPeminta = actor)
// RBAC: clinical.konsultasi (read/create — Dokter; Perawat read). ABAC careUnit di route().

import { route, reply } from "@/lib/http/route";
import { IdParam, KonsultasiCreateInput } from "@/lib/schemas/konsultasi/konsultasi";
import { konsultasiService } from "@/lib/services/konsultasi/konsultasiService";

export const GET = route({
  resource: "clinical.konsultasi",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await konsultasiService.listForKunjungan(params.id, actor)),
});

export const POST = route({
  resource: "clinical.konsultasi",
  action: "create",
  params: IdParam,
  body: KonsultasiCreateInput,
  handler: async ({ params, body, actor }) =>
    reply(await konsultasiService.create(params.id, body, actor), {
      status: 201,
      message: "Permintaan konsultasi terkirim",
    }),
});
