// REST: konsultan mengisi jawaban konsultasi.
//   POST /api/v1/konsultasi/:id/jawab → Diterima → Dijawab; jawaban + AUTO-CPPT ke kunjungan
//   asal dalam 1 transaksi (konsultan = actor, server otoritatif).
// RBAC: clinical.konsultasi:update (Dokter). scopeKunjungan:false (params.id = konsultasiId).

import { route, reply } from "@/lib/http/route";
import { IdParam, KonsultasiJawabInput } from "@/lib/schemas/konsultasi/konsultasi";
import { konsultasiService } from "@/lib/services/konsultasi/konsultasiService";

export const POST = route({
  resource: "clinical.konsultasi",
  action: "update",
  scopeKunjungan: false,
  params: IdParam,
  body: KonsultasiJawabInput,
  handler: async ({ params, body, actor }) =>
    reply(await konsultasiService.jawab(params.id, body, actor), {
      message: "Jawaban konsultasi terkirim — tercatat otomatis di CPPT",
    }),
});
