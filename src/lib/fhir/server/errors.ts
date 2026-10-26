import "server-only";

/**
 * Error infra connector SatuSehat (server-only). Berbeda dari `FhirError` (fhirShared) yang =
 * jalur NORMAL (network/OperationOutcome). Yang di sini = kesalahan KONFIGURASI → fail-loud
 * (di-throw, ditangkap audit wrapper), bukan Result. Lihat docs/FHIR-RULES.md R1/R13.
 */

/** Konfigurasi server salah/kurang (env hilang saat mode != mock). Fail-fast. */
export class FhirConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FhirConfigError";
  }
}
