// API inventory/stock (browser) — Daftar Barang. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/inventory/{locations,stock,stock/item}.

import { api } from "@/lib/api/client";
import type {
  InvLocationDTO, InvStockRowDTO, InvItemDetailDTO, InvItemJenis,
  SetStockPolicyInput, StockPolicyDTO,
} from "@/lib/schemas/inventory/stock";

export type { InvLocationDTO, InvStockRowDTO, InvItemDetailDTO, InvItemJenis, SetStockPolicyInput, StockPolicyDTO };

/** GET /inventory/locations — lokasi farmasi (dropdown). */
export async function listInvLocations(signal?: AbortSignal): Promise<InvLocationDTO[]> {
  const { data } = await api.get<InvLocationDTO[]>("/inventory/locations", { signal });
  return data;
}

/** GET /inventory/stock?locationId= — baris Daftar Barang di lokasi. */
export async function listInvStock(locationId: string, signal?: AbortSignal): Promise<InvStockRowDTO[]> {
  const { data } = await api.get<InvStockRowDTO[]>("/inventory/stock", { query: { locationId }, signal });
  return data;
}

/** GET /inventory/stock/item — detail item (saldo lintas-lokasi + batch + pergerakan). */
export async function getInvItemDetail(jenis: InvItemJenis, itemId: string, signal?: AbortSignal): Promise<InvItemDetailDTO> {
  const { data } = await api.get<InvItemDetailDTO>("/inventory/stock/item", { query: { jenis, itemId }, signal });
  return data;
}

/** PATCH /inventory/stock/policy — atur min/ROP/max item di lokasi. */
export async function setStockPolicy(input: SetStockPolicyInput, signal?: AbortSignal): Promise<StockPolicyDTO> {
  const { data } = await api.patch<StockPolicyDTO>("/inventory/stock/policy", input, { signal });
  return data;
}
