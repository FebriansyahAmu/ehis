"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Printer, HeartPulse, Wallet, HardHat, ShieldCheck,
  ChevronLeft, ChevronRight, Check, CheckCircle2,
} from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";
import { BpjsPanel } from "./sep/BpjsSearch";
import { InlineSEPCard } from "./sep/InlineSEPCard";
import { SepStep1 } from "./sep/BpjsSearch";
import { SepStep2, SepStep3, SepStep4 } from "./sep/SepSteps";
import { StepIndicator } from "./sep/SepShared";
import { BLANK_DRAFT, SLIDE_VARIANTS, type SepDraft, type BpjsData } from "./sep/sepTypes";

export { PaketForm } from "./PaketForm";

// ─── Shared form primitives ───────────────────────────────────

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <p className="text-[13px] font-bold text-slate-800">{title}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">{desc}</p>
    </div>
  );
}

const sm    = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition";
const smSel = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";
const lbl    = "self-center text-right text-[10px] font-bold uppercase tracking-wider text-slate-400";
const lblTop = "self-start pt-2 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400";

function FieldGrid({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={cn(
      "grid grid-cols-[100px_1fr] items-center gap-x-3 gap-y-2.5 rounded-xl border p-4",
      danger ? "border-rose-100 bg-rose-50/40" : "border-slate-100 bg-slate-50/60",
    )}>
      {children}
    </div>
  );
}

function SaveBtn({ text, danger }: { text: string; danger?: boolean }) {
  return (
    <div className="flex justify-end">
      <button type="button" className={cn(
        "rounded-lg px-4 py-2 text-[12px] font-bold text-white transition active:scale-95",
        danger ? "bg-rose-600 hover:bg-rose-700" : "bg-sky-600 hover:bg-sky-700",
      )}>{text}</button>
    </div>
  );
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition active:scale-95",
        active
          ? "border-sky-500 bg-sky-500 text-white"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
      )}
    >
      {label}
    </button>
  );
}

// ─── Penjamin form ────────────────────────────────────────────

type PenjaminType = "bpjs-jkn" | "umum" | "bpjs-naker" | "asuransi";

const PENJAMIN_OPTS: {
  id: PenjaminType;
  label: string;
  sub: string;
  icon: React.ElementType;
  idle: string;
  active: string;
}[] = [
  { id: "bpjs-jkn",   label: "BPJS / JKN",          sub: "Kartu Indonesia Sehat",    icon: HeartPulse,  idle: "border-sky-200 bg-sky-50 text-sky-600",             active: "border-sky-500 bg-sky-500 text-white"         },
  { id: "umum",       label: "Umum / Mandiri",        sub: "Bayar sendiri / tunai",    icon: Wallet,      idle: "border-slate-200 bg-slate-50 text-slate-600",       active: "border-slate-700 bg-slate-700 text-white"     },
  { id: "bpjs-naker", label: "BPJS Ketenagakerjaan", sub: "Jaminan kecelakaan kerja", icon: HardHat,     idle: "border-emerald-200 bg-emerald-50 text-emerald-600", active: "border-emerald-500 bg-emerald-500 text-white" },
  { id: "asuransi",   label: "Asuransi Lainnya",      sub: "Swasta / perusahaan",      icon: ShieldCheck, idle: "border-amber-200 bg-amber-50 text-amber-600",       active: "border-amber-500 bg-amber-500 text-white"     },
];

function getInitialType(penjamin?: string | null): PenjaminType {
  if (!penjamin || penjamin.startsWith("BPJS") || penjamin.includes("PBI")) return "bpjs-jkn";
  if (penjamin === "Umum") return "umum";
  if (penjamin === "Asuransi") return "asuransi";
  return "bpjs-jkn";
}

export function PenjaminForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const [selected,     setSelected]     = useState<PenjaminType>(() => getInitialType(kunjungan.penjamin));
  const [cara,         setCara]         = useState("Tunai");
  const [bpjsSelected, setBpjsSelected] = useState<BpjsData | null>(null);

  const handleTypeChange = (t: PenjaminType) => { setSelected(t); setBpjsSelected(null); };

  return (
    <div className="space-y-4">
      <SectionHead title="Ubah Penjamin" desc="Pilih jenis penjamin lalu lengkapi data kepesertaan" />

      <div className="grid grid-cols-2 gap-2">
        {PENJAMIN_OPTS.map((opt) => {
          const Icon     = opt.icon;
          const isActive = selected === opt.id;
          return (
            <button key={opt.id} type="button" onClick={() => handleTypeChange(opt.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.98]",
                isActive ? opt.active : cn(opt.idle, "hover:opacity-80"),
              )}
            >
              <Icon size={15} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-bold leading-tight">{opt.label}</p>
                <p className={cn("text-[9.5px] leading-tight", isActive ? "opacity-70" : "opacity-50")}>{opt.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={selected} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {selected === "bpjs-jkn" && (
            <BpjsPanel defaultValue={kunjungan.noPenjamin ?? ""}
              onSelect={data => setBpjsSelected(data)}
              onDeselect={() => setBpjsSelected(null)}
            />
          )}
          {selected === "umum" && (
            <FieldGrid>
              <p className="col-span-2 rounded-lg bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-700 ring-1 ring-sky-100">
                Pasien dikenakan tarif umum RS. Pastikan persetujuan biaya telah diperoleh.
              </p>
              <span className={lbl}>Pembayaran</span>
              <div className="flex flex-wrap gap-1.5">
                {["Tunai", "Transfer", "Kartu Debit", "Kartu Kredit"].map(v => (
                  <ToggleChip key={v} label={v} active={cara === v} onClick={() => setCara(v)} />
                ))}
              </div>
            </FieldGrid>
          )}
          {selected === "bpjs-naker" && (
            <FieldGrid>
              <p className="col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-relaxed text-emerald-700 ring-1 ring-emerald-100">
                Untuk kecelakaan kerja / penyakit akibat kerja yang ditanggung BPJS Ketenagakerjaan.
              </p>
              <span className={lbl}>No. KPJ</span>
              <input className={sm} placeholder="Nomor Kartu Peserta..." />
              <span className={lbl}>Perusahaan</span>
              <input className={sm} placeholder="Nama perusahaan pemberi kerja..." />
            </FieldGrid>
          )}
          {selected === "asuransi" && (
            <FieldGrid>
              <span className={lbl}>Nama Asuransi</span>
              <input className={sm} placeholder="Mis. Prudential, AXA..." />
              <span className={lbl}>No. Polis</span>
              <input className={sm} placeholder="Nomor polis asuransi..." />
              <span className={lbl}>Tertanggung</span>
              <input className={sm} placeholder="Nama sesuai kartu / polis..." />
              <span className={lbl}>Berlaku s/d</span>
              <input type="date" className={sm} />
            </FieldGrid>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selected === "bpjs-jkn" && bpjsSelected && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60"
          >
            <InlineSEPCard data={bpjsSelected} kunjungan={kunjungan} onClose={() => setBpjsSelected(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {selected !== "bpjs-jkn" && <SaveBtn text="Simpan Perubahan" />}
    </div>
  );
}

// ─── Rujukan form ─────────────────────────────────────────────

export function RujukanForm() {
  return (
    <div className="space-y-4">
      <SectionHead title="Surat Rujukan" desc="Buat atau perbarui surat rujukan untuk kunjungan ini" />
      <FieldGrid>
        <span className={lbl}>Jenis</span>
        <select className={smSel}>
          <option value="">Pilih jenis...</option>
          <option>Rujukan Internal (Antar Poli)</option>
          <option>Rujukan Eksternal</option>
          <option>Rujukan Balik</option>
        </select>
        <span className={lbl}>Tujuan</span>
        <input className={sm} placeholder="Nama poli / faskes tujuan..." />
        <span className={lbl}>ICD-10</span>
        <input className={sm} placeholder="Mis. J06.9 – ISPA" />
        <span className={lblTop}>Alasan</span>
        <textarea className={cn(sm, "min-h-16 resize-none")} placeholder="Jelaskan alasan perujukan..." />
        <span className={lbl}>Tanggal</span>
        <input type="date" className={sm} />
      </FieldGrid>
      <SaveBtn text="Buat Surat Rujukan" />
    </div>
  );
}

// ─── Kecelakaan form ──────────────────────────────────────────

export function KecelakaanForm() {
  return (
    <div className="space-y-4">
      <SectionHead title="Data Kecelakaan" desc="Lengkapi informasi untuk kasus kecelakaan" />
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700 ring-1 ring-amber-200">
        Diperlukan untuk pelaporan dan klaim Jasa Raharja / BPJS Ketenagakerjaan.
      </p>
      <FieldGrid>
        <span className={lbl}>Jenis</span>
        <select className={smSel}>
          <option value="">Pilih jenis...</option>
          <option>Kecelakaan Lalu Lintas</option>
          <option>Kecelakaan Kerja</option>
          <option>Lainnya</option>
        </select>
        <span className={lbl}>Tanggal</span>
        <input type="date" className={sm} />
        <span className={lbl}>Lokasi</span>
        <input className={sm} placeholder="Alamat / nama jalan kejadian..." />
        <span className={lbl}>No. LP</span>
        <input className={sm} placeholder="LP-XXXX/XX/XXXX" />
        <span className={lblTop}>Keterangan</span>
        <textarea className={cn(sm, "min-h-16 resize-none")} placeholder="Kronologi singkat kejadian..." />
      </FieldGrid>
      <SaveBtn text="Simpan Data Kecelakaan" />
    </div>
  );
}

// ─── Update data form ─────────────────────────────────────────

export function UpdateForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  return (
    <div className="space-y-4">
      <SectionHead title="Update Data Kunjungan" desc="Perbarui informasi dasar kunjungan" />
      <FieldGrid>
        <span className={lbl}>DPJP</span>
        <input className={sm} defaultValue={kunjungan.dokter} />
        <span className={lbl}>Tanggal</span>
        <input type="date" className={sm} defaultValue={kunjungan.tanggal} />
        <span className={lbl}>Cara Masuk</span>
        <select className={smSel} defaultValue={kunjungan.caraMasuk ?? ""}>
          <option value="">Pilih cara masuk...</option>
          <option>Rawat Jalan</option><option>IGD</option>
          <option>Rujukan</option><option>Langsung</option>
        </select>
        <span className={lblTop}>Keluhan</span>
        <textarea className={cn(sm, "min-h-16 resize-none")} defaultValue={kunjungan.keluhan} />
      </FieldGrid>
      <SaveBtn text="Simpan Perubahan" />
    </div>
  );
}

// ─── Update SEP form ──────────────────────────────────────────

export function UpdateSEPForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const [step,      setStep]      = useState(1);
  const [dir,       setDir]       = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [draft,     setDraft]     = useState<SepDraft>({ ...BLANK_DRAFT });

  const goTo = (next: number) => { setDir(next > step ? 1 : -1); setStep(next); };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={28} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-slate-800">SEP Berhasil Dikirim</p>
          <p className="mt-1 text-[11px] text-slate-400">Data SEP telah dikirimkan ke sistem BPJS</p>
        </div>
        <button type="button"
          onClick={() => { setSubmitted(false); setStep(1); setDraft({ ...BLANK_DRAFT }); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
          Buat SEP Baru
        </button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StepIndicator current={step} />

      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={SLIDE_VARIANTS}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
            {step === 1 && <SepStep1 draft={draft} setDraft={setDraft} onNext={() => goTo(2)} />}
            {step === 2 && <SepStep2 draft={draft} setDraft={setDraft} />}
            {step === 3 && <SepStep3 draft={draft} setDraft={setDraft} />}
            {step === 4 && <SepStep4 draft={draft} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {step > 1 && step < 4 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button type="button" onClick={() => goTo(step - 1)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
            <ChevronLeft size={13} />Kembali
          </button>
          <button type="button" onClick={() => goTo(step + 1)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95">
            Lanjut<ChevronRight size={13} />
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button type="button" onClick={() => goTo(3)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
            <ChevronLeft size={13} />Kembali
          </button>
          <button type="button" onClick={() => setSubmitted(true)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95">
            <Check size={12} />Kirim SEP ke BPJS
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Cetak tab ────────────────────────────────────────────────

function PrintRow({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition",
        disabled ? "cursor-not-allowed opacity-40" : "hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 transition",
        !disabled && "group-hover:bg-slate-800",
      )}>
        <Printer size={13} className={cn("text-slate-500 transition", !disabled && "group-hover:text-white")} />
      </div>
      <span className="flex-1 text-[12px] font-medium text-slate-700">{label}</span>
    </button>
  );
}

export function CetakTab({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const hasSEP     = !!kunjungan.noSEP;
  const hasRujukan = !!kunjungan.dokumen?.rujukan;
  const isDone     = kunjungan.status === "Selesai";
  return (
    <div className="space-y-4">
      <SectionHead title="Cetak Dokumen" desc="Cetak dokumen terkait kunjungan ini" />
      <div className="space-y-2">
        <PrintRow label="Bukti Pendaftaran" />
        <PrintRow label="Kartu Antrean" />
        <PrintRow label="Gelang Identitas" />
        <PrintRow label="No. SEP / Surat Eligibilitas" disabled={!hasSEP} />
        <PrintRow label="Surat Rujukan"                disabled={!hasRujukan} />
        <PrintRow label="Struk Pembayaran"             disabled={!isDone} />
      </div>
    </div>
  );
}

// ─── Hapus form ───────────────────────────────────────────────

export function HapusForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const isActive = kunjungan.status === "Aktif";
  return (
    <div className="space-y-4">
      <SectionHead title="Hapus Kunjungan" desc="Tindakan ini tidak dapat dibatalkan" />
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700 ring-1 ring-amber-200">
        Kunjungan hanya dapat dihapus oleh admin. Data terkait (SEP, order, diagnosa) ikut dihapus permanen.
      </p>
      {isActive && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] font-medium text-rose-700">
          Kunjungan masih berstatus <strong>Aktif</strong>. Batalkan terlebih dahulu sebelum menghapus.
        </div>
      )}
      <FieldGrid danger>
        <span className={lblTop}>Alasan</span>
        <textarea className={cn(sm, "min-h-16 resize-none")}
          placeholder="Jelaskan alasan penghapusan data kunjungan..." />
        <span className={lbl}>Konfirmasi</span>
        <input className={sm} placeholder='Ketik "HAPUS" untuk melanjutkan' />
      </FieldGrid>
      <SaveBtn text="Hapus Kunjungan" danger />
    </div>
  );
}
