// POST /api/v1/fhir/ihs-lookup/map — petakan manual data lokal (Practitioner/Patient) → Nomor IHS.
// KHUSUS mode Sandbox (service menolak di luar Sandbox): NIK data asli RS tak ada di Sandbox, padahal
// resource lain butuh referensi yang valid. IHS diverifikasi dulu (GET, tercatat di log pengiriman).
// Menulis peta → RBAC fhir.sync:create (sama dengan Kirim / Cari IHS per item).

import { route, reply } from "@/lib/http/route";
import { IhsMapInput } from "@/lib/schemas/fhir/ihsLookup";
import { mapIhsManual } from "@/lib/services/fhir/ihsLookupService";

export const POST = route({
  resource: "fhir.sync",
  action: "create",
  scopeKunjungan: false,
  body: IhsMapInput,
  handler: async ({ body, actor }) => {
    const r = await mapIhsManual(body, actor);
    return reply(r, {
      message: r.sebelumnya === r.ihsId
        ? `Sudah terpetakan ke ${r.ihsId}`
        : `${r.lokal.label} dipetakan ke ${r.resourceType}/${r.ihsId}`,
    });
  },
});
