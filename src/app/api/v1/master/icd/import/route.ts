// REST: /api/v1/master/icd/import — bulk import katalog ICD (1 jenis/request).
//   POST { jenis, items[] } → dedup via unique (jenis,kode) → { received, inserted, skipped }
// Untuk file besar (±18k baris) klien boleh kirim per-batch (≤ IMPORT_MAX) lalu agregasi.

import { route, reply } from "@/lib/http/route";
import { ImportIcdInput } from "@/lib/schemas/master/icd";
import { icdService } from "@/lib/services/master/icdService";

export const POST = route({
  resource: "master.icd",
  action: "create",
  body: ImportIcdInput,
  handler: async ({ body, actor }) => {
    const result = await icdService.importBatch(body, actor);
    return reply(result, {
      status: 201,
      message: `${result.inserted} kode ditambahkan · ${result.skipped} dilewati (duplikat)`,
    });
  },
});
