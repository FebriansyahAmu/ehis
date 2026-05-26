/**
 * Grouping Resolver — dual-engine router untuk iDRG (primary) vs INA-CBG Legacy.
 *
 * Context: post-Okt 2025, RS bisa di-mode iDRG (default) atau INA-CBG Legacy
 * (transisi/edge case). Field `eraGrouper` di context routing decision.
 *
 * Layering:
 * - Adapter (`iDRGGrouperAdapter` / `inaCbgLegacyAdapter`) = transport layer,
 *   return raw response shape match spek.
 * - Resolver (file ini) = orchestration: call adapter, map raw → domain via
 *   adapter's `toIDRGResult()` / `toInaCbgLegacyResult()`, return clean
 *   `Result<iDRGResult | InaCbgLegacyResult, ClaimError>`.
 *
 * `resolveComparator()` resolve KEDUA engine paralel untuk EK4 dual preview
 * (AD-19) — primary failure block, secondary failure tidak block (attach error).
 *
 * Referensi: TODO-EKLAIM.md § EK0.3 + EK0.4 · architectural decision AD-19.
 */

import { groupiDRG, toIDRGResult } from "./iDRGGrouperAdapter";
import { findIDRGByICD10IM, IDRG_LOOKUP_MOCK } from "./iDRGLookupMock";
import { groupInaCbg, toInaCbgLegacyResult } from "./inaCbgLegacyAdapter";
import {
  Err,
  Ok,
  type CaraPulang,
  type ClaimError,
  type EraGrouper,
  type Gender,
  type KelasRawat,
  type KodeICD10IM,
  type KodeICD9CMIM,
  type Result,
  type TingkatKompetensiRS,
  type TipePelayanan,
  type iDRGResult,
  type InaCbgLegacyResult,
} from "./eklaimShared";

// ── Context Type ───────────────────────────────────────

export interface ClaimGrouperContext {
  eraGrouper: EraGrouper;
  diagnosaPrimer: KodeICD10IM;
  diagnosaSekunder: ReadonlyArray<KodeICD10IM>;
  tindakanProsedur: ReadonlyArray<KodeICD9CMIM>;
  tipePelayanan: TipePelayanan;
  kelas: KelasRawat;
  isKRIS: boolean;
  tingkatKompetensiRS: TingkatKompetensiRS;
  los: number;
  age: number;
  gender: Gender;
  caraPulang: CaraPulang;
}

export type GroupingResult = iDRGResult | InaCbgLegacyResult;

// ── Public API ─────────────────────────────────────────

/**
 * Resolve grouping berdasarkan `eraGrouper` di context.
 * Delegate ke adapter sesuai era — return clean domain type.
 */
export async function resolveGrouping(
  ctx: ClaimGrouperContext,
): Promise<Result<GroupingResult, ClaimError>> {
  if (ctx.eraGrouper === "iDRG") {
    return resolveIDRG(ctx);
  }
  return resolveInaCbgLegacy(ctx);
}

/**
 * Resolve KEDUA engine sekaligus untuk Comparator (AD-19, EK4 dual preview).
 * Return Ok kalau primary (sesuai eraGrouper) sukses — secondary failure di-attach
 * tapi tidak block. UI label clear "ESTIMASI · REFERENCE ONLY".
 */
export async function resolveComparator(ctx: ClaimGrouperContext): Promise<
  Result<
    {
      primary: GroupingResult;
      secondary?: GroupingResult;
      secondaryError?: ClaimError;
    },
    ClaimError
  >
> {
  const [iDRG, inaCbg] = await Promise.all([
    resolveIDRG(ctx).catch((): Result<iDRGResult, ClaimError> => ({
      ok: false,
      error: { type: "GrouperError", message: "iDRG adapter crashed" },
    })),
    resolveInaCbgLegacy(ctx).catch((): Result<InaCbgLegacyResult, ClaimError> => ({
      ok: false,
      error: { type: "GrouperError", message: "INA-CBG adapter crashed" },
    })),
  ]);

  const primary = ctx.eraGrouper === "iDRG" ? iDRG : inaCbg;
  const secondary = ctx.eraGrouper === "iDRG" ? inaCbg : iDRG;

  if (!primary.ok) return Err(primary.error);

  return Ok({
    primary: primary.value,
    secondary: secondary.ok ? secondary.value : undefined,
    secondaryError: !secondary.ok ? secondary.error : undefined,
  });
}

// ── iDRG Resolution (delegate to adapter) ──────────────

async function resolveIDRG(
  ctx: ClaimGrouperContext,
): Promise<Result<iDRGResult, ClaimError>> {
  const raw = await groupiDRG(ctx);
  if (!raw.ok) return Err(raw.error);

  // Adapter mungkin return status "ERROR" envelope (e.g. ICD not mapped) — map ke ClaimError
  if (raw.value.status === "ERROR") {
    return Err({
      type: "GrouperError",
      message: raw.value.error?.message ?? "iDRG grouper returned ERROR",
    });
  }

  try {
    return Ok(toIDRGResult(raw.value, ctx.tingkatKompetensiRS));
  } catch (e) {
    return Err({
      type: "GrouperError",
      message: e instanceof Error ? e.message : "Failed to map iDRG response",
      raw: raw.value,
    });
  }
}

// ── INA-CBG Legacy Resolution (delegate to adapter) ────

async function resolveInaCbgLegacy(
  ctx: ClaimGrouperContext,
): Promise<Result<InaCbgLegacyResult, ClaimError>> {
  const raw = await groupInaCbg(ctx);
  if (!raw.ok) return Err(raw.error);
  return Ok(toInaCbgLegacyResult(raw.value));
}

// ── UI Hint Helpers ────────────────────────────────────

/** Hint count berapa iDRG candidate untuk ICD-10-IM tertentu — UI hint coder. */
export function countIDRGCandidates(kodeICD10IM: string): number {
  return findIDRGByICD10IM(kodeICD10IM).length;
}

/** Hint apakah ICD-10-IM tertentu punya mapping iDRG sama sekali. */
export function hasIDRGMapping(kodeICD10IM: string): boolean {
  return IDRG_LOOKUP_MOCK.some((e) => e.icd10IMList.includes(kodeICD10IM));
}
