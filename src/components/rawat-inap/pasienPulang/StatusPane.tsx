"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawatInapPatientDetail } from "@/lib/data";
import {
  type PasienPulangData, type StatusKepulangan,
  STATUS_KEPULANGAN_CONFIG, STATUS_KEPULANGAN_LIST,
} from "./pasienPulangShared";

type Props = {
  data:     PasienPulangData;
  onChange: (d: PasienPulangData) => void;
  patient:  RawatInapPatientDetail;
};

function Field({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
      />
    </div>
  );
}

export default function StatusPane({ data, onChange, patient }: Props) {
  function set<K extends keyof PasienPulangData>(key: K, val: PasienPulangData[K]) {
    onChange({ ...data, [key]: val });
  }

  const cfg = data.status ? STATUS_KEPULANGAN_CONFIG[data.status] : null;

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Form ── */}
      <div className="min-w-0 flex-1 space-y-4">

        {/* Status selector */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status Kepulangan</p>
          <p className="mb-3 text-[11px] text-slate-400">Pilih satu status yang sesuai dengan kondisi kepulangan pasien</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {STATUS_KEPULANGAN_LIST.map(s => {
              const c       = STATUS_KEPULANGAN_CONFIG[s];
              const selected = data.status === s;
              return (
                <button
                  key={s}
                  onClick={() => set("status", s as StatusKepulangan)}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border-2 p-3 text-left transition-all duration-150",
                    selected ? c.sel : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  <span className={cn(
                    "mt-0.5 h-3 w-3 shrink-0 rounded-full",
                    selected ? c.dot : "bg-slate-300",
                  )} />
                  <div>
                    <p className={cn("text-xs font-bold", selected ? "" : "text-slate-700")}>{s}</p>
                    <p className={cn("mt-0.5 text-[10px]", selected ? "opacity-80" : "text-slate-400")}>{c.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* APS warning */}
          {data.status === "APS" && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 p-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange-500" />
              <div className="text-[11px] text-orange-800">
                <p className="font-semibold">Pulang APS memerlukan penandatanganan surat pernyataan</p>
                <p className="mt-0.5 opacity-80">Pastikan pasien / keluarga menandatangani surat pernyataan APS sebelum meninggalkan RS. Dokter harus mendokumentasikan kondisi saat pasien keluar dan risiko yang dijelaskan.</p>
              </div>
            </div>
          )}
        </div>

        {/* Tanggal & jam */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Waktu Kepulangan</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Pulang *" type="date" value={data.tanggalPulang} onChange={v => set("tanggalPulang", v)} />
            <Field label="Jam Pulang *"     type="time" value={data.jamPulang}     onChange={v => set("jamPulang", v)} />
          </div>
        </div>

        {/* DPJP & catatan */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Dokter & Kondisi Akhir</p>
          <div className="space-y-3">
            <Field
              label="Dokter yang Memulangkan *"
              value={data.dokterYangMemulangkan}
              onChange={v => set("dokterYangMemulangkan", v)}
              placeholder={patient.dpjp}
            />
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Catatan Kondisi Akhir
              </label>
              <textarea
                value={data.catatanKondisiAkhir}
                onChange={e => set("catatanKondisiAkhir", e.target.value)}
                rows={3}
                placeholder="Deskripsi singkat kondisi pasien saat pulang..."
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
              />
            </div>
          </div>
        </div>

      </div>

      {/* ── Right: Summary ── */}
      <div className="w-full shrink-0 xl:w-64">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Ringkasan Status</p>

          {cfg && data.status ? (
            <div className="space-y-3">
              <div className={cn("rounded-lg px-3 py-2.5 text-center", cfg.badge)}>
                <p className="text-xs font-bold">{data.status}</p>
                <p className="mt-0.5 text-[10px] opacity-80">{cfg.desc}</p>
              </div>
              {data.tanggalPulang && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tanggal Pulang</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {new Date(data.tanggalPulang).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    {data.jamPulang && ` · ${data.jamPulang} WIB`}
                  </p>
                </div>
              )}
              {data.dokterYangMemulangkan && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">DPJP</p>
                  <p className="text-xs font-semibold text-slate-700">{data.dokterYangMemulangkan}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
              <p className="text-xs text-slate-400">Belum ada status yang dipilih</p>
            </div>
          )}

          {/* Admission info */}
          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Info Rawat Inap</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {[
                ["Pasien",  patient.name],
                ["No. RM",  patient.noRM],
                ["Ruangan", `${patient.ruangan} / ${patient.noBed}`],
                ["Masuk",   patient.tglMasuk],
                ["DPJP",    patient.dpjp],
                ["Kelas",   patient.kelas.replace("_", " ")],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{lbl}</p>
                  <p className="text-[11px] text-slate-700">{val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
