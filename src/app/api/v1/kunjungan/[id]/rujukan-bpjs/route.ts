// REST: POST /api/v1/kunjungan/:id/rujukan-bpjs — tautkan rujukan BPJS ke kunjungan yang ADA
// (tab Surat Rujukan — "gerbang B"). Upsert bpjs.Rujukan + sinkronkan SEP aktif (diagAwal =
// diagnosa rujukan) → SEP tetap sesuai rujukan & diagnosa. Gate registration.kunjungan:update
// (petugas loket/admisi). Bukan /rujukan (itu Rujukan Eksternal disposisi RJ).
import { route, reply } from "@/lib/http/route";
import { IdParam, LinkRujukanInput } from "@/lib/schemas/kunjungan";
import { kunjunganService } from "@/lib/services/kunjunganService";

export const POST = route({
  resource: "registration.kunjungan",
  action: "update",
  params: IdParam,
  body: LinkRujukanInput,
  handler: async ({ params, body, actor }) =>
    reply(await kunjunganService.linkRujukan(params.id, body, actor), {
      message: "Rujukan ditautkan ke kunjungan",
    }),
});
