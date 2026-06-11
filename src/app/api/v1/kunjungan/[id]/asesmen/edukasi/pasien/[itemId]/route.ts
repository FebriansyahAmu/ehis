// REST: rekam medis — Asesmen Medis · Edukasi · Pasien & Keluarga (per-item).
//   DELETE /api/v1/kunjungan/:id/asesmen/edukasi/pasien/:itemId → soft-delete 1 catatan.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { EdukasiPasienItemParam } from "@/lib/schemas/asesmenMedis/edukasiPasien";
import { edukasiPasienService } from "@/lib/services/asesmenMedis/edukasiPasienService";

export const DELETE = route({
  resource: "clinical.rekammedis",
  action: "delete",
  params: EdukasiPasienItemParam,
  handler: async ({ params, actor }) => {
    await edukasiPasienService.deleteItem(params.id, params.itemId, actor);
    return reply(null, { message: "Catatan edukasi dihapus" });
  },
});
