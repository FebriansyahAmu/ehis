"use client";

import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Info, AlertCircle, ShieldCheck, Car, Check,
  Landmark, Handshake, Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Select } from "@/components/shared/inputs/Select";
import type { KecelakaanDraft, KendaraanItem, StatusLP, StatusKoordinasiJR } from "./kecelakaanTypes";
import { MEKANISME_KLL, STATUS_LP_CONFIG, STATUS_JR_CONFIG } from "./kecelakaanTypes";
import { SectionCard, ChipRow, KendaraanCard, lbl, inp } from "./kecelakaanShared";

// ─── Status stepper (Koordinasi JR — pipeline 3 langkah) ──────

function StatusStepper<T extends string>({
  steps, config, value, onChange,
}: {
  steps:    T[];
  config:   Record<T, { label: string; chipCls: string; dot: string }>;
  value:    T;
  onChange: (v: T) => void;
}) {
  const idx = steps.indexOf(value);
  return (
    <div className="flex items-center">
      {steps.map((s, i) => {
        const reached = i <= idx;
        const active = i === idx;
        return (
          <Fragment key={s}>
            <button
              type="button"
              onClick={() => onChange(s)}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ring-2 transition-all duration-200",
                  active
                    ? "bg-amber-500 text-white ring-amber-200 shadow-sm shadow-amber-200"
                    : reached
                      ? "bg-amber-100 text-amber-700 ring-amber-100"
                      : "bg-white text-slate-400 ring-slate-200 group-hover:ring-amber-200",
                )}
              >
                {reached && !active ? <Check size={13} /> : i + 1}
              </span>
              <span className={cn("text-center text-[9.5px] font-semibold leading-tight transition-colors", active ? "text-amber-700" : reached ? "text-slate-600" : "text-slate-400")}>
                {config[s].label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className="mb-5 h-0.5 flex-1 rounded-full bg-slate-100">
                <div className={cn("h-full rounded-full bg-amber-400 transition-all duration-300", i < idx ? "w-full" : "w-0")} />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ─── KLLPanel ─────────────────────────────────────────────────

export function KLLPanel({
  draft, setDraft,
}: {
  draft:    KecelakaanDraft;
  setDraft: React.Dispatch<React.SetStateAction<KecelakaanDraft>>;
}) {
  const addKendaraan = () =>
    setDraft((d) => ({ ...d, kendaraan: [...d.kendaraan, { jenis: "", noPol: "", peran: "Korban" }] }));
  const updateKendaraan = (i: number, patch: Partial<KendaraanItem>) =>
    setDraft((d) => ({ ...d, kendaraan: d.kendaraan.map((k, idx) => (idx === i ? { ...k, ...patch } : k)) }));
  const removeKendaraan = (i: number) =>
    setDraft((d) => ({ ...d, kendaraan: d.kendaraan.filter((_, idx) => idx !== i) }));

  const lpStatuses: StatusLP[]           = ["belum", "proses", "ada"];
  const jrStatuses: StatusKoordinasiJR[] = ["belum", "dijadwalkan", "verifikasi"];
  const lpMissing = draft.statusLP === "belum" || draft.statusLP === "proses";

  return (
    <div className="space-y-3">
      {/* ── Jasa Raharja coverage widget ── */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-linear-to-br from-amber-50 via-amber-50/40 to-white p-4">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/30 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-amber-200">
            <ShieldCheck size={19} className="text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12.5px] font-bold text-amber-900">Dijamin PT Jasa Raharja</p>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
                UU 34/1964 · PP 18/1965
              </span>
            </div>

            {/* Plafon stat pills */}
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {([
                ["Rp 20 jt", "Biaya perawatan luka"],
                ["Rp 50 jt", "Meninggal / cacat tetap"],
              ] as [string, string][]).map(([val, cap]) => (
                <div key={cap} className="rounded-xl border border-amber-100 bg-white/70 px-3 py-2">
                  <p className="text-[14px] font-bold text-amber-700">{val}</p>
                  <p className="text-[9px] leading-tight text-amber-600/80">{cap}</p>
                </div>
              ))}
            </div>

            <p className="mt-2.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-amber-700">
              <Info size={11} className="mt-0.5 shrink-0" />
              Klaim berjalan <span className="font-semibold">paralel</span> dengan perawatan — Laporan Polisi <span className="font-semibold">bukan syarat mutlak</span> untuk memulai klaim.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form dua kolom ── */}
      <div className="grid items-start gap-3 lg:grid-cols-2">
      {/* Kolom kiri ── Laporan Kepolisian ── */}
      <SectionCard icon={Landmark} title="Laporan Kepolisian">
        <div>
          <p className={lbl}>Status Laporan Polisi (LP)</p>
          <ChipRow options={lpStatuses} config={STATUS_LP_CONFIG} value={draft.statusLP} onChange={(v) => setDraft((d) => ({ ...d, statusLP: v }))} />
        </div>

        {/* Tip when LP missing */}
        <AnimatePresence>
          {lpMissing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }} className="overflow-hidden"
            >
              <div className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 p-2.5">
                <AlertCircle size={12} className="mt-0.5 shrink-0 text-sky-500" />
                <p className="text-[9.5px] leading-relaxed text-sky-700">
                  LP belum ada? Isi <span className="font-semibold">Kronologi Kejadian</span> di bawah sebagai dokumen pengganti sementara. Klaim tetap dapat diproses untuk kasus ringan–sedang.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LP fields — only when LP ada */}
        <AnimatePresence>
          {draft.statusLP === "ada" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }} className="overflow-hidden"
            >
              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <div>
                  <p className={lbl}>Nomor LP</p>
                  <input className={inp} placeholder="LP/XXXX/XX/XXXX/POLDA" value={draft.noLapPol} onChange={(e) => setDraft((d) => ({ ...d, noLapPol: e.target.value }))} />
                </div>
                <div>
                  <p className={lbl}>Satuan Kepolisian</p>
                  <input className={inp} placeholder="Polres / Polsek…" value={draft.satuanPolisi} onChange={(e) => setDraft((d) => ({ ...d, satuanPolisi: e.target.value }))} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <p className={lbl}><Route size={10} /> Mekanisme Trauma</p>
          <Select
            value={draft.mekanismeTrauma}
            onChange={(v) => setDraft((d) => ({ ...d, mekanismeTrauma: v }))}
            options={[...MEKANISME_KLL]}
            placeholder="Pilih mekanisme trauma…"
          />
        </div>
      </SectionCard>

      {/* Kolom kanan ── Penjamin + Koordinasi JR ── */}
      <div className="space-y-3">
      <SectionCard icon={ShieldCheck} title="Penjamin" accent="amber">
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white">
            <ShieldCheck size={12} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-amber-800">Jasa Raharja</p>
            <p className="text-[9px] text-amber-600">Penjamin utama · otomatis</p>
          </div>
          <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-amber-600 ring-1 ring-amber-200">Primer</span>
        </div>

        <div>
          <p className={lbl}>Penjamin Lanjutan <span className="font-normal normal-case text-slate-300">— setelah plafon JR habis</span></p>
          <Select
            value={draft.penjaminLanjutan}
            onChange={(v) => setDraft((d) => ({ ...d, penjaminLanjutan: v }))}
            options={[
              { value: "",         label: "Tidak Ada / Belum Diketahui" },
              { value: "bpjs",     label: "BPJS Kesehatan" },
              { value: "umum",     label: "Umum / Mandiri" },
              { value: "asuransi", label: "Asuransi Swasta" },
            ]}
            placeholder="Pilih penjamin lanjutan…"
          />
        </div>
      </SectionCard>

      {/* ── Koordinasi Jasa Raharja (stepper) ── */}
      <SectionCard icon={Handshake} title="Koordinasi Jasa Raharja" accent="amber">
        <StatusStepper steps={jrStatuses} config={STATUS_JR_CONFIG} value={draft.statusKoordinasiJR} onChange={(v) => setDraft((d) => ({ ...d, statusKoordinasiJR: v }))} />
      </SectionCard>
      </div>
      </div>

      {/* ── Kendaraan terlibat (lebar penuh) ── */}
      <SectionCard
        icon={Car}
        title="Kendaraan Terlibat"
        right={
          <button
            type="button"
            onClick={addKendaraan}
            className="flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-[10px] font-bold text-white transition hover:bg-sky-700 active:scale-95"
          >
            <Plus size={11} /> Tambah
          </button>
        }
      >
        {draft.kendaraan.length === 0 ? (
          <button
            type="button"
            onClick={addKendaraan}
            className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 py-6 text-center transition hover:border-sky-300 hover:bg-sky-50/40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <Car size={16} className="text-slate-400" />
            </span>
            <p className="text-[10.5px] font-semibold text-slate-500">Belum ada kendaraan</p>
            <p className="text-[9px] text-slate-400">Klik untuk menambahkan kendaraan terlibat</p>
          </button>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {draft.kendaraan.map((k, i) => (
                <KendaraanCard key={i} item={k} index={i} onUpdate={updateKendaraan} onRemove={removeKendaraan} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
