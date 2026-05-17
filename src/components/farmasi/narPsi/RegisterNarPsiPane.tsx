"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, ShieldAlert, Package, TrendingDown, Plus,
  Printer, X, AlertTriangle, ChevronDown, ChevronUp,
  CalendarDays, User, FileText, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type NarPsiKategori, type RegisterEntry, type StokOpnameEntry,
  type NarPsiDrug,
  NARKOTIKA_DRUGS, PSIKOTROPIKA_DRUGS,
  REGISTER_MOCK, STOK_OPNAME_MOCK,
  getRegisterByDrug, calcCurrentSaldo,
  getMonthLabel, getAvailableMonths,
} from "./narPsiShared";

// ── Stat card ─────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, cls,
}: { icon: React.ReactNode; label: string; value: number | string; sub?: string; cls: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3", cls)}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold tabular-nums leading-none">{value}</p>
        <p className="mt-0.5 text-xs font-medium opacity-80">{label}</p>
        {sub && <p className="text-[10px] opacity-60">{sub}</p>}
      </div>
    </div>
  );
}

// ── Mutasi type badge ─────────────────────────────────────

function JenisBadge({ jenis }: { jenis: RegisterEntry["jenis"] }) {
  const cfg = {
    Masuk:  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    Keluar: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    Opname: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  }[jenis];
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", cfg)}>
      {jenis}
    </span>
  );
}

// ── Stok opname modal ─────────────────────────────────────

function StokOpnameModal({
  drugs, bulan, onClose, onSave,
}: {
  drugs: NarPsiDrug[];
  bulan: string;
  onClose: () => void;
  onSave: (entry: StokOpnameEntry) => void;
}) {
  const [selectedDrug, setSelectedDrug] = useState(drugs[0]?.nama ?? "");
  const [stokFisik,    setStokFisik]    = useState<number | "">(0);
  const [petugas,      setPetugas]      = useState("");
  const [catatan,      setCatatan]      = useState("");

  const stokSistem = useMemo(
    () => calcCurrentSaldo(selectedDrug, bulan),
    [selectedDrug, bulan],
  );
  const selisih = stokFisik !== "" ? (stokFisik as number) - stokSistem : 0;
  const valid   = selectedDrug && stokFisik !== "" && petugas.trim();

  function handleSave() {
    if (!valid) return;
    onSave({
      id:          `so-local-${Date.now()}`,
      tanggal:     new Date().toISOString().split("T")[0],
      namaObat:    selectedDrug,
      stokSistem,
      stokFisik:   stokFisik as number,
      selisih,
      petugas,
      catatan:     catatan || undefined,
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-bold text-slate-900">Stok Opname</h3>
            <p className="text-xs text-slate-400">{getMonthLabel(bulan)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Obat</label>
            <select
              value={selectedDrug}
              onChange={(e) => setSelectedDrug(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              {drugs.map((d) => <option key={d.id} value={d.nama}>{d.nama} {d.kekuatan}</option>)}
            </select>
          </div>

          <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold tabular-nums text-slate-700">{stokSistem}</p>
              <p className="text-[10px] text-slate-400">Stok Sistem</p>
            </div>
            <div className="w-px bg-slate-200" />
            <div className="flex-1 text-center">
              <p className={cn(
                "text-lg font-bold tabular-nums",
                selisih !== 0 ? "text-rose-600" : "text-emerald-600",
              )}>
                {selisih > 0 ? `+${selisih}` : selisih}
              </p>
              <p className="text-[10px] text-slate-400">Selisih</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Stok Fisik (hasil hitung)</label>
            <input
              type="number" min={0}
              value={stokFisik}
              onChange={(e) => setStokFisik(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {selisih !== 0 && stokFisik !== "" && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3"
            >
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose-600" />
              <p className="text-xs font-semibold text-rose-700">
                Selisih stok {selisih > 0 ? "lebih" : "kurang"} {Math.abs(selisih)} — wajib dilaporkan ke Kepala Instalasi Farmasi
              </p>
            </motion.div>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <User size={11} />Petugas Opname
            </label>
            <input
              type="text" value={petugas}
              onChange={(e) => setPetugas(e.target.value)}
              placeholder="Apt. Nama Lengkap, S.Farm"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Catatan <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <textarea
              rows={2} value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!valid}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-bold transition-all active:scale-95",
              valid ? "bg-sky-600 text-white hover:bg-sky-700 shadow-sm" : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            Simpan Opname
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Tambah mutasi modal ───────────────────────────────────

function TambahMutasiModal({
  drugs, bulan, kategori, onClose, onSave,
}: {
  drugs: NarPsiDrug[];
  bulan: string;
  kategori: NarPsiKategori;
  onClose: () => void;
  onSave: (entry: RegisterEntry) => void;
}) {
  const [namaObat,  setNamaObat]  = useState(drugs[0]?.nama ?? "");
  const [noRM,      setNoRM]      = useState("");
  const [namaPasien,setNamaPasien]= useState("");
  const [dokter,    setDokter]    = useState("");
  const [noResep,   setNoResep]   = useState("");
  const [jumlah,    setJumlah]    = useState<number | "">(1);
  const [pengambil, setPengambil] = useState("");
  const [catatan,   setCatatan]   = useState("");

  const drug     = drugs.find((d) => d.nama === namaObat);
  const curSaldo = calcCurrentSaldo(namaObat, bulan);
  const valid    = namaObat && jumlah !== "" && pengambil.trim() && noRM.trim();

  function handleSave() {
    if (!valid || !drug) return;
    const existing = getRegisterByDrug(namaObat, bulan);
    const noUrut = (existing.length > 0 ? existing[existing.length - 1].noUrut : 0) + 1;
    onSave({
      id:           `rn-local-${Date.now()}`,
      noUrut,
      tanggal:      new Date().toISOString().split("T")[0],
      jam:          new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      namaObat,
      kekuatan:     drug.kekuatan,
      noRM,
      namaPasien,
      dokter,
      noResep,
      jumlahKeluar: jumlah as number,
      jumlahMasuk:  0,
      saldo:        curSaldo - (jumlah as number),
      pengambil,
      keterangan:   catatan || undefined,
      jenis:        "Keluar",
      bulan,
      depo:         kategori === "Narkotika" ? "Apotek RI" : "Apotek RI",
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-bold text-slate-900">Tambah Pengeluaran {kategori}</h3>
            <p className="text-xs text-slate-400">{getMonthLabel(bulan)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Obat</label>
            <select
              value={namaObat}
              onChange={(e) => setNamaObat(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            >
              {drugs.map((d) => <option key={d.id} value={d.nama}>{d.nama} {d.kekuatan}</option>)}
            </select>
            <p className="mt-1 text-[10px] text-slate-400">Saldo saat ini: <span className="font-semibold text-slate-600">{curSaldo} {drug?.satuan}</span></p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">No. RM <span className="text-rose-500">*</span></label>
              <input
                type="text" value={noRM}
                onChange={(e) => setNoRM(e.target.value)}
                placeholder="RM-2025-XXX"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">No. Resep</label>
              <input
                type="text" value={noResep}
                onChange={(e) => setNoResep(e.target.value)}
                placeholder="RX/2025/XX/XXX"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Nama Pasien</label>
            <input
              type="text" value={namaPasien}
              onChange={(e) => setNamaPasien(e.target.value)}
              placeholder="Nama lengkap pasien"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Dokter Penulis Resep</label>
            <input
              type="text" value={dokter}
              onChange={(e) => setDokter(e.target.value)}
              placeholder="dr. Nama, Sp.XX"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Jumlah Keluar <span className="text-rose-500">*</span>
            </label>
            <input
              type="number" min={1}
              value={jumlah}
              onChange={(e) => setJumlah(e.target.value === "" ? "" : parseInt(e.target.value, 10))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <User size={11} />Nama Pengambil <span className="text-rose-500">*</span>
            </label>
            <input
              type="text" value={pengambil}
              onChange={(e) => setPengambil(e.target.value)}
              placeholder="Ns. Nama Perawat, S.Kep"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Keterangan <span className="font-normal text-slate-400">(opsional)</span>
            </label>
            <textarea
              rows={2} value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-5 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={!valid}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-bold transition-all active:scale-95",
              valid ? "bg-sky-600 text-white hover:bg-sky-700 shadow-sm" : "cursor-not-allowed bg-slate-100 text-slate-400",
            )}
          >
            Catat Pengeluaran
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Register table row ────────────────────────────────────

function RegisterRow({ entry, index }: { entry: RegisterEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <div
        className={cn(
          "grid grid-cols-[2rem_5rem_4rem_1fr_4rem_4rem_4rem] gap-x-3 items-center rounded-lg px-3 py-2 text-xs transition-colors",
          index % 2 === 0 ? "bg-white" : "bg-slate-50/60",
          "hover:bg-sky-50/50 cursor-pointer",
        )}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="font-mono text-slate-400 text-[10px]">{entry.noUrut}</span>
        <span className="text-slate-500">{entry.tanggal.slice(5)} <span className="text-slate-400">{entry.jam}</span></span>
        <JenisBadge jenis={entry.jenis} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-700">
            {entry.namaPasien ?? <span className="text-slate-400 italic">—</span>}
          </p>
          <p className="truncate text-[10px] text-slate-400">{entry.noRM ?? entry.keterangan}</p>
        </div>
        <span className={cn(
          "text-center font-bold tabular-nums",
          entry.jumlahKeluar > 0 ? "text-rose-600" : "text-emerald-600",
        )}>
          {entry.jumlahKeluar > 0 ? `-${entry.jumlahKeluar}` : `+${entry.jumlahMasuk}`}
        </span>
        <span className="text-center font-bold tabular-nums text-slate-700">{entry.saldo}</span>
        {expanded ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-1 mb-1 rounded-b-lg border border-t-0 border-slate-100 bg-white px-4 py-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
                {[
                  ["Dokter",     entry.dokter],
                  ["No. Resep",  entry.noResep],
                  ["Pengambil",  entry.pengambil],
                  ["Depo",       entry.depo],
                  ["Keterangan", entry.keterangan],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex gap-1.5">
                    <span className="shrink-0 text-slate-400">{k}:</span>
                    <span className="text-slate-600">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Register pane per kategori ────────────────────────────

function KategoriPane({
  kategori, drugs, bulan,
}: { kategori: NarPsiKategori; drugs: NarPsiDrug[]; bulan: string }) {
  const [selectedDrug, setSelectedDrug] = useState<string>("Semua");
  const [showOpname,   setShowOpname]   = useState(false);
  const [showTambah,   setShowTambah]   = useState(false);
  const [localEntries, setLocalEntries] = useState<RegisterEntry[]>([]);
  const [printDone,    setPrintDone]    = useState(false);

  const allEntries = useMemo(
    () => [
      ...REGISTER_MOCK.filter(
        (r) => r.bulan === bulan && drugs.some((d) => d.nama === r.namaObat),
      ),
      ...localEntries,
    ].sort((a, b) => a.namaObat.localeCompare(b.namaObat) || a.noUrut - b.noUrut),
    [drugs, bulan, localEntries],
  );

  const filtered = selectedDrug === "Semua"
    ? allEntries
    : allEntries.filter((r) => r.namaObat === selectedDrug);

  const totalKeluar = allEntries.filter((r) => r.jenis === "Keluar").reduce((s, r) => s + r.jumlahKeluar, 0);

  const opnameEntries = STOK_OPNAME_MOCK.filter(
    (s) => s.tanggal.startsWith(bulan) && drugs.some((d) => d.nama === s.namaObat),
  );

  const accentCls = kategori === "Narkotika"
    ? "border-orange-200 bg-orange-50 text-orange-700"
    : "border-purple-200 bg-purple-50 text-purple-700";
  const iconCls   = kategori === "Narkotika" ? "text-orange-500" : "text-purple-500";

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Package size={16} className={iconCls} />}
          label="Obat Terdaftar" value={drugs.length}
          cls={`${accentCls} border`}
        />
        <StatCard
          icon={<TrendingDown size={16} className="text-rose-500" />}
          label="Total Keluar" value={totalKeluar} sub={getMonthLabel(bulan)}
          cls="border-rose-200 bg-rose-50 text-rose-700 border"
        />
        <StatCard
          icon={<FileText size={16} className="text-sky-500" />}
          label="Entri Register" value={allEntries.length}
          cls="border-sky-200 bg-sky-50 text-sky-700 border"
        />
        <StatCard
          icon={<Check size={16} className="text-emerald-500" />}
          label="Stok Opname" value={opnameEntries.length} sub="entri bulan ini"
          cls="border-emerald-200 bg-emerald-50 text-emerald-700 border"
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowTambah(true)}
          className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
        >
          <Plus size={12} />Tambah Pengeluaran
        </button>
        <button
          onClick={() => setShowOpname(true)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <Package size={12} />Stok Opname
        </button>
        <button
          onClick={() => { setPrintDone(true); setTimeout(() => setPrintDone(false), 2000); window.print(); }}
          className={cn(
            "ml-auto flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition",
            printDone
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 text-slate-600 hover:bg-slate-50",
          )}
        >
          {printDone ? <Check size={12} /> : <Printer size={12} />}
          Cetak Laporan Bulanan
        </button>
      </div>

      {/* Drug filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedDrug("Semua")}
          className={cn(
            "rounded-lg border px-3 py-1 text-xs font-semibold transition",
            selectedDrug === "Semua" ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-500 hover:bg-slate-50",
          )}
        >
          Semua ({allEntries.length})
        </button>
        {drugs.map((drug) => {
          const n = allEntries.filter((r) => r.namaObat === drug.nama).length;
          const saldo = calcCurrentSaldo(drug.nama, bulan);
          return (
            <button
              key={drug.id}
              onClick={() => setSelectedDrug(drug.nama)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition",
                selectedDrug === drug.nama
                  ? cn(accentCls, "border-transparent")
                  : "border-slate-200 text-slate-500 hover:bg-slate-50",
              )}
            >
              {drug.nama}
              <span className="rounded-full bg-white/40 px-1 text-[9px]">{n}</span>
              {saldo <= drug.stokMin && (
                <AlertTriangle size={9} className="text-rose-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Table header */}
      <div>
        <div className="mb-1 grid grid-cols-[2rem_5rem_4rem_1fr_4rem_4rem_4rem] gap-x-3 rounded-t-lg border border-b-0 border-slate-200 bg-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
          <span>No.</span>
          <span>Tanggal</span>
          <span>Jenis</span>
          <span>Pasien / Keterangan</span>
          <span className="text-center">Keluar</span>
          <span className="text-center">Saldo</span>
          <span />
        </div>

        <div className="rounded-b-lg border border-slate-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">Tidak ada entri register</p>
            </div>
          ) : (
            filtered.map((entry, i) => (
              <RegisterRow key={entry.id} entry={entry} index={i} />
            ))
          )}
        </div>
      </div>

      {/* Stok summary per drug */}
      {selectedDrug === "Semua" && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Saldo Saat Ini per Obat</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {drugs.map((drug) => {
              const saldo = calcCurrentSaldo(drug.nama, bulan);
              const low   = saldo <= drug.stokMin;
              return (
                <div
                  key={drug.id}
                  className={cn(
                    "rounded-xl border p-3",
                    low ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700 leading-tight">{drug.nama}</p>
                    {low && <AlertTriangle size={12} className="shrink-0 text-rose-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400">{drug.kekuatan}</p>
                  <p className={cn("mt-1 text-2xl font-bold tabular-nums leading-none", low ? "text-rose-600" : "text-slate-900")}>
                    {saldo}
                  </p>
                  <p className="text-[10px] text-slate-400">{drug.satuan} · min {drug.stokMin}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showOpname && (
          <StokOpnameModal
            key="opname"
            drugs={drugs}
            bulan={bulan}
            onClose={() => setShowOpname(false)}
            onSave={() => setShowOpname(false)}
          />
        )}
        {showTambah && (
          <TambahMutasiModal
            key="tambah"
            drugs={drugs}
            bulan={bulan}
            kategori={kategori}
            onClose={() => setShowTambah(false)}
            onSave={(entry) => {
              setLocalEntries((prev) => [...prev, entry]);
              setShowTambah(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function RegisterNarPsiPane() {
  const [activeKat, setActiveKat]   = useState<NarPsiKategori>("Narkotika");
  const months                       = getAvailableMonths();
  const [bulan,     setBulan]        = useState(months[0]);

  const drugs = activeKat === "Narkotika" ? NARKOTIKA_DRUGS : PSIKOTROPIKA_DRUGS;
  const tabCls = (k: NarPsiKategori) =>
    activeKat === k
      ? k === "Narkotika"
        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
        : "bg-purple-600 text-white border-purple-600 shadow-sm"
      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50";

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100">
          <ShieldAlert size={18} className="text-orange-600" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Register Narkotika & Psikotropika</h2>
          <p className="text-[11px] text-slate-400">UU 35/2009 · UU 5/1997 · PMK 3/2015 · Pelaporan BPOM/Dinkes</p>
        </div>
        <div className="ml-auto">
          <select
            value={bulan}
            onChange={(e) => setBulan(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            {months.map((m) => (
              <option key={m} value={m}>{getMonthLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Legal notice */}
      <div className="flex items-start gap-2.5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
        <FlaskConical size={13} className="mt-0.5 shrink-0 text-orange-600" aria-hidden />
        <p className="text-xs text-orange-700">
          <span className="font-bold">Pelaporan wajib:</span> Setiap pengeluaran N/P harus dicatat dengan identitas pasien, dokter, dan nomor resep lengkap. Laporan bulanan wajib dilaporkan ke Dinkes Kab/Kota paling lambat tanggal 10 bulan berikutnya.
        </p>
      </div>

      {/* Kategori tabs */}
      <div className="flex gap-2">
        {(["Narkotika", "Psikotropika"] as NarPsiKategori[]).map((k) => (
          <button
            key={k}
            onClick={() => setActiveKat(k)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition-all",
              tabCls(k),
            )}
          >
            <FlaskConical size={12} aria-hidden />
            {k}
            <span className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] font-bold",
              activeKat === k ? "bg-white/25" : "bg-slate-100 text-slate-500",
            )}>
              {(k === "Narkotika" ? NARKOTIKA_DRUGS : PSIKOTROPIKA_DRUGS).length}
            </span>
          </button>
        ))}
      </div>

      {/* Pane content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${activeKat}-${bulan}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          <KategoriPane
            kategori={activeKat}
            drugs={drugs}
            bulan={bulan}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
