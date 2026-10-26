// GET /api/v1/fhir/onboarding — ringkasan onboarding SatuSehat per jenis (lokal vs terpetakan,
// daftar yang belum) untuk env aktif. RBAC: fhir.sync:read.

import { route } from "@/lib/http/route";
import { summary } from "@/lib/services/fhir/onboardingService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  handler: () => summary(),
});
