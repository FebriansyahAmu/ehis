// REST: rekam medis — "Anamnesis Sebelumnya" (longitudinal, read-only).
//   GET /api/v1/kunjungan/:id/anamnesis-sebelumnya → anamnesis TERBARU per kunjungan,
//   lintas semua kunjungan pasien (IGD/RJ/RI) + provenance (unit/tanggal/pemeriksa).
//
// Gate `clinical.rekammedis:read` + scopeKunjungan (default ON) memvalidasi kunjungan entry
// ∈ unit kerja actor; agregasi lintas-unit milik pasien sama = kesinambungan asuhan.

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { anamnesisService } from "@/lib/services/asesmenMedis/anamnesisService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => anamnesisService.getRiwayat(params.id, actor),
});
