// POST /api/v1/fhir/ihs-lookup — GET by Nomor IHS ke SatuSehat (`Practitioner/{id}` · `Patient/{id}`),
// TANPA mengubah peta. Nomor IHS di body (bukan URL) agar tak masuk log akses server; panggilan
// tercatat di log pengiriman (NIK dimasker). RBAC fhir.sync:read (sama dengan cek NIK).

import { route } from "@/lib/http/route";
import { IhsLookupInput } from "@/lib/schemas/fhir/ihsLookup";
import { lookupByIhs } from "@/lib/services/fhir/ihsLookupService";

export const POST = route({
  resource: "fhir.sync",
  action: "read",
  scopeKunjungan: false,
  body: IhsLookupInput,
  handler: ({ body, actor }) => lookupByIhs(body, actor),
});
