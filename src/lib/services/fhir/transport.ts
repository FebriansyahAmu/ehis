// FH1 — fhirRequest: SATU pintu service → SatuSehat. Pilih mock vs nyata (`SATUSEHAT_MODE`) +
// audit 1 baris per panggilan (R9/R13). Semua service FHIR memanggil ini, BUKAN connector langsung.

import "server-only";
import { isSatuSehatMockMode } from "@/lib/fhir/server/config";
import { callSatuSehat, type FhirCallOptions, type FhirResponse } from "@/lib/fhir/server/httpClient";
import { mockSatuSehat } from "@/lib/fhir/server/mock";
import { auditedFhirCall, type FhirAuditContext } from "./audit";
import type { Result, FhirError } from "@/lib/fhir/fhirShared";

/** Metadata audit; target/method/requestBody diturunkan dari opsi panggilan. */
export type FhirRequestAudit = Omit<FhirAuditContext, "target" | "method" | "requestBody">;

export function fhirRequest<T = unknown>(
  opts: FhirCallOptions,
  audit: FhirRequestAudit,
): Promise<Result<FhirResponse<T>, FhirError>> {
  return auditedFhirCall<T>(
    { ...audit, target: opts.target ?? "fhir", method: opts.method ?? "GET", requestBody: opts.body },
    () => (isSatuSehatMockMode() ? mockSatuSehat<T>(opts) : callSatuSehat<T>(opts)),
  );
}
