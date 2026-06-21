// API katalog lab (browser, sisi worklist) — baca parameter master untuk Entry Hasil.
// Endpoint: GET /api/v1/lab/test-params?ids= (gate ancillary.lab.worklist:read).

import { api } from "@/lib/api/client";
import type { LabTestDTO } from "@/lib/schemas/master/labTest";

export type { LabTestDTO };

/** GET — parameter katalog (LabTest + LabParameter) untuk daftar tes diorder. */
export async function getLabTestParams(ids: string[], signal?: AbortSignal): Promise<LabTestDTO[]> {
  if (ids.length === 0) return [];
  const { data } = await api.get<LabTestDTO[]>("/lab/test-params", { query: { ids: ids.join(",") }, signal });
  return data;
}
