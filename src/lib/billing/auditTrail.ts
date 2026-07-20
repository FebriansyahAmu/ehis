/**
 * Audit Trail untuk Invoice (BL2.5).
 *
 * Setiap mutasi invoice (create/edit item/diskon/void/payment/refund/finalize/klaim)
 * tercatat sebagai `AuditEvent` immutable dengan actor, timestamp, target ref,
 * dan optional diff (before/after) untuk edit.
 *
 * **Compliance**: UU PDP 27/2022 pasal audit trail finansial — retained ≥5 tahun.
 *
 * Mock-first: schema 1:1 dengan target Prisma `AuditLog` table. Swap
 * `AUDIT_EVENTS_MOCK[invoiceId]` → `prisma.auditLog.findMany({ where: { invoiceId } })`
 * saat backend ready (zero refactor UI).
 */

import type { LucideIcon } from "lucide-react";
import {
  FilePlus2, CircleDot, ListPlus, Percent, Ban, RotateCcw,
  Banknote, ArrowDownLeft, Trash2, Send, ShieldCheck,
} from "lucide-react";

// ── Action kinds ────────────────────────────────────────

export type AuditActionKind =
  | "invoice.create"
  | "invoice.finalize"
  | "invoice.reopen"
  | "invoice.diskon"
  | "item.add"
  | "item.diskon"
  | "item.void"
  | "item.unvoid"
  | "payment.add"
  | "payment.refund"
  | "payment.void"
  | "klaim.submit"
  | "klaim.status";

export type AuditCategory = "invoice" | "item" | "payment" | "klaim";

export type AuditTone = "slate" | "amber" | "emerald" | "sky" | "rose" | "violet" | "teal";

interface ActionCfg {
  label: string;
  icon: LucideIcon;
  category: AuditCategory;
  tone: AuditTone;
  description: string;     // micro-help kepada user (filter chip tooltip)
}

export const AUDIT_ACTION_CFG: Record<AuditActionKind, ActionCfg> = {
  "invoice.create":   { label: "Buat Invoice",      icon: FilePlus2,    category: "invoice", tone: "slate",   description: "Draft invoice baru dibuka" },
  "invoice.finalize": { label: "Finalisasi",        icon: CircleDot,    category: "invoice", tone: "emerald", description: "Status Draft → Final, charge dibekukan" },
  "invoice.reopen":   { label: "Batalkan Finalisasi", icon: RotateCcw,  category: "invoice", tone: "rose",    description: "Status Final → Draft, charge kembali proyeksi" },
  "invoice.diskon":   { label: "Diskon Invoice",    icon: Percent,      category: "invoice", tone: "violet",  description: "Diskon level invoice (di luar diskon item)" },
  "item.add":         { label: "Tambah Item",       icon: ListPlus,     category: "item",    tone: "emerald", description: "Charge baru ditambahkan ke invoice" },
  "item.diskon":      { label: "Diskon Item",       icon: Percent,      category: "item",    tone: "violet",  description: "Diskon per-item applied" },
  "item.void":        { label: "Void Item",         icon: Ban,          category: "item",    tone: "rose",    description: "Item di-void (soft delete + audit)" },
  "item.unvoid":      { label: "Pulihkan Item",     icon: RotateCcw,    category: "item",    tone: "slate",   description: "Item voided dipulihkan" },
  "payment.add":      { label: "Pembayaran",        icon: Banknote,     category: "payment", tone: "emerald", description: "Pembayaran / deposit masuk" },
  "payment.refund":   { label: "Refund",            icon: ArrowDownLeft, category: "payment", tone: "rose",    description: "Refund ke pasien dicatat" },
  "payment.void":     { label: "Void Pembayaran",   icon: Trash2,       category: "payment", tone: "rose",    description: "Pembayaran di-void (soft delete)" },
  "klaim.submit":     { label: "Submit Klaim",      icon: Send,         category: "klaim",   tone: "sky",     description: "Berkas klaim dikirim ke V-Claim/asuransi" },
  "klaim.status":     { label: "Status Klaim",      icon: ShieldCheck,  category: "klaim",   tone: "teal",    description: "Update status klaim dari penjamin" },
};

export const AUDIT_ACTION_ORDER: AuditActionKind[] = [
  "invoice.create", "invoice.finalize", "invoice.reopen", "invoice.diskon",
  "item.add", "item.diskon", "item.void", "item.unvoid",
  "payment.add", "payment.refund", "payment.void",
  "klaim.submit", "klaim.status",
];

// ── Tone palette ────────────────────────────────────────

export const AUDIT_TONE_PALETTE: Record<AuditTone, {
  bg: string; text: string; ring: string; dot: string; avatarBg: string;
}> = {
  slate:   { bg: "bg-slate-100",  text: "text-slate-700",   ring: "ring-slate-200",   dot: "bg-slate-500",   avatarBg: "bg-slate-200 text-slate-700" },
  amber:   { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200",   dot: "bg-amber-500",   avatarBg: "bg-amber-200 text-amber-800" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500", avatarBg: "bg-emerald-200 text-emerald-800" },
  sky:     { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200",     dot: "bg-sky-500",     avatarBg: "bg-sky-200 text-sky-800" },
  rose:    { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200",    dot: "bg-rose-500",    avatarBg: "bg-rose-200 text-rose-800" },
  violet:  { bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200",  dot: "bg-violet-500",  avatarBg: "bg-violet-200 text-violet-800" },
  teal:    { bg: "bg-teal-50",    text: "text-teal-700",    ring: "ring-teal-200",    dot: "bg-teal-500",    avatarBg: "bg-teal-200 text-teal-800" },
};

// ── Core types ──────────────────────────────────────────

export interface AuditActor {
  name: string;
  role: string;           // "Admin IGD" / "Kasir-1" / "Tim Klaim" / "DPJP" / "Direktur"
}

export interface AuditDiff {
  field: string;          // "Nominal" / "Status" / "Kategori"
  before: string | number | null;
  after: string | number | null;
  isMoney?: boolean;      // tampilkan dengan formatRupiah
}

export interface AuditEvent {
  id: string;
  at: string;             // ISO datetime
  invoiceId: string;
  actor: AuditActor;
  action: AuditActionKind;
  summary: string;        // one-liner singkat (e.g. "Pembayaran Transfer BCA Rp 1.5M")
  target?: {
    type: "item" | "payment" | "invoice" | "klaim";
    id?: string;
    label?: string;
  };
  amount?: number;        // nominal terkait (jika action keuangan)
  reason?: string;        // alasan (untuk void/diskon/refund)
  diff?: AuditDiff[];     // before/after untuk edit
  noKwitansi?: string;    // referensi kwitansi
}

// ── Mock data ──────────────────────────────────────────

/**
 * 18 events untuk INV-009 (Sutrisno Bagus ICU BPJS — multi-day lifecycle).
 * Cover semua action kinds dengan timeline realistis.
 */
const EVENTS_INV_009: AuditEvent[] = [
  {
    id: "ev-009-001", at: "2026-05-20T22:15", invoiceId: "INV-009",
    actor: { name: "Bambang", role: "Admin RI" },
    action: "invoice.create",
    summary: "Draft invoice dibuka saat admisi ICU",
    target: { type: "invoice", id: "INV-009", label: "INV/2026/05/00239" },
  },
  {
    id: "ev-009-002", at: "2026-05-20T22:30", invoiceId: "INV-009",
    actor: { name: "Bambang", role: "Admin RI" },
    action: "item.add",
    summary: "Akomodasi ICU (Hari 1)",
    target: { type: "item", id: "ic-001", label: "Akomodasi ICU" },
    amount: 1_500_000,
  },
  {
    id: "ev-009-003", at: "2026-05-20T22:50", invoiceId: "INV-009",
    actor: { name: "Bambang", role: "Kasir-2" },
    action: "payment.add",
    summary: "Deposit awal admisi ICU via Transfer BCA",
    target: { type: "payment", id: "pay-009-01" },
    amount: 1_500_000,
    noKwitansi: "KW/2026/05/00142",
  },
  {
    id: "ev-009-004", at: "2026-05-20T23:00", invoiceId: "INV-009",
    actor: { name: "Rina", role: "Perawat ICU" },
    action: "item.add",
    summary: "Intubasi & Ventilator Setup",
    target: { type: "item", id: "ic-005", label: "Intubasi & Ventilator" },
    amount: 1_250_000,
  },
  {
    id: "ev-009-005", at: "2026-05-21T06:15", invoiceId: "INV-009",
    actor: { name: "Rina", role: "Perawat ICU" },
    action: "item.add",
    summary: "Norepinephrine 4mg/4ml ×6 amp",
    target: { type: "item", id: "ic-011" },
    amount: 870_000,
  },
  {
    id: "ev-009-006", at: "2026-05-21T06:15", invoiceId: "INV-009",
    actor: { name: "Rina", role: "Perawat ICU" },
    action: "item.add",
    summary: "Meropenem 1g vial ×12 (non-formularium → pasien)",
    target: { type: "item", id: "ic-012" },
    amount: 3_420_000,
  },
  {
    id: "ev-009-007", at: "2026-05-21T11:30", invoiceId: "INV-009",
    actor: { name: "dr. Hendra", role: "DPJP Sp.EM" },
    action: "item.diskon",
    summary: "Diskon obat Meropenem non-formularium",
    target: { type: "item", id: "ic-012", label: "Meropenem 1g vial" },
    amount: 200_000,
    reason: "Selisih kelas — obat non-formularium, kebijaksanaan DPJP",
  },
  {
    id: "ev-009-008", at: "2026-05-21T16:00", invoiceId: "INV-009",
    actor: { name: "Rina", role: "Perawat ICU" },
    action: "item.add",
    summary: "AGD ×4 + DL ×3 (Lab harian)",
    target: { type: "item", id: "ic-007" },
    amount: 1_025_000,
  },
  {
    id: "ev-009-009", at: "2026-05-22T08:45", invoiceId: "INV-009",
    actor: { name: "Bambang", role: "Admin RI" },
    action: "item.add",
    summary: "Akomodasi ICU (Hari 2 & 3)",
    amount: 3_000_000,
  },
  {
    id: "ev-009-010", at: "2026-05-23T10:15", invoiceId: "INV-009",
    actor: { name: "Bambang", role: "Kasir-2" },
    action: "payment.add",
    summary: "Cicilan ke-1 via EDC Mandiri",
    target: { type: "payment", id: "pay-009-02" },
    amount: 750_000,
    noKwitansi: "KW/2026/05/00163",
  },
  {
    id: "ev-009-011", at: "2026-05-23T15:00", invoiceId: "INV-009",
    actor: { name: "Yanti", role: "Admin RI" },
    action: "item.add",
    summary: "Konsultasi Sp.JP (closed-loop)",
    target: { type: "item", id: "ic-014" },
    amount: 195_000,
  },
  {
    id: "ev-009-012", at: "2026-05-23T16:40", invoiceId: "INV-009",
    actor: { name: "Bambang", role: "Kasir-2" },
    action: "payment.refund",
    summary: "Refund kelebihan cicilan via QRIS",
    target: { type: "payment", id: "pay-009-03" },
    amount: 250_000,
    reason: "Revisi tarif — selisih dikembalikan ke pasien",
    noKwitansi: "KW/2026/05/00171",
  },
  {
    id: "ev-009-013", at: "2026-05-23T22:30", invoiceId: "INV-009",
    actor: { name: "Bambang", role: "Admin RI" },
    action: "item.add",
    summary: "Akomodasi ICU (Hari 4)",
    target: { type: "item", id: "ic-004" },
    amount: 1_500_000,
  },
  {
    id: "ev-009-014", at: "2026-05-24T06:45", invoiceId: "INV-009",
    actor: { name: "dr. Hendra", role: "Direktur" },
    action: "invoice.diskon",
    summary: "Diskon invoice — kebijaksanaan direktur",
    amount: 250_000,
    reason: "Pasien lansia + ICU > 3 hari (sesuai SK Direksi 003/2026)",
  },
  {
    id: "ev-009-015", at: "2026-05-24T07:00", invoiceId: "INV-009",
    actor: { name: "Bambang", role: "Admin RI" },
    action: "invoice.finalize",
    summary: "Invoice difinalisasi · items terkunci",
    diff: [{ field: "Status", before: "Draft", after: "Final" }],
  },
  {
    id: "ev-009-016", at: "2026-05-24T08:30", invoiceId: "INV-009",
    actor: { name: "Susi", role: "Tim Klaim" },
    action: "klaim.submit",
    summary: "Berkas klaim BPJS dikirim ke V-Claim",
    target: { type: "klaim", id: "CLM-2026-0524-019", label: "KLM/BPJS/2026/05/00142" },
  },
  {
    id: "ev-009-017", at: "2026-05-24T08:45", invoiceId: "INV-009",
    actor: { name: "Susi", role: "Tim Klaim" },
    action: "klaim.status",
    summary: "Status klaim → Pending Verifikasi",
    target: { type: "klaim", id: "CLM-2026-0524-019" },
    diff: [{ field: "Status", before: "Belum Submit", after: "Pending Verifikasi" }],
  },
  {
    id: "ev-009-018", at: "2026-05-24T09:10", invoiceId: "INV-009",
    actor: { name: "Susi", role: "Tim Klaim" },
    action: "klaim.status",
    summary: "Catatan tambahan verifikator V-Claim",
    target: { type: "klaim", id: "CLM-2026-0524-019" },
    diff: [
      { field: "Catatan", before: null, after: "Lampiran AGD dilengkapi" },
      { field: "Estimasi Approval", before: null, after: "3-5 hari kerja" },
    ],
  },
];

/** 5 events untuk INV-001 (Joko Prasetyo IGD BPJS — single-day, belum finalize). */
const EVENTS_INV_001: AuditEvent[] = [
  {
    id: "ev-001-001", at: "2026-05-24T08:15", invoiceId: "INV-001",
    actor: { name: "Sari", role: "Admin IGD" },
    action: "invoice.create",
    summary: "Draft invoice dibuka saat triase IGD",
    target: { type: "invoice", id: "INV-001", label: "INV/2026/05/00231" },
  },
  {
    id: "ev-001-002", at: "2026-05-24T08:25", invoiceId: "INV-001",
    actor: { name: "Sari", role: "Admin IGD" },
    action: "item.add",
    summary: "Triase IGD Level 2 + Bed Observasi",
    amount: 225_000,
  },
  {
    id: "ev-001-003", at: "2026-05-24T09:15", invoiceId: "INV-001",
    actor: { name: "Nuri", role: "Apoteker" },
    action: "item.add",
    summary: "Ringer Laktat 500ml ×2 + IV Catheter 20G",
    amount: 75_000,
  },
  {
    id: "ev-001-004", at: "2026-05-24T11:32", invoiceId: "INV-001",
    actor: { name: "Sari", role: "Admin IGD" },
    action: "invoice.finalize",
    summary: "Invoice difinalisasi (siap kasir)",
    diff: [{ field: "Status", before: "Draft", after: "Final" }],
  },
  {
    id: "ev-001-005", at: "2026-05-24T11:45", invoiceId: "INV-001",
    actor: { name: "Sari", role: "Kasir-1" },
    action: "payment.add",
    summary: "Deposit awal pendaftaran IGD via Tunai",
    target: { type: "payment", id: "pay-001-01" },
    amount: 500_000,
    noKwitansi: "KW/2026/05/00188",
  },
];

export const AUDIT_EVENTS_MOCK: Record<string, AuditEvent[]> = {
  "INV-001": EVENTS_INV_001,
  "INV-009": EVENTS_INV_009,
};

/** Lookup audit events untuk invoice tertentu (sorted DESC — terbaru dulu). */
export function getAuditEventsForInvoice(invoiceId: string): AuditEvent[] {
  const events = AUDIT_EVENTS_MOCK[invoiceId] ?? [];
  return [...events].sort((a, b) => b.at.localeCompare(a.at));
}

// ── Filters ────────────────────────────────────────────

export interface AuditFilterState {
  actors: string[];               // empty = all
  actions: AuditActionKind[];     // empty = all
  dateFrom: string;               // ISO date YYYY-MM-DD; empty = no lower bound
  dateTo: string;                 // ISO date YYYY-MM-DD; empty = no upper bound
}

export function defaultAuditFilters(): AuditFilterState {
  return { actors: [], actions: [], dateFrom: "", dateTo: "" };
}

export function applyAuditFilters(
  events: AuditEvent[],
  filters: AuditFilterState,
): AuditEvent[] {
  return events.filter((ev) => {
    if (filters.actors.length && !filters.actors.includes(ev.actor.name)) return false;
    if (filters.actions.length && !filters.actions.includes(ev.action)) return false;
    if (filters.dateFrom) {
      const fromTs = new Date(filters.dateFrom + "T00:00:00").getTime();
      if (new Date(ev.at).getTime() < fromTs) return false;
    }
    if (filters.dateTo) {
      const toTs = new Date(filters.dateTo + "T23:59:59").getTime();
      if (new Date(ev.at).getTime() > toTs) return false;
    }
    return true;
  });
}

export function countActiveAuditFilters(filters: AuditFilterState): number {
  return (filters.actors.length > 0 ? 1 : 0)
    + (filters.actions.length > 0 ? 1 : 0)
    + (filters.dateFrom ? 1 : 0)
    + (filters.dateTo ? 1 : 0);
}

/** Daftar unik actor untuk filter dropdown. */
export function uniqueActors(events: AuditEvent[]): AuditActor[] {
  const map = new Map<string, AuditActor>();
  for (const ev of events) {
    if (!map.has(ev.actor.name)) map.set(ev.actor.name, ev.actor);
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
}

// ── Group by date ──────────────────────────────────────

export interface AuditGroup {
  dateISO: string;       // YYYY-MM-DD
  dateLabel: string;     // "Sabtu, 24 Mei 2026"
  events: AuditEvent[];  // sorted DESC dalam group
}

export function groupAuditByDate(events: AuditEvent[]): AuditGroup[] {
  const map = new Map<string, AuditEvent[]>();
  for (const ev of events) {
    const dateISO = ev.at.slice(0, 10);
    if (!map.has(dateISO)) map.set(dateISO, []);
    map.get(dateISO)!.push(ev);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))        // tanggal DESC
    .map(([dateISO, arr]) => ({
      dateISO,
      dateLabel: formatDateLong(dateISO),
      events: arr.sort((a, b) => b.at.localeCompare(a.at)),
    }));
}

function formatDateLong(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── Avatar helpers ─────────────────────────────────────

export function actorInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ── Format money ───────────────────────────────────────

function fmtMoney(v: number | null): string {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0,
  }).format(v);
}

// ── Export CSV ─────────────────────────────────────────

/**
 * Generate CSV (Excel-compatible) dari audit events + trigger download.
 * BOM UTF-8 supaya Excel kenali Rupiah/unicode.
 */
export function exportAuditCsv(
  events: AuditEvent[],
  invoiceNo: string,
  filename?: string,
): void {
  if (typeof window === "undefined") return;
  const today = new Date().toISOString().slice(0, 10);
  const fn = filename ?? `audit-${invoiceNo.replace(/[\\/]/g, "-")}-${today}.csv`;

  const header = [
    "Timestamp", "Aktor", "Peran", "Aksi", "Kategori",
    "Target", "Ringkasan", "Nominal", "Alasan",
    "Diff (Field: Before → After)", "No Kwitansi",
  ];
  const lines = events.map((ev) => {
    const cfg = AUDIT_ACTION_CFG[ev.action];
    const diff = (ev.diff ?? [])
      .map((d) => {
        const b = d.isMoney && typeof d.before === "number" ? fmtMoney(d.before) : String(d.before ?? "—");
        const a = d.isMoney && typeof d.after === "number" ? fmtMoney(d.after) : String(d.after ?? "—");
        return `${d.field}: ${b} → ${a}`;
      })
      .join(" | ");
    return [
      ev.at, ev.actor.name, ev.actor.role, cfg.label, cfg.category,
      ev.target?.label ?? ev.target?.id ?? "—",
      ev.summary,
      typeof ev.amount === "number" ? ev.amount : "",
      ev.reason ?? "",
      diff,
      ev.noKwitansi ?? "",
    ].map(csvCell).join(",");
  });
  const csv = [header.join(","), ...lines].join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fn;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
