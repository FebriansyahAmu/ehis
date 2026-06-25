"use client";

// Pemilih SPRI untuk No. Referensi SPRI (= No. SKDP) di form SEP. Auto-search SPRI berdasarkan
// No. Kartu BPJS peserta + filter tanggal. Pilih baris → isi No. Referensi ke draft.
//
// CATATAN (gap — lihat TECH_DEBT): search masih CLIENT-side (filter listSpri by noKartu);
// belum ada endpoint server `GET /spri?noKartu=`. Aturan "No. SPRI == No. SEP terbit" belum
// ditegakkan. DPJP nama+kode dari SPRI belum dibawa ke payload.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  X, Search, Loader2, FileSearch, CalendarDays, Stethoscope, CheckCircle2, Inbox, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/shared/inputs";
import { listSpri, type SpriDTO } from "@/lib/api/spri/spri";

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";
const onlyDigits = (s: string): string => s.replace(/\D/g, "");

function fmtTgl(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y) return ymd || "—";
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  MenungguRef: { label: "Menunggu Ref", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  Terbit:      { label: "Ref Terbit",   cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  Dikonsumsi:  { label: "Teradmisi",    cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
  Batal:       { label: "Batal",        cls: "bg-rose-50 text-rose-600 ring-1 ring-rose-200" },
};

export function SpriPickerModal({
  noKartu, selectedRef, onSelect, onClose,
}: {
  noKartu: string;
  selectedRef?: string;
  onSelect: (spri: SpriDTO) => void;
  onClose: () => void;
}) {
  const kartuDigits = onlyDigits(noKartu);
  const [rows, setRows] = useState<SpriDTO[]>([]);
  // Loading awal hanya bila ada No. Kartu untuk dicari (hindari setState sinkron di effect).
  const [loading, setLoading] = useState(kartuDigits.length > 0);
  const [error, setError] = useState(false);
  const [tgl, setTgl] = useState(""); // filter tanggal (tglRencanaRawat), kosong = semua

  // Esc untuk tutup.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Auto-search: tarik SPRI lalu filter by No. Kartu peserta (client-side).
  useEffect(() => {
    if (!kartuDigits) return; // tak ada kartu → loading awal sudah false (render guard menangani)
    const ac = new AbortController();
    let cancelled = false;
    listSpri({}, ac.signal)
      .then((items) => {
        if (cancelled) return;
        setRows(items.filter((s) => onlyDigits(s.noKartu) === kartuDigits));
      })
      .catch((e) => { if (!cancelled && !isAbort(e)) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; ac.abort(); };
  }, [kartuDigits]);

  const filtered = useMemo(
    () => (tgl ? rows.filter((s) => s.tglRencanaRawat === tgl) : rows),
    [rows, tgl],
  );

  const body = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 8 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <FileSearch size={19} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Pilih SPRI</h2>
              <p className="text-[11px] text-slate-400">No. Referensi SPRI akan dipakai sebagai No. SKDP penerbitan SEP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Toolbar: kartu (auto) + filter tanggal */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
            <CreditCard size={13} className="text-sky-500" />
            Kartu: <span className="font-mono text-slate-800">{noKartu || "—"}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
            <Search size={11} /> Auto-cari berdasarkan No. Kartu
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tgl SPRI</span>
            <div className="w-40">
              <DatePicker variant="filled" value={tgl} onChange={setTgl} />
            </div>
            {tgl && (
              <button
                onClick={() => setTgl("")}
                className="text-[10px] font-semibold text-slate-400 underline-offset-2 transition hover:text-slate-600 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {!kartuDigits ? (
            <Empty icon={CreditCard} title="No. Kartu BPJS belum ada"
              desc="Verifikasi kepesertaan dulu di langkah Penjamin." />
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
              <Loader2 size={16} className="animate-spin text-emerald-500" />
              <span className="text-[13px]">Mencari SPRI…</span>
            </div>
          ) : error ? (
            <Empty icon={Inbox} title="Gagal memuat SPRI" desc="Periksa koneksi lalu coba lagi." tone="rose" />
          ) : filtered.length === 0 ? (
            <Empty icon={Inbox} title="Tidak ada SPRI"
              desc={tgl ? "Tidak ada SPRI pada tanggal ini. Reset filter tanggal." : "Belum ada SPRI untuk kartu peserta ini."} />
          ) : (
            <div className="space-y-2">
              {filtered.map((s) => {
                const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.MenungguRef;
                const isSel = !!selectedRef && s.noReferensi === selectedRef;
                const noRef = !s.noReferensi;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelect(s)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition active:scale-[0.99]",
                      isSel ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40",
                    )}
                  >
                    <span className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      isSel ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400",
                    )}>
                      {isSel ? <CheckCircle2 size={17} /> : <FileSearch size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn(
                          "font-mono text-[13px] font-bold",
                          noRef ? "text-amber-600" : "text-slate-800",
                        )}>
                          {s.noReferensi || "Belum terbit"}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", cfg.cls)}>{cfg.label}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={11} className="text-slate-400" /> {fmtTgl(s.tglRencanaRawat)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Stethoscope size={11} className="text-slate-400" /> {s.dpjpNama}
                        </span>
                        <span className="text-slate-400">· {s.jenisPerawatan}</span>
                        {s.poliNama && <span className="text-slate-400">· {s.poliNama}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="text-[11px] text-slate-400">
            {filtered.length > 0 && `${filtered.length} SPRI ditemukan`}
          </p>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(body, document.body);
}

function Empty({
  icon: Icon, title, desc, tone = "slate",
}: {
  icon: typeof Inbox;
  title: string;
  desc: string;
  tone?: "slate" | "rose";
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className={cn(
        "flex h-12 w-12 items-center justify-center rounded-2xl",
        tone === "rose" ? "bg-rose-50 text-rose-300" : "bg-slate-50 text-slate-300",
      )}>
        <Icon size={24} />
      </span>
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className="max-w-xs text-xs text-slate-400">{desc}</p>
    </div>
  );
}
