// API inventory/dashboard (browser) — agregat Beranda + Monitoring. Tipe DI-REUSE dari schema server.
// Endpoint: /api/v1/inventory/dashboard/{overview,monitoring}.

import { api } from "@/lib/api/client";
import type { InvBerandaDTO, InvMonitoringDTO } from "@/lib/schemas/inventory/dashboard";

export type { InvBerandaDTO, InvMonitoringDTO };

/** GET /inventory/dashboard/overview — agregat Beranda. */
export async function getInvOverview(signal?: AbortSignal): Promise<InvBerandaDTO> {
  const { data } = await api.get<InvBerandaDTO>("/inventory/dashboard/overview", { signal });
  return data;
}

/** GET /inventory/dashboard/monitoring — agregat Monitoring. */
export async function getInvMonitoring(signal?: AbortSignal): Promise<InvMonitoringDTO> {
  const { data } = await api.get<InvMonitoringDTO>("/inventory/dashboard/monitoring", { signal });
  return data;
}
