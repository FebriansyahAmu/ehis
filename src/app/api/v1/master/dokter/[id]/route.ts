// REST: /api/v1/master/dokter/:id — Dokter tunggal (FLOWS §16 · doc §B.4).
//   GET    → detail (⋈ Pegawai)
//   PATCH  → ubah kredensial klinis + version guard (identitas via Pegawai — G4)
//   DELETE ?expectedVersion=  → soft-delete + lepas pointer + version guard
import { route, reply } from "@/lib/http/route";
import { IdParam, UpdateDokterInput, DeleteQuery } from "@/lib/schemas/dokter";
import { dokterService } from "@/lib/services/dokterService";

export const GET = route({
  resource: "master.dokter",
  action: "read",
  params: IdParam,
  handler: ({ params, actor }) => dokterService.getDokter(params.id, actor),
});

export const PATCH = route({
  resource: "master.dokter",
  action: "update",
  params: IdParam,
  body: UpdateDokterInput,
  handler: async ({ params, body, actor }) => {
    const dokter = await dokterService.updateDokter(params.id, body, actor);
    return reply(dokter, { message: `Profil dokter ${dokter.namaTampil} diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.dokter",
  action: "delete",
  params: IdParam,
  query: DeleteQuery,
  handler: async ({ params, query, actor }) => {
    await dokterService.deleteDokter(params.id, query.expectedVersion, actor);
    return reply({ id: params.id }, { message: "Profil dokter dihapus" });
  },
});
