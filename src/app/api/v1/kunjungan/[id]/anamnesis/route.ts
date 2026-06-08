// REST: rekam medis — Asesmen Medis · Anamnesis (TODO-CLINICAL Domain 3, shared IGD/RI/RJ).
//   GET  /api/v1/kunjungan/:id/anamnesis  → asesmen anamnesis terbaru (null bila belum ada)
//   POST /api/v1/kunjungan/:id/anamnesis  → simpan asesmen baru (append)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AnamnesisInput } from "@/lib/schemas/asesmenMedis/anamnesis";
import { anamnesisService } from "@/lib/services/asesmenMedis/anamnesisService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => anamnesisService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: AnamnesisInput,
  handler: async ({ params, body, actor }) =>
    reply(await anamnesisService.save(params.id, body, actor), {
      status: 201,
      message: "Asesmen anamnesis tersimpan",
    }),
});
