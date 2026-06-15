// REST: /api/v1/master/skala-tersedia — master Skala Klinis untuk konsumsi KLINIS.
//   GET ?modul=IGD&kategori=Risiko   → skala risiko AKTIF ter-assign unit (Morse/Braden/dst)
//   GET ?modul=RI&kategori=Penyakit  → klasifikasi penyakit AKTIF (NYHA/Killip/TIMI/ECOG/dst)
// RBAC: gate `clinical.penilaian:read` (Perawat/Dokter) — BUKAN master.skala (klinisi tak punya
// hak master). Tanpa params.id → tak kena ABAC kunjungan (scopeKunjungan:false).
// Pola identik sdki-template / tindakan-tersedia (read katalog master, gate klinis).
// Dispatch service per kategori (default Risiko); filter status="Aktif".

import { route, reply } from "@/lib/http/route";
import { SkalaTersediaQuery } from "@/lib/schemas/penilaian/penilaianSkala";
import { skalaRisikoService } from "@/lib/services/master/skalaRisikoService";
import { skalaPenyakitService } from "@/lib/services/master/skalaPenyakitService";

export const GET = route({
  resource: "clinical.penilaian",
  action: "read",
  scopeKunjungan: false, // katalog murni (tanpa konteks kunjungan)
  query: SkalaTersediaQuery,
  handler: async ({ query }) => {
    const svc = query.kategori === "Penyakit" ? skalaPenyakitService : skalaRisikoService;
    const { items } = await svc.list({ modul: query.modul, status: "Aktif" });
    return reply(items);
  },
});
