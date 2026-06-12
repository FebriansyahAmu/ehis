// API master/tarif-tindakan (browser) — Mapping Hub Tarif Matrix (Tindakan × Penjamin × Jenis Ruangan).
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/master/tarif-tindakan (+ /:id). Selaras layananUnit.ts.

import { api } from "@/lib/api/client";
import type { UpsertTarifInput, TarifTindakanDTO } from "@/lib/schemas/master/tarifTindakan";

export type { UpsertTarifInput, TarifTindakanDTO };

export interface ListTarifParams {
  tindakanId?: string;
  penjaminKode?: string;
  jenisRuangan?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/tarif-tindakan — list/filter edge tarif (cursor pagination). */
export async function listTarif(
  params: ListTarifParams = {},
  signal?: AbortSignal,
): Promise<{ items: TarifTindakanDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<TarifTindakanDTO[]>("/master/tarif-tindakan", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA edge tarif (loop cursor) — matriks butuh map penuh. */
export async function listAllTarif(signal?: AbortSignal): Promise<TarifTindakanDTO[]> {
  const out: TarifTindakanDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: TarifTindakanDTO[]; cursor: string | null } =
      await listTarif({ limit: 2000, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/tarif-tindakan — set harga (upsert by triple). */
export async function upsertTarif(input: UpsertTarifInput, signal?: AbortSignal): Promise<TarifTindakanDTO> {
  const { data } = await api.post<TarifTindakanDTO>("/master/tarif-tindakan", input, { signal });
  return data;
}

/** DELETE /master/tarif-tindakan/:id — cabut tarif (→ belum diisi). */
export async function deleteTarif(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/tarif-tindakan/${encodeURIComponent(id)}`, { signal });
}
