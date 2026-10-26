// POST /api/v1/fhir/patient/resolve-batch — resolve IHS untuk ≤100 pasien yang belum terpetakan
// (env aktif), sekuensial (kuota SatuSehat). Panggil berulang selama `sisa=true`. RBAC: fhir.sync:create.

import { route, reply } from "@/lib/http/route";
import { ResolveBatchInput } from "@/lib/schemas/fhir/patient";
import { resolveBatch } from "@/lib/services/fhir/patientIhsService";

export const POST = route({
  resource: "fhir.sync",
  action: "create",
  scopeKunjungan: false,
  body: ResolveBatchInput,
  handler: async ({ body, actor }) => {
    const r = await resolveBatch(actor, body.limit);
    const c = r.counts;
    return reply(r, {
      message: `${r.diproses} pasien diproses: ${c.resolved} terpetakan · ${c.not_found} tak ditemukan · ${c.no_nik} tanpa NIK · ${c.failed} gagal`,
    });
  },
});
