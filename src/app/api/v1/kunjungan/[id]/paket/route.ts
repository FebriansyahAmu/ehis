// REST: POST /api/v1/kunjungan/:id/paket — set/ganti/lepas Paket Layanan pada kunjungan yang ada
// (tab "Ubah Paket"). Persist kunjungan.paketLayananId → billing memproyeksikan charge bundel
// (parallel modal pendaftaran). Gate registration.kunjungan:update (petugas loket/admisi).
// body { paketId: uuid | null } (null = lepas paket).
import { route, reply } from "@/lib/http/route";
import { IdParam, SetPaketInput } from "@/lib/schemas/kunjungan";
import { kunjunganService } from "@/lib/services/kunjunganService";

export const POST = route({
  resource: "registration.kunjungan",
  action: "update",
  params: IdParam,
  body: SetPaketInput,
  handler: async ({ params, body, actor }) =>
    reply(await kunjunganService.setPaket(params.id, body.paketId, actor), {
      message: body.paketId ? "Paket layanan diperbarui" : "Paket layanan dilepas",
    }),
});
