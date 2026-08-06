// REST: /api/v1/master/profil-rs — profil RS (SINGLETON).
//   GET   → profil efektif (default bila belum disimpan). AUTHENTICATED-only (tanpa RBAC
//           resource): identitas RS non-sensitif & dipakai KOP semua cetakan lintas modul.
//   PATCH → simpan profil tekstual. Gate master.konfigurasi:update.
// Route TIPIS: route() menangani auth→RBAC→Zod→envelope→error.

import { route, reply } from "@/lib/http/route";
import { UpsertRsProfilInput } from "@/lib/schemas/master/profilRs";
import { rsProfilService } from "@/lib/services/master/rsProfilService";

export const GET = route({
  handler: () => rsProfilService.get(),
});

export const PATCH = route({
  resource: "master.konfigurasi",
  action: "update",
  body: UpsertRsProfilInput,
  handler: async ({ body, actor }) =>
    reply(await rsProfilService.save(body, actor), { message: "Profil RS tersimpan" }),
});
