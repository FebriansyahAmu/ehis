// REST: GET/POST /api/v1/kunjungan/:id/kecelakaan — Data Kecelakaan (tab registrasi).
// GET  → data kecelakaan kunjungan (null bila belum ada). Gate registration.kunjungan:read.
// POST → simpan/ganti (upsert 1:1, last-write-wins). Gate registration.kunjungan:update.
import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { UpsertKecelakaanInput } from "@/lib/schemas/kecelakaan/kecelakaan";
import { kecelakaanService } from "@/lib/services/kecelakaan/kecelakaanService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await kecelakaanService.get(params.id, actor)),
});

export const POST = route({
  resource: "registration.kunjungan",
  action: "update",
  params: IdParam,
  body: UpsertKecelakaanInput,
  handler: async ({ params, body, actor }) =>
    reply(await kecelakaanService.upsert(params.id, body, actor), {
      message: "Data kecelakaan disimpan",
    }),
});
