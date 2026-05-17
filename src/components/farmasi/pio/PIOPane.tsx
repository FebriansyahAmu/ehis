"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Clock, CheckCircle2, AlertCircle, Filter,
  ChevronRight, Plus, Send, X, BookMarked, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPIOLogs, addPIOEntry, updatePIOEntry,
  KATEGORI_CFG, STATUS_PIO_CFG, URGENSI_CFG, SUMBER_CFG,
  KATEGORI_LIST, SUMBER_LIST,
  type LogPIO, type KategoriPIO, type SumberPertanyaan,
  type StatusPIO, type UrgensipIO,
} from "./pioShared";

// ── Log list item ─────────────────────────────────────────

function LogItem({
  entry,
  active,
  onClick,
}: {
  entry: LogPIO;
  active: boolean;
  onClick: () => void;
}) {
  const kCfg = KATEGORI_CFG[entry.kategori];
  const sCfg = STATUS_PIO_CFG[entry.status];
  const uCfg = URGENSI_CFG[entry.urgensi];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border p-3 text-left transition-all",
        active
          ? "border-sky-300 bg-sky-50 ring-1 ring-sky-200"
          : "border-slate-200 bg-white hover:bg-slate-50",
      )}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", kCfg.dot)} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {entry.urgensi === "Urgent" && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-bold", uCfg.badge)}>URGENT</span>
            )}
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", kCfg.badge)}>
              {entry.kategori}
            </span>
            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", sCfg.badge)}>
              {entry.status}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-relaxed">
            {entry.pertanyaan}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", SUMBER_CFG[entry.sumber])}>
              {entry.sumber}
            </span>
            <span className="text-[10px] text-slate-400">{entry.jam} · {entry.tanggal}</span>
            {entry.waktuResponsMenit && (
              <span className="text-[10px] text-slate-400 ml-auto">{entry.waktuResponsMenit} mnt</span>
            )}
          </div>
        </div>
        <ChevronRight size={12} className={cn("shrink-0 mt-1", active ? "text-sky-500" : "text-slate-300")} />
      </div>
    </button>
  );
}

// ── Detail panel ──────────────────────────────────────────

function DetailPanel({
  entry, onClose, onAnswer,
}: {
  entry:    LogPIO;
  onClose:  () => void;
  onAnswer: (id: string, jawaban: string, referensi: string[], apoteker: string) => void;
}) {
  const kCfg = KATEGORI_CFG[entry.kategori];
  const sCfg = STATUS_PIO_CFG[entry.status];

  const [jawaban,   setJawaban]   = useState(entry.jawaban  ?? "");
  const [referensi, setReferensi] = useState(entry.referensi?.join(", ") ?? "");
  const [apoteker,  setApoteker]  = useState(entry.apoteker === "—" ? "" : (entry.apoteker ?? ""));

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400";
  const canAnswer = jawaban.trim().length > 0 && apoteker.trim().length > 0;

  return (
    <motion.div
      key={entry.id}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-bold", kCfg.badge)}>{entry.kategori}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", sCfg.badge)}>{entry.status}</span>
            {entry.urgensi === "Urgent" && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-bold", URGENSI_CFG.Urgent.badge)}>URGENT</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{entry.tanggal}</span>
            <span>·</span>
            <span>{entry.jam}</span>
            {entry.waktuResponsMenit && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  Respons {entry.waktuResponsMenit} mnt
                </span>
              </>
            )}
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 transition-colors">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Penanya */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <User size={13} className="text-slate-400 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-slate-700">{entry.namaPenanya}</p>
          <p className="text-[10px] text-slate-400">{entry.sumber}{entry.unitAsal ? ` · ${entry.unitAsal}` : ""}</p>
        </div>
        <span className={cn("ml-auto rounded-md px-2 py-0.5 text-[10px] font-semibold", SUMBER_CFG[entry.sumber])}>
          {entry.sumber}
        </span>
      </div>

      {/* Pertanyaan */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pertanyaan</p>
        <p className="text-sm text-slate-700 leading-relaxed">{entry.pertanyaan}</p>
      </div>

      {/* Jawaban — sudah ada */}
      {entry.status === "Terjawab" && entry.jawaban && (
        <>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={13} className="text-emerald-600" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Jawaban Apoteker</p>
              <span className="ml-auto text-[10px] text-emerald-600 font-medium">{entry.apoteker}</span>
            </div>
            <p className="text-sm text-emerald-800 leading-relaxed">{entry.jawaban}</p>
          </div>

          {entry.referensi && entry.referensi.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex items-center gap-2">
                <BookMarked size={12} className="text-slate-400" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Referensi</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {entry.referensi.map((r) => (
                  <span key={r} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{r}</span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Jawaban — form untuk Pending (sisi apoteker) */}
      {entry.status === "Pending" && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-slate-700">Belum dijawab — isi jawaban di bawah</p>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Jawaban <span className="text-rose-400">*</span></label>
              <textarea
                value={jawaban}
                onChange={(e) => setJawaban(e.target.value)}
                rows={4}
                placeholder="Tulis jawaban berbasis evidens..."
                className={cn(inputCls, "resize-none")}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Referensi (pisah koma)</label>
              <input
                value={referensi}
                onChange={(e) => setReferensi(e.target.value)}
                placeholder="UpToDate 2025, Sanford Guide, BNF 84"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">Apoteker <span className="text-rose-400">*</span></label>
              <input
                value={apoteker}
                onChange={(e) => setApoteker(e.target.value)}
                placeholder="Apt. nama S.Farm."
                className={inputCls}
              />
            </div>
            <button
              disabled={!canAnswer}
              onClick={() => {
                const refs = referensi.split(",").map((r) => r.trim()).filter(Boolean);
                onAnswer(entry.id, jawaban, refs, apoteker);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={13} />
              Simpan Jawaban
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── New entry form ────────────────────────────────────────

function NewEntryForm({ onSubmit, onCancel }: {
  onSubmit: (entry: LogPIO) => void;
  onCancel: () => void;
}) {
  const [kategori,    setKategori]    = useState<KategoriPIO>("Dosis");
  const [sumber,      setSumber]      = useState<SumberPertanyaan>("Dokter");
  const [namaPenanya, setNamaPenanya] = useState("");
  const [unitAsal,    setUnitAsal]    = useState("");
  const [pertanyaan,  setPertanyaan]  = useState("");
  const [urgensi,     setUrgensi]     = useState<UrgensipIO>("Reguler");
  const [apoteker,    setApoteker]    = useState("");

  function handleSubmit() {
    if (!pertanyaan.trim() || !namaPenanya.trim() || !apoteker.trim()) return;
    const now = new Date();
    onSubmit({
      id:          `pio-${Date.now()}`,
      tanggal:     now.toISOString().slice(0, 10),
      jam:         now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      urgensi, sumber, namaPenanya, unitAsal: unitAsal || undefined,
      kategori, pertanyaan,
      apoteker, status: "Pending",
    });
  }

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400";
  const labelCls = "text-[11px] font-semibold text-slate-500 block mb-1";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-xl border border-sky-300 bg-sky-50 p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Plus size={14} className="text-sky-600" />
        <p className="text-sm font-bold text-sky-800">Catat Pertanyaan PIO Baru</p>
        <button onClick={onCancel} className="ml-auto rounded-lg p-1 hover:bg-sky-100">
          <X size={13} className="text-sky-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Kategori</label>
          <select value={kategori} onChange={(e) => setKategori(e.target.value as KategoriPIO)} className={inputCls}>
            {KATEGORI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Urgensi</label>
          <select value={urgensi} onChange={(e) => setUrgensi(e.target.value as UrgensipIO)} className={inputCls}>
            <option value="Reguler">Reguler</option>
            <option value="Urgent">Urgent (&lt;15 mnt)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Sumber</label>
          <select value={sumber} onChange={(e) => setSumber(e.target.value as SumberPertanyaan)} className={inputCls}>
            {SUMBER_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Nama Penanya</label>
          <input value={namaPenanya} onChange={(e) => setNamaPenanya(e.target.value)} placeholder="dr. / Ns. / nama pasien" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Unit Asal</label>
          <input value={unitAsal} onChange={(e) => setUnitAsal(e.target.value)} placeholder="Bangsal / Poli / IGD" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Pertanyaan</label>
          <textarea
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
            rows={3}
            placeholder="Tulis pertanyaan informasi obat secara lengkap"
            className={cn(inputCls, "resize-none")}
          />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Apoteker Penerima</label>
          <input value={apoteker} onChange={(e) => setApoteker(e.target.value)} placeholder="Apt. nama S.Farm." className={inputCls} />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!pertanyaan.trim() || !namaPenanya.trim() || !apoteker.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Send size={13} />
        Simpan Pertanyaan
      </button>
    </motion.div>
  );
}

// ── Stats strip ───────────────────────────────────────────

function StatsStrip({ logs }: { logs: LogPIO[] }) {
  const stats = {
    total:    logs.length,
    terjawab: logs.filter((l) => l.status === "Terjawab").length,
    pending:  logs.filter((l) => l.status === "Pending").length,
    urgent:   logs.filter((l) => l.urgensi === "Urgent").length,
    avgMenit: Math.round(
      logs.filter((l) => l.waktuResponsMenit).reduce((s, l) => s + (l.waktuResponsMenit ?? 0), 0) /
      (logs.filter((l) => l.waktuResponsMenit).length || 1)
    ),
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: "Total",       val: stats.total,                  cls: "text-slate-800"   },
        { label: "Terjawab",    val: stats.terjawab,               cls: "text-emerald-700" },
        { label: "Pending",     val: stats.pending,                cls: stats.pending > 0 ? "text-amber-600" : "text-slate-400" },
        { label: "Rata Respons",val: `${stats.avgMenit}m`,         cls: "text-sky-700"     },
      ].map(({ label, val, cls }) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className={cn("text-xl font-bold tabular-nums leading-none", cls)}>{val}</p>
          <p className="text-[10px] text-slate-400 mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function PIOPane() {
  const [logs,        setLogs]        = useState<LogPIO[]>(() => getPIOLogs());
  const [selected,    setSelected]    = useState<LogPIO | null>(logs[0] ?? null);
  const [showForm,    setShowForm]    = useState(false);
  const [filterK,     setFilterK]     = useState<KategoriPIO | "">("");
  const [filterS,     setFilterS]     = useState<StatusPIO | "">("");

  const filtered = useMemo(() =>
    logs.filter((l) =>
      (!filterK || l.kategori === filterK) &&
      (!filterS || l.status   === filterS)
    ),
    [logs, filterK, filterS]
  );

  function handleNewEntry(entry: LogPIO) {
    addPIOEntry(entry);
    setLogs(getPIOLogs());
    setSelected(entry);
    setShowForm(false);
  }

  function handleAnswer(id: string, jawaban: string, referensi: string[], apoteker: string) {
    const now = new Date();
    const original = logs.find((l) => l.id === id);
    const submittedAt = original
      ? Math.round((now.getTime() - new Date(`${original.tanggal}T${original.jam}`).getTime()) / 60000)
      : undefined;
    updatePIOEntry(id, { jawaban, referensi, apoteker, status: "Terjawab", waktuResponsMenit: submittedAt });
    const updated = getPIOLogs();
    setLogs(updated);
    setSelected(updated.find((l) => l.id === id) ?? null);
  }

  return (
    <div className="space-y-4">

      {/* Stats */}
      <StatsStrip logs={logs} />

      {/* Header + filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-sky-600" />
          <span className="text-sm font-bold text-slate-700">Log PIO</span>
          <span className="text-[11px] text-slate-400">PMK 72/2016 Ps. 27-29</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Kategori filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5">
            <Filter size={11} className="text-slate-400" />
            <select
              value={filterK}
              onChange={(e) => setFilterK(e.target.value as KategoriPIO | "")}
              className="text-xs text-slate-600 bg-transparent focus:outline-none"
            >
              <option value="">Semua Kategori</option>
              {KATEGORI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
          {/* Status filter */}
          <select
            value={filterS}
            onChange={(e) => setFilterS(e.target.value as StatusPIO | "")}
            className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 focus:outline-none"
          >
            <option value="">Semua Status</option>
            {(["Terjawab", "Pending", "Dirujuk"] as StatusPIO[]).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={() => { setShowForm(true); setSelected(null); }}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            <Plus size={12} />
            Catat PIO
          </button>
        </div>
      </div>

      {/* Two-panel */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_340px]">

        {/* Left: list */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {showForm && (
              <motion.div key="form" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <NewEntryForm onSubmit={handleNewEntry} onCancel={() => setShowForm(false)} />
              </motion.div>
            )}
            {filtered.length === 0 && !showForm && (
              <motion.div
                key="empty"
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 py-14"
              >
                <BookOpen size={24} className="text-slate-300" />
                <p className="text-sm text-slate-400">Tidak ada log PIO yang cocok</p>
              </motion.div>
            )}
            {filtered.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <LogItem
                  entry={entry}
                  active={selected?.id === entry.id}
                  onClick={() => { setSelected(entry); setShowForm(false); }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Right: detail */}
        <aside className="sticky top-0 self-start">
          <AnimatePresence mode="wait">
            {selected ? (
              <DetailPanel key={selected.id} entry={selected} onClose={() => setSelected(null)} onAnswer={handleAnswer} />
            ) : (
              <motion.div
                key="empty-detail"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center"
              >
                <BookOpen size={22} className="text-slate-300" />
                <p className="text-xs text-slate-400">Pilih entri untuk melihat detail jawaban</p>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}
