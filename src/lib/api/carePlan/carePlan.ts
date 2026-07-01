// API rencana asuhan / RAT (browser) — tab Rencana Asuhan. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/care-plan (GET list · POST masalah) + /:masalahId (PATCH · DELETE)
//           + /:masalahId/goal (POST) + /:masalahId/goal/:goalId (PATCH · DELETE).

import { api } from "@/lib/api/client";
import type {
  MasalahInput, MasalahUpdate, GoalInput, GoalUpdate,
  CarePlanMasalahDTO,
} from "@/lib/schemas/carePlan/carePlan";

export type { MasalahInput, MasalahUpdate, GoalInput, GoalUpdate, CarePlanMasalahDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/care-plan`;
const mBase = (k: string, m: string) => `${base(k)}/${encodeURIComponent(m)}`;

/** GET — daftar masalah (+ goals) rencana asuhan per kunjungan. */
export async function getCarePlan(kunjunganId: string, signal?: AbortSignal): Promise<CarePlanMasalahDTO[]> {
  const { data } = await api.get<CarePlanMasalahDTO[]>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 masalah (+ goal awal opsional). */
export async function createMasalah(
  kunjunganId: string, input: MasalahInput, signal?: AbortSignal,
): Promise<CarePlanMasalahDTO> {
  const { data } = await api.post<CarePlanMasalahDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** PATCH — ubah 1 masalah (edit / verify co-sign DPJP). */
export async function updateMasalah(
  kunjunganId: string, masalahId: string, input: MasalahUpdate, signal?: AbortSignal,
): Promise<CarePlanMasalahDTO> {
  const { data } = await api.patch<CarePlanMasalahDTO>(mBase(kunjunganId, masalahId), input, { signal });
  return data;
}

/** DELETE — soft-delete 1 masalah (entered-in-error). */
export async function deleteMasalah(kunjunganId: string, masalahId: string, signal?: AbortSignal): Promise<void> {
  await api.del(mBase(kunjunganId, masalahId), { signal });
}

/** POST — tambah 1 goal ke masalah. Mengembalikan DTO masalah ter-refresh (goals[]). */
export async function createGoal(
  kunjunganId: string, masalahId: string, input: GoalInput, signal?: AbortSignal,
): Promise<CarePlanMasalahDTO> {
  const { data } = await api.post<CarePlanMasalahDTO>(`${mBase(kunjunganId, masalahId)}/goal`, input, { signal });
  return data;
}

/** PATCH — ubah 1 goal. Mengembalikan DTO masalah ter-refresh. */
export async function updateGoal(
  kunjunganId: string, masalahId: string, goalId: string, input: GoalUpdate, signal?: AbortSignal,
): Promise<CarePlanMasalahDTO> {
  const { data } = await api.patch<CarePlanMasalahDTO>(
    `${mBase(kunjunganId, masalahId)}/goal/${encodeURIComponent(goalId)}`, input, { signal });
  return data;
}

/** DELETE — soft-delete 1 goal. Mengembalikan DTO masalah ter-refresh. */
export async function deleteGoal(
  kunjunganId: string, masalahId: string, goalId: string, signal?: AbortSignal,
): Promise<CarePlanMasalahDTO> {
  const { data } = await api.del<CarePlanMasalahDTO>(
    `${mBase(kunjunganId, masalahId)}/goal/${encodeURIComponent(goalId)}`, { signal });
  return data;
}
