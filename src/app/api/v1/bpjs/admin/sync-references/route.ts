// POST /api/v1/bpjs/admin/sync-references — jalankan sync referensi DPJP/Spesialis BPJS.
// Mock (belum ada cons-id) = seed daftar demo. RBAC: master.mapping:update.

import { route, reply } from "@/lib/http/route";
import { runSync } from "@/lib/services/bpjs/dpjpMappingService";

export const POST = route({
  resource: "master.mapping",
  action: "update",
  scopeKunjungan: false,
  handler: async ({ actor }) => {
    const r = await runSync(actor);
    return reply(r, { message: `Sinkronisasi selesai — ${r.spesialis} spesialis, ${r.dpjp} dokter DPJP` });
  },
});
