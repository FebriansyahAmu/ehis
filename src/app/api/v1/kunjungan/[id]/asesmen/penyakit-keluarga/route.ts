// REST: Asesmen Medis · Riwayat · Penyakit Keluarga. Shared IGD/RI/RJ.
//   GET/POST /api/v1/kunjungan/:id/asesmen/penyakit-keluarga

import { route, reply } from "@/lib/http/route";
import { IdParam } from "@/lib/schemas/kunjungan";
import { AsesmenPenyakitKeluargaInput } from "@/lib/schemas/asesmenMedis/asesmenPenyakitKeluarga";
import { asesmenPenyakitKeluargaService } from "@/lib/services/asesmenMedis/asesmenPenyakitKeluargaService";

export const GET = route({
  resource: "clinical.rekammedis",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => asesmenPenyakitKeluargaService.getLatest(params.id, actor),
});

export const POST = route({
  resource: "clinical.rekammedis",
  action: "create",
  params: IdParam,
  body: AsesmenPenyakitKeluargaInput,
  handler: async ({ params, body, actor }) =>
    reply(await asesmenPenyakitKeluargaService.save(params.id, body, actor), {
      status: 201,
      message: "Riwayat penyakit keluarga tersimpan",
    }),
});
