// API master/tarif-lab-test (browser) — Mapping Hub Tarif Matrix, grup Lab (LabTest × Penjamin × Jenis Ruangan).
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/master/tarif-lab-test (+ /:id). Paralel tarifTindakan.ts.

import { api } from "@/lib/api/client";
import type { UpsertTarifLabInput, TarifLabTestDTO } from "@/lib/schemas/master/tarifLabTest";

export type { UpsertTarifLabInput, TarifLabTestDTO };

export interface ListTarifLabParams {
  labTestId?: string;
  penjaminKode?: string;
  jenisRuangan?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/tarif-lab-test — list/filter edge tarif lab (cursor pagination). */
export async function listTarifLab(
  params: ListTarifLabParams = {},
  signal?: AbortSignal,
): Promise<{ items: TarifLabTestDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<TarifLabTestDTO[]>("/master/tarif-lab-test", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA edge tarif lab (loop cursor) — matriks butuh map penuh. */
export async function listAllTarifLab(signal?: AbortSignal): Promise<TarifLabTestDTO[]> {
  const out: TarifLabTestDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: TarifLabTestDTO[]; cursor: string | null } =
      await listTarifLab({ limit: 2000, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/tarif-lab-test — set harga (upsert by triple). */
export async function upsertTarifLab(input: UpsertTarifLabInput, signal?: AbortSignal): Promise<TarifLabTestDTO> {
  const { data } = await api.post<TarifLabTestDTO>("/master/tarif-lab-test", input, { signal });
  return data;
}

/** DELETE /master/tarif-lab-test/:id — cabut tarif (→ belum diisi). */
export async function deleteTarifLab(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/tarif-lab-test/${encodeURIComponent(id)}`, { signal });
}
