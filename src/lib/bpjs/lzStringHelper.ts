/**
 * LZ-String Compression Helper.
 *
 * V-Claim body request/response production di-compress LZ-String per
 * spek BPJS. Phase 1: no-op (mock skip compression) — sufficient
 * untuk test transport contract tanpa dependency NPM.
 *
 * Phase backend: install NPM `lz-string`:
 *
 * ```ts
 * import LZString from "lz-string";
 * export const compressLZ = <T>(payload: T) =>
 *   LZString.compressToEncodedURIComponent(JSON.stringify(payload));
 * export const decompressLZ = <T>(s: string) =>
 *   JSON.parse(LZString.decompressFromEncodedURIComponent(s) ?? "{}") as T;
 * ```
 *
 * Referensi: TODO-BPJS.md § BP0.1.
 */

/**
 * Compress JSON-serializable payload → string.
 * Phase 1: stringify saja (no-op compression).
 */
export function compressLZ<T>(payload: T): string {
  return JSON.stringify(payload);
}

/**
 * Decompress LZ-String → parsed JSON.
 * Phase 1: JSON.parse saja.
 */
export function decompressLZ<T = unknown>(compressed: string): T {
  return JSON.parse(compressed) as T;
}

/**
 * Round-trip check (dev): compress → decompress harus mengembalikan
 * struktur identik. Useful untuk smoke test sebelum aktivasi real LZ.
 */
export function isLZRoundtripSafe<T>(payload: T): boolean {
  try {
    const compressed = compressLZ(payload);
    const restored = decompressLZ<T>(compressed);
    return JSON.stringify(payload) === JSON.stringify(restored);
  } catch {
    return false;
  }
}
