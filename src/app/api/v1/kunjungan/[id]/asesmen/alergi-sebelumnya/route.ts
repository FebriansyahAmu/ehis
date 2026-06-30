// REST: rekam medis — Asesmen Medis · Alergi · RIWAYAT SEBELUMNYA (longitudinal, read-only).
//   GET /api/v1/kunjungan/:id/asesmen/alergi-sebelumnya → alergi aktif dari kunjungan LAIN
//   pasien (dedup per allergen, terbaru) + hint NKA sebelumnya. Untuk panel referensi +
//   carry-forward "Bawa ke RI". Gate `clinical.rekammedis:read` + scopeKunjungan (default ON).

import { route } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { alergiSebelumnyaService } from "@/lib/services/asesmenMedis/alergiSebelumnyaService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => alergiSebelumnyaService.getAlergi(params.id, actor),
});
