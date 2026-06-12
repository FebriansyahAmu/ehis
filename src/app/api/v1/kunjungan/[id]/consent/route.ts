// REST: rekam medis — tab Informed Consent (persetujuan tindakan per kunjungan, PMK 290/2008).
//   GET  /api/v1/kunjungan/:id/consent → daftar persetujuan (tanpa TTD image)
//   POST /api/v1/kunjungan/:id/consent → tambah 1 persetujuan (+ TTD base64)
// RBAC: clinical.consent (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { InformedConsentInput } from "@/lib/schemas/informedConsent/informedConsent";
import { informedConsentService } from "@/lib/services/informedConsent/informedConsentService";

export const GET = route({
  resource: "clinical.consent",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await informedConsentService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.consent",
  action: "create",
  params: IdParam,
  body: InformedConsentInput,
  handler: async ({ params, body, actor }) =>
    reply(await informedConsentService.add(params.id, body, actor), {
      status: 201,
      message: `Persetujuan ${body.tindakanNama} dicatat`,
    }),
});
