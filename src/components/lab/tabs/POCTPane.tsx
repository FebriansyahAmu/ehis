"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Activity, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { type LabOrder, FLAG_CFG, autoFlag } from "../labShared";
import {
  type POCTTestType, type POCTDevice, type POCTEntry,
  POCT_CATALOG, POCT_KATEGORI_BADGE, getPOCTEntries, addPOCTEntry,
} from "../poct/poctShared";

interface Props { order: LabOrder }

const TEST_TYPES = Object.keys(POCT_CATALOG) as POCTTestType[];

// ── Entry Card ────────────────────────────────────────────

function EntryCard({ entry }: { entry: POCTEntry }) {
  const flagCfg = entry.flag ? FLAG_CFG[entry.flag] : null;
  const cfg     = POCT_CATALOG[entry.testType];
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-xl border p-3 transition-colors",
        entry.flag === "C" ? "border-rose-200 bg-rose-50" :
        entry.flag === "H" ? "border-amber-100 bg-amber-50/50" :
        entry.flag === "L" ? "border-sky-100 bg-sky-50/50" :
        "border-slate-200 bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[12px] font-bold text-slate-800">{cfg.nama}</p>
            {cfg.isCito && (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">CITO</span>
            )}
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-bold", POCT_KATEGORI_BADGE[cfg.kategori])}>
              {cfg.kategori}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">{entry.device} · {entry.lokasi}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={cn("text-base font-extrabold", flagCfg?.cls ?? "text-slate-600")}>
            {entry.nilai}
            <span className="ml-0.5 text-[10px] font-normal text-slate-400">{entry.satuan}</span>
          </p>
          {entry.flag && (
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              entry.flag === "C" ? "bg-rose-100 text-rose-700" :
              entry.flag === "H" ? "bg-amber-100 text-amber-700" :
              entry.flag === "L" ? "bg-sky-100 text-sky-700" :
              "bg-emerald-50 text-emerald-700",
            )}>
              {flagCfg?.label}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
        <span>Pukul {entry.waktu} · {entry.petugas}</span>
        {entry.catatan && <span className="text-slate-500 italic">"{entry.catatan}"</span>}
      </div>
      {entry.flag === "C" && (
        <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-100 px-2.5 py-1.5">
          <AlertTriangle size={11} className="text-rose-600 shrink-0" />
          <p className="text-[10px] font-semibold text-rose-700">Nilai kritis — wajib konfirmasi ke dokter &lt; 30 menit</p>
        </div>
      )}
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function POCTPane({ order }: Props) {
  const [entries, setEntries] = useState<POCTEntry[]>(() => getPOCTEntries(order.id));

  const [testType,  setTestType]  = useState<POCTTestType>("GDS");
  const [device,    setDevice]    = useState<POCTDevice | "">("");
  const [nilai,     setNilai]     = useState("");
  const [petugas,   setPetugas]   = useState("");
  const [lokasi,    setLokasi]    = useState("");
  const [catatan,   setCatatan]   = useState("");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const cfg      = POCT_CATALOG[testType];
  const liveFlag = useMemo(
    () => nilai ? autoFlag(nilai, cfg.nilaiMin, cfg.nilaiMax, cfg.criticalLow, cfg.criticalHigh) : undefined,
    [nilai, cfg],
  );
  const canSubmit = nilai.trim() && petugas.trim() && lokasi.trim() && device;

  function handleAdd() {
    if (!canSubmit || !device) return;
    setSaving(true);
    setTimeout(() => {
      const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const entry = addPOCTEntry(order.id, {
        testType, device, nilai, satuan: cfg.satuan, waktu: now, petugas, lokasi, catatan: catatan || undefined,
      });
      setEntries((prev) => [entry, ...prev]);
      setNilai(""); setCatatan(""); setSaved(true);
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }, 400);
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400";
  const labelCls = "block text-[11px] font-semibold text-slate-500 mb-1";

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_280px]">

      {/* Left — Entry form */}
      <div className="space-y-4">

        <div className="flex items-center gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5">
          <Activity size={15} className="text-sky-600 shrink-0" />
          <div>
            <p className="text-[12px] font-bold text-sky-800">POCT — Point of Care Testing</p>
            <p className="text-[10px] text-sky-600">Pemeriksaan bedside · hasil langsung tanpa kirim ke lab · PMK 43/2013</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Tambah Hasil POCT</p>

          {/* Test type */}
          <div>
            <label className={labelCls}>Jenis Pemeriksaan</label>
            <div className="flex flex-wrap gap-1.5">
              {TEST_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTestType(t); setDevice(""); setNilai(""); }}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
                    testType === t
                      ? "bg-sky-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-sky-50 hover:text-sky-700",
                  )}
                >
                  {POCT_CATALOG[t].nama.split(" ").slice(0, 3).join(" ")}
                  {POCT_CATALOG[t].isCito && <span className="ml-1 text-[8px] text-rose-300">CITO</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Device */}
          <div>
            <label className={labelCls}>Alat / Device <span className="text-rose-400">*</span></label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value as POCTDevice)}
              className={inputCls}
            >
              <option value="">-- Pilih alat --</option>
              {cfg.devices.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Nilai */}
          <div>
            <label className={labelCls}>Hasil / Nilai <span className="text-rose-400">*</span></label>
            <div className="flex items-center gap-2">
              <input
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                placeholder={cfg.satuan === "Kualitatif" ? "Positif / Negatif" : "Angka"}
                className={cn(
                  inputCls, "flex-1",
                  liveFlag === "C" ? "border-rose-300 ring-1 ring-rose-200" :
                  liveFlag === "H" ? "border-amber-200" :
                  liveFlag === "L" ? "border-sky-200" : "",
                )}
              />
              <span className="shrink-0 text-[12px] text-slate-400">{cfg.satuan}</span>
              {liveFlag && (
                <span className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                  liveFlag === "C" ? "bg-rose-100 text-rose-700" :
                  liveFlag === "H" ? "bg-amber-100 text-amber-700" :
                  liveFlag === "L" ? "bg-sky-100 text-sky-700" :
                  "bg-emerald-50 text-emerald-700",
                )}>
                  {FLAG_CFG[liveFlag].label}
                </span>
              )}
            </div>
            {cfg.nilaiMin !== undefined && (
              <p className="mt-0.5 text-[10px] text-slate-400">Rujukan: {cfg.nilaiMin}–{cfg.nilaiMax} {cfg.satuan}</p>
            )}
          </div>

          {/* Petugas + lokasi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Petugas <span className="text-rose-400">*</span></label>
              <input value={petugas} onChange={(e) => setPetugas(e.target.value)} placeholder="Nama perawat/analis" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Lokasi <span className="text-rose-400">*</span></label>
              <input value={lokasi} onChange={(e) => setLokasi(e.target.value)} placeholder="Bangsal / Bedside" className={inputCls} />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className={labelCls}>Catatan (opsional)</label>
            <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Kondisi pasien, tindak lanjut…" className={inputCls} />
          </div>

          {liveFlag === "C" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3"
            >
              <AlertTriangle size={14} className="mt-0.5 text-rose-600 shrink-0" />
              <div className="text-[11px]">
                <p className="font-bold text-rose-800">Nilai Kritis Terdeteksi</p>
                <p className="text-rose-700">Wajib konfirmasi ke dokter &lt; 30 menit setelah input · ISO 15189 §5.6.2</p>
              </div>
            </motion.div>
          )}

          <button
            onClick={handleAdd}
            disabled={!canSubmit || saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-40"
          >
            {saving ? "Menyimpan…" : saved ? (
              <><CheckCircle2 size={15} /> Tersimpan!</>
            ) : (
              <><Plus size={15} /> Simpan Hasil POCT</>
            )}
          </button>
        </div>

        {/* Entries list */}
        <div className="space-y-2">
          <AnimatePresence>
            {entries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-10 text-center">
                <Zap size={20} className="text-slate-300" />
                <p className="text-[11px] text-slate-400">Belum ada hasil POCT untuk order ini</p>
              </div>
            ) : (
              entries.map((e) => <EntryCard key={e.id} entry={e} />)
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right — Guide */}
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Panduan POCT</h4>
          <div className="space-y-2.5">
            {[
              { n: "1", text: "Verifikasi identitas pasien sebelum pemeriksaan (SKP 1)" },
              { n: "2", text: "Gunakan alat yang terkalibrasi dan dalam batas kontrol QC" },
              { n: "3", text: "Input hasil segera setelah pemeriksaan" },
              { n: "4", text: "Nilai kritis harus dilaporkan ke DPJP ≤ 30 menit" },
              { n: "5", text: "Hasil POCT tidak menggantikan pemeriksaan lab definitif" },
            ].map(({ n, text }) => (
              <div key={n} className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-700">{n}</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[9px] text-slate-400">PMK 43/2013 · ISO 15189:2022 §5.7</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Kategori Tersedia</p>
          <div className="space-y-1">
            {(["Metabolik", "Kardiak", "Respirasi", "Koagulasi", "Inflamasi", "Skrining"] as const).map((k) => (
              <div key={k} className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", POCT_KATEGORI_BADGE[k])}>{k}</span>
                <span className="text-[10px] text-slate-500">
                  {TEST_TYPES.filter((t) => POCT_CATALOG[t].kategori === k).length} tes
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="px-1 text-[10px] text-slate-400">
          Hasil POCT direkam dalam rekam medis elektronik sebagai data penunjang bedside. Kalibrasi alat wajib terdokumentasi per shift.
        </p>
      </div>
    </div>
  );
}
