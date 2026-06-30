// REST: rekam medis — "Riwayat Sebelumnya" (longitudinal 9 domain, read-only).
//   GET /api/v1/kunjungan/:id/asesmen/riwayat-sebelumnya → asesmen riwayat TERBARU per
//   kunjungan, lintas semua kunjungan pasien (IGD/RJ/RI), per domain + ringkasan.
// Gate `clinical.rekammedis:read` + scopeKunjungan (default ON) — pintu = kunjungan entry.

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { riwayatSebelumnyaService } from "@/lib/services/asesmenMedis/riwayatSebelumnyaService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => riwayatSebelumnyaService.getRiwayat(params.id, actor),
});
