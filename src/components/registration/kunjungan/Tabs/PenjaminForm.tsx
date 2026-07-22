"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, Wallet, HardHat, ShieldCheck,
  Check, Loader2, RefreshCw, Building2, Hash, FileCheck, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { KunjunganRecord } from "@/lib/data";
import { DatePicker } from "@/components/shared/inputs";
import { BpjsPanel } from "./sep/BpjsSearch";
import { InlineSEPCard } from "./sep/InlineSEPCard";
import type { BpjsData } from "./sep/sepTypes";

// ─── Types & config ───────────────────────────────────────────

type PenjaminType = "bpjs-jkn" | "umum" | "bpjs-naker" | "asuransi";

type Accent = {
  ring: string; tile: string; dot: string; soft: string; text: string;
};

// Aksen per jenis penjamin — dipakai halus (tile ikon + ring terpilih + label),
// bukan sebagai isian tombol penuh. Palet: sky/slate/emerald/indigo (hindari ungu primer).
const ACCENT: Record<PenjaminType, Accent> = {
  "bpjs-jkn":   { ring: "ring-sky-500/60",     tile: "bg-sky-100 text-sky-600",         dot: "bg-sky-500",     soft: "bg-sky-50/70",     text: "text-sky-700"     },
  "umum":       { ring: "ring-slate-400/60",   tile: "bg-slate-100 text-slate-600",     dot: "bg-slate-500",   soft: "bg-slate-50",      text: "text-slate-700"   },
  "bpjs-naker": { ring: "ring-emerald-500/60", tile: "bg-emerald-100 text-emerald-600", dot: "bg-emerald-500", soft: "bg-emerald-50/70", text: "text-emerald-700" },
  "asuransi":   { ring: "ring-indigo-500/60",  tile: "bg-indigo-100 text-indigo-600",   dot: "bg-indigo-500",  soft: "bg-indigo-50/70",  text: "text-indigo-700"  },
};

const PENJAMIN_OPTS: { id: PenjaminType; label: string; sub: string; icon: LucideIcon }[] = [
  { id: "bpjs-jkn",   label: "BPJS / JKN",           sub: "Kartu Indonesia Sehat",    icon: HeartPulse  },
  { id: "umum",       label: "Umum / Mandiri",       sub: "Bayar sendiri / tunai",    icon: Wallet      },
  { id: "bpjs-naker", label: "BPJS Ketenagakerjaan", sub: "Jaminan kecelakaan kerja", icon: HardHat     },
  { id: "asuransi",   label: "Asuransi Lainnya",     sub: "Swasta / perusahaan",      icon: ShieldCheck },
];

const labelOf = (t: PenjaminType) => PENJAMIN_OPTS.find((o) => o.id === t)?.label ?? "—";

function typeOf(penjamin?: string | null): PenjaminType {
  if (!penjamin) return "bpjs-jkn";
  const p = penjamin.toLowerCase();
  if (p.includes("bpjs") || p.includes("jkn") || p.includes("pbi") || p.includes("kis")) {
    return p.includes("kerja") || p.includes("naker") ? "bpjs-naker" : "bpjs-jkn";
  }
  if (p.includes("umum") || p.includes("mandiri")) return "umum";
  if (p.includes("asuransi") || p.includes("swasta") || p.includes("polis")) return "asuransi";
  return "bpjs-jkn";
}

const PAYMENTS = ["Tunai", "Transfer", "QRIS", "Kartu Debit", "Kartu Kredit"];

const inp =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] text-slate-800 placeholder:text-slate-300 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100";

// ─── Small primitives ─────────────────────────────────────────

function Field({
  label, hint, full, children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", full && "sm:col-span-2")}>
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
        {hint && <span className="font-medium normal-case tracking-normal text-slate-400">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function PanelCard({ children, tone }: { children: React.ReactNode; tone: PenjaminType }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm", tone === "umum" && "bg-white")}>
      {children}
    </div>
  );
}

// ─── Current-penjamin summary strip ───────────────────────────

function CurrentStrip({ kunjungan, type }: { kunjungan: KunjunganRecord; type: PenjaminType }) {
  const opt  = PENJAMIN_OPTS.find((o) => o.id === type)!;
  const Icon = opt.icon;
  const a    = ACCENT[type];
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", a.tile)}>
        <Icon size={19} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Penjamin Saat Ini</p>
        <p className="truncate text-[14px] font-bold text-slate-800">{kunjungan.penjamin ?? opt.label}</p>
        {(kunjungan.noPenjamin || kunjungan.noSEP) && (
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            {kunjungan.noPenjamin && (
              <span className="font-mono text-[10px] text-slate-500">{kunjungan.noPenjamin}</span>
            )}
            {kunjungan.noSEP && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500">
                <FileCheck size={10} className="text-emerald-500" />
                SEP {kunjungan.noSEP}
              </span>
            )}
          </div>
        )}
      </div>
      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wider", a.soft, a.text)}>
        Aktif
      </span>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────

// Tab "Ubah Penjamin" — pilih jenis penjamin → lengkapi data. BPJS: cek kepesertaan
// (BpjsPanel) → terbitkan/ubah SEP (InlineSEPCard). Non-BPJS: form ringkas + simpan.
export function PenjaminForm({ kunjungan }: { kunjungan: KunjunganRecord }) {
  const currentType = useMemo(() => typeOf(kunjungan.penjamin), [kunjungan.penjamin]);

  const [selected,     setSelected]     = useState<PenjaminType>(currentType);
  const [bpjsSelected, setBpjsSelected] = useState<BpjsData | null>(null);
  const [cara,         setCara]         = useState("Tunai");
  const [saveState,    setSaveState]    = useState<"idle" | "saving" | "saved">("idle");

  const choose = (t: PenjaminType) => {
    setSelected(t);
    setBpjsSelected(null);
    setSaveState("idle");
  };

  const resetToCurrent = () => choose(currentType);

  const doSave = () => {
    if (saveState !== "idle") return;
    setSaveState("saving");
    // Persistensi non-BPJS belum di-wire (SaveBtn lama = no-op). Simulasi optimistik →
    // konfirmasi visual; swap ke updatePenjamin saat kontrak siap.
    window.setTimeout(() => {
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2200);
    }, 700);
  };

  const changed = selected !== currentType;
  const isBpjs  = selected === "bpjs-jkn";

  return (
    <div className="flex w-full flex-col gap-4">
      {/* ── Header ── */}
      <div>
        <p className="text-[15px] font-bold text-slate-800">Ubah Penjamin</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Pilih jenis penjamin lalu lengkapi data kepesertaan untuk kunjungan ini.
        </p>
      </div>

      <CurrentStrip kunjungan={kunjungan} type={currentType} />

      {/* ── Type selector ── */}
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Jenis Penjamin</p>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {PENJAMIN_OPTS.map((opt) => {
            const Icon   = opt.icon;
            const active = selected === opt.id;
            const a      = ACCENT[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => choose(opt.id)}
                aria-pressed={active}
                className={cn(
                  "group relative flex flex-col gap-2.5 rounded-2xl border bg-white p-3 text-left transition-all duration-150 active:scale-[0.98]",
                  active
                    ? cn("border-transparent shadow-sm ring-2", a.ring, a.soft)
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition",
                    active ? a.tile : "bg-slate-100 text-slate-500 group-hover:bg-slate-200",
                  )}>
                    <Icon size={16} />
                  </span>
                  <span className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border-2 transition",
                    active ? cn(a.dot, "border-transparent") : "border-slate-300 group-hover:border-slate-400",
                  )}>
                    {active && <Check size={9} strokeWidth={3.5} className="text-white" />}
                  </span>
                </div>
                <div>
                  <p className={cn("text-[12px] font-bold leading-tight", active ? a.text : "text-slate-700")}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-[9.5px] leading-tight text-slate-400">{opt.sub}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Changed hint ── */}
      <AnimatePresence initial={false}>
        {changed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700">
              <RefreshCw size={13} className="shrink-0" />
              <span>
                Mengubah dari <b>{labelOf(currentType)}</b>
                <ArrowRight size={11} className="mx-1 inline -translate-y-px" />
                <b>{labelOf(selected)}</b>.
                {isBpjs ? " Perubahan tersimpan saat SEP diterbitkan." : " Klik Simpan untuk menerapkan."}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dynamic panel ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
          className="space-y-4"
        >
          {selected === "bpjs-jkn" && (
            <>
              <BpjsPanel
                defaultValue={kunjungan.noPenjamin ?? ""}
                onSelect={(data) => setBpjsSelected(data)}
                onDeselect={() => setBpjsSelected(null)}
              />
              <AnimatePresence>
                {bpjsSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60"
                  >
                    <InlineSEPCard data={bpjsSelected} kunjungan={kunjungan} onClose={() => setBpjsSelected(null)} />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {selected === "umum" && (
            <PanelCard tone="umum">
              <div className="flex items-start gap-2.5 rounded-xl bg-sky-50 px-3.5 py-2.5 ring-1 ring-sky-100">
                <Wallet size={14} className="mt-px shrink-0 text-sky-500" />
                <p className="text-[11px] leading-relaxed text-sky-700">
                  Pasien dikenakan tarif umum RS. Pastikan persetujuan biaya telah diperoleh sebelum pelayanan.
                </p>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Metode Pembayaran</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENTS.map((v) => {
                    const on = cara === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setCara(v)}
                        aria-pressed={on}
                        className={cn(
                          "rounded-xl border px-3.5 py-2 text-[11.5px] font-semibold transition active:scale-95",
                          on
                            ? "border-sky-500 bg-sky-500 text-white shadow-sm shadow-sky-200"
                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>
            </PanelCard>
          )}

          {selected === "bpjs-naker" && (
            <PanelCard tone="bpjs-naker">
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 ring-1 ring-emerald-100">
                <HardHat size={14} className="mt-px shrink-0 text-emerald-500" />
                <p className="text-[11px] leading-relaxed text-emerald-700">
                  Untuk kecelakaan kerja / penyakit akibat kerja yang ditanggung BPJS Ketenagakerjaan.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="No. KPJ" hint="Kartu Peserta">
                  <div className="relative">
                    <Hash size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input className={cn(inp, "pl-8 font-mono tracking-wide")} placeholder="Nomor kartu peserta…" />
                  </div>
                </Field>
                <Field label="Perusahaan">
                  <div className="relative">
                    <Building2 size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input className={cn(inp, "pl-8")} placeholder="Pemberi kerja…" />
                  </div>
                </Field>
              </div>
            </PanelCard>
          )}

          {selected === "asuransi" && (
            <PanelCard tone="asuransi">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nama Asuransi" full>
                  <div className="relative">
                    <ShieldCheck size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input className={cn(inp, "pl-8")} placeholder="Mis. Prudential, AXA, Allianz…" />
                  </div>
                </Field>
                <Field label="No. Polis">
                  <input className={cn(inp, "font-mono tracking-wide")} placeholder="Nomor polis…" />
                </Field>
                <Field label="Berlaku s/d">
                  <DatePicker value="" onChange={() => { /* draft lokal */ }} placeholder="Pilih tanggal" />
                </Field>
                <Field label="Nama Tertanggung" full>
                  <input className={inp} placeholder="Sesuai kartu / polis…" />
                </Field>
              </div>
            </PanelCard>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Action bar (non-BPJS) ── */}
      {!isBpjs && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={resetToCurrent}
            disabled={!changed || saveState !== "idle"}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11.5px] font-semibold transition active:scale-95",
              !changed || saveState !== "idle"
                ? "cursor-not-allowed border-slate-100 text-slate-300"
                : "border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            <RefreshCw size={13} />
            Batalkan
          </button>

          <button
            type="button"
            onClick={doSave}
            disabled={saveState !== "idle"}
            className={cn(
              "flex min-w-[9.5rem] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-bold text-white shadow-sm transition active:scale-[0.98]",
              saveState === "saved" ? "bg-emerald-600" : "bg-sky-600 hover:bg-sky-700",
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {saveState === "idle" && (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <Check size={14} />Simpan Perubahan
                </motion.span>
              )}
              {saveState === "saving" && (
                <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />Menyimpan…
                </motion.span>
              )}
              {saveState === "saved" && (
                <motion.span key="saved" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2">
                  <Check size={14} strokeWidth={3} />Tersimpan
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}
    </div>
  );
}
