// API master/tarif-kamar (browser) — Mapping Hub → Tarif Ruang Rawat (Kelas × Penjamin).
// Tipe DI-REUSE dari schema server. Endpoint: /api/v1/master/tarif-kamar (+ /:id). Paralel tarifLabTest.ts.

import { api } from "@/lib/api/client";
import type { UpsertTarifKamarInput, TarifKamarDTO } from "@/lib/schemas/master/tarifKamar";

export type { UpsertTarifKamarInput, TarifKamarDTO };

export interface ListTarifKamarParams {
  kelas?: string;
  penjaminKode?: string;
  cursor?: string;
  limit?: number;
}

/** GET /master/tarif-kamar — list/filter (cursor pagination). */
export async function listTarifKamar(
  params: ListTarifKamarParams = {},
  signal?: AbortSignal,
): Promise<{ items: TarifKamarDTO[]; cursor: string | null }> {
  const { data, meta } = await api.get<TarifKamarDTO[]>("/master/tarif-kamar", { query: { ...params }, signal });
  const cursor = (meta as { cursor?: string | null } | undefined)?.cursor ?? null;
  return { items: data, cursor };
}

/** Ambil SEMUA tarif kamar (loop cursor) — grid butuh map penuh. */
export async function listAllTarifKamar(signal?: AbortSignal): Promise<TarifKamarDTO[]> {
  const out: TarifKamarDTO[] = [];
  let cursor: string | null = null;
  do {
    const { items, cursor: next }: { items: TarifKamarDTO[]; cursor: string | null } =
      await listTarifKamar({ limit: 500, cursor: cursor ?? undefined }, signal);
    out.push(...items);
    cursor = next;
  } while (cursor);
  return out;
}

/** POST /master/tarif-kamar — set harga (upsert by pair). */
export async function upsertTarifKamar(input: UpsertTarifKamarInput, signal?: AbortSignal): Promise<TarifKamarDTO> {
  const { data } = await api.post<TarifKamarDTO>("/master/tarif-kamar", input, { signal });
  return data;
}

/** DELETE /master/tarif-kamar/:id — cabut tarif (→ belum diisi). */
export async function deleteTarifKamar(id: string, signal?: AbortSignal): Promise<void> {
  await api.del(`/master/tarif-kamar/${encodeURIComponent(id)}`, { signal });
}
