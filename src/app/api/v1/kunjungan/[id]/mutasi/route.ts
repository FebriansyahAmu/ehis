// REST: mutasi pasien (pindah ruangan/bed dalam kunjungan — IGD · Rawat Inap).
//   GET  /api/v1/kunjungan/:id/mutasi → lokasi sekarang + mutasi Diajukan + riwayat
//   POST /api/v1/kunjungan/:id/mutasi → ajukan mutasi = reservasi bed tujuan
// Gate `clinical.rekammedis` (sama dgn "Terima Pasien") + ABAC careUnit; terkunci saat kunjungan selesai.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AjukanMutasiInput } from "@/lib/schemas/mutasi";
import { mutasiService } from "@/lib/services/mutasiService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => mutasiService.getState(params.id, actor),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "update",
  params: IdParam,
  body: AjukanMutasiInput,
  handler: async ({ params, body, actor }) =>
    reply(await mutasiService.ajukan(params.id, body, actor), {
      status: 201,
      message: "Mutasi diajukan — bed tujuan direservasi",
    }),
});
