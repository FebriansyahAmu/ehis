"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Search, CheckCircle2, XCircle, Loader2,
  CreditCard, User, Calendar, Building2,
} from "lucide-react";
import {
  type BpjsData, type BpjsMode, type BpjsPhase, type SepDraft,
  BPJS_MOCK, sInp,
} from "./sepTypes";
import { SepField } from "./SepShared";

// White-bg variant used in the standalone BpjsPanel (Ubah Penjamin tab)
const panelInp = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition";

// ─── InfoItem (local — only used in result cards here) ────────

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

// ─── BpjsPanel (used in PenjaminForm → Ubah Penjamin tab) ────

export function BpjsPanel({
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
      {/* ── Left: search form ── */}
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
            className={cn(panelInp, "pr-14 font-mono tracking-widest")}
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
                  : <XCircle     size={12} className="shrink-0 text-white" />}
                <span className="text-[10px] font-bold text-white">{result.status}</span>
                <span className="ml-auto font-mono text-[9px] text-white/70">{result.noKartu}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-3">
                <p className="text-[14px] font-bold leading-tight text-slate-800">{result.nama}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <InfoItem icon={User}       label="Jenis"      value={result.jenis} />
                  <InfoItem icon={Building2}  label="Kelas"      value={result.kelas} />
                  <InfoItem icon={CreditCard} label="FKTP"       value={result.fktp} className="col-span-2" />
                  <InfoItem icon={Calendar}   label="Berlaku s/d" value={result.berlakuSd} />
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

// ─── SepStep1: BPJS search (used in UpdateSEPForm) ───────────

export function SepStep1({ draft, setDraft, onNext }: {
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

// ─── SEPCardStep1: pre-filled member review (InlineSEPCard) ──

export function SEPCardStep1({ data, draft, setDraft }: {
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
            : <XCircle     size={13} className="shrink-0 text-white" />}
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
