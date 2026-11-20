// GET /api/v1/fhir/onboarding/:jenis/items/:localId — detail mentah 1 data Prerequisites: data master
// lokal (NIK dimasker), peta ResourceMap, payload FHIR (Organization/Location) atau request GET by NIK
// (Practitioner/Patient). RBAC fhir.sync:read. Detail Patient dicatat di log akses rekam medis.

import { route } from "@/lib/http/route";
import { PrereqItemParams } from "@/lib/schemas/fhir/onboarding";
import { getItem } from "@/lib/services/fhir/prerequisiteService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  params: PrereqItemParams,
  aksesLog: (d) => (d.jenis === "patient" ? { patientId: d.localId, domain: "fhir-prerequisites" } : null),
  handler: ({ params }) => getItem(params.jenis, params.localId),
});
