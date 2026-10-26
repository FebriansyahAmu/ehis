// API status integrasi SatuSehat (browser). Tipe DI-REUSE dari schema server (`import type`).
// Endpoint: GET /api/v1/fhir/status · POST /api/v1/fhir/status/probe. Konsumen: konsol /ehis-fhir (FH9).

import { api } from "@/lib/api/client";
import type { FhirStatusDTO, FhirTokenProbeDTO } from "@/lib/schemas/fhir/status";

export type { FhirStatusDTO, FhirTokenProbeDTO };

export async function getFhirStatus(signal?: AbortSignal): Promise<FhirStatusDTO> {
  const { data } = await api.get<FhirStatusDTO>("/fhir/status", { signal });
  return data;
}

/** Uji token OAuth2 ke SatuSehat (mode sandbox/prod). Mode mock → ok tanpa jaringan. */
export async function probeFhirToken(): Promise<FhirTokenProbeDTO> {
  const { data } = await api.post<FhirTokenProbeDTO>("/fhir/status/probe", {});
  return data;
}
