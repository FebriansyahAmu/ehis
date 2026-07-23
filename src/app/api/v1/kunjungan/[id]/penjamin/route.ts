// REST: POST /api/v1/kunjungan/:id/penjamin — Ubah Penjamin pada kunjungan yang ada.
// Ganti penjaminTipe + jaminan pasien; BPJS → (opsional) terbitkan/ganti SEP (supersede
// SEP lama). Gate registration.kunjungan:update (petugas loket/admisi). SEP ditolak BPJS →
// Errors.validation({ sepReject }) (kecuali forceSep → penjamin tetap berganti, SEP ditangguhkan).
import { route, reply } from "@/lib/http/route";
import { IdParam, ChangePenjaminInput } from "@/lib/schemas/kunjungan";
import { kunjunganService } from "@/lib/services/kunjunganService";

export const POST = route({
  resource: "registration.kunjungan",
  action: "update",
  params: IdParam,
  body: ChangePenjaminInput,
  handler: async ({ params, body, actor }) =>
    reply(await kunjunganService.changePenjamin(params.id, body, actor), {
      message: "Penjamin kunjungan diperbarui",
    }),
});
