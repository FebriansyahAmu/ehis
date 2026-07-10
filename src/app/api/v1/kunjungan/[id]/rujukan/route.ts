// REST: rekam medis — Rujukan Eksternal / Rujukan Keluar (tab Disposisi RJ → Rujuk Eksternal).
//   GET  /api/v1/kunjungan/:id/rujukan → daftar rujukan aktif (terbaru dulu) — utk CETAK ULANG
//   POST /api/v1/kunjungan/:id/rujukan → terbitkan (No. Rujukan auto; server-side; 201)
// RBAC: clinical.rekammedis (read/create). ABAC careUnit ditegakkan route() (clinical.* + params.id).

import { route, reply } from "@/lib/http/route";
import { IdParam, RujukanEksternalInput } from "@/lib/schemas/rujukanEksternal/rujukanEksternal";
import { rujukanEksternalService } from "@/lib/services/rujukanEksternal/rujukanEksternalService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: async ({ params, actor }) => reply(await rujukanEksternalService.list(params.id, actor)),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  allowWhenLocked: true, // dokumen disposisi/kepulangan — rujukan boleh terbit di sekitar Selesai
  params: IdParam,
  body: RujukanEksternalInput,
  handler: async ({ params, body, actor }) =>
    reply(await rujukanEksternalService.create(params.id, body, actor), {
      status: 201,
      message: "Surat rujukan diterbitkan",
    }),
});
