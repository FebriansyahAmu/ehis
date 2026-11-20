// REST: GET /api/v1/audit/akses-rekam-medis — Jejak Akses rekam medis (PRD Kepatuhan E5 · FR-5.1).
// Cari per pasien (?noRm=) ATAU per pegawai (?pegawaiId=), opsional ?dari=&sampai= (YYYY-MM-DD, WIB),
// keyset ?cursor=. RBAC audit.akses:read (Unit RM / DPO / Admin). Membuka log ikut dicatat.

import { route } from "@/lib/http/route";
import { AksesRekamMedisQuery } from "@/lib/schemas/audit/aksesRekamMedis";
import { aksesRekamMedisService, clientIp } from "@/lib/services/audit/aksesRekamMedisService";

export const GET = route({
  resource: "audit.akses",
  action: "read",
  scopeKunjungan: false,
  query: AksesRekamMedisQuery,
  handler: ({ query, actor, req }) => aksesRekamMedisService.list(query, actor, clientIp(req)),
});
