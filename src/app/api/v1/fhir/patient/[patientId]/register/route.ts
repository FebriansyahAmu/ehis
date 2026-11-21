// POST /api/v1/fhir/patient/:patientId/register — daftarkan pasien ke SatuSehat sesuai Playbook MPI
// "Pasien dengan NIK": GET by NIK dulu, POST Create Patient HANYA bila tidak ditemukan. Membuat data
// di Master Patient Index nasional → operator interop (fhir.sync:create), bukan otomatis.

import { route, reply } from "@/lib/http/route";
import { PatientIdParam } from "@/lib/schemas/fhir/patient";
import { registerPatient } from "@/lib/services/fhir/patientIhsService";

export const POST = route({
  resource: "fhir.sync",
  action: "create",
  scopeKunjungan: false,
  params: PatientIdParam,
  handler: async ({ params, actor }) => {
    const r = await registerPatient(params.patientId, actor);
    return reply(r, { message: r.message });
  },
});
