// REST: GET /api/v1/audit/akses-rekam-medis/pegawai?q= — cari pegawai (nama/NIP) untuk filter
// Jejak Akses. Gate audit.akses:read (auditor tak harus punya akses master pegawai).

import { route } from "@/lib/http/route";
import { AksesPegawaiQuery } from "@/lib/schemas/audit/aksesRekamMedis";
import { aksesRekamMedisService } from "@/lib/services/audit/aksesRekamMedisService";

export const GET = route({
  resource: "audit.akses",
  action: "read",
  scopeKunjungan: false,
  query: AksesPegawaiQuery,
  handler: ({ query }) => aksesRekamMedisService.searchPegawai(query),
});
