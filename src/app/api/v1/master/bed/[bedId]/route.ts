// REST: /api/v1/master/bed/:bedId — operasi item Bed (flat; Bed ber-UUID sendiri).
//   PATCH  → ubah nama/kode/status
//   DELETE → soft-delete (tanpa version — bed = leaf sub-record)
import { route, reply } from "@/lib/http/route";
import { BedIdParam, UpdateBedInput } from "@/lib/schemas/ruangan";
import { ruanganService } from "@/lib/services/ruanganService";

export const PATCH = route({
  resource: "master.ruangan",
  action: "update",
  params: BedIdParam,
  body: UpdateBedInput,
  handler: async ({ params, body, actor }) => {
    const bed = await ruanganService.updateBed(params.bedId, body, actor);
    return reply(bed, { message: `Bed ${bed.name} diperbarui` });
  },
});

export const DELETE = route({
  resource: "master.ruangan",
  action: "delete",
  params: BedIdParam,
  handler: async ({ params, actor }) => {
    await ruanganService.deleteBed(params.bedId, actor);
    return reply({ id: params.bedId }, { message: "Bed dihapus" });
  },
});
