// REST: /api/v1/kunjungan — koleksi kunjungan (BACKEND-ENCOUNTER §4.4).
//   GET  ?unit=&status=&cursor=&limit=  → worklist (cursor pagination)
//   POST                                → Pendaftaran Kunjungan Baru (RJ) + SEP (BPJS, mock)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, paginated, reply } from "@/lib/http/route";
import { WorklistQuery, RegisterKunjunganInput } from "@/lib/schemas/kunjungan";
import { kunjunganService } from "@/lib/services/kunjunganService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  query: WorklistQuery,
  handler: async ({ query, actor }) => {
    const { items, cursor } = await kunjunganService.getWorklist(query, actor);
    return paginated(items, { cursor });
  },
});

export const POST = route({
  resource: "registration.kunjungan",
  action: "create",
  body: RegisterKunjunganInput,
  handler: async ({ body, actor }) => {
    const k = await kunjunganService.registerKunjungan(body, actor);
    const msg = k.sep?.noSep
      ? `Kunjungan ${k.noKunjungan} dibuat · SEP ${k.sep.noSep} terbit`
      : `Kunjungan ${k.noKunjungan} berhasil dibuat`;
    return reply(k, { status: 201, message: msg });
  },
});
