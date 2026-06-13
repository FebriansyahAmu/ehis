// REST: /api/v1/master/sdki-template — katalog keperawatan (SDKI) untuk konsumsi KLINIS.
//   GET → daftar template asuhan (diagnosa Aktif): kode/nama/penyebab/faktor/SLKI/SIKI.
// RBAC: gate `clinical.keperawatan:read` (Perawat/Dokter) — BUKAN master.katalog (klinisi tak
// punya hak master). Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).
// Pola identik tindakan-tersedia / obat-tersedia (read katalog master, gate klinis).

import { route, reply } from "@/lib/http/route";
import { sdkiService } from "@/lib/services/master/sdkiService";

export const GET = route({
  resource: "clinical.keperawatan",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  handler: async () => reply(await sdkiService.listTemplate()),
});
