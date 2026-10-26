// GET /api/v1/fhir/encounter/:kunjunganId — rencana kirim 1 kunjungan: semua resource beserta
// payload & status (terkirim/berubah/belum), prasyarat kurang, data dilewati, riwayat job.
// Pratinjau tanpa panggilan SatuSehat & tanpa tulis. RBAC: fhir.sync:read.

import { route } from "@/lib/http/route";
import { KunjunganIdParam } from "@/lib/schemas/fhir/outbox";
import { getEncounter } from "@/lib/services/fhir/consoleService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  params: KunjunganIdParam,
  handler: ({ params, actor }) => getEncounter(params.kunjunganId, actor),
});
