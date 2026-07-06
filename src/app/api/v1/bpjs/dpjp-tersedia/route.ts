// REST: GET /api/v1/bpjs/dpjp-tersedia — dokter RS + kode DPJP BPJS ter-map, konsumsi LOKET.
//   Picker DPJP untuk form SEP (dpjpLayan = kodeDPJP payload; kodeBpjs null = belum di-map).
//   Sumber sama dengan /master/dpjp-tersedia (klinis), tapi di-gate untuk petugas registrasi.
// RBAC: registration.kunjungan:read (loket/admisi). Katalog murni → scopeKunjungan:false.

import { route, reply } from "@/lib/http/route";
import { listDpjpTersedia } from "@/lib/services/bpjs/dpjpMappingService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: false,
  handler: async () => reply(await listDpjpTersedia()),
});
