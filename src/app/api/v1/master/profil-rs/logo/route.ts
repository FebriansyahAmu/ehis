// REST: /api/v1/master/profil-rs/logo — logo RS (data URI base64).
//   POST   → set/ganti logo. Gate master.konfigurasi:update.
//   DELETE → hapus logo (kembali ke placeholder). Gate master.konfigurasi:update.
// Logo tersimpan self-contained → ikut tercetak di KOP semua surat tanpa fetch eksternal.

import { route, reply } from "@/lib/http/route";
import { UploadLogoInput } from "@/lib/schemas/master/profilRs";
import { rsProfilService } from "@/lib/services/master/rsProfilService";

export const POST = route({
  resource: "master.konfigurasi",
  action: "update",
  body: UploadLogoInput,
  handler: async ({ body, actor }) =>
    reply(await rsProfilService.saveLogo(body.dataUrl, actor), { message: "Logo RS diperbarui" }),
});

export const DELETE = route({
  resource: "master.konfigurasi",
  action: "update",
  handler: async ({ actor }) =>
    reply(await rsProfilService.removeLogo(actor), { message: "Logo RS dihapus" }),
});
