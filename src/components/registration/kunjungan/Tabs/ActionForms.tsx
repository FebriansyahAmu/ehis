"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Printer, HeartPulse, Wallet, HardHat, ShieldCheck,
  Search, CheckCircle2, XCircle, Loader2, CreditCard, User, Calendar, Building2,
  ChevronLeft, ChevronRight, Check, X, FileText,
} from "lucide-react";
import type { KunjunganRecord } from "@/lib/data";

// ─── Shared primitives ────────────────────────────────────────

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

// ─── BPJS mock data ───────────────────────────────────────────

interface BpjsData {
  nama: string;
  noKartu: string;
  nik: string;
  jenis: "PBI" | "Non-PBI";
  kelas: "Kelas I" | "Kelas II" | "Kelas III";
  fktp: string;
  status: "Aktif" | "Tidak Aktif";
  berlakuSd: string;
}

const BPJS_MOCK: Record<string, BpjsData> = {
  "0001234567890": {
    nama: "Joko Prasetyo", noKartu: "0001234567890", nik: "3275011301700001",
    jenis: "Non-PBI", kelas: "Kelas II", fktp: "Puskesmas Cempaka Putih",
    status: "Aktif", berlakuSd: "2027-12-31",
  },
  "3275011301700001": {
    nama: "Joko Prasetyo", noKartu: "0001234567890", nik: "3275011301700001",
    jenis: "Non-PBI", kelas: "Kelas II", fktp: "Puskesmas Cempaka Putih",
    status: "Aktif", berlakuSd: "2027-12-31",
  },
  "0009876543210": {
    nama: "Siti Rahayu", noKartu: "0009876543210", nik: "3275025202920002",
    jenis: "PBI", kelas: "Kelas III", fktp: "Puskesmas Kebun Jeruk",
    status: "Tidak Aktif", berlakuSd: "2024-06-30",
  },
  "3275025202920002": {
    nama: "Siti Rahayu", noKartu: "0009876543210", nik: "3275025202920002",
    jenis: "PBI", kelas: "Kelas III", fktp: "Puskesmas Kebun Jeruk",
    status: "Tidak Aktif", berlakuSd: "2024-06-30",
  },
};

// ─── InfoItem ─────────────────────────────────────────────────

function InfoItem({
  icon: Icon, label, value, className,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wider text-slate-400">
        <Icon size={8} />
        {label}
      </p>
      <p className="text-[11px] font-semibold text-slate-700">{value}</p>
    </div>
  );
}

// ─── BPJS search panel ────────────────────────────────────────

type BpjsMode  = "kartu" | "nik";
type BpjsPhase = "idle" | "searching" | "found" | "notfound";

function BpjsPanel({
  defaultValue,
  onSelect,
  onDeselect,
}: {
  defaultValue?: string;
  onSelect?: (data: BpjsData) => void;
  onDeselect?: () => void;
}) {
  const [mode,   setMode]   = useState<BpjsMode>("kartu");
  const [query,  setQuery]  = useState(defaultValue ?? "");
  const [phase,  setPhase]  = useState<BpjsPhase>("idle");
  const [result, setResult] = useState<BpjsData | null>(null);
  const [used,   setUsed]   = useState(false);

  const digitLen = query.replace(/\D/g, "").length;
  const maxLen   = mode === "nik" ? 16 : 13;
  const isValid  = digitLen >= maxLen;

  const handleSearch = () => {
    if (!isValid) return;
    setPhase("searching"); setResult(null); setUsed(false);
    setTimeout(() => {
      const key   = query.replace(/\D/g, "");
      const found = BPJS_MOCK[key] ?? null;
      setResult(found); setPhase(found ? "found" : "notfound");
    }, 1200);
  };

  const handleModeChange = (m: BpjsMode) => {
    setMode(m); setQuery(""); setPhase("idle"); setResult(null); setUsed(false);
  };

  return (
    <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
      {/* ── Left: form ── */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cari Kepesertaan</p>
        <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
          {(["kartu", "nik"] as BpjsMode[]).map(m => (
            <button key={m} type="button" onClick={() => handleModeChange(m)}
              className={cn("flex-1 py-1.5 text-[10px] font-bold transition",
                mode === m ? "bg-sky-500 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700")}
            >
              {m === "kartu" ? "No. Kartu" : "NIK"}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            className={cn(sm, "pr-14 font-mono tracking-widest")}
            placeholder={mode === "kartu" ? "13 digit no. kartu..." : "16 digit NIK..."}
            value={query} maxLength={maxLen} inputMode="numeric"
            onChange={e => {
              const v = e.target.value.replace(/\D/g, "").slice(0, maxLen);
              setQuery(v);
              if (phase !== "idle") setPhase("idle");
            }}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <span className={cn(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold tabular-nums",
            digitLen >= maxLen ? "text-sky-500" : "text-slate-300",
          )}>
            {digitLen}/{maxLen}
          </span>
        </div>
        <button type="button" disabled={!isValid || phase === "searching"} onClick={handleSearch}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12px] font-bold transition",
            isValid && phase !== "searching"
              ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.98]"
              : "cursor-not-allowed bg-slate-200 text-slate-400",
          )}
        >
          {phase === "searching"
            ? <><Loader2 size={12} className="animate-spin" />Mencari...</>
            : <><Search size={12} />Cari Kepesertaan</>}
        </button>
        <div className="rounded-lg bg-sky-50 px-2.5 py-2 ring-1 ring-sky-100">
          <p className="mb-1 text-[8.5px] font-bold uppercase tracking-wider text-sky-500">Demo</p>
          {mode === "kartu" ? (
            <>
              <p className="font-mono text-[9.5px] text-slate-500">0001234567890 → Aktif</p>
              <p className="font-mono text-[9.5px] text-slate-500">0009876543210 → Tidak Aktif</p>
            </>
          ) : (
            <>
              <p className="font-mono text-[9.5px] text-slate-500">3275011301700001 → Aktif</p>
              <p className="font-mono text-[9.5px] text-slate-500">3275025202920002 → Tidak Aktif</p>
            </>
          )}
        </div>
      </div>

      {/* ── Right: result ── */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Informasi Kepesertaan</p>
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-center"
            >
              <CreditCard size={24} className="text-slate-200" />
              <p className="text-[10px] text-slate-400">Masukkan nomor lalu klik Cari</p>
            </motion.div>
          )}
          {phase === "searching" && (
            <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col gap-2.5 rounded-xl border border-slate-100 bg-white p-3"
            >
              <div className="h-3 w-2/3 animate-pulse rounded-md bg-slate-100" />
              <div className="h-2 w-1/2 animate-pulse rounded-md bg-slate-100" />
              <div className="mt-1 h-2 w-full animate-pulse rounded-md bg-slate-100" />
              <div className="h-2 w-full animate-pulse rounded-md bg-slate-100" />
              <div className="h-2 w-3/4 animate-pulse rounded-md bg-slate-100" />
              <div className="h-2 w-1/2 animate-pulse rounded-md bg-slate-100" />
            </motion.div>
          )}
          {phase === "notfound" && (
            <motion.div key="notfound" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-rose-100 bg-rose-50/50 py-10 text-center"
            >
              <XCircle size={22} className="text-rose-300" />
              <div>
                <p className="text-[11px] font-semibold text-rose-600">Data tidak ditemukan</p>
                <p className="mt-0.5 text-[9.5px] text-rose-400">Nomor tidak terdaftar di sistem BPJS</p>
              </div>
            </motion.div>
          )}
          {phase === "found" && result && (
            <motion.div key="found" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white"
            >
              <div className={cn("flex items-center gap-2 px-3 py-2.5",
                result.status === "Aktif" ? "bg-emerald-500" : "bg-rose-500")}>
                {result.status === "Aktif"
                  ? <CheckCircle2 size={12} className="shrink-0 text-white" />
                  : <XCircle size={12} className="shrink-0 text-white" />}
                <span className="text-[10px] font-bold text-white">{result.status}</span>
                <span className="ml-auto font-mono text-[9px] text-white/70">{result.noKartu}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-3">
                <p className="text-[14px] font-bold leading-tight text-slate-800">{result.nama}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <InfoItem icon={User}      label="Jenis" value={result.jenis} />
                  <InfoItem icon={Building2} label="Kelas" value={result.kelas} />
                  <InfoItem icon={CreditCard} label="FKTP" value={result.fktp} className="col-span-2" />
                  <InfoItem icon={Calendar}  label="Berlaku s/d" value={result.berlakuSd} />
                </div>
                <div className="mt-auto border-t border-slate-50 pt-2.5">
                  <AnimatePresence mode="wait">
                    {used ? (
                      <motion.div key="used"
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 ring-1 ring-emerald-200"
                      >
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        <span className="text-[11px] font-bold text-emerald-700">Data dipilih</span>
                        <button type="button" onClick={() => { setUsed(false); onDeselect?.(); }}
                          className="ml-auto text-[9px] font-semibold text-emerald-500 underline hover:text-emerald-700"
                        >
                          Ganti
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button key="use" type="button"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }} transition={{ duration: 0.12 }}
                        onClick={() => { onSelect?.(result); setUsed(true); }}
                        className={cn(
                          "w-full rounded-lg py-1.5 text-[11px] font-bold text-white transition active:scale-95",
                          result.status === "Aktif" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-400 hover:bg-slate-500",
                        )}
                      >
                        Gunakan Data Ini
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
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
  { id: "bpjs-jkn",   label: "BPJS / JKN",           sub: "Kartu Indonesia Sehat",    icon: HeartPulse,  idle: "border-sky-200 bg-sky-50 text-sky-600",              active: "border-sky-500 bg-sky-500 text-white"         },
  { id: "umum",       label: "Umum / Mandiri",         sub: "Bayar sendiri / tunai",    icon: Wallet,      idle: "border-slate-200 bg-slate-50 text-slate-600",        active: "border-slate-700 bg-slate-700 text-white"     },
  { id: "bpjs-naker", label: "BPJS Ketenagakerjaan",  sub: "Jaminan kecelakaan kerja", icon: HardHat,     idle: "border-emerald-200 bg-emerald-50 text-emerald-600",  active: "border-emerald-500 bg-emerald-500 text-white" },
  { id: "asuransi",   label: "Asuransi Lainnya",       sub: "Swasta / perusahaan",      icon: ShieldCheck, idle: "border-amber-200 bg-amber-50 text-amber-600",        active: "border-amber-500 bg-amber-500 text-white"     },
];

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

// ─── Paket form ───────────────────────────────────────────────

export function PaketForm() {
  return (
    <div className="space-y-4">
      <SectionHead title="Ubah Paket Layanan" desc="Ubah paket atau kelas layanan untuk kunjungan ini" />
      <FieldGrid>
        <span className={lbl}>Paket</span>
        <select className={smSel}>
          <option value="">Pilih paket...</option>
          <option>Reguler</option>
          <option>Eksekutif</option>
          <option>VIP</option>
          <option>BPJS Non-PBI</option>
          <option>BPJS PBI</option>
        </select>
        <span className={lbl}>Kelas</span>
        <select className={smSel}>
          <option value="">Pilih kelas...</option>
          <option>Kelas 1</option>
          <option>Kelas 2</option>
          <option>Kelas 3</option>
          <option>VIP</option>
          <option>ICU</option>
        </select>
        <span className={lblTop}>Catatan</span>
        <textarea className={cn(sm, "min-h-16 resize-none")} placeholder="Alasan perubahan paket..." />
      </FieldGrid>
      <SaveBtn text="Simpan Perubahan" />
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
          <option>Rawat Jalan</option>
          <option>IGD</option>
          <option>Rujukan</option>
          <option>Langsung</option>
        </select>
        <span className={lblTop}>Keluhan</span>
        <textarea className={cn(sm, "min-h-16 resize-none")} defaultValue={kunjungan.keluhan} />
      </FieldGrid>
      <SaveBtn text="Simpan Perubahan" />
    </div>
  );
}

// ─── SEP Stepper ──────────────────────────────────────────────

const SEP_STEPS = [
  { id: 1, label: "Peserta"   },
  { id: 2, label: "Kunjungan" },
  { id: 3, label: "Jaminan"   },
  { id: 4, label: "Review"    },
] as const;

interface SepDraft {
  noKartu: string; namaPeserta: string; klsRawatHak: string; jenisPeserta: string;
  tglSep: string; jnsPelayanan: "1" | "2"; ppkPelayanan: string; noMR: string;
  naikKelas: boolean; klsRawatNaik: string; pembiayaan: string; penanggungJawab: string;
  lakaLantas: "0" | "1" | "2" | "3"; noLP: string;
  tglKejadian: string; keteranganLaka: string;
  suplesi: "0" | "1"; noSepSuplesi: string;
  kdPropinsi: string; kdKabupaten: string; kdKecamatan: string;
  cob: "0" | "1"; katarak: "0" | "1";
  skdpNoSurat: string; skdpKodeDPJP: string;
  noTelp: string; catatan: string; user: string;
}

const BLANK_DRAFT: SepDraft = {
  noKartu: "", namaPeserta: "", klsRawatHak: "", jenisPeserta: "",
  tglSep: "", jnsPelayanan: "2", ppkPelayanan: "0107R001", noMR: "",
  naikKelas: false, klsRawatNaik: "", pembiayaan: "", penanggungJawab: "",
  lakaLantas: "0", noLP: "",
  tglKejadian: "", keteranganLaka: "",
  suplesi: "0", noSepSuplesi: "",
  kdPropinsi: "", kdKabupaten: "", kdKecamatan: "",
  cob: "0", katarak: "0",
  skdpNoSurat: "", skdpKodeDPJP: "",
  noTelp: "", catatan: "", user: "",
};

const SLIDE_VARIANTS = {
  enter:  (d: number) => ({ opacity: 0, x: d * 36 }),
  center: { opacity: 1, x: 0 },
  exit:   (d: number) => ({ opacity: 0, x: d * -36 }),
};

function SepField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      {children}
    </div>
  );
}

const sInp = "h-10 w-full rounded-xl border border-transparent bg-slate-100 px-3 text-[13px] text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition";
const sSel = "h-10 w-full rounded-xl border border-transparent bg-slate-100 px-3 text-[13px] text-slate-800 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";

function Chips({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex h-10 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-lg text-[11px] font-bold transition-all duration-150 active:scale-[0.97]",
            value === o.value
              ? "bg-white text-sky-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Step indicator (compact, sidebar) ───────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-start px-1">
      {SEP_STEPS.map((s, i) => {
        const done   = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex flex-1 flex-col items-center">
            <div className="relative flex w-full items-center">
              {i > 0 && (
                <div className={cn("h-0.5 flex-1 transition-colors duration-300",
                  done || active ? "bg-emerald-500" : "bg-slate-200")} />
              )}
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all duration-300",
                done    ? "border-emerald-500 bg-emerald-500 text-white"
                : active ? "border-emerald-500 bg-white text-emerald-600"
                :          "border-slate-200 bg-white text-slate-300",
              )}>
                {done ? <Check size={10} /> : s.id}
              </div>
              {i < SEP_STEPS.length - 1 && (
                <div className={cn("h-0.5 flex-1 transition-colors duration-300",
                  done ? "bg-emerald-500" : "bg-slate-200")} />
              )}
            </div>
            <p className={cn(
              "mt-1 text-center text-[8px] font-semibold transition-colors duration-200",
              active ? "text-emerald-600" : done ? "text-emerald-400" : "text-slate-300",
            )}>
              {s.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Peserta BPJS ─────────────────────────────────────

function SepStep1({ draft, setDraft, onNext }: {
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
  onNext: () => void;
}) {
  const [mode,   setMode]   = useState<BpjsMode>("kartu");
  const [query,  setQuery]  = useState("");
  const [phase,  setPhase]  = useState<BpjsPhase>("idle");
  const [result, setResult] = useState<BpjsData | null>(null);

  const maxLen   = mode === "nik" ? 16 : 13;
  const digitLen = query.replace(/\D/g, "").length;
  const isValid  = digitLen >= maxLen;

  const handleSearch = () => {
    if (!isValid) return;
    setPhase("searching"); setResult(null);
    setTimeout(() => {
      const key   = query.replace(/\D/g, "");
      const found = BPJS_MOCK[key] ?? null;
      setResult(found); setPhase(found ? "found" : "notfound");
    }, 1000);
  };

  const handleUse = () => {
    if (!result) return;
    const klsMap: Record<string, string> = { "Kelas I": "1", "Kelas II": "2", "Kelas III": "3" };
    setDraft(d => ({
      ...d,
      noKartu: result.noKartu, namaPeserta: result.nama,
      klsRawatHak: klsMap[result.kelas] ?? "2", jenisPeserta: result.jenis,
    }));
    onNext();
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cari Kepesertaan</p>
        <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
          {(["kartu", "nik"] as BpjsMode[]).map(m => (
            <button key={m} type="button"
              onClick={() => { setMode(m); setQuery(""); setPhase("idle"); setResult(null); }}
              className={cn("flex-1 py-1.5 text-[10px] font-bold transition",
                mode === m ? "bg-sky-500 text-white" : "text-slate-500 hover:bg-slate-50")}
            >
              {m === "kartu" ? "No. Kartu" : "NIK"}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            className={cn(sInp, "pr-14 font-mono tracking-widest")}
            placeholder={mode === "kartu" ? "13 digit no. kartu..." : "16 digit NIK..."}
            value={query} maxLength={maxLen} inputMode="numeric"
            onChange={e => {
              const v = e.target.value.replace(/\D/g, "").slice(0, maxLen);
              setQuery(v);
              if (phase !== "idle") { setPhase("idle"); setResult(null); }
            }}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <span className={cn(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold tabular-nums",
            digitLen >= maxLen ? "text-sky-500" : "text-slate-300",
          )}>
            {digitLen}/{maxLen}
          </span>
        </div>
        <button type="button" disabled={!isValid || phase === "searching"} onClick={handleSearch}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition",
            isValid && phase !== "searching"
              ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.98]"
              : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          {phase === "searching"
            ? <><Loader2 size={11} className="animate-spin" />Mencari...</>
            : <><Search size={11} />Cari Kepesertaan</>}
        </button>
        <div className="rounded-lg bg-sky-50 px-2.5 py-2 ring-1 ring-sky-100">
          <p className="mb-1 text-[8px] font-bold uppercase tracking-wider text-sky-500">Demo</p>
          {mode === "kartu" ? (
            <><p className="font-mono text-[9px] text-slate-500">0001234567890 → Aktif</p>
              <p className="font-mono text-[9px] text-slate-500">0009876543210 → Tidak Aktif</p></>
          ) : (
            <><p className="font-mono text-[9px] text-slate-500">3275011301700001 → Aktif</p>
              <p className="font-mono text-[9px] text-slate-500">3275025202920002 → Tidak Aktif</p></>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Informasi Kepesertaan</p>
        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-center"
            >
              <CreditCard size={22} className="text-slate-200" />
              <p className="text-[10px] text-slate-400">Masukkan nomor lalu klik Cari</p>
            </motion.div>
          )}
          {phase === "searching" && (
            <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col gap-2 rounded-xl border border-slate-100 bg-white p-3"
            >
              {[0.65, 0.45, 1, 1, 0.75, 0.5].map((w, i) => (
                <div key={i} className="animate-pulse rounded-md bg-slate-100 py-1.5" style={{ width: `${w * 100}%` }} />
              ))}
            </motion.div>
          )}
          {phase === "notfound" && (
            <motion.div key="notfound" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50/50 py-10 text-center"
            >
              <XCircle size={22} className="text-rose-300" />
              <div>
                <p className="text-[11px] font-semibold text-rose-600">Data tidak ditemukan</p>
                <p className="mt-0.5 text-[9.5px] text-rose-400">Nomor tidak terdaftar di sistem</p>
              </div>
            </motion.div>
          )}
          {phase === "found" && result && (
            <motion.div key="found" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white"
            >
              <div className={cn("flex items-center gap-2 px-3 py-2",
                result.status === "Aktif" ? "bg-emerald-500" : "bg-rose-500")}>
                {result.status === "Aktif"
                  ? <CheckCircle2 size={11} className="shrink-0 text-white" />
                  : <XCircle     size={11} className="shrink-0 text-white" />}
                <span className="text-[10px] font-bold text-white">{result.status}</span>
                <span className="ml-auto font-mono text-[8.5px] text-white/70">{result.noKartu}</span>
              </div>
              <div className="flex flex-1 flex-col gap-2.5 p-3">
                <p className="text-[13px] font-bold text-slate-800">{result.nama}</p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <InfoItem icon={User}       label="Jenis" value={result.jenis} />
                  <InfoItem icon={Building2}  label="Kelas" value={result.kelas} />
                  <InfoItem icon={CreditCard} label="FKTP"  value={result.fktp} className="col-span-2" />
                  <InfoItem icon={Calendar}   label="s/d"   value={result.berlakuSd} />
                </div>
                <div className="mt-auto border-t border-slate-50 pt-2">
                  <button type="button" onClick={handleUse}
                    className={cn(
                      "w-full rounded-lg py-1.5 text-[11px] font-bold text-white transition active:scale-[0.98]",
                      result.status === "Aktif" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-400 hover:bg-slate-500",
                    )}
                  >
                    Gunakan Data Ini →
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step 2: Kunjungan ────────────────────────────────────────

function SepStep2({ draft, setDraft }: {
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
}) {
  const set = <K extends keyof SepDraft>(k: K, v: SepDraft[K]) => setDraft(d => ({ ...d, [k]: v }));
  const klsLabel = ({ "1": "Kelas I", "2": "Kelas II", "3": "Kelas III" } as Record<string, string>)[draft.klsRawatHak] ?? "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5 rounded-xl bg-sky-50 px-3.5 py-2.5 ring-1 ring-sky-100">
        <CheckCircle2 size={14} className="shrink-0 text-sky-500" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-sky-800">{draft.namaPeserta}</p>
          <p className="font-mono text-[9.5px] text-sky-500">{draft.noKartu}</p>
        </div>
        <span className="shrink-0 rounded-md bg-sky-100 px-2 py-0.5 text-[9.5px] font-bold text-sky-600">
          {klsLabel}
        </span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <SepField label="Tanggal SEP">
            <input type="date" className={sInp} value={draft.tglSep}
              onChange={e => set("tglSep", e.target.value)} />
          </SepField>
          <SepField label="Jenis Pelayanan">
            <Chips options={[{ value: "2", label: "Rawat Jalan" }, { value: "1", label: "Rawat Inap" }]}
              value={draft.jnsPelayanan} onChange={v => set("jnsPelayanan", v as "1" | "2")} />
          </SepField>
          <SepField label="Kode PPK Pelayanan">
            <input className={sInp} value={draft.ppkPelayanan} placeholder="Kode faskes..."
              onChange={e => set("ppkPelayanan", e.target.value)} />
          </SepField>
          <SepField label="No. Medical Record">
            <input className={sInp} value={draft.noMR} placeholder="No. RM pasien..."
              onChange={e => set("noMR", e.target.value)} />
          </SepField>
          <SepField label="Kelas Rawat Hak">
            <div className="flex h-10 items-center rounded-xl bg-slate-100 px-3">
              <span className="text-[13px] font-semibold text-slate-600">{klsLabel}</span>
              <span className="ml-auto text-[9px] text-slate-400">dari BPJS</span>
            </div>
          </SepField>
          <SepField label="Naik Kelas">
            <Chips options={[{ value: "false", label: "Tidak" }, { value: "true", label: "Ya" }]}
              value={String(draft.naikKelas)} onChange={v => set("naikKelas", v === "true")} />
          </SepField>
        </div>
      </div>

      <AnimatePresence>
        {draft.naikKelas && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="grid grid-cols-3 gap-3 overflow-hidden rounded-xl border border-amber-100 bg-amber-50/40 p-4"
          >
            <SepField label="Kelas Naik">
              <select className={sSel} value={draft.klsRawatNaik}
                onChange={e => set("klsRawatNaik", e.target.value)}>
                <option value="">Pilih...</option>
                {["VVIP", "VIP", "Kelas I", "Kelas II", "Kelas III", "ICCU", "ICU", "Di atas Kelas I"].map((v, i) => (
                  <option key={v} value={String(i + 1)}>{v}</option>
                ))}
              </select>
            </SepField>
            <SepField label="Pembiayaan">
              <select className={sSel} value={draft.pembiayaan}
                onChange={e => set("pembiayaan", e.target.value)}>
                <option value="">Pilih...</option>
                <option value="1">Pribadi</option>
                <option value="2">Pemberi Kerja</option>
                <option value="3">Asuransi Tambahan</option>
              </select>
            </SepField>
            <SepField label="Penanggung Jawab">
              <input className={sInp} value={draft.penanggungJawab} placeholder="Mis. Pribadi..."
                onChange={e => set("penanggungJawab", e.target.value)} />
            </SepField>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 3: Jaminan & Kecelakaan ────────────────────────────

function SepStep3({ draft, setDraft }: {
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
}) {
  const set    = <K extends keyof SepDraft>(k: K, v: SepDraft[K]) => setDraft(d => ({ ...d, [k]: v }));
  const isLaka = draft.lakaLantas !== "0";

  return (
    <div className="space-y-3">
      {/* Jaminan Kecelakaan */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-3.5 w-1 rounded-full bg-amber-400" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Jaminan Kecelakaan</p>
        </div>
        <SepField label="Laka Lantas">
          <Chips
            options={[
              { value: "0", label: "BKLL" },
              { value: "1", label: "KLL+BKK" },
              { value: "2", label: "KLL+KK" },
              { value: "3", label: "KK" },
            ]}
            value={draft.lakaLantas}
            onChange={v => set("lakaLantas", v as "0" | "1" | "2" | "3")}
          />
        </SepField>
        <AnimatePresence>
          {isLaka && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
              className="space-y-3 overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <SepField label="No. Laporan Polisi (LP)">
                  <input className={sInp} value={draft.noLP} placeholder="LP-XXXX/XX/XXXX"
                    onChange={e => set("noLP", e.target.value)} />
                </SepField>
                <SepField label="Tanggal Kejadian KLL">
                  <input type="date" className={sInp} value={draft.tglKejadian}
                    onChange={e => set("tglKejadian", e.target.value)} />
                </SepField>
                <div className="col-span-2">
                  <SepField label="Keterangan Kejadian">
                    <input className={sInp} value={draft.keteranganLaka} placeholder="Kronologi singkat kejadian..."
                      onChange={e => set("keteranganLaka", e.target.value)} />
                  </SepField>
                </div>
              </div>

              {/* Suplesi */}
              <div className="space-y-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <p className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400">Suplesi</p>
                <SepField label="Suplesi">
                  <Chips options={[{ value: "0", label: "Tidak" }, { value: "1", label: "Ya" }]}
                    value={draft.suplesi} onChange={v => set("suplesi", v as "0" | "1")} />
                </SepField>
                <AnimatePresence>
                  {draft.suplesi === "1" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
                      className="space-y-2.5 overflow-hidden"
                    >
                      <SepField label="No. SEP Suplesi">
                        <input className={sInp} value={draft.noSepSuplesi} placeholder="No. SEP terdahulu..."
                          onChange={e => set("noSepSuplesi", e.target.value)} />
                      </SepField>
                      <div className="grid grid-cols-3 gap-2">
                        <SepField label="Kode Provinsi">
                          <input className={sInp} value={draft.kdPropinsi} placeholder="Kode..."
                            onChange={e => set("kdPropinsi", e.target.value)} />
                        </SepField>
                        <SepField label="Kode Kabupaten">
                          <input className={sInp} value={draft.kdKabupaten} placeholder="Kode..."
                            onChange={e => set("kdKabupaten", e.target.value)} />
                        </SepField>
                        <SepField label="Kode Kecamatan">
                          <input className={sInp} value={draft.kdKecamatan} placeholder="Kode..."
                            onChange={e => set("kdKecamatan", e.target.value)} />
                        </SepField>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* COB, Katarak, SKDP */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <SepField label="COB">
          <Chips options={[{ value: "0", label: "Tidak" }, { value: "1", label: "Ya" }]}
            value={draft.cob} onChange={v => set("cob", v as "0" | "1")} />
        </SepField>
        <SepField label="Katarak">
          <Chips options={[{ value: "0", label: "Tidak" }, { value: "1", label: "Ya" }]}
            value={draft.katarak} onChange={v => set("katarak", v as "0" | "1")} />
        </SepField>
        <SepField label="No. Surat SKDP">
          <input className={sInp} value={draft.skdpNoSurat} placeholder="No. surat kontrol..."
            onChange={e => set("skdpNoSurat", e.target.value)} />
        </SepField>
        <SepField label="Kode DPJP (SKDP)">
          <input className={sInp} value={draft.skdpKodeDPJP} placeholder="Kode dokter..."
            onChange={e => set("skdpKodeDPJP", e.target.value)} />
        </SepField>
        <SepField label="No. Telepon">
          <input className={sInp} value={draft.noTelp} placeholder="08XX..."
            onChange={e => set("noTelp", e.target.value)} />
        </SepField>
        <SepField label="User / Operator">
          <input className={sInp} value={draft.user} placeholder="Username operator..."
            onChange={e => set("user", e.target.value)} />
        </SepField>
        <div className="col-span-2">
          <SepField label="Catatan">
            <textarea className={cn(sInp, "h-auto min-h-[52px] resize-none py-1.5")}
              value={draft.catatan} placeholder="Catatan peserta..."
              onChange={e => set("catatan", e.target.value)} />
          </SepField>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Review ───────────────────────────────────────────

const R_JNS  = { "1": "Rawat Inap", "2": "Rawat Jalan" } as const;
const R_LAKA = { "0": "BKLL", "1": "KLL + BKK", "2": "KLL + KK", "3": "KK" } as const;
const R_KLS  = { "1": "Kelas I", "2": "Kelas II", "3": "Kelas III" } as const;

function RvItem({
  label, value, mono, fullWidth,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  fullWidth?: boolean;
}) {
  if (!value) return null;
  return (
    <div className={cn("space-y-1.5", fullWidth && "col-span-2")}>
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">{label}</p>
      <div className="flex h-10 items-center rounded-xl bg-slate-100 px-3">
        <span className={cn("text-[12px] font-semibold text-slate-700", mono && "font-mono tracking-wider")}>
          {value}
        </span>
      </div>
    </div>
  );
}

function RvSection2({
  title, accent, icon, children,
}: {
  title: string;
  accent: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <div className={cn("h-4 w-1 rounded-full", accent)} />
        {icon}
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SepStep4({ draft }: { draft: SepDraft }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
        <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
        <div>
          <p className="text-[11px] font-bold text-emerald-700">Semua data siap dikirim</p>
          <p className="text-[9.5px] text-emerald-500">Periksa kembali sebelum menekan Kirim SEP</p>
        </div>
      </div>

      <RvSection2 title="Identitas Peserta" accent="bg-sky-500"
        icon={<User size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Nama Peserta</p>
            <div className="flex h-10 items-center rounded-xl bg-slate-100 px-3">
              <span className="text-[13px] font-bold text-slate-800">{draft.namaPeserta}</span>
            </div>
          </div>
          <RvItem label="No. Kartu BPJS" value={draft.noKartu} mono />
          <RvItem label="Hak Kelas" value={R_KLS[draft.klsRawatHak as keyof typeof R_KLS]} />
        </div>
      </RvSection2>

      <RvSection2 title="Info Kunjungan" accent="bg-indigo-400"
        icon={<Calendar size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <RvItem label="Tanggal SEP" value={draft.tglSep} />
          <RvItem label="Jenis Pelayanan" value={R_JNS[draft.jnsPelayanan]} />
          <RvItem label="Kode PPK" value={draft.ppkPelayanan || "—"} mono />
          <RvItem label="No. Medical Record" value={draft.noMR || "—"} mono />
        </div>
      </RvSection2>

      <RvSection2 title="Jaminan & Kecelakaan" accent="bg-amber-400"
        icon={<ShieldCheck size={11} className="shrink-0 text-slate-400" />}>
        <div className="grid grid-cols-2 gap-3">
          <RvItem label="Laka Lantas" value={R_LAKA[draft.lakaLantas]} />
          {draft.lakaLantas !== "0" && <RvItem label="No. Laporan Polisi" value={draft.noLP || "—"} mono />}
          {draft.lakaLantas !== "0" && <RvItem label="Tgl. Kejadian" value={draft.tglKejadian || "—"} />}
          {draft.suplesi === "1" && <RvItem label="No. SEP Suplesi" value={draft.noSepSuplesi || "—"} mono />}
          <RvItem label="COB" value={draft.cob === "1" ? "Ya" : "Tidak"} />
          {draft.user && <RvItem label="Operator" value={draft.user} />}
        </div>
      </RvSection2>
    </div>
  );
}

// ─── SEP Progress Bar ─────────────────────────────────────────

function SEPProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round(((current - 1) / (total - 1)) * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
      <motion.div
        className="h-full rounded-full bg-emerald-400"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ─── Animated SEP Stepper (inline card) ──────────────────────

function SEPStepper({ current }: { current: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start">
        {SEP_STEPS.map((s, i) => {
          const done   = s.id < current;
          const active = s.id === current;
          return (
            <div key={s.id} className="flex flex-1 flex-col items-center">
              <div className="relative flex w-full items-center">
                {i > 0 && (
                  <div className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-500",
                    done ? "bg-emerald-400" : active ? "bg-emerald-200" : "bg-slate-200",
                  )} />
                )}
                <motion.div
                  animate={{
                    scale: active ? 1.18 : 1,
                    backgroundColor: done ? "#10b981" : active ? "#ffffff" : "#f8fafc",
                    borderColor: done || active ? "#10b981" : "#e2e8f0",
                    boxShadow: active
                      ? "0 0 0 6px rgba(16,185,129,0.15), 0 0 0 3px rgba(16,185,129,0.1)"
                      : "none",
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2"
                >
                  {done ? (
                    <Check size={12} className="text-white" />
                  ) : (
                    <span className={cn("text-[11px] font-bold",
                      active ? "text-emerald-600" : "text-slate-300")}>
                      {s.id}
                    </span>
                  )}
                </motion.div>
                {i < SEP_STEPS.length - 1 && (
                  <div className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors duration-500",
                    done ? "bg-emerald-400" : "bg-slate-200",
                  )} />
                )}
              </div>
              <motion.p
                animate={{ color: active ? "#059669" : done ? "#34d399" : "#cbd5e1" }}
                transition={{ duration: 0.25 }}
                className="mt-2 text-center text-[9px] font-bold uppercase tracking-wider"
              >
                {s.label}
              </motion.p>
            </div>
          );
        })}
      </div>
      <SEPProgressBar current={current} total={SEP_STEPS.length} />
    </div>
  );
}

// ─── SEP Card Step 1 (pre-filled member review) ──────────────

function SEPCardStep1({ data, draft, setDraft }: {
  data: BpjsData;
  draft: SepDraft;
  setDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
}) {
  const set     = <K extends keyof SepDraft>(k: K, v: SepDraft[K]) => setDraft(d => ({ ...d, [k]: v }));
  const isAktif = data.status === "Aktif";

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
        <div className={cn("flex items-center gap-2.5 px-5 py-3",
          isAktif ? "bg-emerald-500" : "bg-rose-500")}>
          {isAktif
            ? <CheckCircle2 size={13} className="shrink-0 text-white" />
            : <XCircle size={13} className="shrink-0 text-white" />}
          <span className="text-[11px] font-bold text-white">Peserta {data.status}</span>
          <span className="ml-auto font-mono text-[9.5px] text-white/70">{data.noKartu}</span>
        </div>
        <div className="bg-white p-5">
          <div className="mb-4">
            <p className="text-[8.5px] font-bold uppercase tracking-widest text-slate-400">Nama Peserta</p>
            <p className="mt-0.5 text-[19px] font-bold leading-tight text-slate-800">{data.nama}</p>
          </div>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Jenis</p>
              <p className="mt-1 text-[12px] font-bold text-slate-700">{data.jenis}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Hak Kelas</p>
              <p className="mt-1 text-[12px] font-bold text-slate-700">{data.kelas}</p>
            </div>
            <div className={cn("rounded-xl p-3", isAktif ? "bg-emerald-50" : "bg-rose-50")}>
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Berlaku s/d</p>
              <p className={cn("mt-1 text-[11px] font-bold leading-tight",
                isAktif ? "text-emerald-600" : "text-rose-500")}>
                {data.berlakuSd}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2.5">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
              Fasilitas Kesehatan Tingkat Pertama
            </p>
            <p className="mt-0.5 text-[12px] font-medium text-slate-700">{data.fktp}</p>
          </div>
        </div>
      </div>

      <SepField label="No. Medical Record Pasien">
        <input className={cn(sInp, "font-mono tracking-wider")} value={draft.noMR}
          placeholder="Mis. RM-2025-001" onChange={e => set("noMR", e.target.value)} />
      </SepField>

      {!isAktif && (
        <motion.div
          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 rounded-xl border border-rose-100 bg-rose-50/60 px-3.5 py-3"
        >
          <XCircle size={14} className="mt-px shrink-0 text-rose-500" />
          <p className="text-[10.5px] leading-relaxed text-rose-600">
            Peserta tidak aktif. SEP mungkin tidak dapat diterbitkan. Konfirmasi dengan supervisor sebelum melanjutkan.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ─── Inline SEP Card ─────────────────────────────────────────

function InlineSEPCard({ data, kunjungan, onClose }: {
  data: BpjsData;
  kunjungan: KunjunganRecord;
  onClose: () => void;
}) {
  const [step,      setStep]      = useState(1);
  const [dir,       setDir]       = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [draft,     setDraft]     = useState<SepDraft>(() => {
    const klsMap: Record<string, string> = { "Kelas I": "1", "Kelas II": "2", "Kelas III": "3" };
    return {
      ...BLANK_DRAFT,
      noKartu: data.noKartu, namaPeserta: data.nama,
      klsRawatHak: klsMap[data.kelas] ?? "2", jenisPeserta: data.jenis,
      tglSep: new Date().toISOString().slice(0, 10),
    };
  });

  const goTo = (next: number) => { setDir(next > step ? 1 : -1); setStep(next); };

  return (
    <div className="flex flex-col">
      {/* Header — solid sky */}
      <div className="bg-sky-400 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <FileText size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-white">Penerbitan SEP</p>
            <p className="text-[10px] text-white/70">Surat Eligibilitas Peserta · BPJS Kesehatan</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Success state */}
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center gap-5 px-6 py-14 text-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 18 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
          >
            <CheckCircle2 size={32} className="text-emerald-600" />
          </motion.div>
          <div>
            <p className="text-[15px] font-bold text-slate-800">SEP Berhasil Diterbitkan</p>
            <p className="mt-1 text-[11px] text-slate-400">
              SEP atas nama <span className="font-bold text-slate-600">{data.nama}</span> telah dikirim ke sistem BPJS Kesehatan
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
              Tutup
            </button>
            <button type="button"
              onClick={() => { setSubmitted(false); setStep(1); setDraft({ ...BLANK_DRAFT }); }}
              className="rounded-xl bg-sky-500 px-4 py-2.5 text-[11px] font-bold text-white hover:bg-sky-600">
              Buat SEP Baru
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          {/* Stepper */}
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <SEPStepper current={step} />
          </div>

          {/* Step content */}
          <div className="overflow-hidden px-6 py-5">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={step} custom={dir} variants={SLIDE_VARIANTS}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 1 && <SEPCardStep1 data={data} draft={draft} setDraft={setDraft} />}
                {step === 2 && <SepStep2 draft={draft} setDraft={setDraft} />}
                {step === 3 && <SepStep3 draft={draft} setDraft={setDraft} />}
                {step === 4 && <SepStep4 draft={draft} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer */}
          {step < 4 && (
            <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              {step > 1 ? (
                <button type="button" onClick={() => goTo(step - 1)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
                  <ChevronLeft size={13} />
                  Kembali
                </button>
              ) : <div />}
              <span className="flex-1 text-center text-[9px] text-slate-400">
                Langkah {step} dari 4
              </span>
              <button type="button" onClick={() => goTo(step + 1)}
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-[12px] font-bold text-white shadow-sm shadow-sky-200/70 transition hover:bg-sky-600 active:scale-95">
                Lanjut
                <ChevronRight size={13} />
              </button>
            </div>
          )}
          {step === 4 && (
            <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button type="button" onClick={() => goTo(3)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
                <ChevronLeft size={13} />
                Kembali
              </button>
              <div className="flex-1" />
              <button type="button" onClick={() => setSubmitted(true)}
                className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-[12px] font-bold text-white shadow-md shadow-sky-200/80 transition hover:bg-sky-600 active:scale-95">
                <CheckCircle2 size={14} />
                Kirim SEP ke BPJS
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Update SEP form (standalone) ────────────────────────────

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
            <ChevronLeft size={13} />
            Kembali
          </button>
          <button type="button" onClick={() => goTo(step + 1)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95">
            Lanjut
            <ChevronRight size={13} />
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <button type="button" onClick={() => goTo(3)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95">
            <ChevronLeft size={13} />
            Kembali
          </button>
          <button type="button" onClick={() => setSubmitted(true)}
            className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-[11px] font-bold text-white transition hover:bg-sky-700 active:scale-95">
            <Check size={12} />
            Kirim SEP ke BPJS
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
        <PrintRow label="Surat Rujukan" disabled={!hasRujukan} />
        <PrintRow label="Struk Pembayaran" disabled={!isDone} />
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
