// REST: /api/v1/master/template-anamnesis-tersedia — template anamnesis utk konsumsi KLINIS.
//   GET ?modul=IGD|RI|RJ → template Aktif relevan modul (field pre-fill picker "Template Cepat").
// RBAC: gate `clinical.rekammedis:read` (Dokter/Perawat) — BUKAN master.konfigurasi (klinisi tak
// punya hak master). Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).
// Pola identik status-enum-tersedia / sdki-template (read katalog master, gate klinis).

import { route, reply } from "@/lib/http/route";
import { TemplateTersediaQuery } from "@/lib/schemas/master/templateAnamnesis";
import { templateAnamnesisService } from "@/lib/services/master/templateAnamnesisService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  query: TemplateTersediaQuery,
  handler: async ({ query }) => reply(await templateAnamnesisService.listForModul(query.modul)),
});
