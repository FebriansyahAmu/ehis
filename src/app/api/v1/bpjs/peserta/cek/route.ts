// POST /api/v1/bpjs/peserta/cek — cek kepesertaan V-Claim (baca).
// • Nomor kartu/NIK di BODY (bukan query string) → tidak tercatat di URL/log akses (ASVS V8.3.1).
// • RBAC: bpjs.kepesertaan:read (resource DATA — sengaja bukan bpjs.view, supaya form lain yang
//   butuh cek peserta, mis. loket registrasi, cukup diberi hak ini tanpa membuka modul BPJS).
// • Respons berisi data pribadi peserta → `Cache-Control: no-store` (ASVS V8.2.1).
// • Mock vs nyata ditentukan service (BPJS_MODE / BPJS_BACA_LIVE).

import { route } from "@/lib/http/route";
import { CekPesertaInput } from "@/lib/schemas/bpjs/peserta";
import { cekPeserta } from "@/lib/services/bpjs/pesertaService";

const handler = route({
  resource: "bpjs.kepesertaan",
  action: "read",
  scopeKunjungan: false,
  body: CekPesertaInput,
  handler: ({ body, actor }) => cekPeserta(body, actor),
});

export async function POST(req: Request): Promise<Response> {
  const res = await handler(req);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
