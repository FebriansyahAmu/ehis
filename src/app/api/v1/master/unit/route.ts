// REST: /api/v1/master/unit — buat Unit (Organization) di bawah Unit induk.
// (Tree read & list via GET /api/v1/master/ruangan?view=tree.)
import { route, reply } from "@/lib/http/route";
import { CreateUnitInput } from "@/lib/schemas/ruangan";
import { ruanganService } from "@/lib/services/ruanganService";

export const POST = route({
  resource: "master.ruangan",
  action: "create",
  body: CreateUnitInput,
  handler: async ({ body, actor }) => {
    const unit = await ruanganService.createUnit(body, actor);
    return reply(unit, { status: 201, message: `Unit ${unit.name} dibuat` });
  },
});
