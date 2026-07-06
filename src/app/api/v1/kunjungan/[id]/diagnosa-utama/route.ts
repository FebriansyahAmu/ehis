// REST: /api/v1/kunjungan/:id/diagnosa-utama — diagnosa UTAMA (primary) kunjungan.
//   GET → { kode, nama } (null bila belum ada). Dipakai pra-isi rujukan "Kontrol Pasca Ranap"
//         (SEP ranap terakhir → diagnosa primer episode ranap).
// RBAC: registration.kunjungan (read) — loket/admisi (Registrasi/Kasir = global, bypass unit-scope).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { kunjunganService } from "@/lib/services/kunjunganService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await kunjunganService.getDiagnosaUtama(params.id, actor)),
});
