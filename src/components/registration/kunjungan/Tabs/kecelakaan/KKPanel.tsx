"use client";

import { Building2, Info } from "lucide-react";
import type { KecelakaanDraft } from "./kecelakaanTypes";
import { JENIS_PEKERJAAN, MEKANISME_KK } from "./kecelakaanTypes";

// ─── Field styles ─────────────────────────────────────────────

const sm    = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 placeholder:text-slate-300 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition";
const smSel = "w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 transition cursor-pointer";
const lbl   = "mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400";

// ─── KKPanel ──────────────────────────────────────────────────

export function KKPanel({
  draft,
  setDraft,
}: {
  draft:    KecelakaanDraft;
  setDraft: React.Dispatch<React.SetStateAction<KecelakaanDraft>>;
}) {
  return (
    <div className="space-y-3">
      {/* BPJS Naker info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
        <Info size={13} className="mt-0.5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-[11px] font-bold text-emerald-800">
            Ditanggung BPJS Ketenagakerjaan — JKK
          </p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-emerald-700">
            Kecelakaan kerja dan penyakit akibat kerja dijamin BPJS Ketenagakerjaan sesuai PP No. 44/2015.
            Pastikan peserta aktif dan No. KPJ tersedia sebelum pengajuan klaim.
          </p>
        </div>
      </div>

      {/* Data Perusahaan */}
      <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <div className="flex items-center gap-2">
          <Building2 size={11} className="text-slate-400" />
          <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
            Data Perusahaan
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <p className={lbl}>Nama Perusahaan Pemberi Kerja</p>
            <input
              className={sm}
              placeholder="PT / CV / UD / Perorangan..."
              value={draft.namaPerusahaan}
              onChange={e => setDraft(d => ({ ...d, namaPerusahaan: e.target.value }))}
            />
          </div>
          <div>
            <p className={lbl}>No. KPJ (Kartu Peserta)</p>
            <input
              className={sm}
              placeholder="Nomor peserta BPJS Naker"
              value={draft.noKpj}
              onChange={e => setDraft(d => ({ ...d, noKpj: e.target.value }))}
            />
          </div>
          <div>
            <p className={lbl}>Jenis Pekerjaan</p>
            <select
              className={smSel}
              value={draft.jenisPekerjaan}
              onChange={e => setDraft(d => ({ ...d, jenisPekerjaan: e.target.value }))}
            >
              <option value="">Pilih jenis pekerjaan...</option>
              {JENIS_PEKERJAAN.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <p className={lbl}>Lokasi / Area Kejadian (di Tempat Kerja)</p>
            <input
              className={sm}
              placeholder="Area produksi / divisi / lokasi proyek..."
              value={draft.lokasiKerja}
              onChange={e => setDraft(d => ({ ...d, lokasiKerja: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Mekanisme kecelakaan kerja */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
        <p className="mb-3 text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
          Mekanisme Kecelakaan Kerja
        </p>
        <div>
          <p className={lbl}>Jenis / Mekanisme</p>
          <select
            className={smSel}
            value={draft.mekanismeTrauma}
            onChange={e => setDraft(d => ({ ...d, mekanismeTrauma: e.target.value }))}
          >
            <option value="">Pilih mekanisme...</option>
            {MEKANISME_KK.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
