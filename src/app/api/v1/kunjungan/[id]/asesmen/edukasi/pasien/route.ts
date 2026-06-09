// REST: rekam medis — Asesmen Medis · Edukasi · Pasien & Keluarga (HPK 2), shared IGD/RI/RJ.
//   GET  /api/v1/kunjungan/:id/asesmen/edukasi/pasien  → riwayat edukasi (terbaru dulu)
//   POST /api/v1/kunjungan/:id/asesmen/edukasi/pasien  → simpan 1 catatan (append)
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { EdukasiPasienInput } from "@/lib/schemas/asesmenMedis/edukasiPasien";
import { edukasiPasienService } from "@/lib/services/asesmenMedis/edukasiPasienService";

export const GET = route({
  resource: "clinical.igd",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => edukasiPasienService.list(params.id, actor),
});

export const POST = route({
  resource: "clinical.igd",
  action: "create",
  params: IdParam,
  body: EdukasiPasienInput,
  handler: async ({ params, body, actor }) =>
    reply(await edukasiPasienService.record(params.id, body, actor), {
      status: 201,
      message: "Catatan edukasi tersimpan",
    }),
});
