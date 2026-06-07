// REST: /api/v1/master/triase-igd/default — protokol triase DEFAULT aktif.
// Dikonsumsi medicalrecord.Triase ("Tabel Kriteria Triase" di TriaseTab). null bila belum ada.
// Segmen statis "default" diprioritaskan Next di atas [id] (UUID) → tak bentrok.

import { route } from "@/lib/http/route";
import { triaseProtocolService } from "@/lib/services/triaseProtocolService";

export const GET = route({
  resource: "master.triase",
  action: "read",
  handler: ({ actor }) => triaseProtocolService.getDefault(actor),
});
