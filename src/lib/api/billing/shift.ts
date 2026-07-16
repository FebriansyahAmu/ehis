// API shift kasir (browser, Slice 2e). Papan { active, open, recentClosed } + buka + tutup + kandidat
// kasir. Tipe DI-REUSE dari schema. Endpoint /billing/shift* (gate billing.kasir).

import { api } from "@/lib/api/client";
import type {
  OpenShiftInput, CloseShiftInput, ShiftBoardDTO, ShiftDTO, KasirUserDTO,
} from "@/lib/schemas/billing/shift";

export type { OpenShiftInput, CloseShiftInput, ShiftBoardDTO, ShiftDTO, KasirUserDTO };

/** Papan shift kasir (active milik user + open semua counter + recent closed). */
export async function getShiftBoard(signal?: AbortSignal): Promise<ShiftBoardDTO> {
  const { data } = await api.get<ShiftBoardDTO>("/billing/shift", { signal });
  return data;
}

/** Buka shift → papan ter-update. */
export async function openShift(input: OpenShiftInput, signal?: AbortSignal): Promise<ShiftBoardDTO> {
  const { data } = await api.post<ShiftBoardDTO>("/billing/shift", input, { signal });
  return data;
}

/** Tutup shift → papan ter-update. */
export async function closeShift(
  shiftId: string, input: CloseShiftInput, signal?: AbortSignal,
): Promise<ShiftBoardDTO> {
  const { data } = await api.patch<ShiftBoardDTO>(
    `/billing/shift/${encodeURIComponent(shiftId)}/tutup`, input, { signal },
  );
  return data;
}

/** Kandidat kasir (dropdown Buka Shift). */
export async function listKasirUsers(signal?: AbortSignal): Promise<KasirUserDTO[]> {
  const { data } = await api.get<KasirUserDTO[]>("/billing/kasir-users", { signal });
  return data;
}
