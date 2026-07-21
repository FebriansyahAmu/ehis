/**
 * Berkas Tab — shared types · kategori/group config · status mapping · mock helpers (EK3.2).
 *
 * Konvensi:
 * - 10 BerkasKategori dipetakan ke 4 group semantik (Identitas / Klinis / Finansial / Khusus)
 *   untuk grouping UI yang lebih scannable.
 * - Status display pakai `STATUS_CFG` lokal (label id-ID + icon + tone) — tidak shared
 *   dengan ClaimStatus.
 * - Mock file generator (`makeMockFile`) menyimulasikan auto-pull dari modul lain.
 */

import {
  FileText,
  ShieldCheck,
  IdCard,
  ArrowRightLeft,
  FileSignature,
  Scissors,
  FlaskConical,
  Activity,
  Receipt,
  Scale,
  Stamp,
  Clock,
  Check,
  Ban,
  AlertTriangle,
  FileImage,
  type LucideIcon,
} from "lucide-react";

import type {
  BerkasKategori,
  BerkasKlaim,
  BerkasStatus,
  ClaimRecord,
} from "@/lib/eklaim/eklaimShared";
import type { KlaimTone } from "../../../klaim/klaimBoardShared";

// ── Group Categorization ───────────────────────────────

export type BerkasGroupKey = "identitas" | "klinis" | "finansial" | "khusus";

export interface BerkasGroupCfg {
  key: BerkasGroupKey;
  label: string;
  tone: KlaimTone;
  /** Order asc — lower shows first. */
  order: number;
  description: string;
}

export const BERKAS_GROUPS: Record<BerkasGroupKey, BerkasGroupCfg> = {
  identitas: {
    key: "identitas",
    label: "Identitas & Eligibilitas",
    tone: "sky",
    order: 1,
    description: "Verifikasi pasien & jaminan",
  },
  klinis: {
    key: "klinis",
    label: "Bukti Klinis",
    tone: "teal",
    order: 2,
    description: "Dokumentasi pelayanan medis",
  },
  finansial: {
    key: "finansial",
    label: "Finansial & Grouper",
    tone: "amber",
    order: 3,
    description: "Tagihan & hasil koding",
  },
  khusus: {
    key: "khusus",
    label: "Berkas Khusus",
    tone: "slate",
    order: 4,
    description: "Lampiran kasus spesifik",
  },
};

// ── Kategori Config ────────────────────────────────────

export interface AutoPullSource {
  /** Label sumber (e.g. "EHIS-Care · Rawat Inap"). */
  label: string;
  /** Deep-link tujuan (untuk anchor "Buka modul"). */
  href: (claim: ClaimRecord) => string;
  /** Estimasi item yang akan di-pull (mock fixed value). */
  estimatedCount?: number;
}

export interface BerkasKategoriCfg {
  icon: LucideIcon;
  group: BerkasGroupKey;
  /** Tone untuk badge kategori. */
  tone: KlaimTone;
  /** True jika berkas ini bisa di-auto-pull dari modul EHIS lain. */
  autoPull?: AutoPullSource;
}

export const KATEGORI_CFG: Record<BerkasKategori, BerkasKategoriCfg> = {
  SEP: {
    icon: ShieldCheck,
    group: "identitas",
    tone: "emerald",
    autoPull: {
      label: "V-Claim (BPJS)",
      href: (c) => `/ehis-registration/pasien/${c.pasienId}/kunjungan/${c.kunjunganId}`,
    },
  },
  Identitas: {
    icon: IdCard,
    group: "identitas",
    tone: "sky",
    autoPull: {
      label: "Registrasi Pasien",
      href: (c) => `/ehis-registration/pasien/${c.pasienId}`,
    },
  },
  Rujukan: {
    icon: ArrowRightLeft,
    group: "identitas",
    tone: "amber",
    autoPull: {
      label: "FKTP Asal (manual)",
      href: (c) => `/ehis-registration/pasien/${c.pasienId}/kunjungan/${c.kunjunganId}`,
    },
  },
  ResumeMedis: {
    icon: FileSignature,
    group: "klinis",
    tone: "teal",
    autoPull: {
      label: "EHIS-Care · Discharge",
      href: (c) => {
        const route = c.tipePelayanan === "RJ" ? "rawat-jalan" : c.tipePelayanan === "RI" ? "rawat-inap" : "igd";
        return `/ehis-care/${route}/${c.pasienId}`;
      },
      estimatedCount: 1,
    },
  },
  Tindakan: {
    icon: Scissors,
    group: "klinis",
    tone: "rose",
    autoPull: {
      label: "EHIS-Care · Tindakan",
      href: (c) => `/ehis-care/rawat-inap/${c.pasienId}`,
    },
  },
  Lab: {
    icon: FlaskConical,
    group: "klinis",
    tone: "sky",
    autoPull: {
      label: "Laboratorium · Tervalidasi",
      href: () => "/ehis-care/laboratorium",
      estimatedCount: 3,
    },
  },
  Rad: {
    icon: Activity,
    group: "klinis",
    tone: "amber",
    autoPull: {
      label: "Radiologi · Tervalidasi",
      href: () => "/ehis-care/radiologi",
      estimatedCount: 1,
    },
  },
  Billing: {
    icon: Receipt,
    group: "finansial",
    tone: "amber",
    autoPull: {
      label: "Billing · Tagihan",
      href: (c) => `/ehis-billing/tagihan/kunjungan/${c.kunjunganId}`,
      estimatedCount: 1,
    },
  },
  Grouper: {
    icon: Scale,
    group: "finansial",
    tone: "teal",
    autoPull: {
      label: "iDRG Grouper",
      href: () => "/ehis-eklaim",
      estimatedCount: 1,
    },
  },
  Khusus: {
    icon: Stamp,
    group: "khusus",
    tone: "slate",
  },
};

// ── Status Config ──────────────────────────────────────

export interface BerkasStatusCfg {
  label: string;
  tone: KlaimTone;
  icon: LucideIcon;
}

export const STATUS_CFG: Record<BerkasStatus, BerkasStatusCfg> = {
  Belum:               { label: "Belum",          tone: "amber",   icon: Clock          },
  Siap:                { label: "Siap",           tone: "emerald", icon: Check          },
  "Tidak Berlaku":     { label: "Tidak Berlaku",  tone: "slate",   icon: Ban            },
  "Reject Verifikator":{ label: "Ditolak Verif.", tone: "rose",    icon: AlertTriangle  },
};

/** Cycle status untuk demo: Belum → Siap → Tidak Berlaku → Belum. */
export function cycleStatus(current: BerkasStatus): BerkasStatus {
  switch (current) {
    case "Belum":              return "Siap";
    case "Siap":               return "Tidak Berlaku";
    case "Tidak Berlaku":      return "Belum";
    case "Reject Verifikator": return "Belum";
  }
}

// ── Group Computations ─────────────────────────────────

export interface GroupSummary {
  key: BerkasGroupKey;
  cfg: BerkasGroupCfg;
  items: ReadonlyArray<BerkasKlaim>;
  /** Berkas wajib di group ini yang sudah "Siap" atau "Tidak Berlaku". */
  readyWajib: number;
  totalWajib: number;
  /** Berkas optional ditambah satisfied count. */
  readyOptional: number;
  totalOptional: number;
  percent: number;
  /** All berkas in this group are "Tidak Berlaku" / optional all "Tidak Berlaku" → collapse default. */
  collapsibleDefault: boolean;
}

export function buildGroupSummaries(
  berkas: ReadonlyArray<BerkasKlaim>,
): ReadonlyArray<GroupSummary> {
  const groups = new Map<BerkasGroupKey, BerkasKlaim[]>();

  // Initialize all 4 groups so empty groups still show (UX consistency)
  (Object.keys(BERKAS_GROUPS) as BerkasGroupKey[]).forEach((k) => groups.set(k, []));

  for (const b of berkas) {
    const cfg = KATEGORI_CFG[b.kategori];
    const arr = groups.get(cfg.group);
    if (arr) arr.push(b);
  }

  const summaries: GroupSummary[] = [];
  for (const [key, items] of groups) {
    const cfg = BERKAS_GROUPS[key];
    const wajib = items.filter((b) => b.wajib);
    const optional = items.filter((b) => !b.wajib);
    const readyWajib = wajib.filter(
      (b) => b.status === "Siap" || b.status === "Tidak Berlaku",
    ).length;
    const readyOptional = optional.filter((b) => b.status === "Siap").length;
    const totalWajib = wajib.length;
    const percent =
      totalWajib === 0
        ? items.length === 0
          ? 0
          : 100
        : Math.round((readyWajib / totalWajib) * 100);
    const allOptionalNA =
      optional.length > 0 && optional.every((b) => b.status === "Tidak Berlaku");

    summaries.push({
      key,
      cfg,
      items,
      readyWajib,
      totalWajib,
      readyOptional,
      totalOptional: optional.length,
      percent,
      collapsibleDefault: items.length === 0 || allOptionalNA,
    });
  }

  return summaries.sort((a, b) => a.cfg.order - b.cfg.order);
}

// ── Mock File Generator ────────────────────────────────

/**
 * Generate mock file metadata untuk simulasi auto-pull dari modul lain.
 * Mime + size dipick berdasarkan kategori (PDF untuk dokumen, JPG untuk identitas/lab).
 */
export function makeMockFile(
  kategori: BerkasKategori,
  berkasId: string,
  uploadedBy: string,
): NonNullable<BerkasKlaim["file"]> {
  const isImage = kategori === "Identitas" || kategori === "Rad";
  const mime = isImage ? "image/jpeg" : "application/pdf";
  const ext = isImage ? "jpg" : "pdf";
  const sizeBytes = isImage
    ? 120_000 + Math.floor(Math.random() * 300_000)
    : 180_000 + Math.floor(Math.random() * 450_000);
  const slug = kategori.toLowerCase();
  const ts = new Date().toISOString().slice(0, 10);

  return {
    url: `/mock/berkas/${berkasId}/${slug}-${ts}.${ext}`,
    mimeType: mime,
    sizeBytes,
    hash: makeHash(`${berkasId}-${ts}`),
    versions: [
      {
        versionNumber: 1,
        url: `/mock/berkas/${berkasId}/${slug}-${ts}-v1.${ext}`,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
      },
    ],
  };
}

function makeHash(seed: string): string {
  // Pseudo SHA-256 untuk demo — 64 hex chars deterministic dari seed.
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
}

// ── Format Helpers ─────────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function fileTypeFromMime(mime: string): "pdf" | "image" | "other" {
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  return "other";
}

export function fileTypeIcon(mime: string): LucideIcon {
  if (mime.startsWith("image/")) return FileImage;
  return FileText;
}

// ── Auto-pull Hooks ────────────────────────────────────

/**
 * Daftar kategori yang punya auto-pull source (subset dari 10 kategori).
 * Dipakai `AutoPullBar` untuk render tombol per source.
 */
export const AUTO_PULL_KATEGORI: ReadonlyArray<BerkasKategori> = [
  "ResumeMedis",
  "Lab",
  "Rad",
  "Billing",
];
