// REST: rekam medis — Surat Keterangan Sehat (tab Surat & Dokumen).
//   GET  /api/v1/kunjungan/:id/surat-sehat → daftar surat aktif (terbaru dulu)
//   POST /api/v1/kunjungan/:id/surat-sehat → terbitkan (nomor auto; TTE auto bila Dokter, 201)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, SuratSehatInput } from "@/lib/schemas/suratSehat/suratSehat";
import { suratSehatService } from "@/lib/services/suratSehat/suratSehatService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await suratSehatService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  allowWhenLocked: true, // dokumen surat keterangan boleh terbit pasca-Selesai
  params: IdParam,
  body: SuratSehatInput,
  handler: async ({ params, body, actor }) =>
    reply(await suratSehatService.create(params.id, body, actor), {
      status: 201,
      message: "Surat keterangan sehat diterbitkan",
    }),
});
