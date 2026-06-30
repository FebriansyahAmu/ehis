"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, CheckCircle2, History, Save, User, Salad, Loader2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MUST_QUESTIONS, GIZI_RISK, getGiziRisk, GIZI_HISTORY_MOCK, getGiziRiskKey,
  type GiziScore, type GiziState, type GiziHistoryEntry,
} from "./asesmenShared";
import { getGiziList, recordGizi, type AsesmenGiziDTO } from "@/lib/api/asesmenMedis/asesmenGizi";
import { ApiError } from "@/lib/api/client";
import { DatePicker } from "@/components/shared/inputs/DatePicker";

// id kunjungan DB = UUID; id demo/mock ("igd-1") tak tersimpan ke DB.
const GIZI_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// DB DTO → GiziHistoryEntry FE (kontrak mirror → map langsung).
function dtoToGiziEntry(d: AsesmenGiziDTO): GiziHistoryEntry {
  return {
    id: d.id,
    savedAt: d.savedAt,
    tanggal: d.tanggal ?? d.savedAt.slice(0, 10),
    petugas: d.petugas,
    scores: { bmi: d.scores.bmi as GiziScore, bb: d.scores.bb as GiziScore, akut: d.scores.akut as GiziScore },
    total: d.total,
    risk: d.risk,
    ahliGizi: d.ahliGizi ?? "",
    catatan: d.catatan ?? "",
  };
}

// ── Helpers ───────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

// ── Micro-components ───────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </p>
  );
}

function ScoreChip({ score }: { score: number | null }) {
  if (score === null)
    return <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">–</span>;
  const cls =
    score === 0 ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : score === 1 ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
    : "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  return <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", cls)}>{score}</span>;
}

const RISK_BADGE = {
  low:  { text: "Rendah", cls: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" },
  mid:  { text: "Sedang", cls: "bg-amber-100   text-amber-700   ring-1 ring-amber-200"   },
  high: { text: "Tinggi", cls: "bg-rose-100    text-rose-700    ring-1 ring-rose-200"    },
} as const;

const SCORE_BORDER = {
  low:  "border-emerald-200 bg-emerald-50 text-emerald-700",
  mid:  "border-amber-200   bg-amber-50   text-amber-700",
  high: "border-rose-200    bg-rose-50    text-rose-700",
} as const;

// ── History Card ───────────────────────────────────────────

function HistoryCard({
  entry, index, isNew,
}: {
  entry: GiziHistoryEntry;
  index: number;
  isNew: boolean;
}) {
  const [expanded, setExpanded] = useState(isNew);
  const risk   = GIZI_RISK[entry.risk];
  const badge  = RISK_BADGE[entry.risk];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: isNew ? -10 : 0 }}
      animate={{
        opacity: 1,
        y: 0,
        borderColor: isNew ? "#38bdf8" : "#e2e8f0",
        backgroundColor: isNew ? "#f0f9ff" : "#ffffff",
      }}
      transition={{
        duration: 0.28,
        delay: isNew ? 0 : index * 0.07,
        ease: "easeOut",
        borderColor: { duration: 0.7 },
        backgroundColor: { duration: 0.7 },
      }}
      className="overflow-hidden rounded-xl border"
    >
      {/* ── Card header ── */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/60"
      >
        {/* Index / icon */}
        <div className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold",
          isNew ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500",
        )}>
          {isNew ? <Salad size={12} /> : String(index + 1)}
        </div>

        {/* Date + petugas */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-700">
              {fmtDateTime(entry.savedAt)}
            </span>
            {isNew && (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="rounded-full bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold text-white"
              >
                Baru
              </motion.span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-1">
            <User size={9} className="shrink-0 text-slate-400" />
            <span className="truncate text-[10px] text-slate-500">{entry.petugas}</span>
          </div>
        </div>

        {/* Score + risk + chevron */}
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn(
            "rounded-lg border px-2.5 py-1 text-sm font-black tabular-nums",
            SCORE_BORDER[entry.risk],
          )}>
            {entry.total}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", badge.cls)}>
            {badge.text}
          </span>
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* ── Mini MUST score strip ── */}
      <div className="flex gap-1.5 px-4 pb-3">
        {(["bmi", "bb", "akut"] as const).map(key => (
          <div key={key} className="flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-100">
            <span className="text-[9px] font-bold uppercase text-slate-400">
              {key === "bmi" ? "BMI" : key === "bb" ? "BB" : "Akut"}
            </span>
            <ScoreChip score={entry.scores[key]} />
          </div>
        ))}
      </div>

      {/* ── Expandable detail ── */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2.5 border-t border-slate-100 px-4 py-3">

              {/* Full MUST breakdown */}
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Detail Skor MUST
                </p>
                <div className="flex flex-col gap-1.5">
                  {MUST_QUESTIONS.map(q => {
                    const val = entry.scores[q.key];
                    const opt = q.options.find(o => o.score === val);
                    return (
                      <div
                        key={q.key}
                        className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-1.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-slate-600">{q.label}</p>
                          <p className="truncate text-[10px] text-slate-400">{opt?.label ?? "—"}</p>
                        </div>
                        <ScoreChip score={val} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Risk interpretation */}
              <div className={cn("rounded-md border p-2.5", risk.cls)}>
                <p className="text-xs font-bold">{risk.label}</p>
                <p className="mt-0.5 text-[10px] leading-relaxed opacity-80">{risk.action}</p>
              </div>

              {/* Follow-up info */}
              {entry.ahliGizi && (
                <div className="flex items-start gap-2 text-[10px]">
                  <span className="shrink-0 font-semibold text-slate-500">Ahli Gizi:</span>
                  <span className="text-slate-700">{entry.ahliGizi}</span>
                </div>
              )}
              {entry.catatan && (
                <div className="flex items-start gap-2 text-[10px]">
                  <span className="shrink-0 font-semibold text-slate-500">Catatan:</span>
                  <span className="leading-relaxed text-slate-700">{entry.catatan}</span>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── History Section ────────────────────────────────────────

function HistorySection({
  entries, newId,
}: {
  entries: GiziHistoryEntry[];
  newId: string | null;
}) {
  const [open, setOpen] = useState(true);

  if (entries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl border border-slate-200 bg-slate-50/60"
    >
      {/* Section header / toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors hover:bg-slate-100/60 rounded-xl"
      >
        <div className="flex items-center gap-2">
          <History size={13} className="text-sky-500" />
          <span className="text-xs font-semibold text-slate-700">Riwayat Skrining Gizi</span>
          <motion.span
            key={entries.length}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700"
          >
            {entries.length} entri
          </motion.span>
        </div>
        <motion.div
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-3 pb-3">
              {entries.map((e, i) => (
                <HistoryCard
                  key={e.id}
                  entry={e}
                  index={i}
                  isNew={e.id === newId}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Props ─────────────────────────────────────────────────

interface GiziPaneProps {
  noRM?: string;
  /** id kunjungan DB (UUID) → mode DB: fetch riwayat + persist. Non-UUID/absen → demo. */
  kunjunganId?: string;
  /** Nama user login → "Nama Petugas" read-only di mode DB (server tetap derive dari actor). */
  recordedBy?: string;
  onComplete?: (done: boolean) => void;
}

// ── Main Pane ─────────────────────────────────────────────

export default function GiziPane({ noRM, kunjunganId, recordedBy, onComplete }: GiziPaneProps) {
  const isPersisted = !!kunjunganId && GIZI_UUID_RE.test(kunjunganId);

  const [scores, setScores] = useState<GiziState>({ bmi: null, bb: null, akut: null });
  const [ahliGizi, setAhliGizi] = useState("");
  const [catatan, setCatatan]   = useState("");
  const [tanggal, setTanggal]   = useState("");
  const [petugas, setPetugas]   = useState(() => (isPersisted ? (recordedBy ?? "") : ""));

  const [history, setHistory]       = useState<GiziHistoryEntry[]>(
    () => (isPersisted ? [] : noRM ? (GIZI_HISTORY_MOCK[noRM] ?? []) : []),
  );
  const [newEntryId, setNewEntryId] = useState<string | null>(null);
  const [showToast, setShowToast]   = useState(false);
  const [everSaved, setEverSaved]   = useState(
    () => (isPersisted ? false : noRM ? (GIZI_HISTORY_MOCK[noRM]?.length ?? 0) > 0 : false),
  );
  const [loading, setLoading] = useState(isPersisted);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Mode DB: nama petugas = user login (server derive dari actor); jaga sinkron bila berubah.
  useEffect(() => {
    if (isPersisted && recordedBy) setPetugas(recordedBy);
  }, [isPersisted, recordedBy]);

  const total     = (scores.bmi ?? 0) + (scores.bb ?? 0) + (scores.akut ?? 0);
  const allFilled = scores.bmi !== null && scores.bb !== null && scores.akut !== null;
  const risk      = getGiziRisk(total, allFilled);
  const canSave   = allFilled && petugas.trim() !== "" && !saving;

  // Report done state to parent whenever relevant state changes
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    onCompleteRef.current?.(allFilled || everSaved);
  }, [allFilled, everSaved]);

  // Muat riwayat skrining dari DB (kunjungan nyata). Mock → seed dari GIZI_HISTORY_MOCK (demo).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const rows = await getGiziList(kunjunganId!, ac.signal);
        if (ac.signal.aborted) return;
        setHistory(rows.map(dtoToGiziEntry));
        setEverSaved(rows.length > 0);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof ApiError ? e.message : "Gagal memuat riwayat skrining gizi.");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [kunjunganId, isPersisted]);

  function handleScore(key: keyof GiziState, score: GiziScore) {
    setScores(prev => ({ ...prev, [key]: score }));
  }

  function resetForm() {
    setScores({ bmi: null, bb: null, akut: null });
    setAhliGizi("");
    setCatatan("");
    setTanggal("");
    if (!isPersisted) setPetugas(""); // mode DB: pertahankan nama petugas (user login)
  }

  async function handleSave() {
    if (!canSave) return;

    // Mode DB: persist 1 skrining (append) → prepend hasil server ke riwayat.
    if (isPersisted) {
      setSaving(true); setError(null);
      try {
        const dto = await recordGizi(kunjunganId!, {
          skorBmi: scores.bmi!, skorBb: scores.bb!, skorAkut: scores.akut!,
          ahliGizi: ahliGizi.trim() || undefined,
          catatan: catatan.trim() || undefined,
          tanggal: tanggal || undefined,
        });
        const entry = dtoToGiziEntry(dto);
        setHistory(prev => [entry, ...prev]);
        setNewEntryId(entry.id);
        setEverSaved(true);
        setShowToast(true);
        resetForm();
        setTimeout(() => setNewEntryId(null), 4500);
        setTimeout(() => setShowToast(false), 3000);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Gagal menyimpan skrining gizi.");
      } finally {
        setSaving(false);
      }
      return;
    }

    // Demo (mock) — lokal saja.
    const now = new Date();
    const entry: GiziHistoryEntry = {
      id:       `gizi-${now.getTime()}`,
      savedAt:  now.toISOString().slice(0, 19),
      tanggal:  tanggal || now.toISOString().slice(0, 10),
      petugas:  petugas.trim(),
      scores:   { ...scores },
      total,
      risk:     getGiziRiskKey(total),
      ahliGizi: ahliGizi.trim(),
      catatan:  catatan.trim(),
    };

    setHistory(prev => [entry, ...prev]);
    setNewEntryId(entry.id);
    setEverSaved(true);
    setShowToast(true);
    resetForm();

    setTimeout(() => setNewEntryId(null), 4500);
    setTimeout(() => setShowToast(false), 3000);
  }

  const INPUT_CLS =
    "h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-xs text-slate-900 " +
    "placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100";

  return (
    <div className="flex flex-col gap-3">

      {/* ── Save toast ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5"
          >
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
            <p className="text-xs font-medium text-emerald-700">
              Skrining gizi berhasil disimpan dan ditambahkan ke riwayat.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
          <Loader2 size={13} className="animate-spin" /> Memuat riwayat skrining gizi…
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertTriangle size={13} className="shrink-0" /> {error}
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid gap-3 md:grid-cols-2">

        {/* MUST Questions */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-2.5">
            <span className="text-xs font-semibold text-slate-700">
              MUST — Malnutrition Universal Screening Tool
            </span>
          </div>
          <div className="flex flex-col gap-4 p-4">
            {MUST_QUESTIONS.map(q => (
              <div key={q.key}>
                <Label>{q.label}</Label>
                <div className="flex flex-col gap-1">
                  {q.options.map(opt => (
                    <button
                      key={opt.score}
                      type="button"
                      onClick={() => handleScore(q.key, opt.score)}
                      className={cn(
                        "flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-medium transition",
                        scores[q.key] === opt.score
                          ? "border-sky-400 bg-sky-50 text-sky-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span>{opt.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{opt.hint}</span>
                        <span className={cn(
                          "ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10px] font-bold",
                          opt.score === 0 ? "bg-slate-100 text-slate-500"
                            : opt.score === 1 ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700",
                        )}>
                          Skor {opt.score}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: result + follow-up */}
        <div className="flex flex-col gap-3">

          {/* Score result */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-700">Hasil Skrining</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Total Skor MUST</span>
                <motion.span
                  key={total}
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{ scale: 1,   opacity: 1   }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className={cn(
                    "rounded-lg border px-3 py-1 text-lg font-bold tabular-nums",
                    !allFilled ? "border-slate-200 bg-slate-50 text-slate-400"
                      : total === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : total === 1 ? "border-amber-200   bg-amber-50   text-amber-700"
                      : "border-rose-200   bg-rose-50   text-rose-700",
                  )}
                >
                  {total}
                </motion.span>
              </div>

              {/* Progress bar */}
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    animate={{
                      backgroundColor: allFilled && i < total
                        ? total >= 2 ? "#fb7185" : total === 1 ? "#fbbf24" : "#34d399"
                        : "#f1f5f9",
                    }}
                    transition={{ duration: 0.3 }}
                    className="h-2 flex-1 rounded-full"
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {risk ? (
                  <motion.div
                    key={risk.label}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn("rounded-md border p-3", risk.cls)}
                  >
                    <p className="text-xs font-bold">{risk.label}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">{risk.action}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center text-[11px] text-slate-400"
                  >
                    Isi semua pertanyaan untuk melihat hasil
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 text-[10px]">
                {[
                  { s: "0",  l: "Rendah", cls: "bg-emerald-50 text-emerald-700" },
                  { s: "1",  l: "Sedang", cls: "bg-amber-50   text-amber-700"   },
                  { s: "≥2", l: "Tinggi", cls: "bg-rose-50    text-rose-700"    },
                ].map(r => (
                  <span key={r.s} className={cn("rounded-md px-2 py-0.5 font-semibold", r.cls)}>
                    {r.s} – {r.l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-up & save */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-white px-4 py-2.5">
              <span className="text-xs font-semibold text-slate-700">Tindak Lanjut & Simpan</span>
            </div>
            <div className="flex flex-col gap-3 p-4">
              <div>
                <Label>Dirujuk ke Ahli Gizi</Label>
                <input
                  value={ahliGizi}
                  onChange={e => setAhliGizi(e.target.value)}
                  placeholder="Nama ahli gizi / Tidak dirujuk"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <Label>Catatan / Rencana Intervensi Gizi</Label>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Rencana diet, suplemen, konsultasi lanjutan..."
                  className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>
                    Nama Petugas{" "}
                    {isPersisted
                      ? <span className="normal-case font-normal text-slate-400">(user login)</span>
                      : <span className="normal-case font-normal text-rose-500">*wajib</span>}
                  </Label>
                  <input
                    value={petugas}
                    onChange={e => setPetugas(e.target.value)}
                    readOnly={isPersisted}
                    placeholder="Nama petugas..."
                    className={cn(
                      INPUT_CLS,
                      isPersisted && "cursor-default bg-slate-100 text-slate-600",
                      !isPersisted && !petugas && allFilled
                        ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                        : "",
                    )}
                  />
                </div>
                <div>
                  <Label>Tanggal Skrining</Label>
                  <DatePicker
                    value={tanggal}
                    onChange={setTanggal}
                    placeholder="Pilih tanggal"
                  />
                </div>
              </div>

              <motion.button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                whileTap={canSave ? { scale: 0.97 } : undefined}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all",
                  canSave
                    ? "cursor-pointer bg-sky-600 text-white shadow-sm hover:bg-sky-700"
                    : "cursor-not-allowed bg-slate-100 text-slate-400",
                )}
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {saving
                  ? "Menyimpan…"
                  : !allFilled
                  ? "Lengkapi 3 pertanyaan MUST terlebih dahulu"
                  : !petugas.trim()
                  ? "Isi nama petugas untuk menyimpan"
                  : "Simpan Skrining Gizi"}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* ── History ── */}
      <HistorySection entries={history} newId={newEntryId} />

    </div>
  );
}
