"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, CheckCircle, Circle, User, Clock,
  ChevronDown, ChevronUp, Info, PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RawatInapPatientDetail } from "@/lib/data";
import {
  type KonselingRecord, type KonselingObatItem,
  type KonselingMetode, type PenerimaMateri, type TingkatPemahaman,
  getDrugInfo, PEMAHAMAN_CFG, getKonselingForRM,
} from "./konseling/konselingShared";

// ── Props ─────────────────────────────────────────────────

interface Props { patient: RawatInapPatientDetail }

// ── Drug checklist item (left panel) ─────────────────────

function DrugCheckItem({
  item, onToggle, active, onClick,
}: { item: KonselingObatItem; onToggle: () => void; active: boolean; onClick: () => void }) {
  return (
    <div
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-all duration-150",
        active ? "border-sky-300 bg-sky-50" : "border-slate-100 bg-white hover:border-sky-200 hover:bg-sky-50/30",
      )}
      onClick={onClick}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={cn(
          "mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          item.dikonseling
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 hover:border-sky-400",
        )}
      >
        {item.dikonseling && <CheckCircle size={10} className="text-white" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800">{item.namaObat}</p>
        <p className="text-[10px] text-slate-400">{item.dosis} · {item.rute}</p>
      </div>
    </div>
  );
}

// ── Drug detail (right panel top) ────────────────────────

function DrugInfoCard({ item }: { item: KonselingObatItem }) {
  const [showESO, setShowESO] = useState(false);

  return (
    <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">{item.namaObat}</p>
          <p className="text-[11px] text-slate-400">{item.dosis} · {item.rute}</p>
        </div>
        {item.dikonseling && (
          <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            <CheckCircle size={9} />Dikonseling
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="rounded-lg bg-sky-50/60 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-sky-600">Indikasi</p>
          <p className="mt-0.5 text-[11px] text-slate-700">{item.indikasi}</p>
        </div>

        <button
          onClick={() => setShowESO((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-left"
        >
          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Efek Samping</p>
          {showESO ? <ChevronUp size={11} className="text-amber-500" /> : <ChevronDown size={11} className="text-amber-500" />}
        </button>
        <AnimatePresence>
          {showESO && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1 overflow-hidden px-1"
            >
              {item.efekSamping.map((e, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                  {e}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>

        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Penyimpanan</p>
          <p className="mt-0.5 text-[11px] text-slate-600">{item.penyimpanan}</p>
        </div>
      </div>
    </div>
  );
}

// ── Assessment form ────────────────────────────────────────

type FormData = {
  metode: KonselingMetode; penerima: PenerimaMateri; bahasa: string;
  durasiMenit: string; pemahaman: TingkatPemahaman;
  apoteker: string; ttdPasien: boolean; catatan: string;
};

const EMPTY_FORM: FormData = {
  metode: "Verbal", penerima: "Pasien & Keluarga", bahasa: "Indonesia",
  durasiMenit: "15", pemahaman: "Baik",
  apoteker: "", ttdPasien: false, catatan: "",
};

function AssessmentForm({ items, noRM, onSave }: {
  items: KonselingObatItem[]; noRM: string;
  onSave: (r: KonselingRecord) => void;
}) {
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm((f) => ({ ...f, [k]: v }));

  const dikonseling = items.filter((i) => i.dikonseling);
  const valid = dikonseling.length > 0 && form.apoteker.trim();

  const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  const sel = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100";
  const lbl = "mb-1 block text-xs font-semibold text-slate-600";

  const METODE_OPTS:   KonselingMetode[]  = ["Verbal", "Tertulis", "Verbal + Tertulis", "Demonstrasi"];
  const PENERIMA_OPTS: PenerimaMateri[]   = ["Pasien", "Keluarga", "Pasien & Keluarga"];
  const PEMAHAMAN_OPTS: TingkatPemahaman[] = ["Baik", "Cukup", "Kurang"];

  function handleSave() {
    if (!valid) return;
    onSave({
      id: `kon-${Date.now()}`, noRM,
      tanggal: new Date().toISOString().split("T")[0],
      metode: form.metode, penerimaMateri: form.penerima,
      bahasa: form.bahasa, durasiMenit: parseInt(form.durasiMenit) || 15,
      pemahaman: form.pemahaman, obat: items,
      apoteker: form.apoteker, ttdPasien: form.ttdPasien,
      catatan: form.catatan || undefined,
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <PenLine size={13} className="text-sky-600" />
        <p className="text-xs font-bold text-slate-900">Penilaian Konseling</p>
      </div>

      {dikonseling.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <Info size={12} className="shrink-0 text-amber-600" />
          <p className="text-xs text-amber-700">Centang minimal satu obat untuk diselesaikan konselingnya</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Metode</label>
          <select value={form.metode} onChange={(e) => set("metode", e.target.value as KonselingMetode)} className={sel}>
            {METODE_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Penerima Materi</label>
          <select value={form.penerima} onChange={(e) => set("penerima", e.target.value as PenerimaMateri)} className={sel}>
            {PENERIMA_OPTS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Bahasa</label>
          <input value={form.bahasa} onChange={(e) => set("bahasa", e.target.value)} className={inp} placeholder="Indonesia" />
        </div>
        <div>
          <label className={lbl}>Durasi (menit)</label>
          <input type="number" min={1} value={form.durasiMenit} onChange={(e) => set("durasiMenit", e.target.value)} className={inp} />
        </div>
      </div>

      {/* Comprehension level */}
      <div>
        <label className={lbl}>Tingkat Pemahaman Pasien</label>
        <div className="flex gap-2">
          {PEMAHAMAN_OPTS.map((p) => {
            const cfg = PEMAHAMAN_CFG[p];
            return (
              <button key={p} onClick={() => set("pemahaman", p)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-xs font-bold transition-all",
                  form.pemahaman === p ? cn(cfg.badge) : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={lbl}><User size={10} className="inline mr-1" />Apoteker</label>
        <input value={form.apoteker} onChange={(e) => set("apoteker", e.target.value)}
          placeholder="Apt. Nama, S.Farm." className={inp} />
      </div>

      <div>
        <label className={lbl}>Catatan <span className="font-normal text-slate-400">(opsional)</span></label>
        <textarea rows={2} value={form.catatan} onChange={(e) => set("catatan", e.target.value)}
          placeholder="Catatan khusus tentang konseling ini..."
          className={cn(inp, "resize-none")} />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.ttdPasien} onChange={(e) => set("ttdPasien", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-600" />
        <span className="text-xs font-medium text-slate-600">Pasien / keluarga telah menandatangani lembar konseling</span>
      </label>

      <button onClick={handleSave} disabled={!valid}
        className={cn(
          "w-full rounded-lg py-2.5 text-sm font-bold transition-all",
          valid ? "bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.98]" : "cursor-not-allowed bg-slate-100 text-slate-400",
        )}
      >
        Selesaikan & Simpan Konseling
      </button>
    </div>
  );
}

// ── Completed record card ─────────────────────────────────

function CompletedCard({ record }: { record: KonselingRecord }) {
  const cfg = PEMAHAMAN_CFG[record.pemahaman];
  const done = record.obat.filter((o) => o.dikonseling).length;
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <CheckCircle size={14} className="text-emerald-600" />
          <p className="text-xs font-bold text-slate-900">Konseling Selesai</p>
        </div>
        <span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", cfg.badge)}>{cfg.label}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Obat Dikonseling", value: `${done}/${record.obat.length}` },
          { label: "Durasi",           value: `${record.durasiMenit} mnt` },
          { label: "Metode",           value: record.metode               },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-white px-2 py-1.5">
            <p className="text-xs font-bold text-slate-900">{s.value}</p>
            <p className="text-[9px] text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-0.5"><User size={9} />{record.apoteker}</span>
        <span className="flex items-center gap-0.5"><Clock size={9} />{record.tanggal}</span>
        {record.ttdPasien && <span className="text-emerald-600">✓ TTD Pasien</span>}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function KonselingTab({ patient }: Props) {
  const resepItems = patient.resepRI?.items ?? [];

  const [items, setItems] = useState<KonselingObatItem[]>(() =>
    resepItems.filter((i) => i.aktif).map((i) => {
      const info = getDrugInfo(i.namaObat);
      return {
        resepItemId: i.id, namaObat: i.namaObat, dosis: i.dosis, rute: i.rute,
        indikasi:    info.indikasi,
        efekSamping: info.efekSamping,
        penyimpanan: info.penyimpanan,
        dikonseling: false,
      };
    }),
  );

  const [selected,  setSelected]  = useState<string | null>(items[0]?.resepItemId ?? null);
  const [records,   setRecords]   = useState<KonselingRecord[]>(() => getKonselingForRM(patient.noRM));
  const [showForm,  setShowForm]  = useState(false);

  function toggleItem(id: string) {
    setItems((prev) => prev.map((i) => i.resepItemId === id ? { ...i, dikonseling: !i.dikonseling } : i));
  }

  function handleSave(record: KonselingRecord) {
    setRecords((prev) => [record, ...prev]);
    setShowForm(false);
    setItems((prev) => prev.map((i) => ({ ...i, dikonseling: false })));
  }

  const activeItem = items.find((i) => i.resepItemId === selected);
  const doneCount  = items.filter((i) => i.dikonseling).length;

  if (resepItems.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
        <BookOpen size={28} className="mb-2 text-slate-300" />
        <p className="font-medium text-slate-500">Belum ada resep aktif</p>
        <p className="mt-1 text-sm text-slate-400">Konseling obat pulang membutuhkan resep yang sudah diinput</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
            <BookOpen size={15} className="text-sky-600" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Konseling Obat Pulang</h2>
            <p className="text-[11px] text-slate-400">SNARS PP 5 · PMK 72/2016 Ps. 27</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
            showForm
              ? "border-slate-200 bg-white text-slate-600"
              : "border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100",
          )}
        >
          <PenLine size={12} />
          {showForm ? "Batal" : "Mulai Konseling"}
        </button>
      </div>

      {/* Previous records */}
      {records.length > 0 && (
        <div className="space-y-2">
          {records.map((r) => <CompletedCard key={r.id} record={r} />)}
        </div>
      )}

      {/* Two-panel */}
      <div className="flex min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" style={{ minHeight: 480 }}>

        {/* Left — drug list */}
        <div className="flex w-60 shrink-0 flex-col border-r border-slate-100 bg-slate-50/60">
          <div className="border-b border-slate-100 px-3 py-3">
            <p className="text-xs font-bold text-slate-700">Obat Aktif</p>
            <p className="text-[10px] text-slate-400">{doneCount}/{items.length} siap dikonseling</p>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
            {items.map((item, i) => (
              <motion.div key={item.resepItemId}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <DrugCheckItem
                  item={item}
                  active={selected === item.resepItemId}
                  onToggle={() => toggleItem(item.resepItemId)}
                  onClick={() => setSelected(item.resepItemId)}
                />
              </motion.div>
            ))}
          </div>

          {showForm && doneCount > 0 && (
            <div className="border-t border-slate-100 px-3 py-2.5">
              <p className="text-[10px] font-semibold text-emerald-600">
                {doneCount} obat siap — isi penilaian di kanan
              </p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {showForm ? (
              <motion.div key="form"
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {activeItem && <DrugInfoCard item={activeItem} />}
                <AssessmentForm items={items} noRM={patient.noRM} onSave={handleSave} />
              </motion.div>
            ) : activeItem ? (
              <motion.div key={activeItem.resepItemId}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
              >
                <DrugInfoCard item={activeItem} />
                {!showForm && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50/40 px-4 py-3">
                    <Info size={12} className="shrink-0 text-sky-500" />
                    <p className="text-xs text-sky-700">Centang obat di kiri, lalu klik "Mulai Konseling" untuk mendokumentasikan sesi ini</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex h-full flex-col items-center justify-center gap-2 text-center"
              >
                <Circle size={24} className="text-slate-200" />
                <p className="text-sm text-slate-400">Pilih obat di sebelah kiri</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
