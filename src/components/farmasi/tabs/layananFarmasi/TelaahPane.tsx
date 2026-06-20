"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, ChevronDown,
  Check, ShieldAlert, RefreshCw, Pill, ChevronRight,
  ClipboardList, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TELAAH_GROUP_BY_KEY, initTelaahGroup, telaahGroupLulus,
  getLASAPair,
  type FarmasiOrder, type TelaahData, type TelaahCheck, type TelaahGroupKey, type TelaahItem,
  type AllergiPasien, type SubstitusiItem, type FarmasiOrderItem,
} from "@/components/farmasi/farmasiShared";

interface Props {
  order:    FarmasiOrder;
  onSubmit: (orderId: string, data: TelaahData) => void;
}

// ── Allergy banner ─────────────────────────────────────────

const TINGKAT_CFG = {
  Berat:  { cls: "border-rose-200 bg-rose-50",     text: "text-rose-700",   badge: "bg-rose-500 text-white",  dot: "bg-rose-500"   },
  Sedang: { cls: "border-amber-200 bg-amber-50",   text: "text-amber-700",  badge: "bg-amber-400 text-white", dot: "bg-amber-400"  },
  Ringan: { cls: "border-yellow-200 bg-yellow-50", text: "text-yellow-700", badge: "bg-yellow-400 text-white",dot: "bg-yellow-400" },
};

function allergyMatchesItem(alergen: string, namaObat: string): boolean {
  const a = alergen.toLowerCase();
  const n = namaObat.toLowerCase();
  return n.includes(a) || a.includes(n.split(" ")[0]);
}

function AllergyBanner({ allergies, itemNames }: { allergies: AllergiPasien[]; itemNames: string[] }) {
  const [open, setOpen] = useState(true);
  const matches = allergies.filter((a) => itemNames.some((n) => allergyMatchesItem(a.alergen, n)));
  const worst   = matches.some((a) => a.tingkat === "Berat") ? "Berat"
                : matches.some((a) => a.tingkat === "Sedang") ? "Sedang"
                : allergies.some((a) => a.tingkat === "Berat") ? "Berat"
                : "Sedang";
  const cfg = TINGKAT_CFG[worst];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("overflow-hidden rounded-xl border", cfg.cls)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left"
      >
        <ShieldAlert size={13} className={cn("shrink-0", cfg.text)} />
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <p className={cn("text-xs font-semibold", cfg.text)}>
            {matches.length > 0
              ? `${matches.length} item berpotensi bereaksi dengan alergi pasien`
              : `${allergies.length} catatan alergi`}
          </p>
          {matches.length > 0 && (
            <motion.span
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white"
            >
              KRITIS
            </motion.span>
          )}
        </div>
        <ChevronDown
          size={12}
          className={cn("shrink-0 transition-transform duration-200", cfg.text, open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 border-t border-black/5 px-4 pb-3 pt-2 sm:grid-cols-3">
              {allergies.map((a, i) => {
                const hit = itemNames.some((n) => allergyMatchesItem(a.alergen, n));
                const c   = TINGKAT_CFG[a.tingkat];
                return (
                  <div key={i} className={cn(
                    "rounded-lg border px-2.5 py-2 text-xs",
                    hit ? "border-rose-300 bg-rose-100/60" : "border-black/5 bg-white/70",
                  )}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", c.dot)} />
                      <p className="font-semibold text-slate-800">{a.alergen}</p>
                      {hit && <AlertTriangle size={9} className="text-rose-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500">{a.reaksi}</p>
                    <span className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold", c.badge)}>
                      {a.tingkat}
                    </span>
                  </div>
                );
              })}
            </div>
            {matches.length > 0 && (
              <div className="border-t border-rose-200 bg-rose-100/40 px-4 py-2">
                <p className="text-[11px] font-medium text-rose-700">
                  Verifikasi bersama dokter sebelum melanjutkan dispensing.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Substitution panel ─────────────────────────────────────

interface SubstitusiState { namaGenerik: string; alasan: string }

function SubstitusiPanel({
  items, value, onChange,
}: {
  items:    FarmasiOrder["items"];
  value:    Record<string, SubstitusiState | undefined>;
  onChange: (id: string, s: SubstitusiState | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const count = Object.values(value).filter(Boolean).length;

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border transition-colors",
      count > 0 ? "border-sky-200" : "border-slate-200",
    )}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
          count > 0 ? "bg-sky-50/40 hover:bg-sky-50" : "bg-white hover:bg-slate-50/60",
        )}
      >
        <RefreshCw size={12} className={cn("shrink-0", count > 0 ? "text-sky-600" : "text-slate-400")} />
        <p className={cn("flex-1 text-xs font-semibold", count > 0 ? "text-sky-700" : "text-slate-600")}>
          Substitusi Generik
          <span className="ml-1 font-normal text-slate-400">(opsional)</span>
        </p>
        {count > 0 && (
          <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-black text-white">
            {count}
          </span>
        )}
        <ChevronDown
          size={12}
          className={cn("shrink-0 text-slate-400 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 border-t border-slate-100 px-4 pb-4 pt-3">
              <p className="text-[10px] text-slate-400">
                Tandai item yang akan diganti ke generik. Perlu konfirmasi dokter sebelum dispensing.
              </p>
              {items.map((item) => {
                const active = !!value[item.id];
                return (
                  <div key={item.id} className={cn(
                    "overflow-hidden rounded-lg border transition-all",
                    active ? "border-sky-200 bg-sky-50/30" : "border-slate-100 bg-white",
                  )}>
                    <button
                      onClick={() => onChange(item.id, active ? undefined : { namaGenerik: "", alasan: "" })}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left"
                    >
                      <div className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                        active ? "border-sky-500 bg-sky-500" : "border-slate-300",
                      )}>
                        {active && <Check size={9} className="text-white" />}
                      </div>
                      <div className="flex flex-1 items-center gap-2 min-w-0">
                        <Pill size={11} className="shrink-0 text-slate-400" />
                        <p className="truncate text-xs font-medium text-slate-800">{item.namaObat}</p>
                        <span className="shrink-0 text-[10px] text-slate-400">{item.dosis}</span>
                      </div>
                      <ChevronRight size={11} className={cn("shrink-0 text-slate-300 transition-transform", active && "rotate-90")} />
                    </button>

                    <AnimatePresence>
                      {active && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-2 border-t border-sky-100 px-3 pb-3 pt-2">
                            <div>
                              <label className="mb-1 block text-[10px] font-medium text-slate-500">
                                Nama Generik <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={value[item.id]?.namaGenerik ?? ""}
                                onChange={(e) => onChange(item.id, { ...value[item.id]!, namaGenerik: e.target.value })}
                                placeholder="Mis: Paracetamol 500mg"
                                className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-medium text-slate-500">Alasan</label>
                              <input
                                type="text"
                                value={value[item.id]?.alasan ?? ""}
                                onChange={(e) => onChange(item.id, { ...value[item.id]!, alasan: e.target.value })}
                                placeholder="Mis: Stok habis, efisiensi"
                                className="w-full rounded-lg border border-sky-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Checklist section ──────────────────────────────────────

interface SectionProps {
  title:      string;
  items:      TelaahItem[];
  answers:    Record<string, boolean>; // linkId → bool
  onToggle:   (linkId: string) => void;
  onCheckAll: () => void;
}

function CheckSection({ title, items, answers, onToggle, onCheckAll }: SectionProps) {
  const [open, setOpen] = useState(true);
  const done    = items.filter((it) => answers[it.linkId]).length;
  const total   = items.length;
  const pct     = total > 0 ? (done / total) * 100 : 0;
  const allDone = done === total;

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border transition-colors duration-300",
      allDone ? "border-emerald-200" : "border-slate-200",
    )}>
      {/* Header row */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2.5 transition-colors",
        allDone ? "bg-emerald-50/60" : "bg-white",
      )}>
        <motion.div
          animate={{ scale: allDone ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black transition-all",
            allDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500",
          )}
        >
          {allDone ? <Check size={9} /> : done}
        </motion.div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left min-w-0"
        >
          <p className={cn("text-xs font-bold", allDone ? "text-emerald-700" : "text-slate-700")}>
            {title}
          </p>
          <span className={cn(
            "rounded px-1.5 py-0.5 text-[9px] font-semibold",
            allDone ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500",
          )}>
            {done}/{total}
          </span>
          <div className="hidden sm:flex flex-1 max-w-16">
            <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <motion.div
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3 }}
                className={cn("h-full rounded-full", allDone ? "bg-emerald-500" : "bg-sky-400")}
              />
            </div>
          </div>
        </button>

        <button
          onClick={onCheckAll}
          className={cn(
            "shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold transition-all duration-150",
            allDone
              ? "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              : "text-sky-600 hover:bg-sky-50",
          )}
        >
          {allDone ? "Hapus" : "Semua"}
        </button>

        <button onClick={() => setOpen((v) => !v)} className="shrink-0 p-0.5">
          <ChevronDown
            size={13}
            className={cn(
              "text-slate-400 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-slate-50 border-t border-slate-100 px-2 pb-2 pt-1">
              {items.map((item) => {
                const checked = !!answers[item.linkId];
                return (
                  <button
                    key={item.linkId}
                    onClick={() => onToggle(item.linkId)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-100",
                      checked ? "bg-emerald-50/50" : "hover:bg-slate-50/70",
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all duration-200",
                      checked ? "border-emerald-500 bg-emerald-500" : "border-slate-300 hover:border-sky-400",
                    )}>
                      <AnimatePresence>
                        {checked && (
                          <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: "spring", stiffness: 600, damping: 20 }}
                          >
                            <Check size={9} className="text-white" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className={cn(
                      "flex items-center gap-1.5 text-xs leading-relaxed transition-colors",
                      checked ? "text-emerald-600/70 line-through" : "text-slate-600",
                    )}>
                      {item.text}
                      {item.prefill && !checked && (
                        <span className="rounded bg-sky-100 px-1 py-0.5 text-[8px] font-bold text-sky-600 no-underline">e-resep</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── LASA confirm panel ─────────────────────────────────────

function LASAConfirmPanel({ items, confirmed, onChange }: {
  items:     FarmasiOrderItem[];
  confirmed: Record<string, boolean>;
  onChange:  (id: string, v: boolean) => void;
}) {
  const lasaItems = items.filter((i) => i.isLASA);
  if (lasaItems.length === 0) return null;
  const done = lasaItems.filter((i) => confirmed[i.id]).length;
  const all  = done === lasaItems.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className={cn(
        "overflow-hidden rounded-xl border-2 transition-all",
        all ? "border-emerald-200 bg-emerald-50/30" : "border-amber-300 bg-amber-50/60",
      )}
    >
      <div className="flex items-center gap-2 px-4 py-2.5">
        <AlertTriangle size={12} className={cn("shrink-0", all ? "text-emerald-600" : "text-amber-600")} />
        <p className={cn("flex-1 text-xs font-bold", all ? "text-emerald-700" : "text-amber-700")}>
          LASA — Konfirmasi Tidak Tertukar
        </p>
        <span className={cn(
          "rounded-full px-2 py-0.5 text-[10px] font-black",
          all ? "bg-emerald-100 text-emerald-700" : "bg-amber-200 text-amber-800",
        )}>
          {done}/{lasaItems.length}
        </span>
      </div>
      <div className="divide-y divide-amber-100/60 border-t border-amber-200/60">
        {lasaItems.map((item) => {
          const pair    = getLASAPair(item.namaObat);
          const checked = !!confirmed[item.id];
          return (
            <motion.button
              key={item.id} whileHover={{ x: 2 }}
              onClick={() => onChange(item.id, !checked)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                checked ? "bg-emerald-50/50" : "hover:bg-amber-50/80",
              )}
            >
              <div className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all",
                checked ? "border-emerald-500 bg-emerald-500" : "border-amber-400",
              )}>
                {checked && <Check size={9} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-800">{item.namaObat}</span>
                {pair && (
                  <span className="ml-2 text-[10px] text-amber-600">
                    ≠ <span className="font-semibold">{pair}</span>
                  </span>
                )}
              </div>
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-black bg-amber-100 text-amber-700">LASA</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Panel wrapper ──────────────────────────────────────────

interface PanelProps {
  icon:     React.ReactNode;
  label:    string;
  accent:   string;
  children: React.ReactNode;
}

function Panel({ icon, label, accent, children }: PanelProps) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/40 p-3">
      <div className="flex items-center gap-2 px-0.5">
        <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-lg", accent)}>
          {icon}
        </span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      </div>
      {children}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function TelaahPane({ order, onSubmit }: Props) {
  const existing = order.telaah;
  const isLocked = !!existing;

  // Jawaban per-aspek (linkId→bool). Item `prefill` (administrasi e-resep) tercentang awal.
  const [answers, setAnswers] = useState<Record<TelaahGroupKey, Record<string, boolean>>>(() => ({
    administrasi: initTelaahGroup("administrasi"),
    farmasetik:   initTelaahGroup("farmasetik"),
    klinis:       initTelaahGroup("klinis"),
  }));
  const [catatan,       setCatatan]       = useState(existing?.catatan       ?? "");
  const [alasanKembali, setAlasanKembali] = useState(existing?.alasanKembali ?? "");
  const [result, setResult] = useState<"Disetujui" | "Dikembalikan" | null>(existing?.result ?? null);
  const [substitusiState,       setSubstitusiState]       = useState<Record<string, SubstitusiState | undefined>>({});
  const [lasaConfirmed,         setLasaConfirmed]         = useState<Record<string, boolean>>({});

  const toggleItem = (key: TelaahGroupKey, linkId: string) =>
    setAnswers((prev) => ({ ...prev, [key]: { ...prev[key], [linkId]: !prev[key][linkId] } }));

  const checkAllGroup = (key: TelaahGroupKey) =>
    setAnswers((prev) => {
      const items = TELAAH_GROUP_BY_KEY[key].items;
      const all   = items.every((it) => prev[key][it.linkId]);
      return { ...prev, [key]: Object.fromEntries(items.map((it) => [it.linkId, !all])) };
    });

  const lulusAdm  = telaahGroupLulus("administrasi", answers.administrasi);
  const lulusFarm = telaahGroupLulus("farmasetik",   answers.farmasetik);
  const lulusKlin = telaahGroupLulus("klinis",       answers.klinis);

  const lasaItems   = order.items.filter((i) => i.isLASA);
  const allLasaDone  = lasaItems.length === 0 || lasaItems.every((i) => lasaConfirmed[i.id]);
  const allDone      = lulusAdm && lulusFarm && lulusKlin && allLasaDone;
  const hamItems     = order.items.filter((i) => i.isHAM);
  const allergies    = order.alergiPasien ?? [];
  const itemNames    = order.items.map((i) => i.namaObat);

  function handleSubstitusiChange(id: string, s: SubstitusiState | undefined) {
    setSubstitusiState((prev) => ({ ...prev, [id]: s }));
  }

  function handleSubmit() {
    if (!result) return;
    const checks: TelaahCheck = { administratif: lulusAdm, farmasetis: lulusFarm, klinis: lulusKlin };
    const substitusi: SubstitusiItem[] = Object.entries(substitusiState)
      .filter(([, v]) => v?.namaGenerik)
      .map(([itemId, v]) => ({
        itemId,
        namaAsli:    order.items.find((i) => i.id === itemId)?.namaObat ?? "",
        namaGenerik: v!.namaGenerik,
        alasan:      v?.alasan || undefined,
      }));
    onSubmit(order.id, {
      checks,
      answers,
      catatan:       catatan || undefined,
      alasanKembali: result === "Dikembalikan" ? alasanKembali : undefined,
      apoteker:      "",  // server isi nama actor (apoteker login)
      waktu:         new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      result,
      substitusi:    substitusi.length > 0 ? substitusi : undefined,
      lasaKonfirmasi: lasaItems.length > 0 ? allLasaDone : undefined,
    });
  }

  // ── Locked view ────────────────────────────────────────

  if (isLocked) {
    const isApproved = existing.result === "Disetujui";
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className={cn(
          "rounded-xl border p-4",
          isApproved ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50",
        )}>
          <div className="flex items-center gap-2.5">
            {isApproved
              ? <CheckCircle2 size={16} className="text-emerald-600" />
              : <XCircle      size={16} className="text-rose-600" />}
            <div>
              <p className={cn("text-sm font-bold", isApproved ? "text-emerald-700" : "text-rose-700")}>
                Telaah {existing.result}
              </p>
              <p className={cn("mt-0.5 text-xs", isApproved ? "text-emerald-600/80" : "text-rose-600/80")}>
                {existing.apoteker} · {existing.waktu}
              </p>
            </div>
          </div>
          {existing.catatan && (
            <p className={cn("mt-2 text-xs italic", isApproved ? "text-emerald-700" : "text-rose-700")}>
              &ldquo;{existing.catatan}&rdquo;
            </p>
          )}
          {existing.alasanKembali && (
            <p className="mt-2 rounded-lg bg-rose-100 px-3 py-2 text-xs font-medium text-rose-800">
              Alasan: {existing.alasanKembali}
            </p>
          )}
        </div>

        {existing.substitusi && existing.substitusi.length > 0 && (
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-sky-700">
              <RefreshCw size={11} />
              Substitusi Generik ({existing.substitusi.length} item)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {existing.substitusi.map((s) => (
                <div key={s.itemId} className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-xs">
                  <p className="text-[11px] text-slate-400 line-through">{s.namaAsli}</p>
                  <p className="font-semibold text-sky-700">{s.namaGenerik}</p>
                  {s.alasan && <p className="mt-0.5 text-[10px] text-slate-400">{s.alasan}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // ── Active form ────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Alerts — full width */}
      {allergies.length > 0 && (
        <AllergyBanner allergies={allergies} itemNames={itemNames} />
      )}

      {hamItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5"
        >
          <AlertTriangle size={13} className="shrink-0 text-rose-600" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-rose-700">High Alert Medication — verifikasi ganda wajib</p>
            <p className="mt-0.5 text-[10px] text-rose-500">{hamItems.map((i) => i.namaObat).join(" · ")}</p>
          </div>
        </motion.div>
      )}

      {/* LASA confirm — full width */}
      <LASAConfirmPanel
        items={order.items}
        confirmed={lasaConfirmed}
        onChange={(id, v) => setLasaConfirmed((p) => ({ ...p, [id]: v }))}
      />

      {/* Two-panel grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        {/* Left panel — Administratif & Farmasetis */}
        <Panel
          label="Administratif & Farmasetis"
          accent="bg-sky-100"
          icon={<ClipboardList size={11} className="text-sky-600" />}
        >
          <CheckSection
            title="Administratif"
            items={TELAAH_GROUP_BY_KEY.administrasi.items}
            answers={answers.administrasi}
            onToggle={(l) => toggleItem("administrasi", l)}
            onCheckAll={() => checkAllGroup("administrasi")}
          />
          <CheckSection
            title="Farmasetis"
            items={TELAAH_GROUP_BY_KEY.farmasetik.items}
            answers={answers.farmasetik}
            onToggle={(l) => toggleItem("farmasetik", l)}
            onCheckAll={() => checkAllGroup("farmasetik")}
          />
        </Panel>

        {/* Right panel — Klinis & Keputusan */}
        <Panel
          label="Klinis & Keputusan"
          accent="bg-emerald-100"
          icon={<Stethoscope size={11} className="text-emerald-600" />}
        >
          <CheckSection
            title="Klinis"
            items={TELAAH_GROUP_BY_KEY.klinis.items}
            answers={answers.klinis}
            onToggle={(l) => toggleItem("klinis", l)}
            onCheckAll={() => checkAllGroup("klinis")}
          />

          <SubstitusiPanel
            items={order.items}
            value={substitusiState}
            onChange={handleSubstitusiChange}
          />

          {/* Catatan */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium text-slate-500">
              Catatan Apoteker <span className="text-slate-300">(opsional)</span>
            </label>
            <textarea
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Catatan klinis tambahan…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Setujui / Kembalikan */}
          <div className="flex gap-2">
            <motion.button
              whileHover={allDone ? { scale: 1.01 } : {}}
              whileTap={allDone ? { scale: 0.98 } : {}}
              onClick={() => setResult("Disetujui")}
              disabled={!allDone}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all",
                result === "Disetujui"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                  : "border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40",
              )}
            >
              <CheckCircle2 size={13} />Setujui
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setResult("Dikembalikan")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition-all",
                result === "Dikembalikan"
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-200"
                  : "border border-rose-200 text-rose-700 hover:bg-rose-50",
              )}
            >
              <XCircle size={13} />Kembalikan
            </motion.button>
          </div>
        </Panel>
      </div>

      {/* Alasan dikembalikan — full width */}
      <AnimatePresence>
        {result === "Dikembalikan" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="mb-1.5 block text-xs font-semibold text-rose-600">Alasan dikembalikan *</label>
            <textarea
              value={alasanKembali}
              onChange={(e) => setAlasanKembali(e.target.value)}
              rows={2}
              placeholder="Mis: Dosis melebihi batas maksimal, perlu koreksi dokter…"
              className="w-full resize-none rounded-xl border border-rose-200 bg-rose-50/50 px-3 py-2 text-xs text-rose-700 outline-none focus:ring-2 focus:ring-rose-100"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simpan — full width */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        disabled={!result || (result === "Dikembalikan" && !alasanKembali)}
        className="w-full rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Simpan Hasil Telaah
      </motion.button>
    </div>
  );
}
