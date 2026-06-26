import "server-only";

/**
 * Error infra connector BPJS (server-only). Berbeda dari `BPJSError`
 * (bpjsShared) yang = jalur NORMAL (network/business code). Yang di sini =
 * kesalahan KONFIGURASI / DECODE → fail-loud (di-throw, ditangkap audit wrapper),
 * bukan Result. Lihat [docs/BPJS-WS-RULES.md](../../../../docs/BPJS-WS-RULES.md) R5/R1.
 */

/** Konfigurasi server salah/kurang (env hilang saat mode != mock). Fail-fast. */
export class BpjsConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BpjsConfigError";
  }
}

/** Gagal decode response BPJS (AES/LZ-String/JSON) — kontrak rusak / kunci salah. */
export class BpjsDecodeError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "BpjsDecodeError";
    this.cause = cause;
  }
}
