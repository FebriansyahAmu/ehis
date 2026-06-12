// REST: rekam medis — tab Informed Consent, per-item.
//   GET    /api/v1/kunjungan/:id/consent/:itemId → detail penuh (+ TTD image) untuk cetak/preview
//   DELETE /api/v1/kunjungan/:id/consent/:itemId → soft-delete (entered-in-error)
// IC immutable → tanpa PATCH. RBAC: clinical.consent (read/delete). ABAC careUnit ditegakkan route().

import { route, reply } from "@/lib/http/route";
import { ConsentItemParam } from "@/lib/schemas/informedConsent/informedConsent";
import { informedConsentService } from "@/lib/services/informedConsent/informedConsentService";

export const GET = route({
  resource: "clinical.consent",
  action: "read",
  params: ConsentItemParam,
  handler: async ({ params, actor }) =>
    reply(await informedConsentService.getDetail(params.id, params.itemId, actor)),
});

export const DELETE = route({
  resource: "clinical.consent",
  action: "delete",
  params: ConsentItemParam,
  handler: async ({ params, actor }) => {
    await informedConsentService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Persetujuan dihapus" });
  },
});
