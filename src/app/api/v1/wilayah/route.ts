// REST: GET /api/v1/wilayah — referensi wilayah Kemendagri (lazy per-level).
//   ?level= | ?parentKode= | ?q= | ?ancestorsOf= (lihat WilayahQuery).
// Gate master.wilayah:read (referensi publik lintas modul). Route TIPIS.

import { route } from "@/lib/http/route";
import { WilayahQuery } from "@/lib/schemas/master/wilayah";
import { wilayahService } from "@/lib/services/master/wilayahService";

export const GET = route({
  resource: "master.wilayah",
  action: "read",
  query: WilayahQuery,
  handler: async ({ query }) => wilayahService.list(query),
});
