"use client";

// Batalkan Kunjungan (grup Manajemen) — pengganti "Hapus Kunjungan".
// Aturan: kunjungan HANYA bisa dibatalkan bila BELUM ada rekam medis / tindakan / order
// (semua kategori 0). Ditegakkan server-side (guard di kunjunganService.cancelKunjungan);
// UI menampilkan kelayakan interaktif (rincian aktivitas per kategori + verdict live).

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ban, CheckCircle2, XCircle, AlertTriangle, Loader2, ShieldCheck, RefreshCw,
  Stethoscope, FileText, Activity, Syringe, Pill, FlaskConical, ScanLine, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KunjunganRecord } from "@/lib/data";
import {
  getCancelEligibility, cancelKunjungan, type CancelEligibilityDTO,
} from "@/lib/api/kunjungan";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ActKey = "diagnosa" | "cppt" | "observasi" | "tindakan" | "resep" | "lab" | "rad";

const CATS: { key: ActKey; label: string; icon: IconComponent; group: string }[] = [
  { key: "diagnosa",  label: "Diagnosa",       icon: Stethoscope,  group: "Rekam Medis" },
  { key: "cppt",      label: "CPPT",           icon: FileText,     group: "Rekam Medis" },
  { key: "observasi", label: "TTV / Observasi", icon: Activity,     group: "Rekam Medis" },
  { key: "tindakan",  label: "Tindakan",       icon: Syringe,      group: "Tindakan" },
  { key: "resep",     label: "Resep",          icon: Pill,         group: "Order" },
  { key: "lab",       label: "Laboratorium",   icon: FlaskConical, group: "Order" },
  { key: "rad",       label: "Radiologi",      icon: ScanLine,     group: "Order" },
];

const STATUS_LABEL: Record<string, string> = {
  Registered: "Terdaftar", Queued: "Antrean", InService: "Dalam Pelayanan",
  Completed: "Selesai", Closed: "Ditutup", Cancelled: "Dibatalkan",
  Billed: "Ditagihkan", Claimed: "Diklaim",
};

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="text-[13px] font-bold text-slate-800">{title}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{desc}</p>
    </div>
  );
}

// ── Chip aktivitas per kategori ───────────────────────────────
function ActivityChip({ label, icon: Icon, count, index }: {
  label: string; icon: IconComponent; count: number; index: number;
}) {
  const has = count > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: index * 0.03 }}
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2",
        has ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50/60",
      )}
    >
      <div className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
        has ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600",
      )}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[11px] font-semibold", has ? "text-rose-800" : "text-slate-600")}>{label}</p>
      </div>
      <span className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
        has ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-700",
      )}>
        {has ? count : <CheckCircle2 size={11} />}
      </span>
    </motion.div>
  );
}

// ── Modal konfirmasi final (destruktif) ──────────────────────
function ConfirmBatalModal({ open, noKunjungan, unit, alasan, busy, onConfirm, onCancel }: {
  open: boolean; noKunjungan: string; unit: string; alasan: string;
  busy: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);
  if (typeof document === "undefined") return null; // SSR-safe (portal butuh document)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => !busy && onCancel()}
          />
          <motion.div
            role="dialog" aria-modal="true" aria-label="Konfirmasi batalkan kunjungan"
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-100"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-rose-200">
                <Ban size={17} className="text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-rose-700">Batalkan Kunjungan?</p>
                <p className="text-[11px] text-rose-400">Status kunjungan akan menjadi Dibatalkan</p>
              </div>
              <button type="button" onClick={onCancel} disabled={busy} aria-label="Tutup"
                className="rounded-lg p-1 text-rose-300 transition hover:bg-rose-100 hover:text-rose-500 disabled:opacity-40">
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200">
                  <Ban size={16} />
                </span>
                <div className="min-w-0">
                  <span className="inline-flex items-center rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                    {unit}
                  </span>
                  <p className="mt-1 truncate font-mono text-[13px] font-bold text-slate-800">{noKunjungan || "—"}</p>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Alasan</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-700">{alasan}</p>
              </div>

              <p className="mt-3 text-[11.5px] leading-relaxed text-slate-500">
                Kunjungan akan ditandai{" "}
                <span className="rounded-md bg-rose-50 px-1.5 py-0.5 font-semibold text-rose-600 ring-1 ring-rose-100">Dibatalkan</span>
                {unit === "Rawat Inap" && ", reservasi bed dilepaskan"}, dan SPRI terkait dipulihkan.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 border-t border-slate-100 px-5 py-4">
              <button type="button" onClick={onCancel} disabled={busy}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-600 outline-none transition hover:bg-slate-50 active:scale-95 disabled:opacity-50">
                Kembali
              </button>
              <button type="button" onClick={onConfirm} disabled={busy}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-white shadow-sm outline-none transition active:scale-95",
                  busy ? "cursor-not-allowed bg-rose-400" : "bg-rose-600 hover:bg-rose-700",
                )}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={13} />}
                {busy ? "Membatalkan…" : "Ya, Batalkan"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ── Main ──────────────────────────────────────────────────────
export function BatalkanForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const isReal = UUID_RE.test(kunjungan.id);
  const [elig, setElig] = useState<CancelEligibilityDTO | null>(null);
  const [loading, setLoading] = useState(isReal);
  const [err, setErr] = useState<string | null>(null);
  const [alasan, setAlasan] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Fetch async — setState hanya di callback promise (bukan sinkron di effect).
  const runFetch = useCallback((signal?: AbortSignal) => {
    getCancelEligibility(kunjungan.id, signal)
      .then((e) => { if (!signal?.aborted) { setElig(e); setLoading(false); } })
      .catch((e: unknown) => {
        if (!signal?.aborted) { setErr(e instanceof Error ? e.message : "Gagal memuat kelayakan"); setLoading(false); }
      });
  }, [kunjungan.id]);

  useEffect(() => {
    if (!isReal) return;
    const ac = new AbortController();
    runFetch(ac.signal); // loading sudah true dari initial state
    return () => ac.abort();
  }, [isReal, runFetch]);

  // Retry = event handler → setState sinkron diperbolehkan.
  function retry() {
    setLoading(true);
    setErr(null);
    runFetch();
  }

  async function submit() {
    if (!elig) return;
    setSubmitting(true);
    setErr(null);
    try {
      await cancelKunjungan(kunjungan.id, { alasan: alasan.trim(), expectedVersion: elig.version });
      setDone(true);
      setTimeout(() => window.location.reload(), 1500); // refleksikan status Dibatalkan di seluruh halaman
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal membatalkan kunjungan");
      setSubmitting(false);
      setConfirmOpen(false); // tutup modal → error tampil inline
    }
  }

  const canSubmit = !!elig?.cancelable && alasan.trim().length >= 5 && !submitting;

  return (
    <div className="w-full space-y-4">
      <SectionHead
        title="Batalkan Kunjungan"
        desc="Batalkan pendaftaran kunjungan yang keliru. Hanya bisa dilakukan bila belum ada rekam medis, tindakan, atau order."
      />

      {/* Konteks kunjungan */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <span className="font-mono text-[12px] font-bold text-slate-700">{kunjungan.noKunjungan || kunjungan.noPendaftaran}</span>
        <span className="text-slate-300">·</span>
        <span className="text-[12px] text-slate-500">{kunjungan.unit}</span>
        {elig && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
            {STATUS_LABEL[elig.status] ?? elig.status}
          </span>
        )}
      </div>

      {/* Demo (non-UUID) */}
      {!isReal && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
          <AlertTriangle size={16} className="mt-px shrink-0 text-amber-500" />
          <p>Kunjungan contoh (demo) tidak tersimpan di server, sehingga tidak dapat dibatalkan. Fitur ini aktif untuk pasien nyata.</p>
        </div>
      )}

      {/* Loading */}
      {isReal && loading && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-4 py-8 text-[12px] text-slate-400">
          <Loader2 size={15} className="animate-spin" /> Memeriksa kelayakan pembatalan…
        </div>
      )}

      {/* Error muat */}
      {isReal && !loading && err && !elig && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
          <span className="flex items-center gap-2"><XCircle size={15} /> {err}</span>
          <button type="button" onClick={retry} className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">
            <RefreshCw size={12} /> Coba lagi
          </button>
        </div>
      )}

      {/* Kelayakan */}
      {isReal && elig && !done && (
        <>
          {/* Rincian aktivitas klinis */}
          <div>
            <p className="mb-2 text-[9.5px] font-bold uppercase tracking-widest text-slate-400">Aktivitas Klinis</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {CATS.map((c, i) => (
                <ActivityChip key={c.key} label={c.label} icon={c.icon} count={elig.activity[c.key]} index={i} />
              ))}
            </div>
          </div>

          {/* Verdict */}
          <AnimatePresence mode="wait">
            {elig.cancelable ? (
              <motion.div key="ok" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="space-y-3 rounded-xl border-2 border-emerald-300 bg-emerald-50/70 p-4">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className="shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-[13px] font-bold text-emerald-800">Kunjungan dapat dibatalkan</p>
                    <p className="text-[11px] text-emerald-700/80">Belum ada rekam medis, tindakan, atau order pada kunjungan ini.</p>
                  </div>
                </div>

                <div className="rounded-lg border border-rose-200 bg-white p-3">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alasan Pembatalan</label>
                  <textarea
                    value={alasan}
                    onChange={(e) => setAlasan(e.target.value)}
                    rows={2}
                    placeholder="Contoh: salah input pasien / kunjungan ganda / batal atas permintaan pasien…"
                    className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-800 placeholder:text-slate-300 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100"
                  />
                  {alasan.trim().length > 0 && alasan.trim().length < 5 && (
                    <p className="mt-1 text-[10.5px] text-rose-500">Alasan minimal 5 karakter.</p>
                  )}
                </div>

                {err && <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-rose-600"><XCircle size={13} /> {err}</p>}

                <div className="flex justify-end">
                  <button type="button" onClick={() => setConfirmOpen(true)} disabled={!canSubmit}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-bold text-white transition active:scale-95",
                      canSubmit ? "bg-rose-600 hover:bg-rose-700" : "cursor-not-allowed bg-slate-300",
                    )}>
                    <Ban size={13} />
                    Batalkan Kunjungan
                  </button>
                </div>
              </motion.div>
            ) : !elig.statusCancelable ? (
              <motion.div key="status" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[12px] text-slate-600">
                <AlertTriangle size={18} className="mt-px shrink-0 text-slate-400" />
                <p>
                  Kunjungan berstatus <strong>{STATUS_LABEL[elig.status] ?? elig.status}</strong> tidak dapat dibatalkan.
                  {elig.status === "Cancelled"
                    ? " Kunjungan ini sudah dibatalkan."
                    : " Gunakan Batalkan Selesai / mekanisme lain sesuai lifecycle."}
                </p>
              </motion.div>
            ) : (
              <motion.div key="blocked" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-2 rounded-xl border-2 border-rose-300 bg-rose-50/70 p-4">
                <div className="flex items-center gap-2.5">
                  <XCircle size={20} className="shrink-0 text-rose-600" />
                  <div>
                    <p className="text-[13px] font-bold text-rose-800">Tidak dapat dibatalkan</p>
                    <p className="text-[11px] text-rose-700/80">Kunjungan sudah memiliki aktivitas klinis ({elig.totalActivity} entri).</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {CATS.filter((c) => elig.activity[c.key] > 0).map((c) => (
                    <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold text-rose-700 ring-1 ring-rose-200">
                      <c.icon size={11} /> {c.label} · {elig.activity[c.key]}
                    </span>
                  ))}
                </div>
                <p className="pl-8 text-[11px] leading-relaxed text-rose-700/80">
                  Batalkan order/tindakan yang keliru terlebih dahulu, atau akhiri kunjungan melalui <strong>Selesaikan Kunjungan</strong>.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Sukses */}
      {done && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-emerald-300 bg-emerald-50/70 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={30} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-800">Kunjungan Dibatalkan</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-[11.5px] text-slate-500">
              <Loader2 size={12} className="animate-spin" /> Memuat ulang halaman…
            </p>
          </div>
        </motion.div>
      )}

      {/* Konfirmasi final */}
      <ConfirmBatalModal
        open={confirmOpen}
        noKunjungan={kunjungan.noKunjungan || kunjungan.noPendaftaran}
        unit={kunjungan.unit}
        alasan={alasan.trim()}
        busy={submitting}
        onConfirm={submit}
        onCancel={() => { if (!submitting) setConfirmOpen(false); }}
      />
    </div>
  );
}
