// API Intake/Output (browser) — tab Balance Cairan. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/kunjungan/:id/intake-output (GET agregat · POST entri) + /:itemId (DELETE)
//           + /target (POST set target).

import { api } from "@/lib/api/client";
import type {
  IOEntryInput, IOTargetInput, IntakeOutputDTO, IOEntryDTO, IOTargetDTO,
} from "@/lib/schemas/intakeOutput/intakeOutput";

export type { IOEntryInput, IOTargetInput, IntakeOutputDTO, IOEntryDTO, IOTargetDTO };

const base = (k: string) => `/kunjungan/${encodeURIComponent(k)}/intake-output`;

/** GET — agregat { entries, target } per kunjungan. */
export async function getIntakeOutput(kunjunganId: string, signal?: AbortSignal): Promise<IntakeOutputDTO> {
  const { data } = await api.get<IntakeOutputDTO>(base(kunjunganId), { signal });
  return data;
}

/** POST — tambah 1 entri cairan. */
export async function addIOEntry(kunjunganId: string, input: IOEntryInput, signal?: AbortSignal): Promise<IOEntryDTO> {
  const { data } = await api.post<IOEntryDTO>(base(kunjunganId), input, { signal });
  return data;
}

/** DELETE — soft-delete 1 entri (entered-in-error). */
export async function deleteIOEntry(kunjunganId: string, itemId: string, signal?: AbortSignal): Promise<void> {
  await api.del(`${base(kunjunganId)}/${encodeURIComponent(itemId)}`, { signal });
}

/** POST — set target DPJP (latest-wins). */
export async function setIOTarget(kunjunganId: string, input: IOTargetInput, signal?: AbortSignal): Promise<IOTargetDTO> {
  const { data } = await api.post<IOTargetDTO>(`${base(kunjunganId)}/target`, input, { signal });
  return data;
}
