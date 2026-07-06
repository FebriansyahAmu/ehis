"use client";

// Pemilih No. SKDP untuk penerbitan SEP. DUA sumber:
//  • Surat Kontrol (jadwal kontrol pasien lintas kunjungan) — default filter TANGGAL HARI INI.
//  • SPRI (khusus Rawat Inap) — bebas pilih tanggal.
// Keduanya menghasilkan No. Referensi (noSuratKontrol) → dipakai sebagai No. SKDP.
// Auto-cari berdasarkan pasien (patientId utk kontrol · No. RM/Kartu utk SPRI).

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  X, Search, Loader2, FileSearch, CalendarDays, Stethoscope, CheckCircle2, Inbox, CreditCard,
  CalendarCheck, BedDouble,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/shared/inputs";
import { listSpri, type SpriDTO } from "@/lib/api/spri/spri";
import { listJadwalKontrolByPatient, type JadwalKontrolDTO } from "@/lib/api/jadwalKontrol/jadwalKontrol";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";
const onlyDigits = (s: string): string => s.replace(/\D/g, "");
const todayISO = (): string => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (tz lokal)

function fmtTgl(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y) return ymd || "—";
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const SPRI_STATUS: Record<string, { label: string; cls: string }> = {
  MenungguRef: { label: "Menunggu Ref", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  Terbit:      { label: "Ref Terbit",   cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  Dikonsumsi:  { label: "Teradmisi",    cls: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
  Batal:       { label: "Batal",        cls: "bg-rose-50 text-rose-600 ring-1 ring-rose-200" },
};

type Tab = "kontrol" | "spri";

/** Hasil pilih SKDP (dinormalisasi dari jadwal kontrol / SPRI). */
export interface SkdpPick {
  noReferensi: string | null; // No. Surat Kontrol (SKDP)
  source: Tab;                // "kontrol" (surat kontrol) → RS jadi perujuk (auto PPK Rujukan)
  dokterNama: string;
  kodeDokter?: string;        // kode DPJP BPJS (dari jadwal kontrol) → skdp.kodeDPJP
  tglLabel: string;
  info: string;
  diagAwalKode?: string | null;
  diagAwalNama?: string | null;
}

export function SkdpPickerModal({
  patientId, noKartu, noRM, selectedRef, defaultTab = "kontrol", onSelect, onClose,
}: {
  patientId: string;
  noKartu: string;
  /** No. RM pasien — kunci filter SPRI (No. Kartu SPRI bisa tersimpan ter-mask). */
  noRM?: string;
  selectedRef?: string;
  /** Tab awal aktif — dari Unit Kunjungan step 1 (Rawat Inap → "spri", RJ/IGD → "kontrol"). */
  defaultTab?: Tab;
  onSelect: (pick: SkdpPick) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  const patientOk = UUID_RE.test(patientId);
  const kartuDigits = onlyDigits(noKartu);
  const rmKey = (noRM ?? "").trim();
  const spriHasKey = rmKey.length > 0 || kartuDigits.length > 0;

  // ── Sumber 1: Jadwal Kontrol (surat kontrol) pasien — default filter tanggal HARI INI ──
  const [jkRows, setJkRows] = useState<JadwalKontrolDTO[]>([]);
  const [jkLoading, setJkLoading] = useState(patientOk);
  const [jkError, setJkError] = useState(false);
  const [jkTgl, setJkTgl] = useState<string>(todayISO());

  useEffect(() => {
    if (!patientOk) return;
    const ac = new AbortController();
    let cancelled = false;
    listJadwalKontrolByPatient(patientId, ac.signal)
      .then((rows) => { if (!cancelled) setJkRows(rows); })
      .catch((e) => { if (!cancelled && !isAbort(e)) setJkError(true); })
      .finally(() => { if (!cancelled) setJkLoading(false); });
    return () => { cancelled = true; ac.abort(); };
  }, [patientId, patientOk]);

  // ── Sumber 2: SPRI (Rawat Inap) — bebas tanggal (default: semua) ──
  const [spriRows, setSpriRows] = useState<SpriDTO[]>([]);
  const [spriLoading, setSpriLoading] = useState(spriHasKey);
  const [spriError, setSpriError] = useState(false);
  const [spriTgl, setSpriTgl] = useState("");

  useEffect(() => {
    if (!spriHasKey) return;
    const ac = new AbortController();
    let cancelled = false;
    listSpri({}, ac.signal)
      .then((items) => {
        if (cancelled) return;
        setSpriRows(items.filter((s) =>
          (rmKey && s.noRM === rmKey) ||
          (kartuDigits.length > 0 && onlyDigits(s.noKartu) === kartuDigits),
        ));
      })
      .catch((e) => { if (!cancelled && !isAbort(e)) setSpriError(true); })
      .finally(() => { if (!cancelled) setSpriLoading(false); });
    return () => { cancelled = true; ac.abort(); };
  }, [rmKey, kartuDigits, spriHasKey]);

  // Esc tutup.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const jkFiltered = useMemo(
    () => (jkTgl ? jkRows.filter((r) => r.tanggal === jkTgl) : jkRows),
    [jkRows, jkTgl],
  );
  const spriFiltered = useMemo(
    () => (spriTgl ? spriRows.filter((s) => s.tglRencanaRawat === spriTgl) : spriRows),
    [spriRows, spriTgl],
  );

  const isKontrol = tab === "kontrol";
  const activeTgl = isKontrol ? jkTgl : spriTgl;
  const setActiveTgl = isKontrol ? setJkTgl : setSpriTgl;
  const activeCount = isKontrol ? jkFiltered.length : spriFiltered.length;

  const pickKontrol = (r: JadwalKontrolDTO) => onSelect({
    noReferensi: r.noReferensi,
    source: "kontrol",
    dokterNama: r.dokterNama,
    kodeDokter: r.kodeDokter || undefined,
    tglLabel: fmtTgl(r.tanggal),
    info: r.poliNama,
  });
  const pickSpri = (s: SpriDTO) => onSelect({
    noReferensi: s.noReferensi,
    source: "spri",
    dokterNama: s.dpjpNama,
    tglLabel: fmtTgl(s.tglRencanaRawat),
    info: s.jenisPerawatan,
    diagAwalKode: s.diagAwalKode,
    diagAwalNama: s.diagAwalNama,
  });

  const body = (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
              <h2 className="text-[15px] font-bold text-slate-900">Pilih Surat Kontrol / SPRI</h2>
              <p className="text-[11px] text-slate-400">No. Referensi dipakai sebagai No. SKDP penerbitan SEP</p>
            </div>
          </div>
          <button
            onClick={onClose} aria-label="Tutup"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab sumber */}
        <div className="flex gap-1 border-b border-slate-100 bg-white px-3 pt-3">
          {([
            { id: "kontrol", label: "Surat Kontrol", icon: CalendarCheck },
            { id: "spri", label: "SPRI · Rawat Inap", icon: BedDouble },
          ] as { id: Tab; label: string; icon: typeof CalendarCheck }[]).map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id} type="button" onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-t-lg border-b-2 px-3.5 py-2 text-[12px] font-semibold transition",
                  active ? "border-emerald-500 text-emerald-700" : "border-transparent text-slate-400 hover:text-slate-600",
                )}
              >
                <t.icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Toolbar: kunci pasien (auto) + filter tanggal */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
            <CreditCard size={13} className="text-sky-500" />
            Kartu: <span className="font-mono text-slate-800">{noKartu || "—"}</span>
          </span>
          {noRM && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
              RM: <span className="font-mono text-slate-800">{noRM}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600">
            <Search size={11} /> Auto-cari berdasarkan pasien
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {isKontrol ? "Tgl Kontrol" : "Tgl SPRI"}
            </span>
            <div className="w-40">
              <DatePicker variant="filled" value={activeTgl} onChange={setActiveTgl} />
            </div>
            {activeTgl && (
              <button
                onClick={() => setActiveTgl("")}
                className="text-[10px] font-semibold text-slate-400 underline-offset-2 transition hover:text-slate-600 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {isKontrol ? (
            !patientOk ? (
              <Empty icon={CreditCard} title="Data pasien belum tersimpan"
                desc="Surat kontrol hanya tersedia untuk pasien yang sudah tersimpan (No. RM DB)." />
            ) : jkLoading ? (
              <Loading label="Mencari surat kontrol…" />
            ) : jkError ? (
              <Empty icon={Inbox} title="Gagal memuat surat kontrol" desc="Periksa koneksi lalu coba lagi." tone="rose" />
            ) : jkFiltered.length === 0 ? (
              <Empty icon={Inbox} title="Tidak ada surat kontrol"
                desc={jkTgl ? "Tidak ada surat kontrol pada tanggal ini. Ubah / reset filter tanggal." : "Belum ada surat kontrol untuk pasien ini."} />
            ) : (
              <div className="space-y-2">
                {jkFiltered.map((r) => (
                  <Row
                    key={r.id}
                    noRef={r.noReferensi}
                    tglLabel={fmtTgl(r.tanggal)}
                    dokter={r.dokterNama || "—"}
                    info={r.poliNama}
                    badge={<span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[9px] font-bold text-slate-500">{r.nomor}</span>}
                    selected={!!selectedRef && r.noReferensi === selectedRef}
                    onClick={() => pickKontrol(r)}
                  />
                ))}
              </div>
            )
          ) : (
            !spriHasKey ? (
              <Empty icon={CreditCard} title="Data pasien belum ada"
                desc="Verifikasi kepesertaan / pastikan No. RM pasien tersedia." />
            ) : spriLoading ? (
              <Loading label="Mencari SPRI…" />
            ) : spriError ? (
              <Empty icon={Inbox} title="Gagal memuat SPRI" desc="Periksa koneksi lalu coba lagi." tone="rose" />
            ) : spriFiltered.length === 0 ? (
              <Empty icon={Inbox} title="Tidak ada SPRI"
                desc={spriTgl ? "Tidak ada SPRI pada tanggal ini. Reset filter tanggal." : "Belum ada SPRI untuk pasien ini."} />
            ) : (
              <div className="space-y-2">
                {spriFiltered.map((s) => {
                  const cfg = SPRI_STATUS[s.status] ?? SPRI_STATUS.MenungguRef;
                  return (
                    <Row
                      key={s.id}
                      noRef={s.noReferensi}
                      tglLabel={fmtTgl(s.tglRencanaRawat)}
                      dokter={s.dpjpNama}
                      info={s.poliNama ? `${s.jenisPerawatan} · ${s.poliNama}` : s.jenisPerawatan}
                      badge={<span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", cfg.cls)}>{cfg.label}</span>}
                      selected={!!selectedRef && s.noReferensi === selectedRef}
                      onClick={() => pickSpri(s)}
                    />
                  );
                })}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <p className="text-[11px] text-slate-400">
            {activeCount > 0 && `${activeCount} ${isKontrol ? "surat kontrol" : "SPRI"} ditemukan`}
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

function Row({
  noRef, tglLabel, dokter, info, badge, selected, onClick,
}: {
  noRef: string | null;
  tglLabel: string;
  dokter: string;
  info: string;
  badge?: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  const noReferensi = !noRef;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition active:scale-[0.99]",
        selected ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-200"
          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40",
      )}
    >
      <span className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        selected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400",
      )}>
        {selected ? <CheckCircle2 size={17} /> : <FileSearch size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("font-mono text-[13px] font-bold", noReferensi ? "text-amber-600" : "text-slate-800")}>
            {noRef || "Belum terbit"}
          </span>
          {badge}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={11} className="text-slate-400" /> {tglLabel}
          </span>
          <span className="inline-flex items-center gap-1">
            <Stethoscope size={11} className="text-slate-400" /> {dokter}
          </span>
          {info && <span className="text-slate-400">· {info}</span>}
        </div>
      </div>
    </button>
  );
}

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
      <Loader2 size={16} className="animate-spin text-emerald-500" />
      <span className="text-[13px]">{label}</span>
    </div>
  );
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
