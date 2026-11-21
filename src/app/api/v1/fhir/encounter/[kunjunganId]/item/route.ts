// POST /api/v1/fhir/encounter/:kunjunganId/item — kirim SATU resource milik kunjungan (kartu konsol),
// pelengkap "Kirim semua" (Bundle). Body { localType, localId } (localId bisa berisi ":" → tidak di path).
// Prasyarat dicek dulu tanpa jaringan; hanya resource ini yang di-POST/PUT. Gagal/terblokir = hasil
// (200), bukan error HTTP; kunjungan sedang dikirim = 409. RBAC fhir.sync:create.

import { route, reply } from "@/lib/http/route";
import { KunjunganIdParam } from "@/lib/schemas/fhir/outbox";
import { EncounterItemSyncInput } from "@/lib/schemas/fhir/resources";
import { sendEncounterItem } from "@/lib/services/fhir/encounterItemService";

export const POST = route({
  resource: "fhir.sync",
  action: "create",
  scopeKunjungan: false,
  params: KunjunganIdParam,
  body: EncounterItemSyncInput,
  handler: async ({ params, body, actor }) => {
    const r = await sendEncounterItem(params.kunjunganId, body, actor);
    return reply(r, { message: r.message });
  },
});
