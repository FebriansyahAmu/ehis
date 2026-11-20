// REST: /api/v1/kunjungan/:id — kunjungan tunggal (BACKEND-ENCOUNTER §4.4).
//   GET → detail (incl. rujukan + SEP untuk cetak)
import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { kunjunganService } from "@/lib/services/kunjunganService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  params: IdParam,
  // Dibuka saat registrasi & resolver rekam medis IGD/RI/RJ memuat kunjungan → log akses RM.
  aksesLog: (k) => ({ kunjunganId: k.id }),
  handler: ({ params, actor }) => kunjunganService.getKunjungan(params.id, actor),
});
