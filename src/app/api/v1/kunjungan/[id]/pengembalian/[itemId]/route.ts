// REST: rekam medis — Pengembalian Obat, per-dokumen.
//   PATCH  /api/v1/kunjungan/:id/pengembalian/:itemId → koreksi Draft (replace-all items)
//   DELETE /api/v1/kunjungan/:id/pengembalian/:itemId → hapus Draft (soft-delete)
// Terkunci pasca-verifikasi (Service, guarded transition). RBAC: clinical.pengembalian
// (update — DELETE juga action update: soft-delete Draft = koreksi administratif, pola
// discharge/edukasi). ABAC careUnit ditegakkan route().

import { route, reply } from "@/lib/http/route";
import { ItemParam, PengembalianUpdateInput } from "@/lib/schemas/pengembalian/pengembalian";
import { pengembalianService } from "@/lib/services/pengembalian/pengembalianService";

export const PATCH = route({
  resource: "clinical.pengembalian",
  action: "update",
  params: ItemParam,
  body: PengembalianUpdateInput,
  handler: async ({ params, body, actor }) =>
    reply(await pengembalianService.update(params.id, params.itemId, body, actor), {
      message: "Dokumen pengembalian diperbarui",
    }),
});

export const DELETE = route({
  resource: "clinical.pengembalian",
  action: "update",
  params: ItemParam,
  handler: async ({ params, actor }) => {
    await pengembalianService.remove(params.id, params.itemId, actor);
    return reply(null, { message: "Dokumen pengembalian dihapus" });
  },
});
