/**
 * INA-CBG Legacy Adapter (LEGACY — parked).
 *
 * Bridging ke E-Klaim Kemenkes desktop app (.NET) yang historically pakai
 * file-based integration (export XML → import hasil grouper XML).
 *
 * Spek reference: E-Klaim INA-CBG desktop app (Permenkes 3/2023 era).
 *
 * Mock implementasi:
 * - `exportToEklaimXml(claim)`: serialize klaim → XML format E-Klaim minimal
 *   (root `<klaim>` dengan sub-elements identitas, diagnosa, prosedur).
 * - `importGrouperResult(xml)`: parse hasil grouper XML (minimal heuristic).
 * - `groupInaCbg(ctx)`: convenience wrapper untuk in-memory mock (lookup
 *   `INA_CBG_LEGACY_MOCK` by prefix heuristic) — dipanggil resolver.
 *
 * Production swap:
 * - Replace `groupInaCbg()` dengan call ke E-Klaim Web API (jika tersedia)
 *   atau file watcher pattern (write XML → wait result XML).
 * - `exportToEklaimXml` shape align dengan XSD resmi E-Klaim.
 *
 * Status: PARKED Phase later — hanya dipakai untuk klaim transisi pre-Okt 2025
 * atau dual-engine Comparator (AD-19) di EK4. Tidak ada submission flow di
 * adapter ini (E-Klaim desktop pakai workflow lokal terpisah).
 *
 * Referensi: TODO-EKLAIM.md § EK0.4.
 */

import { INA_CBG_LEGACY_MOCK } from "./inaCbgLegacyMock";
import {
  Err,
  Ok,
  type ClaimError,
  type ClaimRecord,
  type InaCbgLegacyResult,
  type Result,
} from "./eklaimShared";
import type { ClaimGrouperContext } from "./groupingResolver";

// ── Raw Response (minimal) ─────────────────────────────

/**
 * Raw response ala E-Klaim grouper output. Minimal subset untuk mock —
 * real XSD lebih kompleks (header batch, footer audit, dsb.).
 */
export interface InaCbgRawResult {
  cbgCode: string; // "I-1-01-II"
  groupDescription: string;
  severityRoman: "I" | "II" | "III";
  tarifKelas3: string; // bigint as string
  tarifKelas2: string;
  tarifKelas1: string;
  tarifVIP: string;
  versiGrouper: string;
  generatedAt: string;
}

// ── XML Serialization (mock minimal) ───────────────────

/**
 * Serialize `ClaimRecord` ke XML format E-Klaim. Minimal field — real XSD
 * butuh ~40 elements (rincian tindakan, lab, rad, billing items).
 *
 * Caution: pakai escape XML manual karena no XML lib dependency.
 */
export function exportToEklaimXml(claim: ClaimRecord): string {
  const escape = (s: string): string =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const diagSekunderXml = claim.diagnosaSekunder
    .map((d) => `    <diagnosaSekunder kode="${escape(d.kode)}" />`)
    .join("\n");
  const prosedurXml = claim.tindakanProsedur
    .map((p) => `    <prosedur kode="${escape(p.kode)}" />`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<klaim noKlaim="${escape(claim.noKlaim)}" tipePelayanan="${claim.tipePelayanan}">
  <pasien id="${escape(claim.pasienId)}" age="${claim.age}" gender="${claim.gender}" />
  <kelas value="${claim.kelas}" isKRIS="${claim.isKRIS}" />
  <los>${claim.los}</los>
  <caraPulang>${claim.caraPulang}</caraPulang>
  <koding>
    <diagnosaPrimer kode="${escape(claim.diagnosaPrimer.kode)}" />
${diagSekunderXml}
${prosedurXml}
  </koding>
  <tarifRS>${claim.tarifRS.toString()}</tarifRS>
</klaim>`;
}

/**
 * Parse XML hasil grouper. Minimal — assumes single `<grouperResult>` element
 * dengan atribut cbgCode + tarif fields. Real impl pakai DOMParser/sax.
 */
export function importGrouperResult(xml: string): Result<InaCbgRawResult, ClaimError> {
  const match = xml.match(
    /<grouperResult\s+cbgCode="([^"]+)"\s+severity="(I{1,3})"\s+tarif\.kelas3="(\d+)"\s+tarif\.kelas2="(\d+)"\s+tarif\.kelas1="(\d+)"\s+tarif\.vip="(\d+)"\s*\/>/,
  );
  if (!match) {
    return Err({
      type: "GrouperError",
      message: "Hasil grouper XML tidak match format expected",
      raw: xml.slice(0, 200),
    });
  }
  return Ok({
    cbgCode: match[1],
    groupDescription: `Group ${match[1]}`,
    severityRoman: match[2] as "I" | "II" | "III",
    tarifKelas3: match[3],
    tarifKelas2: match[4],
    tarifKelas1: match[5],
    tarifVIP: match[6],
    versiGrouper: "INA-CBG_v5.9",
    generatedAt: new Date().toISOString(),
  });
}

// ── In-Memory Grouper (mock convenience) ───────────────

export interface InaCbgConfig {
  /** 0-1. Default 0.03 (legacy lebih stable). */
  failRate?: number;
  fixedLatencyMs?: number;
}

/**
 * Convenience mock — di production tidak ada method ini (legacy pakai
 * file-based workflow). Untuk mock-stage + EK4 Comparator, sediakan
 * in-memory call yang shape-equivalent.
 */
export async function groupInaCbg(
  ctx: ClaimGrouperContext,
  config: InaCbgConfig = {},
): Promise<Result<InaCbgRawResult, ClaimError>> {
  await simulateLatency(config.fixedLatencyMs);

  const failRate = config.failRate ?? 0.03;
  if (failRate > 0 && Math.random() < failRate) {
    return Err({
      type: "NetworkError",
      message: "E-Klaim grouper file-watch timeout (simulated)",
      retryable: true,
    });
  }

  // Prefix mapping ICD-10-IM letter → CBG group letter
  const prefix = ctx.diagnosaPrimer.kode.charAt(0);
  const cbgPrefixMap: Record<string, string> = {
    I: "I-1",
    E: "I-4",
    O: "O-6",
    J: "J-1",
    K: "K-1",
    U: "U-1",
  };
  const cbgPrefix = cbgPrefixMap[prefix];
  if (!cbgPrefix) {
    return Err({
      type: "GrouperError",
      message: `INA-CBG: tidak ada mapping untuk prefix "${prefix}"`,
    });
  }

  const severityRoman: "I" | "II" | "III" = ctx.los >= 10 ? "III" : ctx.los >= 5 ? "II" : "I";
  const candidates = INA_CBG_LEGACY_MOCK.filter((e) => e.code.startsWith(cbgPrefix));
  const exact = candidates.find((e) => e.code.endsWith(severityRoman)) ?? candidates[0];

  if (!exact) {
    return Err({
      type: "GrouperError",
      message: `INA-CBG: no candidate untuk prefix "${cbgPrefix}"`,
    });
  }

  return Ok({
    cbgCode: exact.code,
    groupDescription: exact.group,
    severityRoman: ["I", "II", "III"][exact.severity - 1] as "I" | "II" | "III",
    tarifKelas3: exact.tarif.kelas3.toString(),
    tarifKelas2: exact.tarif.kelas2.toString(),
    tarifKelas1: exact.tarif.kelas1.toString(),
    tarifVIP: exact.tarif.vip.toString(),
    versiGrouper: exact.versiGrouper,
    generatedAt: new Date().toISOString(),
  });
}

// ── Mapper: raw → domain ───────────────────────────────

export function toInaCbgLegacyResult(raw: InaCbgRawResult): InaCbgLegacyResult {
  const severity: 1 | 2 | 3 =
    raw.severityRoman === "I" ? 1 : raw.severityRoman === "II" ? 2 : 3;
  return {
    code: raw.cbgCode,
    group: raw.groupDescription,
    severity,
    tarif: {
      kelas3: BigInt(raw.tarifKelas3),
      kelas2: BigInt(raw.tarifKelas2),
      kelas1: BigInt(raw.tarifKelas1),
      vip: BigInt(raw.tarifVIP),
    },
    versiGrouper: raw.versiGrouper,
    timestampGroup: raw.generatedAt,
  };
}

// ── Internal ───────────────────────────────────────────

function simulateLatency(fixedMs?: number): Promise<void> {
  const ms = fixedMs ?? 300 + Math.random() * 800;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
