// REST: GET /api/v1/spri — worklist admisi Rawat Inap (SPRI yang sudah terbit dari IGD).
//   ?status= → filter eksplisit; default = belum dikonsumsi (MenungguRef + Terbit).
//   POST — buat SPRI mandiri dari worklist admisi (rawat inap terencana, bukan dari IGD),
//   ditautkan ke kunjungan sumber pasien. No. Referensi terbit server (mock BPJS).
// RBAC: registration.kunjungan (petugas loket/admisi). SPRI = artefak admisi (bukan
// clinical.*), lintas-kunjungan → scopeKunjungan:false.

import { route, reply } from "@/lib/http/route";
import { SpriQuery, CreateSpriInput } from "@/lib/schemas/disposisi/disposisi";
import { spriService } from "@/lib/services/spri/spriService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: false,
  query: SpriQuery,
  handler: async ({ query, actor }) => reply(await spriService.listWorklist(query, actor)),
});

export const POST = route({
  resource: "registration.kunjungan",
  action: "create",
  scopeKunjungan: false,
  body: CreateSpriInput,
  handler: async ({ body, actor }) =>
    reply(await spriService.create(body, actor), { status: 201, message: "SPRI diterbitkan" }),
});
