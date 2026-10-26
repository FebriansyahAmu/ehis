// POST /api/v1/fhir/status/probe — uji ambil token OAuth2 SatuSehat (tanpa menulis resource).
// Hati-hati: setelah gagal, SatuSehat membatasi token 1 req/menit → cooldown lokal 60 dtk.
// RBAC: fhir.sync:update.

import { route, reply } from "@/lib/http/route";
import { probeToken } from "@/lib/services/fhir/statusService";

export const POST = route({
  resource: "fhir.sync",
  action: "update",
  scopeKunjungan: false,
  handler: async ({ actor }) => {
    const r = await probeToken(actor);
    return reply(r, { message: r.message });
  },
});
