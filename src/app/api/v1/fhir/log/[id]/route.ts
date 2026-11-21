// GET /api/v1/fhir/log/:id?localType=&localId= — 1 panggilan SatuSehat + isi request/response
// (didekripsi di server; NIK sudah dimasker saat disimpan). Isi = data klinis/pasien → dicatat di log
// akses rekam medis (kunjungan / pasien). RBAC fhir.sync:read.

import { route } from "@/lib/http/route";
import { SendLogDetailQuery, SendLogIdParam } from "@/lib/schemas/fhir/sendLog";
import { getDetail } from "@/lib/services/fhir/sendLogService";

export const GET = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  params: SendLogIdParam,
  query: SendLogDetailQuery,
  aksesLog: (d) =>
    d.kunjunganId ? { kunjunganId: d.kunjunganId, domain: "fhir-log" }
    : d.localType === "Patient" && d.localId ? { patientId: d.localId, domain: "fhir-log" }
    : null,
  handler: ({ params, query }) => getDetail(params.id, query),
});
