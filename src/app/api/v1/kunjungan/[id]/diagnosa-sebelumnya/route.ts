// REST: rekam medis — "Diagnosa Sebelumnya" (longitudinal, read-only).
//   GET /api/v1/kunjungan/:id/diagnosa-sebelumnya → diagnosa (semua tipe) dari kunjungan
//   SEBELUMNYA pasien yang sama (IGD/RJ/RI), dikelompokkan per kunjungan, terbaru dulu.
//
// Gate `clinical.diagnosa:read` (selaras GET agregat diagnosa) + scopeKunjungan (default ON)
// memvalidasi kunjungan entry ∈ unit kerja actor; agregasi lintas-unit milik pasien sama =
// kesinambungan asuhan (SNARS AP 1.2).

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { diagnosaService } from "@/lib/services/diagnosa/diagnosaService";

export const GET = route({
  resource: "clinical.diagnosa",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => diagnosaService.getRiwayat(params.id, actor),
});
