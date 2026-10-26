// GET /api/v1/fhir/encounter — daftar kunjungan + status sinkron SatuSehat (Encounter terpetakan,
// job terakhir, jumlah resource). Cari no. kunjungan / nama / RM / ID kunjungan / IHS Encounter.
// RBAC: fhir.sync:read.

import { route } from "@/lib/http/route";
import { EncounterListQuery } from "@/lib/schemas/fhir/resources";
import { listEncounters } from "@/lib/services/fhir/consoleService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  query: EncounterListQuery,
  handler: ({ query }) => listEncounters(query),
});
