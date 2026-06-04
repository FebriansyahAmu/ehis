// REST: /api/v1/master/pegawai/:id — pegawai tunggal (FLOWS §16).
//   GET    → detail
//   PATCH  → ubah data + version guard
//   DELETE ?expectedVersion=  → soft-delete + version guard
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdatePegawaiInput, DeleteQuery } from "@/lib/schemas/pegawai";
import { pegawaiService } from "@/lib/services/pegawaiService";

export const GET = route({
  resource: "master.pegawai",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => pegawaiService.getPegawai(params.id, actor),
});

export const PATCH = route({
  resource: "master.pegawai",
  action: "update",
  params: IdParam,
  body: UpdatePegawaiInput,
  handler: async ({ params, body, actor }) => {
    const pegawai = await pegawaiService.updatePegawai(params.id, body, actor);
    return reply(pegawai, { message: `Data pegawai ${pegawai.namaTampil} diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.pegawai",
  action: "delete",
  params: IdParam,
  query: DeleteQuery,
  handler: async ({ params, query, actor }) => {
    await pegawaiService.deletePegawai(params.id, query.expectedVersion, actor);
    return reply({ id: params.id }, { message: "Pegawai dinonaktifkan" });
  },
});
