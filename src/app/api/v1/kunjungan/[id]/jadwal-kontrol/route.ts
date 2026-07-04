// REST: rekam medis — Jadwal Kontrol Poliklinik pasca-pulang (tab Pasien Pulang, Obat & Jadwal).
//   GET  /api/v1/kunjungan/:id/jadwal-kontrol → daftar jadwal aktif
//   POST /api/v1/kunjungan/:id/jadwal-kontrol → terbitkan (nomor auto sistem; pasien BPJS →
//        panggil V-Claim RencanaKontrol/insert → noReferensi = noSuratKontrol, 201)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, JadwalKontrolInput } from "@/lib/schemas/jadwalKontrol/jadwalKontrol";
import { jadwalKontrolService } from "@/lib/services/jadwalKontrol/jadwalKontrolService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await jadwalKontrolService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  allowWhenLocked: true, // dokumen kepulangan — surat kontrol boleh terbit pasca-Selesai
  params: IdParam,
  body: JadwalKontrolInput,
  handler: async ({ params, body, actor }) =>
    reply(await jadwalKontrolService.create(params.id, body, actor), {
      status: 201,
      message: "Jadwal kontrol diterbitkan",
    }),
});
