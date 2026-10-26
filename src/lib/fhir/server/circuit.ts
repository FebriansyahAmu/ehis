import "server-only";

/**
 * FH0 — Circuit breaker per target SatuSehat (R10). Gagal beruntun (network/5xx) ≥ THRESHOLD →
 * OPEN selama COOLDOWN (fail-fast, lindungi outbox worker) → HALF-OPEN (1 percobaan) → CLOSED
 * bila sukses. Error validasi (4xx OperationOutcome) TIDAK dihitung gagal — itu kesalahan payload.
 *
 * In-memory per-proses (globalThis). Multi-instance → Redis (seam sama).
 */

import type { FhirTarget } from "../fhirShared";

const THRESHOLD = 5;
const COOLDOWN_MS = 30_000;

interface Circuit {
  failures: number;
  openedAt: number;
}

const g = globalThis as unknown as { __ehisSatuSehatCircuit?: Map<FhirTarget, Circuit> };
const circuits: Map<FhirTarget, Circuit> = (g.__ehisSatuSehatCircuit ??= new Map());

function get(target: FhirTarget): Circuit {
  let c = circuits.get(target);
  if (!c) {
    c = { failures: 0, openedAt: 0 };
    circuits.set(target, c);
  }
  return c;
}

export type CircuitState = "closed" | "open" | "half-open";

export function circuitState(target: FhirTarget): CircuitState {
  const c = get(target);
  if (c.failures < THRESHOLD) return "closed";
  return Date.now() - c.openedAt < COOLDOWN_MS ? "open" : "half-open";
}

/** `false` = tolak panggilan (circuit terbuka). */
export function circuitAllows(target: FhirTarget): boolean {
  return circuitState(target) !== "open";
}

export function recordSuccess(target: FhirTarget): void {
  const c = get(target);
  c.failures = 0;
  c.openedAt = 0;
}

export function recordFailure(target: FhirTarget): void {
  const c = get(target);
  c.failures += 1;
  if (c.failures >= THRESHOLD) c.openedAt = Date.now();
}

export function describeCircuits(): Record<FhirTarget, CircuitState> {
  return {
    fhir: circuitState("fhir"),
    kfa: circuitState("kfa"),
    masterdata: circuitState("masterdata"),
    kyc: circuitState("kyc"),
  };
}

/** Reset (test). */
export function resetCircuits(): void {
  circuits.clear();
}
