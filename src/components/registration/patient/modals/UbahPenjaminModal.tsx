"use client";

import { useState } from "react";
import { Shield, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PenjaminData, TipePenjamin } from "@/lib/data";
import { ModalShell } from "../primitives";
import { PENJAMIN_CFG } from "../config";

type PjSection = "jenis" | "detail";

const SECTIONS: {
  id: PjSection;
  label: string;
  icon: typeof Shield;
  desc: string;
  iconBg: string;
  iconText: string;
}[] = [
  {
    id: "jenis",
    label: "Jenis Penjamin",
    icon: Shield,
    desc: "Pilih tipe penjamin",
    iconBg: "bg-indigo-100",
    iconText: "text-indigo-600",
  },
  {
    id: "detail",
    label: "Detail & Kelas",
    icon: FileText,
    desc: "No. BPJS, polis, kelas",
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
  },
];

const OPTS: { value: TipePenjamin; label: string; desc: string }[] = [
  { value: "Umum", label: "Umum / Mandiri", desc: "Bayar sendiri" },
  { value: "BPJS_Non_PBI", label: "BPJS Non-PBI", desc: "Peserta aktif" },
  { value: "BPJS_PBI", label: "BPJS PBI", desc: "Penerima bantuan" },
  { value: "Asuransi", label: "Asuransi Swasta", desc: "Asuransi komersial" },
  { value: "Jamkesda", label: "Jamkesda", desc: "Jaminan daerah" },
];

export function UbahPenjaminModal({
  current,
  onClose,
  onSave,
}: {
  current: PenjaminData;
  onClose: () => void;
  onSave: (p: PenjaminData) => void;
}) {
  const [d, setD] = useState<PenjaminData>({ ...current });
  const [activeSection, setActiveSection] = useState<PjSection>("jenis");

  const isBpjs = d.tipe === "BPJS_Non_PBI" || d.tipe === "BPJS_PBI";
  const isAsuransi = d.tipe === "Asuransi";
  const hasDetail = isBpjs || isAsuransi;
  const pjCfg = PENJAMIN_CFG[d.tipe];
  const sectionIdx = SECTIONS.findIndex((s) => s.id === activeSection);

  return (
    <ModalShell
      title="Ubah Penjamin"
      subtitle="Jenis dan informasi penjaminan pasien"
      onClose={onClose}
      size="lg"
    >
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 380 }}>
        {/* Left sidebar */}
        <div className="flex w-48 shrink-0 flex-col border-r border-slate-100 bg-slate-50/80">
          <div className="flex flex-col items-center gap-2.5 border-b border-slate-100 px-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 shadow-sm ring-4 ring-white">
              <Shield size={22} className="text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Penjamin Aktif</p>
              <span className={cn("mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold", pjCfg.badge)}>
                {pjCfg.label}
              </span>
              {d.nomor && (
                <p className="mt-1 break-all font-mono text-[9px] text-slate-400">{d.nomor}</p>
              )}
            </div>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {SECTIONS.map((s) => {
              const SIcon = s.icon;
              const isActive = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-xl p-3 text-left transition-all duration-150",
                    isActive
                      ? "bg-indigo-600 shadow-sm shadow-indigo-200 text-white"
                      : "text-slate-500 hover:bg-white hover:shadow-xs",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg mt-0.5 transition",
                      isActive ? "bg-white/20" : s.iconBg,
                    )}
                  >
                    <SIcon size={12} className={isActive ? "text-white" : s.iconText} />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-[11px] font-bold leading-tight", isActive ? "text-white" : "text-slate-700")}>
                      {s.label}
                    </p>
                    <p className={cn("mt-0.5 text-[10px] leading-tight", isActive ? "text-white/60" : "text-slate-400")}>
                      {s.desc}
                    </p>
                  </div>
                  {isActive && <span className="ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto flex items-center justify-center gap-1.5 px-4 pb-5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "h-1.5 cursor-pointer rounded-full transition-all duration-200",
                  activeSection === s.id ? "w-5 bg-indigo-500" : "w-1.5 bg-slate-300 hover:bg-slate-400",
                )}
              />
            ))}
            <span className="ml-1 text-[10px] text-slate-400">{sectionIdx + 1}/{SECTIONS.length}</span>
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 overflow-y-auto">
          {activeSection === "jenis" && (
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100">
                  <Shield size={13} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Jenis Penjamin</p>
                  <p className="text-[10px] text-slate-400">Pilih jenis penjaminan pasien</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {OPTS.map((o) => {
                  const isSelected = d.tipe === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => setD((x) => ({ ...x, tipe: o.value }))}
                      className={cn(
                        "cursor-pointer rounded-xl border-2 p-3 text-left transition-all duration-150",
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 shadow-sm shadow-indigo-100"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <p className={cn("text-[11px] font-bold", isSelected ? "text-indigo-700" : "text-slate-700")}>
                        {o.label}
                      </p>
                      <p className={cn("mt-0.5 text-[10px]", isSelected ? "text-indigo-500" : "text-slate-400")}>
                        {o.desc}
                      </p>
                      {isSelected && (
                        <span className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-indigo-500">
                          <Check size={9} /> Dipilih
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === "detail" && (
            <div className="p-5">
              <div className="mb-4 flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
                  <FileText size={13} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Detail &amp; Kelas</p>
                  <p className="text-[10px] text-slate-400">Informasi detail penjaminan</p>
                </div>
              </div>

              {!hasDetail && (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
                    <Shield size={18} />
                  </span>
                  <p className="text-xs text-slate-400">
                    Penjamin <strong className="text-slate-600">{pjCfg.label}</strong> tidak memerlukan data tambahan.
                  </p>
                </div>
              )}

              {isBpjs && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. BPJS</label>
                    <input
                      value={d.nomor ?? ""}
                      onChange={(e) => setD((x) => ({ ...x, nomor: e.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Kelas Perawatan</p>
                    <div className="flex gap-2">
                      {(["1", "2", "3"] as const).map((k) => (
                        <button
                          key={k}
                          onClick={() => setD((x) => ({ ...x, kelas: k }))}
                          className={cn(
                            "flex-1 cursor-pointer rounded-lg border-2 py-2.5 text-xs font-bold transition",
                            d.kelas === k
                              ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                          )}
                        >
                          Kelas {k}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Berlaku s/d</label>
                    <input
                      value={d.berlakuSampai ?? ""}
                      onChange={(e) => setD((x) => ({ ...x, berlakuSampai: e.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              )}

              {isAsuransi && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Asuransi</label>
                    <input
                      value={d.nama ?? ""}
                      onChange={(e) => setD((x) => ({ ...x, nama: e.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. Polis</label>
                    <input
                      value={d.noPolis ?? ""}
                      onChange={(e) => setD((x) => ({ ...x, noPolis: e.target.value }))}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t border-slate-100 bg-slate-50/80 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <button
            disabled={sectionIdx === 0}
            onClick={() => setActiveSection(SECTIONS[sectionIdx - 1].id)}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-30"
          >
            ← Sebelumnya
          </button>
          <button
            disabled={sectionIdx === SECTIONS.length - 1}
            onClick={() => setActiveSection(SECTIONS[sectionIdx + 1].id)}
            className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-50 disabled:cursor-default disabled:opacity-30"
          >
            Selanjutnya →
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={() => { onSave(d); onClose(); }}
            className="cursor-pointer rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700"
          >
            Simpan Perubahan
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
