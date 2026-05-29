/**
 * Beranda BPJS — shared palette · derived KPI · quick-nav config · mock seed.
 *
 * Single source untuk semua sub-component Beranda BPJS:
 *  - `BerandaBPJSPage`     orchestrator
 *  - `SystemStatusStrip`   3-dot health V-Claim/Aplicares/LZ-String
 *  - `BPJSKPIStrip`        5 KPI (SEP · Rujukan · RK · Bed Sync · Failed 24h)
 *  - `QuickNavGridBPJS`    8 modul shortcut
 *  - `BPJSSidebarPanel`    Recent Calls + Reference Status tab
 *
 * Mock-first: stats derive dari `SEP_MOCK / RUJUKAN_MOCK / RENCANA_KONTROL_MOCK
 * / APLICARES_KAMAR_MOCK` zero side-effect. Audit feed + reference cache
 * di-seed lewat helper `seedBerandaBPJSMocks()` saat halaman mount pertama.
 *
 * Reference: TODO-BPJS.md § BP1.
 */

import {
  Activity,
  Bed,
  BedDouble,
  CalendarCheck,
  FileText,
  LayoutGrid,
  Share2,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import { SEP_MOCK } from "@/lib/bpjs/mock/sepMock";
import { RUJUKAN_MOCK } from "@/lib/bpjs/mock/rujukanMock";
import { RENCANA_KONTROL_MOCK } from "@/lib/bpjs/mock/rencanaKontrolMock";
import { aggregateKamarKPI, APLICARES_KAMAR_MOCK } from "@/lib/bpjs/mock/aplicaresKamarMock";
import {
  getAuditEntries,
  logAuditEntry,
  summarizeAudit24h,
} from "@/lib/bpjs/auditStore";
import {
  getAllCacheStatus,
  setCached,
  type ReferenceCacheStatus,
} from "@/lib/bpjs/referenceCache";
import type { BPJSAuditEntry } from "@/lib/bpjs/bpjsShared";

// ── Tone palette ───────────────────────────────────────

export type BPJSBerandaTone =
  | "emerald"
  | "sky"
  | "teal"
  | "amber"
  | "violet"
  | "pink"
  | "rose"
  | "slate";

export interface BPJSTonePalette {
  iconBg: string;
  iconText: string;
  ring: string;
  badgeBg: string;
  badgeText: string;
  bar: string;
  dot: string;
  cardHover: string;
}

export const BPJS_TONE: Record<BPJSBerandaTone, BPJSTonePalette> = {
  emerald: {
    iconBg: "bg-emerald-50", iconText: "text-emerald-600", ring: "ring-emerald-100",
    badgeBg: "bg-emerald-50", badgeText: "text-emerald-700",
    bar: "bg-emerald-500", dot: "bg-emerald-500",
    cardHover: "hover:border-emerald-300 hover:shadow",
  },
  sky: {
    iconBg: "bg-sky-50", iconText: "text-sky-600", ring: "ring-sky-100",
    badgeBg: "bg-sky-50", badgeText: "text-sky-700",
    bar: "bg-sky-500", dot: "bg-sky-500",
    cardHover: "hover:border-sky-300 hover:shadow",
  },
  teal: {
    iconBg: "bg-teal-50", iconText: "text-teal-600", ring: "ring-teal-100",
    badgeBg: "bg-teal-50", badgeText: "text-teal-700",
    bar: "bg-teal-500", dot: "bg-teal-500",
    cardHover: "hover:border-teal-300 hover:shadow",
  },
  amber: {
    iconBg: "bg-amber-50", iconText: "text-amber-600", ring: "ring-amber-100",
    badgeBg: "bg-amber-50", badgeText: "text-amber-700",
    bar: "bg-amber-500", dot: "bg-amber-500",
    cardHover: "hover:border-amber-300 hover:shadow",
  },
  violet: {
    iconBg: "bg-violet-50", iconText: "text-violet-600", ring: "ring-violet-100",
    badgeBg: "bg-violet-50", badgeText: "text-violet-700",
    bar: "bg-violet-500", dot: "bg-violet-500",
    cardHover: "hover:border-violet-300 hover:shadow",
  },
  pink: {
    iconBg: "bg-pink-50", iconText: "text-pink-600", ring: "ring-pink-100",
    badgeBg: "bg-pink-50", badgeText: "text-pink-700",
    bar: "bg-pink-500", dot: "bg-pink-500",
    cardHover: "hover:border-pink-300 hover:shadow",
  },
  rose: {
    iconBg: "bg-rose-50", iconText: "text-rose-600", ring: "ring-rose-100",
    badgeBg: "bg-rose-50", badgeText: "text-rose-700",
    bar: "bg-rose-500", dot: "bg-rose-500",
    cardHover: "hover:border-rose-300 hover:shadow",
  },
  slate: {
    iconBg: "bg-slate-100", iconText: "text-slate-600", ring: "ring-slate-200",
    badgeBg: "bg-slate-100", badgeText: "text-slate-700",
    bar: "bg-slate-500", dot: "bg-slate-400",
    cardHover: "hover:border-slate-300 hover:shadow",
  },
};

// ── System Status (3 service health) ───────────────────

export type ServiceHealth = "online" | "degraded" | "offline";

export interface SystemServiceStatus {
  key: "vclaim" | "aplicares" | "lzstring";
  label: string;
  health: ServiceHealth;
  /** Detik sejak last successful sync. */
  lastSyncAgoSec: number;
  hint: string;
}

const HEALTH_TONE: Record<ServiceHealth, BPJSBerandaTone> = {
  online: "emerald",
  degraded: "amber",
  offline: "rose",
};

export function toneForHealth(h: ServiceHealth): BPJSBerandaTone {
  return HEALTH_TONE[h];
}

/**
 * Derive status sistem dari summarizeAudit24h — failed ratio per endpoint
 * group sebagai proxy health. Mock-friendly fallback ke "online" jika
 * audit buffer kosong.
 */
export function getSystemStatuses(): SystemServiceStatus[] {
  const summary = summarizeAudit24h();
  const failRate = summary.total > 0 ? summary.failed / summary.total : 0;
  const vclaimHealth: ServiceHealth =
    failRate > 0.2 ? "offline" : failRate > 0.05 ? "degraded" : "online";

  return [
    {
      key: "vclaim",
      label: "V-Claim",
      health: vclaimHealth,
      lastSyncAgoSec: 90,
      hint: `${summary.success}/${summary.total || 0} ok 24j`,
    },
    {
      key: "aplicares",
      label: "Aplicares",
      health: "degraded",
      lastSyncAgoSec: 8 * 60,
      hint: "Sync mundur 8 menit",
    },
    {
      key: "lzstring",
      label: "LZ-String",
      health: "online",
      lastSyncAgoSec: 5,
      hint: "Compression aktif",
    },
  ];
}

// ── KPI Strip ──────────────────────────────────────────

export interface BPJSKPI {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
  /** Helper text di bawah value. */
  hint: string;
  tone: BPJSBerandaTone;
}

export function getBPJSKPIs(): BPJSKPI[] {
  const sepTotal = SEP_MOCK.length;
  const sepIssued = SEP_MOCK.filter((s) => s.statusInternal === "Issued").length;
  const sepUpdated = SEP_MOCK.filter((s) => s.statusInternal === "Updated").length;
  const sepDeleted = SEP_MOCK.filter((s) => s.statusInternal === "Deleted").length;

  const fktp = RUJUKAN_MOCK.filter((r) => r.asalRujukan === "FKTP").length;
  const fkrtl = RUJUKAN_MOCK.filter((r) => r.asalRujukan === "FKRTL").length;

  const rkCount = RENCANA_KONTROL_MOCK.filter((r) => r.jenis === "Kontrol").length;
  const spriCount = RENCANA_KONTROL_MOCK.filter((r) => r.jenis === "SPRI").length;

  const bedAgg = aggregateKamarKPI();
  const occupancy =
    bedAgg.totalKapasitas > 0
      ? Math.round((bedAgg.totalTerisi / bedAgg.totalKapasitas) * 100)
      : 0;
  const lastSyncMaxMs = APLICARES_KAMAR_MOCK.reduce((acc, k) => {
    const t = new Date(k.lastSyncISO).getTime();
    return Number.isFinite(t) ? Math.max(acc, t) : acc;
  }, 0);
  const bedAgoSec =
    lastSyncMaxMs > 0
      ? Math.max(0, Math.floor((Date.now() - lastSyncMaxMs) / 1000))
      : 180;

  const audit = summarizeAudit24h();

  return [
    {
      key: "sep",
      icon: FileText,
      label: "SEP",
      value: String(sepTotal),
      hint: `Issue ${sepIssued} · Upd ${sepUpdated} · Del ${sepDeleted}`,
      tone: "emerald",
    },
    {
      key: "rujukan",
      icon: Share2,
      label: "Rujukan",
      value: String(fktp + fkrtl),
      hint: `FKTP ${fktp} · FKRTL ${fkrtl}`,
      tone: "teal",
    },
    {
      key: "rk",
      icon: CalendarCheck,
      label: "Rencana Kontrol",
      value: String(rkCount + spriCount),
      hint: `Kontrol ${rkCount} · SPRI ${spriCount}`,
      tone: "violet",
    },
    {
      key: "bed",
      icon: BedDouble,
      label: "Bed Sync",
      value: `${occupancy}%`,
      hint: `${APLICARES_KAMAR_MOCK.length} ruang · ${fmtAgo(bedAgoSec)}`,
      tone: "pink",
    },
    {
      key: "failed",
      icon: Activity,
      label: "Failed 24j",
      value: String(audit.failed),
      hint: audit.topFailedEndpoint ? truncateMiddle(audit.topFailedEndpoint, 26) : "Tidak ada error",
      tone: audit.failed > 0 ? "rose" : "slate",
    },
  ];
}

// ── Quick Nav (8 modul) ────────────────────────────────

export interface BPJSQuickNavCard {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  badge: string;
  tone: BPJSBerandaTone;
  disabled?: boolean;
  group: "vclaim" | "aplicares";
}

export function getBPJSQuickNav(): BPJSQuickNavCard[] {
  const bedAgg = aggregateKamarKPI();
  return [
    {
      href: "/ehis-bpjs/vclaim/kepesertaan",
      icon: UserCheck,
      label: "Kepesertaan",
      desc: "Cek peserta by Kartu/NIK",
      badge: "V2",
      tone: "sky",
      group: "vclaim",
    },
    {
      href: "/ehis-bpjs/vclaim/sep",
      icon: FileText,
      label: "SEP",
      desc: "Surat Eligibilitas Peserta",
      badge: String(SEP_MOCK.length),
      tone: "emerald",
      group: "vclaim",
    },
    {
      href: "/ehis-bpjs/vclaim/rujukan",
      icon: Share2,
      label: "Rujukan",
      desc: "FKTP & FKRTL",
      badge: String(RUJUKAN_MOCK.length),
      tone: "teal",
      group: "vclaim",
    },
    {
      href: "/ehis-bpjs/vclaim/monitoring",
      icon: Activity,
      label: "Monitoring",
      desc: "Kunjungan · Klaim · Histori",
      badge: "4",
      tone: "amber",
      group: "vclaim",
    },
    {
      href: "/ehis-bpjs/vclaim/rencana-kontrol",
      icon: CalendarCheck,
      label: "Rencana Kontrol",
      desc: "Kontrol pasca RJ & SPRI",
      badge: String(RENCANA_KONTROL_MOCK.length),
      tone: "violet",
      group: "vclaim",
    },
    {
      href: "/ehis-bpjs/aplicares/referensi-kamar",
      icon: BedDouble,
      label: "Referensi Kamar",
      desc: "Master kamar BPJS",
      badge: "Sync",
      tone: "pink",
      group: "aplicares",
    },
    {
      href: "/ehis-bpjs/aplicares/map-kelas",
      icon: LayoutGrid,
      label: "Map Kelas",
      desc: "BPJS ↔ RS kelas mapping",
      badge: "4",
      tone: "rose",
      group: "aplicares",
    },
    {
      href: "/ehis-bpjs/aplicares/ketersediaan",
      icon: Bed,
      label: "Ketersediaan",
      desc: `${bedAgg.totalKosong} bed kosong`,
      badge: String(APLICARES_KAMAR_MOCK.length),
      tone: "emerald",
      group: "aplicares",
    },
  ];
}

// ── Reference Cache panel ──────────────────────────────

export interface ReferenceRowVm {
  status: ReferenceCacheStatus;
  label: string;
  tone: BPJSBerandaTone;
}

const REFERENCE_LABEL: Record<ReferenceCacheStatus["kind"], string> = {
  diagnosa: "Diagnosa ICD-10",
  poli: "Poli BPJS",
  dokter: "Dokter Spesialis",
  faskes: "Faskes / PPK",
  spesialistik: "Spesialistik",
  "pasca-pulang": "Pasca Pulang",
};

export function getReferenceRows(): ReferenceRowVm[] {
  return getAllCacheStatus().map((status) => ({
    status,
    label: REFERENCE_LABEL[status.kind] ?? status.kind,
    tone:
      status.staleness === "fresh"
        ? "emerald"
        : status.staleness === "stale"
          ? "amber"
          : "rose",
  }));
}

// ── Recent Calls panel ─────────────────────────────────

export interface RecentCallVm {
  entry: BPJSAuditEntry;
  agoSec: number;
  tone: BPJSBerandaTone;
}

export function getRecentCalls(max: number = 12, now: Date = new Date()): RecentCallVm[] {
  return getAuditEntries()
    .slice(0, max)
    .map((entry) => ({
      entry,
      agoSec: Math.max(0, Math.floor((now.getTime() - new Date(entry.timestamp).getTime()) / 1000)),
      tone: toneForResponseCode(entry.responseCode, entry.success),
    }));
}

export function toneForResponseCode(code: string, success: boolean): BPJSBerandaTone {
  if (success) return "emerald";
  if (code === "201" || code === "204") return "amber";
  if (code === "202" || code === "203") return "violet";
  return "rose";
}

export function toneForMethod(m: BPJSAuditEntry["method"]): BPJSBerandaTone {
  if (m === "GET") return "sky";
  if (m === "POST") return "emerald";
  if (m === "PUT") return "amber";
  return "rose";
}

// ── Helpers ────────────────────────────────────────────

export function fmtAgo(sec: number): string {
  if (sec < 60) return `${sec}d`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  const d = Math.floor(h / 24);
  return `${d}h`;
}

export function fmtClockId(d: Date): string {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function truncateMiddle(s: string, max: number): string {
  if (s.length <= max) return s;
  const head = Math.ceil((max - 1) / 2);
  const tail = Math.floor((max - 1) / 2);
  return `${s.slice(0, head)}…${s.slice(s.length - tail)}`;
}

// ── Mock seed (one-shot per session) ───────────────────

let seeded = false;

/**
 * Seed audit ring buffer + reference cache supaya Beranda BPJS punya
 * konten visual sebelum adapter pertama dipanggil. Idempotent —
 * safe panggil setiap mount.
 */
export function seedBerandaBPJSMocks(): void {
  if (seeded) return;
  seeded = true;

  // 1) Reference cache seed — variasi staleness (fresh / stale / expired)
  const ttlMs = 24 * 60 * 60 * 1000;
  const ago = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();
  setCached("diagnosa", "all", { count: 14_318, sampleISO: ago(ttlMs * 0.1) });
  setCached("poli", "all", { count: 87 });
  setCached("dokter", "all", { count: 432 });
  setCached("spesialistik", "all", { count: 32 });
  // faskes & pasca-pulang sengaja tidak di-seed → tampil "Expired" panel.

  // 2) Audit entries — 12 sample lintas endpoint
  if (getAuditEntries().length > 0) return;
  AUDIT_SEED.forEach(logAuditEntry);
}

const AUDIT_SEED_BASE: ReadonlyArray<Omit<BPJSAuditEntry, "id" | "timestamp">> = [
  { endpoint: "/Peserta/nokartu/{noKartu}/tglSEP/{tgl}", method: "GET",  requestHash: "h_001", responseCode: "200", responseHash: "r_001", success: true,  durationMs: 312, actor: "ari.rachmanto",   actorRole: "Admin BPJS", consId: "12345" },
  { endpoint: "/SEP/2.0/insert",                          method: "POST", requestHash: "h_002", responseCode: "200", responseHash: "r_002", success: true,  durationMs: 712, actor: "ari.rachmanto",   actorRole: "Admin BPJS", consId: "12345", idempotencyKey: "0001-2026-05-29-abc" },
  { endpoint: "/Rujukan/RS/{noRujukan}",                  method: "GET",  requestHash: "h_003", responseCode: "201", responseHash: "r_003", success: false, durationMs: 280, actor: "diah.purnamasari",actorRole: "Operator",  consId: "12345", errorType: "BPJSMetaError" },
  { endpoint: "/monitoring/Klaim/Tanggal/{t}/JnsPelayanan/{j}/Status/{s}", method: "GET", requestHash: "h_004", responseCode: "200", responseHash: "r_004", success: true, durationMs: 1124, actor: "diah.purnamasari", actorRole: "Operator", consId: "12345" },
  { endpoint: "/RencanaKontrol/v2/insert",                method: "POST", requestHash: "h_005", responseCode: "200", responseHash: "r_005", success: true,  durationMs: 654, actor: "siti.rahayu",     actorRole: "Coder",      consId: "12345", idempotencyKey: "0002-2026-05-29-def" },
  { endpoint: "/sep/updtglplg",                           method: "PUT",  requestHash: "h_006", responseCode: "204", responseHash: "r_006", success: false, durationMs: 198, actor: "ari.rachmanto",   actorRole: "Admin BPJS", consId: "12345", errorType: "BPJSMetaError" },
  { endpoint: "/Peserta/nik/{nik}/tglSEP/{tgl}",          method: "GET",  requestHash: "h_007", responseCode: "200", responseHash: "r_007", success: true,  durationMs: 244, actor: "yulianto.h",      actorRole: "Registration", consId: "12345" },
  { endpoint: "/kamar/update",                            method: "POST", requestHash: "h_008", responseCode: "503", responseHash: "r_008", success: false, durationMs: 5021,actor: "system.cron",     actorRole: "Service",    consId: "12345", errorType: "NetworkError", retryCount: 2 },
  { endpoint: "/SEP/{noSEP}",                             method: "GET",  requestHash: "h_009", responseCode: "200", responseHash: "r_009", success: true,  durationMs: 192, actor: "ari.rachmanto",   actorRole: "Admin BPJS", consId: "12345" },
  { endpoint: "/Rujukan/List/Peserta/{noKartu}",          method: "GET",  requestHash: "h_010", responseCode: "200", responseHash: "r_010", success: true,  durationMs: 380, actor: "yulianto.h",      actorRole: "Registration", consId: "12345" },
  { endpoint: "/SEP/FingerPrint/Peserta/{noKartu}/TglPelayanan/{t}", method: "GET", requestHash: "h_011", responseCode: "201", responseHash: "r_011", success: false, durationMs: 312, actor: "ari.rachmanto", actorRole: "Admin BPJS", consId: "12345", errorType: "BPJSMetaError" },
  { endpoint: "/kamar/list",                              method: "POST", requestHash: "h_012", responseCode: "200", responseHash: "r_012", success: true,  durationMs: 511, actor: "system.cron",     actorRole: "Service",    consId: "12345" },
];

const AUDIT_SEED: ReadonlyArray<BPJSAuditEntry> = AUDIT_SEED_BASE
  .map((base, idx) => {
    const offsetSec = 45 + idx * 480 + (idx % 3) * 90;
    const ts = new Date(Date.now() - offsetSec * 1000).toISOString();
    return { ...base, id: `seed-${idx + 1}`, timestamp: ts };
  })
  .reverse();
