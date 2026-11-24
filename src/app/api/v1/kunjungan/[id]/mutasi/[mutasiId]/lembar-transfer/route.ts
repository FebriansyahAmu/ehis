// REST: lembar transfer pasien antar ruangan (opsional) — snapshot terakhir menimpa.
//   POST /api/v1/kunjungan/:id/mutasi/:mutasiId/lembar-transfer
// Pengisi = akun login (server). Bisa diisi saat mutasi Diajukan atau sesudah Selesai.

import { route, reply } from "@/lib/http/route";
import { LembarTransferInput, MutasiParam } from "@/lib/schemas/mutasi";
import { mutasiService } from "@/lib/services/mutasiService";

export const POST = route({
  resource: "clinical.rekammedis",
  action: "update",
  params: MutasiParam,
  body: LembarTransferInput,
  handler: async ({ params, body, actor }) =>
    reply(await mutasiService.simpanLembar(params.id, params.mutasiId, body, actor), {
      message: "Lembar transfer disimpan",
    }),
});
