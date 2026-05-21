"use client";

import { ShieldCheck, MapPin, FileText, BadgeCheck } from "lucide-react";
import type { PenjaminRecord, BPJSConfig, TipeFaskesBPJS } from "@/lib/master/penjaminStore";
import { TIPE_FASKES_BPJS_LIST } from "../penjaminShared";
import { Field, TextInput, Select, SectionGroup } from "./FormPrimitives";

interface Props {
  draft: PenjaminRecord;
  onPatch: (p: Partial<PenjaminRecord>) => void;
}

const REGIONAL_DESC: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: "Jawa, Bali, Sumut",
  2: "Sumbar, Riau, Sumsel, Lampung",
  3: "Aceh, Kalbar, Kalsel, Kalteng",
  4: "Sulut, Sulteng, Sulteng, Maluku",
  5: "Papua, NTT, NTB, Maluku Utara",
};

const FASKES_DESC: Record<TipeFaskesBPJS, string> = {
  TKP:   "Tingkat Kerja Sama Pertama (mis. Klinik / Puskesmas)",
  FKTP:  "Fasilitas Kesehatan Tingkat Pertama",
  FKRTL: "Fasilitas Kesehatan Rujukan Tingkat Lanjutan (RS)",
};

function emptyBPJSConfig(): BPJSConfig {
  return {
    kodeFaskes: "",
    regional: 1,
    noPKS: "",
    tipeFaskes: "FKRTL",
  };
}

export default function BPJSPane({ draft, onPatch }: Props) {
  const bpjs = draft.bpjsConfig;

  const patchBPJS = (p: Partial<BPJSConfig>) => {
    if (!bpjs) return;
    onPatch({ bpjsConfig: { ...bpjs, ...p } });
  };

  if (!bpjs) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-6 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
          <ShieldCheck size={20} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">Belum ada konfigurasi BPJS</p>
          <p className="mt-1 max-w-md text-xs text-emerald-700/80">
            Aktifkan konfigurasi BPJS untuk mengelola kode faskes, regional, dan kredensialing FKRTL.
          </p>
        </div>
        <button
          onClick={() => onPatch({ bpjsConfig: emptyBPJSConfig() })}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <ShieldCheck size={12} /> Aktifkan
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">

      {/* ── Form BPJS ──────────────────────────────────────── */}
      <div className="space-y-4">

        <SectionGroup
          title="Identitas Faskes BPJS"
          icon={BadgeCheck}
          accent={{ bg: "bg-emerald-50", text: "text-emerald-600" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kode Faskes" required hint="format 8 karakter">
              <TextInput
                value={bpjs.kodeFaskes}
                onChange={(v) => patchBPJS({ kodeFaskes: v.toUpperCase() })}
                placeholder="0001R001"
                maxLength={10}
                mono
              />
            </Field>

            <Field label="Tipe Faskes">
              <Select<TipeFaskesBPJS>
                value={bpjs.tipeFaskes}
                onChange={(v) => patchBPJS({ tipeFaskes: v })}
                options={TIPE_FASKES_BPJS_LIST.map((t) => ({ value: t, label: t }))}
              />
              <p className="mt-1 text-[10px] text-slate-500">{FASKES_DESC[bpjs.tipeFaskes]}</p>
            </Field>

            <Field label="Regional" className="col-span-2">
              <div className="flex flex-wrap gap-1">
                {([1, 2, 3, 4, 5] as const).map((r) => {
                  const active = bpjs.regional === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => patchBPJS({ regional: r })}
                      className={
                        active
                          ? "rounded-lg border border-emerald-300 bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white"
                          : "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      }
                    >
                      Reg {r}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                <MapPin size={9} className="mb-0.5 mr-0.5 inline" />
                {REGIONAL_DESC[bpjs.regional]}
              </p>
            </Field>
          </div>
        </SectionGroup>

        <SectionGroup
          title="Kontrak Kerja Sama BPJS"
          icon={FileText}
          accent={{ bg: "bg-sky-50", text: "text-sky-600" }}
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nomor PKS BPJS" className="col-span-2">
              <TextInput
                value={bpjs.noPKS}
                onChange={(v) => patchBPJS({ noPKS: v })}
                placeholder="0123/PKS-BPJS/RS/2024"
                mono
              />
            </Field>

            <Field label="Tanggal Kredensialing" hint="opsional" className="col-span-2">
              <input
                type="date"
                value={bpjs.tanggalKredensialing ?? ""}
                onChange={(e) => patchBPJS({ tanggalKredensialing: e.target.value || undefined })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </Field>
          </div>
        </SectionGroup>
      </div>

      {/* ── Info Panel ─────────────────────────────────────── */}
      <aside className="space-y-3">
        <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <ShieldCheck size={14} className="text-emerald-600" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-800">
              Identitas BPJS RS
            </p>
          </div>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg bg-white px-2.5 py-2 ring-1 ring-emerald-100">
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70">Kode Faskes</p>
              <p className="font-mono text-sm font-black text-emerald-800">
                {bpjs.kodeFaskes || "—"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-emerald-100">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70">Tipe</p>
                <p className="text-[11px] font-bold text-slate-800">{bpjs.tipeFaskes}</p>
              </div>
              <div className="rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-emerald-100">
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600/70">Regional</p>
                <p className="text-[11px] font-bold text-slate-800">Wilayah {bpjs.regional}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-[10px] leading-relaxed text-slate-600 ring-1 ring-slate-200">
          <p className="font-semibold text-slate-700">Catatan:</p>
          <p className="mt-1">
            Kode faskes BPJS mengikuti format <span className="font-mono">XXXXR000</span> — 4 digit
            kode RS + R001 untuk FKRTL utama. Konfigurasi ini dipakai saat klaim INA-CBG
            dan eligibility check.
          </p>
        </div>

        <button
          onClick={() => onPatch({ bpjsConfig: undefined })}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          Nonaktifkan Konfigurasi
        </button>
      </aside>
    </div>
  );
}
