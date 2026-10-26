// POST /api/v1/fhir/patient/:patientId/resolve — resolve IHS Patient by NIK ke SatuSehat lalu
// simpan peta (resolve-first, idempoten; `force` = ulang). Bagian alur registrasi → RBAC
// registration.pasien:update (petugas loket boleh, bukan hanya operator interop).

import { route, reply } from "@/lib/http/route";
import { PatientIdParam, ResolvePatientInput } from "@/lib/schemas/fhir/patient";
import { resolveForPatient } from "@/lib/services/fhir/patientIhsService";

const MESSAGE: Record<string, string> = {
  cached: "Pasien sudah terpetakan ke SatuSehat",
  resolved: "IHS Patient SatuSehat berhasil diperoleh",
  not_found: "NIK tidak ditemukan di SatuSehat",
  no_nik: "Pasien tanpa NIK — tidak dapat di-resolve",
  failed: "Gagal menghubungi SatuSehat",
};

export const POST = route({
  resource: "registration.pasien",
  action: "update",
  scopeKunjungan: false,
  params: PatientIdParam,
  body: ResolvePatientInput,
  handler: async ({ params, body, actor }) => {
    const r = await resolveForPatient(params.patientId, actor, { force: body.force });
    return reply(r, { message: r.message ?? MESSAGE[r.status] });
  },
});
