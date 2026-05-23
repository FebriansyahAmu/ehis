/**
 * Shared component layer untuk halaman master Skala (Risiko/Umum/Penyakit).
 *
 * Pemakaian:
 *   import {
 *     SkalaList, SkalaDetail, SkalaEmptyState,
 *     type SkalaTabKey,
 *   } from "@/components/master/skala-shared";
 *
 * Per-master Page hanya jadi thin wrapper yang pass:
 *   - mock data + emptyFactory
 *   - accent + branded classes
 *   - copy text (title, eyebrow, description, addLabel, emptyState text)
 */

export { default as SkalaList } from "./SkalaList";
export { default as SkalaDetail } from "./SkalaDetail";
export { default as SkalaEmptyState } from "./SkalaEmptyState";

export {
  SKALA_TABS, TONE_CFG, MODUL_CFG,
  getSkalaStatusCfg, isSkalaValid, skalaInitials, fmtModulList,
  deriveTotalMax, findInterpretasi, detectRangeIssues,
  MODUL_LIST_ALL, TONE_OPTIONS,
  type SkalaTabKey, type SkalaTabConfig, type ToneClasses, type RangeIssue,
} from "./skalaConfig";
