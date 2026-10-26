// POST /api/v1/fhir/patient-lookup — cek NIK ke SatuSehat TANPA menyimpan (tool verifikasi).
// NIK di body (bukan query) agar tak masuk log URL; audit menyimpan hash NIK. RBAC: fhir.sync:read.

import { route } from "@/lib/http/route";
import { NikLookupInput } from "@/lib/schemas/fhir/patient";
import { lookupByNik } from "@/lib/services/fhir/patientIhsService";

export const POST = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  body: NikLookupInput,
  handler: ({ body, actor }) => lookupByNik(body.nik, actor),
});
