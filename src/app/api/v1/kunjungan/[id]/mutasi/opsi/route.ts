// REST: pilihan ruangan tujuan mutasi + peta bed (okupansi relatif terhadap kunjungan ini).
//   GET /api/v1/kunjungan/:id/mutasi/opsi
// Disusun server (bukan dari master tree) agar petugas klinis tak butuh izin master.ruangan.

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { mutasiService } from "@/lib/services/mutasiService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => mutasiService.getOpsi(params.id, actor),
});
