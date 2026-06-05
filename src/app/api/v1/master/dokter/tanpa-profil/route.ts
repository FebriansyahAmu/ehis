// REST: /api/v1/master/dokter/tanpa-profil (FLOWS §16 · doc §B.4 · G3).
//   GET → pegawai profesi-dokter yang BELUM punya profil Dokter (bahan "Lengkapi Profil").
// Segmen statis "tanpa-profil" diutamakan di atas "[id]" oleh App Router (tak bentrok).
import { route } from "@/lib/http/route";
import { dokterService } from "@/lib/services/dokterService";

export const GET = route({
  resource: "master.dokter",
  action: "read",
  handler: ({ actor }) => dokterService.listTanpaProfil(actor),
});
