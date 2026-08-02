// API Referensi Wilayah (browser). Tipe DI-REUSE dari schema server (`import type`).
// Endpoint: GET /api/v1/wilayah (lazy per-level). Konsumen: cascading WilayahPicker.

import { api } from "@/lib/api/client";
import type { WilayahDTO } from "@/lib/schemas/master/wilayah";

export type { WilayahDTO };

export interface WilayahParams {
  level?: number;
  parentKode?: string;
  q?: string;
  ancestorsOf?: string;
  limit?: number;
}

function toQuery(p: WilayahParams): string {
  const sp = new URLSearchParams();
  if (p.level !== undefined) sp.set("level", String(p.level));
  if (p.parentKode) sp.set("parentKode", p.parentKode);
  if (p.q) sp.set("q", p.q);
  if (p.ancestorsOf) sp.set("ancestorsOf", p.ancestorsOf);
  if (p.limit !== undefined) sp.set("limit", String(p.limit));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** GET /wilayah — daftar wilayah sesuai mode (provinsi default / anak parent / cari / leluhur). */
export async function listWilayah(params: WilayahParams = {}, signal?: AbortSignal): Promise<WilayahDTO[]> {
  const { data } = await api.get<WilayahDTO[]>(`/wilayah${toQuery(params)}`, { signal });
  return data ?? [];
}
