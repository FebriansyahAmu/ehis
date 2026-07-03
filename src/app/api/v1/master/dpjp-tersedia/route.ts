// REST: /api/v1/master/dpjp-tersedia — dokter RS + kode DPJP BPJS ter-map, konsumsi KLINIS.
//   GET → picker dokter untuk form yang butuh kodeDokter payload BPJS (mis. Jadwal Kontrol
//         RencanaKontrol/insert di tab Pasien Pulang RI). kodeBpjs null = belum di-map
//         (Mapping Hub → DPJP BPJS). Sumber sama dengan resolver SPRI (bpjs.DpjpMapping).
// RBAC: gate `clinical.rekammedis:read` (Dokter/Perawat) — BUKAN master.mapping (klinisi tak
// punya hak master; read-only tanpa aksi mapping). scopeKunjungan:false (katalog murni).
// Pola identik template-anamnesis-tersedia / konsultan-tersedia.

import { route, reply } from "@/lib/http/route";
import { listDpjpTersedia } from "@/lib/services/bpjs/dpjpMappingService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  scopeKunjungan: false,
  handler: async () => reply(await listDpjpTersedia()),
});
