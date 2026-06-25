"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { PENJAMIN_CFG } from "../../config";
import { BpjsPanel } from "@/components/registration/kunjungan/Tabs/sep/BpjsSearch";
import type { BpjsData, SepDraft } from "@/components/registration/kunjungan/Tabs/sep/sepTypes";
import {
  PENJAMIN_KATEGORI_OPTS, kategoriOf, isBpjs, inputCls, labelCls,
  type PenjaminForm, type PenjaminKategori,
} from "./config";

const KLS_MAP: Record<string, "1" | "2" | "3"> = { "Kelas I": "1", "Kelas II": "2", "Kelas III": "3" };

export function StepPenjamin({
  patient, penjamin, setPenjamin, bpjsData, setBpjsData, setSepDraft, prefilledNoKartu,
}: {
  patient: PatientMaster;
  penjamin: PenjaminForm;
  setPenjamin: React.Dispatch<React.SetStateAction<PenjaminForm>>;
  bpjsData: BpjsData | null;
  setBpjsData: React.Dispatch<React.SetStateAction<BpjsData | null>>;
  setSepDraft: React.Dispatch<React.SetStateAction<SepDraft>>;
  /** No. Kartu BPJS PENUH (un-mask) dari DB → prefill pencarian kepesertaan. */
  prefilledNoKartu?: string;
}) {
  const set = <K extends keyof PenjaminForm>(k: K, v: PenjaminForm[K]) => setPenjamin((p) => ({ ...p, [k]: v }));
  const kategori = kategoriOf(penjamin.tipe);
  const fromRM = kategori === kategoriOf(patient.penjamin.tipe);

  function pickKategori(k: PenjaminKategori) {
    // Field detail (nomor/kelas/noPolis) hanya dipertahankan dari RM bila kategori RM sama;
    // jika ganti kategori → kosongkan agar tak ada data sisa (mis. No. Kartu BPJS terbawa ke Umum).
    const rmMatch = k === kategoriOf(patient.penjamin.tipe);
    const nomor = rmMatch ? (patient.penjamin.nomor ?? "") : "";
    const kelas = (rmMatch ? patient.penjamin.kelas : "") as PenjaminForm["kelas"];
    const noPolis = rmMatch ? (patient.penjamin.noPolis ?? "") : "";
    if (k === "BPJS") {
      // Pertahankan PBI/Non-PBI dari RM bila ada; default Non-PBI (dipertegas saat verifikasi).
      const t = isBpjs(patient.penjamin.tipe) ? patient.penjamin.tipe : "BPJS_Non_PBI";
      setPenjamin((p) => ({ ...p, tipe: t, nama: PENJAMIN_CFG[t].label, nomor, kelas, noPolis: "" }));
    } else if (k === "Asuransi") {
      // Asuransi: No. Kartu + No. Polis (kelas = konsep hak BPJS, tak relevan → kosong).
      setPenjamin((p) => ({ ...p, tipe: "Asuransi", nama: rmMatch ? p.nama : PENJAMIN_CFG.Asuransi.label, nomor, kelas: "", noPolis }));
      setBpjsData(null);
    } else {
      // Umum/Mandiri: tanpa kartu/kelas/polis.
      setPenjamin((p) => ({ ...p, tipe: "Umum", nama: PENJAMIN_CFG.Umum.label, nomor: "", kelas: "", noPolis: "" }));
      setBpjsData(null);
    }
  }

  function onSelectBpjs(d: BpjsData) {
    const kls = KLS_MAP[d.kelas] ?? "2";
    // Pertegas PBI/Non-PBI dari hasil verifikasi kepesertaan.
    const tipe = d.jenis === "PBI" ? "BPJS_PBI" : "BPJS_Non_PBI";
    setBpjsData(d);
    setPenjamin((p) => ({ ...p, tipe, nama: PENJAMIN_CFG[tipe].label, nomor: d.noKartu, kelas: kls }));
    setSepDraft((s) => ({
      ...s,
      noKartu: d.noKartu, namaPeserta: d.nama,
      klsRawatHak: kls, jenisPeserta: d.jenis,
      noMR: patient.noRM,
    }));
  }

  return (
    <div className="space-y-5">
      {/* Pilih tipe penjamin */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Jenis Penjamin</p>
          {fromRM && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
              Sesuai rekam medis
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {PENJAMIN_KATEGORI_OPTS.map((opt) => {
            const isActive = kategori === opt.value;
            const cfg = PENJAMIN_CFG[opt.tipe];
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => pickKategori(opt.value)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-[11px] font-semibold transition",
                  isActive
                    ? cn(cfg.bg, cfg.border, "ring-2 ring-offset-1 ring-slate-200")
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <Shield size={13} className={isActive ? "text-slate-600" : "text-slate-300"} />
                <span className={isActive ? "text-slate-800" : ""}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional per tipe */}
      <AnimatePresence mode="wait">
        <motion.div
          key={isBpjs(penjamin.tipe) ? "bpjs" : penjamin.tipe}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {isBpjs(penjamin.tipe) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-1 rounded-full bg-sky-400" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Verifikasi Kepesertaan</p>
                {bpjsData && (
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-600 ring-1 ring-emerald-200">
                    <CheckCircle2 size={10} /> Terverifikasi
                  </span>
                )}
              </div>
              <BpjsPanel
                // Remount saat No. Kartu penuh dari DB tiba (async) → field pencarian ter-seed
                // dengan nomor PENUH, bukan masked. Operator tinggal "Cari Kepesertaan".
                key={prefilledNoKartu ? "prefilled" : "default"}
                defaultValue={prefilledNoKartu || patient.penjamin.nomor}
                patientName={patient.name}
                onSelect={onSelectBpjs}
                onDeselect={() => setBpjsData(null)}
              />
              {!bpjsData && (
                <p className="flex items-center gap-1.5 text-[10px] text-amber-600">
                  <Info size={11} /> Cari & pilih kepesertaan untuk melanjutkan ke penerbitan SEP.
                </p>
              )}
            </div>
          )}

          {(penjamin.tipe === "Asuransi" || penjamin.tipe === "Jamkesda") && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div>
                <label className={labelCls}>Nama Penjamin</label>
                <input
                  type="text"
                  value={penjamin.nama}
                  onChange={(e) => set("nama", e.target.value)}
                  placeholder={penjamin.tipe === "Asuransi" ? "Mis. Mandiri Inhealth" : "Mis. Jamkesda Kota"}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>No. Kartu / Anggota</label>
                  <input
                    type="text"
                    value={penjamin.nomor}
                    onChange={(e) => set("nomor", e.target.value)}
                    placeholder="Nomor kepesertaan"
                    className={cn(inputCls, "font-mono")}
                  />
                </div>
                {penjamin.tipe === "Asuransi" && (
                  <div>
                    <label className={labelCls}>No. Polis</label>
                    <input
                      type="text"
                      value={penjamin.noPolis}
                      onChange={(e) => set("noPolis", e.target.value)}
                      placeholder="Nomor polis"
                      className={cn(inputCls, "font-mono")}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {penjamin.tipe === "Umum" && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Shield size={16} className="shrink-0 text-slate-400" />
              <div>
                <p className="text-xs font-bold text-slate-700">Pembayaran Umum / Mandiri</p>
                <p className="text-[10px] text-slate-400">Tidak memerlukan SEP. Tagihan dibebankan ke pasien.</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
