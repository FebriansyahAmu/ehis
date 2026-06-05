// REST: /api/v1/master/ruangan/:id/bed — tambah Bed ke Ruangan (nest 1 level; butuh
// parent + cek kapasitas). Operasi item bed (PATCH/DELETE) di /api/v1/master/bed/:bedId.
import { route, reply } from "@/lib/http/route";
import { IdParam, CreateBedInput } from "@/lib/schemas/ruangan";
import { ruanganService } from "@/lib/services/ruanganService";

export const POST = route({
  resource: "master.ruangan",
  action: "create",
  params: IdParam,
  body: CreateBedInput,
  handler: async ({ params, body, actor }) => {
    const bed = await ruanganService.addBed(params.id, body, actor);
    return reply(bed, { status: 201, message: `Bed ${bed.name} ditambahkan` });
  },
});
