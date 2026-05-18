"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, CheckCircle2, ChevronDown, ChevronUp,
  Plus, Pill, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type RadOrder, type ReaksiGrade, type KontrasJenis, fmtDate,
} from "../radShared";

// ── Types ─────────────────────────────────────────────────

interface KontrasReaksiEntry {
  id:          string;
  tanggal:     string;
  jenis:       KontrasJenis;
  produk:      string;
  dosis:       string;
  reaksi:      ReaksiGrade;
  manifestasi: string[];
  onset:       string;
  tatalaksana: string;
  dokter:      string;
  catatan?:    string;
}

// ── Config ────────────────────────────────────────────────

const REAKSI_CFG: Record<ReaksiGrade, {
  label: string; badge: string; ring: string; textColor: string; icon: string;
  manifestasi: string[];
}> = {
  "Tidak Ada": {
    label: "Tidak Ada Reaksi", icon: "✓",
    badge: "bg-emerald-100 text-emerald-700", ring: "border-emerald-200", textColor: "text-emerald-700",
    manifestasi: [],
  },
  "Ringan": {
    label: "Reaksi Ringan", icon: "!",
    badge: "bg-amber-100 text-amber-700", ring: "border-amber-200", textColor: "text-amber-700",
    manifestasi: ["Mual", "Muntah ringan", "Urtikaria ringan", "Flushing", "Pruritus", "Sensasi panas"],
  },
  "Sedang": {
    label: "Reaksi Sedang", icon: "!!",
    badge: "bg-orange-100 text-orange-700", ring: "border-orange-200", textColor: "text-orange-700",
    manifestasi: ["Urtikaria luas", "Bronkospasme", "Edema wajah", "Edema laring", "Hipotensi"],
  },
  "Berat": {
    label: "Reaksi Berat", icon: "!!!",
    badge: "bg-rose-100 text-rose-700", ring: "border-rose-200", textColor: "text-rose-700",
    manifestasi: ["Anafilaksis", "Syok anafilaktik", "Aritmia berat", "Henti jantung", "Edema laring berat"],
  },
};

const KONTRAS_LABEL: Record<KontrasJenis, string> = {
  Iodinasi_IV:     "Iodinasi IV",
  Iodinasi_Oral:   "Iodinasi Oral",
  Iodinasi_Rektal: "Iodinasi Rektal",
  Gadolinium:      "Gadolinium (MRI)",
  Tidak:           "Tanpa Kontras",
};

const SEMUA_MANIFESTASI = [
  ...new Set([
    ...REAKSI_CFG["Ringan"].manifestasi,
    ...REAKSI_CFG["Sedang"].manifestasi,
    ...REAKSI_CFG["Berat"].manifestasi,
  ]),
];

const REAKSI_RANK: Record<ReaksiGrade, number> = {
  "Tidak Ada": 0, "Ringan": 1, "Sedang": 2, "Berat": 3,
};

// Premedikasi protocol — ACR Manual on Contrast Media Ed. 11
const PREMEDIKASI_STEPS = [
  { jam: "−13 jam", obat: "Methylprednisolone 32 mg PO", catatan: "atau Prednisone 50 mg PO" },
  { jam: "−7 jam",  obat: "Methylprednisolone 32 mg PO", catatan: "atau Prednisone 50 mg PO" },
  { jam: "−1 jam",  obat: "Diphenhydramine 25–50 mg IV/IM/PO", catatan: "wajib; ± H2-blocker" },
];

// ── Mock history ──────────────────────────────────────────

const KONTRAS_HISTORY_MOCK: Record<string, KontrasReaksiEntry[]> = {
  "RM-2025-003": [
    {
      id: "kr-1", tanggal: "2024-03-15",
      jenis: "Iodinasi_IV", produk: "Omnipaque 350 (Iohexol)", dosis: "80 mL",
      reaksi: "Ringan",
      manifestasi: ["Mual", "Urtikaria ringan di lengan"],
      onset: "5 menit post-injeksi",
      tatalaksana: "Diphenhydramine 25 mg IV, observasi 30 menit — resolusi lengkap",
      dokter: "dr. Wirawan Kusuma Sp.Rad",
      catatan: "Direkomendasikan premedikasi steroid untuk pemeriksaan kontras berikutnya",
    },
  ],
  "RM-2025-012": [
    {
      id: "kr-2", tanggal: "2023-11-20",
      jenis: "Iodinasi_IV", produk: "Ultravist 370 (Iopromide)", dosis: "70 mL",
      reaksi: "Sedang",
      manifestasi: ["Urtikaria luas", "Bronkospasme ringan"],
      onset: "3 menit post-injeksi",
      tatalaksana: "Epinephrine 0.3 mg IM, Methylprednisolone 125 mg IV, O₂ masker — resolusi 45 menit",
      dokter: "dr. Ahmad Yusuf Sp.EM",
      catatan: "Wajib premedikasi steroid penuh untuk kontras berikutnya",
    },
  ],
};

// ── ReaksiCard ────────────────────────────────────────────

function ReaksiCard({ entry, defaultOpen }: { entry: KontrasReaksiEntry; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = REAKSI_CFG[entry.reaksi];

  return (
    <div className={cn("rounded-2xl border bg-white transition-shadow", cfg.ring)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left"
      >
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
          cfg.badge,
        )}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-slate-800 truncate">{entry.produk}</p>
            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold", cfg.badge)}>
              {cfg.label}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {fmtDate(entry.tanggal)} · {KONTRAS_LABEL[entry.jenis]} · {entry.dosis}
          </p>
        </div>
        <div className="shrink-0 text-slate-400">
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="grid gap-3 p-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Manifestasi</p>
                <div className="flex flex-wrap gap-1">
                  {entry.manifestasi.map((m) => (
                    <span key={m} className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700">{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Onset</p>
                <p className="text-[11px] text-slate-600">{entry.onset}</p>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tatalaksana</p>
                <p className="text-[11px] leading-relaxed text-slate-600">{entry.tatalaksana}</p>
              </div>
              {entry.catatan && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                  <p className="mb-0.5 text-[10px] font-bold text-amber-700">Catatan</p>
                  <p className="text-[10px] leading-relaxed text-amber-600">{entry.catatan}</p>
                </div>
              )}
              <p className="text-[10px] text-slate-400">Dicatat oleh: {entry.dokter}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── AddReaksiForm ─────────────────────────────────────────

function AddReaksiForm({ onAdd, onClose }: {
  onAdd:   (e: KontrasReaksiEntry) => void;
  onClose: () => void;
}) {
  const [reaksi,      setReaksi]      = useState<ReaksiGrade>("Ringan");
  const [manifestasi, setManifestasi] = useState<string[]>([]);
  const [onset,       setOnset]       = useState("");
  const [tatalaksana, setTatalaksana] = useState("");
  const [dokter,      setDokter]      = useState("");

  const canSubmit = onset.trim() && tatalaksana.trim() && dokter.trim();

  const toggleManifest = (m: string) =>
    setManifestasi((prev) => prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAdd({
      id: Date.now().toString(),
      tanggal: new Date().toISOString().slice(0, 10),
      jenis: "Iodinasi_IV", produk: "—", dosis: "—",
      reaksi, manifestasi, onset: onset.trim(),
      tatalaksana: tatalaksana.trim(), dokter: dokter.trim(),
    });
    onClose();
  };

  const inputCls = "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <p className="mb-3 text-[11px] font-bold text-slate-600">Tambah Reaksi Kontras</p>

      {/* Grade */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {(["Ringan", "Sedang", "Berat"] as ReaksiGrade[]).map((g) => (
          <button key={g} type="button" onClick={() => setReaksi(g)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all border",
              reaksi === g ? cn(REAKSI_CFG[g].badge, "ring-1 ring-current") : "border-slate-200 text-slate-500",
            )}>
            {g}
          </button>
        ))}
      </div>

      {/* Manifestasi chips */}
      <div className="mb-3">
        <p className="mb-1.5 text-[10px] font-bold text-slate-500">Manifestasi (pilih semua yang sesuai)</p>
        <div className="flex flex-wrap gap-1.5">
          {SEMUA_MANIFESTASI.map((m) => (
            <button key={m} type="button" onClick={() => toggleManifest(m)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all",
                manifestasi.includes(m)
                  ? "border-rose-300 bg-rose-100 text-rose-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300",
              )}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2">
        <label className="mb-1 block text-[10px] font-bold text-slate-500">Onset</label>
        <input value={onset} onChange={(e) => setOnset(e.target.value)}
          placeholder="mis. 5 menit post-injeksi" className={inputCls} />
      </div>
      <div className="mb-2">
        <label className="mb-1 block text-[10px] font-bold text-slate-500">Tatalaksana</label>
        <textarea rows={2} value={tatalaksana} onChange={(e) => setTatalaksana(e.target.value)}
          placeholder="mis. Diphenhydramine 25 mg IV, observasi 30 menit"
          className={cn(inputCls, "resize-none")} />
      </div>
      <div className="mb-4">
        <label className="mb-1 block text-[10px] font-bold text-slate-500">Dokter Penanggung Jawab</label>
        <input value={dokter} onChange={(e) => setDokter(e.target.value)}
          placeholder="Nama + spesialisasi" className={inputCls} />
      </div>

      <div className="flex gap-2">
        <button onClick={onClose}
          className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-500 hover:bg-slate-50">
          Batal
        </button>
        <button onClick={handleSubmit} disabled={!canSubmit}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
            canSubmit ? "bg-rose-600 text-white hover:bg-rose-700" : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}>
          Simpan
        </button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function KontrasPane({ order }: { order: RadOrder }) {
  const kontrasUsed = order.persiapan?.kontras;
  const [history, setHistory] = useState<KontrasReaksiEntry[]>(
    KONTRAS_HISTORY_MOCK[order.noRM] ?? [],
  );
  const [showForm, setShowForm] = useState(false);

  const hasHistory = history.length > 0;
  const highestReaksi = history.reduce<ReaksiGrade>(
    (acc, e) => REAKSI_RANK[e.reaksi] > REAKSI_RANK[acc] ? e.reaksi : acc,
    "Tidak Ada",
  );
  const needsPremedikasi = hasHistory && highestReaksi !== "Tidak Ada";

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_260px]">

      {/* ── Left: history + form ── */}
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-3 text-white",
          needsPremedikasi ? "bg-rose-600" : "bg-teal-600",
        )}>
          <ShieldAlert size={20} className="shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Riwayat Reaksi Kontras Media</p>
            <p className={cn("text-[11px]", needsPremedikasi ? "text-rose-200" : "text-teal-200")}>
              {order.namaPasien} · {order.noRM} · ACR Manual on Contrast Media Ed. 11
            </p>
          </div>
          {needsPremedikasi && (
            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold", REAKSI_CFG[highestReaksi].badge)}>
              {REAKSI_CFG[highestReaksi].label}
            </span>
          )}
        </div>

        {/* Kontras warning banner */}
        {needsPremedikasi && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <p className="text-[12px] font-bold text-rose-800">Riwayat Reaksi Kontras — Premedikasi Wajib</p>
              <p className="mt-0.5 text-[11px] text-rose-600">
                Pasien ini memiliki riwayat reaksi kontras ({highestReaksi}). Protokol premedikasi steroid ACR wajib diberikan sebelum pemberian kontras iodinasi.
              </p>
            </div>
          </motion.div>
        )}

        {/* Current order kontras info */}
        {kontrasUsed && kontrasUsed.jenis !== "Tidak" && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-teal-700">
              Kontras pada Order Ini
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {[
                { label: "Jenis",       value: KONTRAS_LABEL[kontrasUsed.jenis]         },
                { label: "Dosis",       value: kontrasUsed.dosis ?? "—"                 },
                { label: "Kecepatan",   value: kontrasUsed.kecepatan ?? "—"             },
                { label: "Premedikasi", value: kontrasUsed.premedikasi ? "✓ Diberikan" : "✗ Tidak"    },
                { label: "Reaksi Intra",value: kontrasUsed.reaksiIntra                  },
                { label: "Konsent TTD", value: kontrasUsed.konsentSigned ? "✓ Ditanda" : "✗ Belum"    },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b border-teal-100 pb-1">
                  <span className="text-teal-500">{label}</span>
                  <span className="font-semibold text-teal-800">{value}</span>
                </div>
              ))}
            </div>
            {kontrasUsed.reaksiIntra !== "Tidak Ada" && (
              <div className={cn(
                "mt-3 rounded-xl border p-2.5",
                REAKSI_CFG[kontrasUsed.reaksiIntra].badge,
                REAKSI_CFG[kontrasUsed.reaksiIntra].ring,
              )}>
                <p className="text-[10px] font-bold">
                  ⚠ Reaksi Intra-Prosedur: {kontrasUsed.reaksiIntra}
                </p>
                {kontrasUsed.catatan && (
                  <p className="mt-0.5 text-[10px]">{kontrasUsed.catatan}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* History list */}
        {!hasHistory ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
            <CheckCircle2 size={24} className="text-emerald-300" />
            <div>
              <p className="text-sm font-semibold text-emerald-600">Tidak Ada Riwayat Reaksi Kontras</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Pasien belum pernah mengalami reaksi kontras media</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {history.map((entry, i) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ReaksiCard entry={entry} defaultOpen={i === 0} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <AddReaksiForm
              onAdd={(e) => { setHistory((prev) => [e, ...prev]); }}
              onClose={() => setShowForm(false)}
            />
          )}
        </AnimatePresence>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-400 transition-colors hover:border-rose-300 hover:text-rose-500"
          >
            <Plus size={14} /> Tambah Reaksi Kontras
          </button>
        )}
      </div>

      {/* ── Right: risk + protocol ── */}
      <div className="flex flex-col gap-3">

        {/* Risk summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Penilaian Risiko</p>
          <div className={cn(
            "rounded-xl border p-3 text-center",
            needsPremedikasi ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50",
          )}>
            <p className={cn(
              "text-xl font-black",
              needsPremedikasi ? "text-rose-700" : "text-emerald-700",
            )}>
              {needsPremedikasi ? REAKSI_CFG[highestReaksi].label : "Risiko Standar"}
            </p>
            <p className={cn("mt-1 text-[10px]", needsPremedikasi ? "text-rose-500" : "text-emerald-500")}>
              {hasHistory ? `${history.length} riwayat reaksi` : "Tidak ada riwayat reaksi"}
            </p>
          </div>
          <div className="mt-3 space-y-1.5 text-[11px]">
            {[
              { label: "Total Riwayat", value: `${history.length} kejadian`           },
              { label: "Kontras Ini",   value: kontrasUsed ? KONTRAS_LABEL[kontrasUsed.jenis] : "—" },
              { label: "Premedikasi",   value: kontrasUsed?.premedikasi ? "✓ Diberikan" : needsPremedikasi ? "⚠ Belum" : "Tidak diperlukan" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-400">{label}</span>
                <span className="font-semibold text-slate-700">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Premedikasi protocol */}
        {needsPremedikasi && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <Pill size={14} className="text-amber-700" />
              <p className="text-[11px] font-bold text-amber-800">Protokol Premedikasi</p>
              <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                ACR Ed. 11
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {PREMEDIKASI_STEPS.map(({ jam, obat, catatan }) => (
                <div key={jam} className="flex gap-2.5">
                  <div className="w-14 shrink-0 rounded-lg bg-amber-200/60 px-1.5 py-1 text-center">
                    <p className="text-[9px] font-bold text-amber-800 leading-tight">{jam}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-amber-800">{obat}</p>
                    <p className="text-[9px] text-amber-600">{catatan}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[9px] italic text-amber-600">
              Konfirmasi dengan SpRad sebelum pemberian. Pastikan IV access terpasang.
            </p>
          </motion.div>
        )}

        {/* Klasifikasi reaksi reference */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Klasifikasi Reaksi (ACR)</p>
          <div className="flex flex-col gap-2">
            {(["Ringan", "Sedang", "Berat"] as ReaksiGrade[]).map((grade) => {
              const cfg = REAKSI_CFG[grade];
              return (
                <div key={grade} className={cn("rounded-xl border p-2.5", cfg.ring,
                  grade === "Berat" ? "bg-rose-50" : grade === "Sedang" ? "bg-orange-50" : "bg-amber-50",
                )}>
                  <p className={cn("text-[10px] font-bold mb-0.5", cfg.textColor)}>{cfg.label}</p>
                  <p className={cn("text-[9px] leading-relaxed", cfg.textColor, "opacity-80")}>
                    {cfg.manifestasi.slice(0, 3).join(" · ")}
                    {cfg.manifestasi.length > 3 && ` +${cfg.manifestasi.length - 3} lainnya`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reference footer */}
        <div className="rounded-xl bg-slate-800 p-3">
          <p className="text-[10px] font-bold text-teal-300">ACR Manual on Contrast Media Ed. 11</p>
          <p className="mt-1 text-[9px] leading-relaxed text-slate-400">
            Semua pasien dengan riwayat reaksi kontras wajib mendapat premedikasi steroid sebelum pemberian kontras iodinasi berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
