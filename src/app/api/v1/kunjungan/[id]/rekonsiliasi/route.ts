// REST: rekam medis — tab Rekonsiliasi (medication reconciliation per fase transisi).
//   GET  /api/v1/kunjungan/:id/rekonsiliasi → RIWAYAT (semua snapshot, terbaru dulu)
//   POST /api/v1/kunjungan/:id/rekonsiliasi → simpan 1 snapshot fase (append-only)
// RBAC: clinical.rekonsiliasi (read/create) — DIPISAH dari clinical.resep agar Apoteker/Perawat boleh
// rekonsiliasi tanpa hak tulis resep. ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { RekonsiliasiInput } from "@/lib/schemas/rekonsiliasi/rekonsiliasi";
import { rekonsiliasiService } from "@/lib/services/rekonsiliasi/rekonsiliasiService";

export const GET = route({
  resource: "clinical.rekonsiliasi",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await rekonsiliasiService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekonsiliasi",
  action: "create",
  params: IdParam,
  body: RekonsiliasiInput,
  handler: async ({ params, body, actor }) =>
    reply(await rekonsiliasiService.add(params.id, body, actor), {
      status: 201,
      message: "Rekonsiliasi tersimpan",
    }),
});
