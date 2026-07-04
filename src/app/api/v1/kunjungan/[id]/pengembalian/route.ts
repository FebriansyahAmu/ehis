// REST: rekam medis — Pengembalian Obat pasien pulang (tab Pasien Pulang, sub Kembalian Obat).
//   GET  /api/v1/kunjungan/:id/pengembalian → daftar dokumen aktif (terbaru dulu)
//   POST /api/v1/kunjungan/:id/pengembalian → buat dokumen Draft (perawatPenyerah = actor, 201)
// RBAC: clinical.pengembalian (read/create — Dokter/Perawat; Apoteker read).
// ABAC careUnit ditegakkan route(); Apoteker lolos via isAncillaryActor.

import { route, reply } from "@/lib/http/route";
import { IdParam, PengembalianCreateInput } from "@/lib/schemas/pengembalian/pengembalian";
import { pengembalianService } from "@/lib/services/pengembalian/pengembalianService";

export const GET = route({
  resource: "clinical.pengembalian",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await pengembalianService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.pengembalian",
  action: "create",
  allowWhenLocked: true, // dokumen kepulangan — pengembalian obat terjadi PASCA-pulang
  params: IdParam,
  body: PengembalianCreateInput,
  handler: async ({ params, body, actor }) =>
    reply(await pengembalianService.create(params.id, body, actor), {
      status: 201,
      message: "Dokumen pengembalian dibuat",
    }),
});
