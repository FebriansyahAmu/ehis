// DTO status integrasi SatuSehat (FH0). Dipakai route GET /fhir/status + FE adapter (import type).
// TIDAK memuat nilai rahasia — hanya flag kelengkapan config.

export type SyncStatusKey = "Pending" | "Sending" | "Acked" | "Failed" | "Skipped";
export type CircuitStateKey = "closed" | "open" | "half-open";

export interface FhirStatusDTO {
  config: {
    mode: "mock" | "sandbox" | "prod" | "invalid";
    host: string;
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasOrgId: boolean;
    error?: string;
  };
  token: { cached: boolean; expiresInSec: number; coolingDownSec: number };
  circuits: Record<"fhir" | "kfa" | "masterdata" | "kyc", CircuitStateKey>;
  outbox: Record<SyncStatusKey, number>;
  resourceMap: Record<string, number>;
  recentCalls: {
    id: string;
    startedAt: string;
    mode: string;
    target: string;
    endpoint: string;
    method: string;
    resourceType: string | null;
    responseStatus: string;
    success: boolean;
    durationMs: number;
    errorType: string | null;
  }[];
}

export interface FhirTokenProbeDTO {
  ok: boolean;
  mode: "mock" | "sandbox" | "prod";
  message: string;
  expiresInSec?: number;
  durationMs: number;
}
