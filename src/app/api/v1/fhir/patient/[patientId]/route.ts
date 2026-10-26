// GET /api/v1/fhir/patient/:patientId — status IHS Patient SatuSehat pasien (env aktif), TANPA
// panggilan ke SatuSehat. Untuk badge IHS di registrasi. RBAC: registration.pasien:read.

import { route } from "@/lib/http/route";
import { PatientIdParam } from "@/lib/schemas/fhir/patient";
import { getForPatient } from "@/lib/services/fhir/patientIhsService";

export const GET = route({
  resource: "registration.pasien",
  action: "read",
  scopeKunjungan: false,
  params: PatientIdParam,
  handler: ({ params }) => getForPatient(params.patientId),
});
