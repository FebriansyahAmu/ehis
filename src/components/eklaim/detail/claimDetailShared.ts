/**
 * Klaim Detail — shared types · tab config · timeline stages · helpers.
 *
 * Reference: TODO-EKLAIM.md § EK3.1 (Banner Header + Tab Scaffold).
 *
 * Design tokens:
 * - Accent module: teal (primary), sky untuk CTA "Submit ke BPJS",
 *   amber untuk progress/peringatan, emerald untuk Approved/Paid,
 *   rose untuk Rejected/Write-off, slate untuk neutral.
 * - **No indigo / violet** per user preference.
 * - Font scale ≥ 11.5px untuk label, ≥ 12.5px untuk value/body.
 */

import {
  ClipboardList,
  FileCheck,
  Stethoscope,
  Scale,
  Send,
  History,
  Edit3,
  ShieldCheck,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Wallet,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  ClaimRecord,
  ClaimStatus,
  BerkasKlaim,
} from "@/lib/eklaim/eklaimShared";
import type { KlaimTone } from "../klaim/klaimBoardShared";

// ── Tab Config ─────────────────────────────────────────

export type ClaimDetailTab =
  | "ringkasan"
  | "berkas"
  | "koding"
  | "grouper"
  | "submission"
  | "audit";

export interface TabCfg {
  key: ClaimDetailTab;
  label: string;
  /** Sublabel sub-pertama untuk konteks (e.g. "EK3.2"). */
  hint: string;
  icon: LucideIcon;
  /** Apakah tab sudah implemented (untuk placeholder banner). */
  implemented: boolean;
}

export const CLAIM_DETAIL_TABS: ReadonlyArray<TabCfg> = [
  {
    key: "ringkasan",
    label: "Ringkasan",
    hint: "Overview · status & metrik",
    icon: ClipboardList,
    implemented: false,
  },
  {
    key: "berkas",
    label: "Berkas",
    hint: "Checklist & upload dokumen",
    icon: FileCheck,
    implemented: true,
  },
  {
    key: "koding",
    label: "Koding",
    hint: "ICD-10-IM & ICD-9-CM-IM",
    icon: Stethoscope,
    implemented: true,
  },
  {
    key: "grouper",
    label: "Grouper",
    hint: "iDRG · tarif & severity",
    icon: Scale,
    implemented: true,
  },
  {
    key: "submission",
    label: "Submission",
    hint: "Eligibility & kirim batch",
    icon: Send,
    implemented: true,
  },
  {
    key: "audit",
    label: "Audit",
    hint: "Timeline & jejak perubahan",
    icon: History,
    implemented: true,
  },
];

export function findTab(key: string | undefined): ClaimDetailTab {
  if (!key) return "ringkasan";
  const found = CLAIM_DETAIL_TABS.find((t) => t.key === key);
  return found?.key ?? "ringkasan";
}

// ── Timeline Stages (5-stage horizontal pipeline) ──────

export type StageKey =
  | "koding"
  | "verif-rs"
  | "submit"
  | "verif-bpjs"
  | "selesai";

export type StageState = "idle" | "active" | "done" | "error";

export interface TimelineStage {
  key: StageKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

export const TIMELINE_STAGES: ReadonlyArray<TimelineStage> = [
  { key: "koding",     label: "Koding",           shortLabel: "Koding",   icon: Edit3            },
  { key: "verif-rs",   label: "Verifikasi RS",    shortLabel: "Verif RS", icon: ClipboardCheck   },
  { key: "submit",     label: "Submit BPJS",      shortLabel: "Submit",   icon: Send             },
  { key: "verif-bpjs", label: "Verifikasi BPJS",  shortLabel: "Verif",    icon: Clock            },
  { key: "selesai",    label: "Dibayar / Final",  shortLabel: "Selesai",  icon: Wallet           },
];

/**
 * Resolve state per stage berdasarkan ClaimStatus.
 * - `done` = sudah lewat
 * - `active` = sedang di stage ini
 * - `idle` = belum dicapai
 * - `error` = stuck/rejected di stage ini
 */
export function resolveStageStates(status: ClaimStatus): Record<StageKey, StageState> {
  const init: Record<StageKey, StageState> = {
    koding: "idle",
    "verif-rs": "idle",
    submit: "idle",
    "verif-bpjs": "idle",
    selesai: "idle",
  };

  switch (status) {
    case "Draft Coding":
      init.koding = "active";
      break;

    case "Belum Submit":
      init.koding = "done";
      init["verif-rs"] = "active";
      break;

    case "Submitted":
      init.koding = "done";
      init["verif-rs"] = "done";
      init.submit = "active";
      break;

    case "Pending Verifikasi":
      init.koding = "done";
      init["verif-rs"] = "done";
      init.submit = "done";
      init["verif-bpjs"] = "active";
      break;

    case "Susulan Required":
      init.koding = "done";
      init["verif-rs"] = "done";
      init.submit = "done";
      init["verif-bpjs"] = "error";
      break;

    case "Approved":
      init.koding = "done";
      init["verif-rs"] = "done";
      init.submit = "done";
      init["verif-bpjs"] = "done";
      init.selesai = "active";
      break;

    case "Paid":
      init.koding = "done";
      init["verif-rs"] = "done";
      init.submit = "done";
      init["verif-bpjs"] = "done";
      init.selesai = "done";
      break;

    case "Rejected":
    case "Banding Rejected":
    case "Sengketa":
      init.koding = "done";
      init["verif-rs"] = "done";
      init.submit = "done";
      init["verif-bpjs"] = "error";
      break;

    case "Banding Submitted":
      init.koding = "done";
      init["verif-rs"] = "done";
      init.submit = "done";
      init["verif-bpjs"] = "active";
      break;

    case "Banding Approved":
      init.koding = "done";
      init["verif-rs"] = "done";
      init.submit = "done";
      init["verif-bpjs"] = "done";
      init.selesai = "active";
      break;

    case "Write-off":
      init.koding = "done";
      init["verif-rs"] = "done";
      init.submit = "done";
      init["verif-bpjs"] = "done";
      init.selesai = "error";
      break;
  }

  return init;
}

// ── Berkas Progress ────────────────────────────────────

export interface BerkasProgress {
  /** Berkas wajib yang sudah siap. */
  readyWajib: number;
  /** Total berkas wajib. */
  totalWajib: number;
  /** Berkas tambahan/optional yang siap. */
  readyOptional: number;
  totalOptional: number;
  /** Persentase 0-100 untuk wajib. */
  percent: number;
  /** True jika semua berkas wajib siap. */
  isComplete: boolean;
  /** Daftar kategori wajib yang belum siap (untuk tooltip). */
  missingKategori: ReadonlyArray<string>;
}

export function computeBerkasProgress(
  berkas: ReadonlyArray<BerkasKlaim>,
): BerkasProgress {
  const wajib = berkas.filter((b) => b.wajib);
  const optional = berkas.filter((b) => !b.wajib);
  const readyWajib = wajib.filter((b) => b.status === "Siap").length;
  const readyOptional = optional.filter((b) => b.status === "Siap").length;
  const totalWajib = wajib.length;
  const percent =
    totalWajib === 0 ? 100 : Math.round((readyWajib / totalWajib) * 100);
  const missingKategori = wajib
    .filter((b) => b.status !== "Siap" && b.status !== "Tidak Berlaku")
    .map((b) => b.kategori);

  return {
    readyWajib,
    totalWajib,
    readyOptional,
    totalOptional: optional.length,
    percent,
    isComplete: percent >= 100,
    missingKategori,
  };
}

// ── Quick Action Capability ────────────────────────────

export interface QuickActionState {
  /** Tombol Submit ke BPJS terlihat (BPJS only). */
  showSubmit: boolean;
  /** Tombol Submit aktif (Belum Submit + berkas lengkap + iDRG resolved). */
  canSubmit: boolean;
  /** Alasan disabled — undefined jika canSubmit. */
  submitDisabledReason?: string;
  /** Tombol Generate Berkas terlihat (selalu). */
  showGenerateBerkas: boolean;
  /** Tombol Print Resume Medis terlihat (selalu untuk RI/SameDay). */
  showPrintResume: boolean;
}

export function computeQuickActionState(claim: ClaimRecord): QuickActionState {
  const isBpjs = claim.penjamin.tipe === "bpjs";
  const isBelumSubmit = claim.statusPenjamin === "Belum Submit";
  const progress = computeBerkasProgress(claim.berkas);
  const hasGrouper =
    claim.eraGrouper === "iDRG" ? !!claim.iDRG : !!claim.inaCbgLegacy;

  let submitDisabledReason: string | undefined;
  if (!isBelumSubmit) {
    submitDisabledReason = "Status klaim bukan Belum Submit";
  } else if (!progress.isComplete) {
    submitDisabledReason = `Berkas wajib belum lengkap (${progress.readyWajib}/${progress.totalWajib})`;
  } else if (!hasGrouper) {
    submitDisabledReason = "Grouper belum di-resolve";
  }

  return {
    showSubmit: isBpjs,
    canSubmit: isBpjs && !submitDisabledReason,
    submitDisabledReason,
    showGenerateBerkas: true,
    showPrintResume: claim.tipePelayanan !== "RJ",
  };
}

// ── Status Tone Mapper (untuk banner status badge besar) ──

/**
 * Status klaim → tone untuk display banner.
 * Reuse map dari `klaimBoardShared.STATUS_CFG` agar konsisten.
 */
export function statusToneForBanner(status: ClaimStatus): KlaimTone {
  // Selaras dengan STATUS_CFG di klaimBoardShared
  switch (status) {
    case "Approved":
    case "Banding Approved":
    case "Paid":
      return "emerald";
    case "Rejected":
    case "Banding Rejected":
      return "rose";
    case "Susulan Required":
    case "Sengketa":
    case "Belum Submit":
      return "amber";
    case "Submitted":
    case "Pending Verifikasi":
    case "Banding Submitted":
      return "sky";
    case "Draft Coding":
    case "Write-off":
    default:
      return "slate";
  }
}

// ── Date Helpers (id-ID) ───────────────────────────────

/** Format ISO date → "12 Mei 2026". */
export function fmtDateShort(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** Format ISO datetime → "12 Mei · 14:30". */
export function fmtDateTimeShort(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const day = d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${day} · ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

/** Format avatar dari nama (initials max 2 char). */
export function avatarInitials(nama: string): string {
  const parts = nama.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Re-export lucide for tab content placeholders ──────

export { CheckCircle2, XCircle, AlertCircle, ClipboardCheck, ShieldCheck };
