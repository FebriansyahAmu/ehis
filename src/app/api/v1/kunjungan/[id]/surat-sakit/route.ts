// REST: rekam medis — Surat Keterangan Sakit (tab Surat & Dokumen).
//   GET  /api/v1/kunjungan/:id/surat-sakit → daftar surat aktif (terbaru dulu)
//   POST /api/v1/kunjungan/:id/surat-sakit → terbitkan (nomor auto; tglSelesai di-hitung server, 201)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, SuratSakitInput } from "@/lib/schemas/suratSakit/suratSakit";
import { suratSakitService } from "@/lib/services/suratSakit/suratSakitService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await suratSakitService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  allowWhenLocked: true, // dokumen kepulangan — surat keterangan sakit boleh terbit pasca-Selesai
  params: IdParam,
  body: SuratSakitInput,
  handler: async ({ params, body, actor }) =>
    reply(await suratSakitService.create(params.id, body, actor), {
      status: 201,
      message: "Surat keterangan sakit diterbitkan",
    }),
});
