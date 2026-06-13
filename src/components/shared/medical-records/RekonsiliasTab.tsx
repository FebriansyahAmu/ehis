"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Home, Info, ClipboardList, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import type { KategoriObat } from "@/lib/data";
import type { ObatCatalog } from "@/components/shared/resep/resepShared";
import { ApiError } from "@/lib/api/client";
import { listObatTersedia, type ObatTersediaDTO } from "@/lib/api/master/obatTersedia";
import {
  getRekonsiliasi, addRekonsiliasi, type RekonsiliasiDTO,
} from "@/lib/api/rekonsiliasi/rekonsiliasi";
import {
  REKON_PHASES, emptyRekon,
  type RekonContext, type RekonPhase, type RekonData, type Keputusan,
} from "./rekonsiliasi/rekonsiliasiShared";
import RekonSection from "./rekonsiliasi/RekonSection";
import RekonHistory from "./rekonsiliasi/RekonHistory";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Obat ter-formularium (DB) → bentuk ObatCatalog yang dipakai ObatSearch. Golongan → KategoriObat.
function toObatCatalog(o: ObatTersediaDTO): ObatCatalog {
  const g = o.golongan ?? "";
  const kategori: KategoriObat =
    g.startsWith("Narkotika") ? "Narkotika" : g.startsWith("Psikotropika") ? "Psikotropika" : "Reguler";
  return {
    kode: o.kode,
    nama: o.namaGenerik,
    dosis: o.kekuatan,
    satuan: "",
    stok: 0, // formularium tak melacak stok → ObatSearch sembunyikan badge stok (showStock=false)
    kategori,
    isHAM: o.isHAM,
  };
}

// ISO (UTC) → "YYYY-MM-DDTHH:mm" waktu lokal (kontrak DateTimePicker / datetime-local).
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// DTO snapshot → RekonData (seed form dari snapshot terbaru per fase).
function dtoToRekonData(dto: RekonsiliasiDTO): RekonData {
  return {
    selesai: dto.selesai,
    tanggal: isoToLocalInput(dto.waktu),
    petugas: dto.petugas,
    catatan: dto.catatan ?? "",
    obatList: dto.obatList.map((o) => ({
      id: o.id,
      namaObat: o.namaObat,
      dosis: o.dosis ?? "",
      rute: o.rute ?? "Oral",
      frekuensi: o.frekuensi ?? "",
      sumber: o.sumber ?? "Rumah",
      keputusan: o.keputusan as Keputusan,
      gantiDengan: o.gantiDengan ?? undefined,
      alasan: o.alasan ?? undefined,
      isHAM: o.isHAM,
    })),
  };
}

// ── Patient interface (minimal — both IGD and RI satisfy this) ─

interface RekonPatient {
  /** kunjunganId (UUID) bila pasien terdaftar → persist; mock (igd-1) → lokal saja. */
  id?:          string;
  noRM:         string;
  name?:        string;
  obatSaatIni?: string;
}

interface Props {
  patient: RekonPatient;
  context: RekonContext;
}

type ViewKey = "form" | "riwayat";

// ── HAM summary banner ─────────────────────────────────────

function HAMBanner({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -6, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3">
            <AlertTriangle size={13} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-[11px] text-red-700">
              <span className="font-bold">{count} obat High-Alert Medication (HAM)</span>{" "}
              terdeteksi dalam rekonsiliasi ini. Wajib verifikasi ganda sebelum pemberian.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Home meds banner (shown for RI when obatSaatIni available) ─

function HomeMedsBanner({ obatSaatIni }: { obatSaatIni?: string }) {
  if (!obatSaatIni) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <Home size={13} className="mt-0.5 shrink-0 text-slate-400" />
      <p className="text-[11px] text-slate-600">
        <span className="font-semibold">Obat dari rumah (anamnesis):</span>{" "}
        {obatSaatIni}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function RekonsiliasTab({ patient, context }: Props) {
  const phases = REKON_PHASES[context];
  const { session } = useSession();
  const kunjunganId = patient.id ?? "";
  const isPersisted = UUID_RE.test(kunjunganId);

  const [view, setView] = useState<ViewKey>("form");
  const [open, setOpen] = useState<RekonPhase | null>(null);
  const [dataMap, setDataMap] = useState<Record<RekonPhase, RekonData>>({
    admisi:    emptyRekon(),
    transfer:  emptyRekon(),
    discharge: emptyRekon(),
  });

  // Riwayat (semua snapshot) + seed form dari snapshot terbaru per fase.
  const [history, setHistory] = useState<RekonsiliasiDTO[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(isPersisted);
  const [savingFase, setSavingFase] = useState<RekonPhase | null>(null);

  useEffect(() => {
    if (!isPersisted) { setLoadingHistory(false); return; }
    const ac = new AbortController();
    getRekonsiliasi(kunjunganId, ac.signal)
      .then((rows) => {
        setHistory(rows);
        setDataMap((prev) => {
          const next = { ...prev };
          for (const f of ["admisi", "transfer", "discharge"] as RekonPhase[]) {
            const latest = rows.find((r) => r.fase === f); // rows desc by createdAt → first = terbaru
            if (latest) next[f] = dtoToRekonData(latest);
          }
          return next;
        });
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat riwayat rekonsiliasi", e instanceof ApiError ? e.message : undefined);
      })
      .finally(() => { if (!ac.signal.aborted) setLoadingHistory(false); });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  // Katalog obat = obat ter-formularium (Mapping Hub → Formularium), gate clinical.resep.
  // undefined = belum termuat / tak ber-hak → ObatSearch fallback ke mock (degradasi anggun).
  // Per-unit scoping (?ruanganKode=) forward-ready; ruangan pasien IGD masih mock → ambil semua.
  const [catalog, setCatalog] = useState<ObatCatalog[] | undefined>(undefined);
  useEffect(() => {
    const ac = new AbortController();
    listObatTersedia({}, ac.signal)
      .then((items) => setCatalog(items.map(toObatCatalog)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        // 403 (tanpa hak) / belum login → biarkan undefined (fallback mock).
      });
    return () => ac.abort();
  }, []);

  async function handleSave(fase: RekonPhase) {
    const data = dataMap[fase];
    if (!isPersisted) {
      toast.info("Mode demo", "Rekonsiliasi pasien contoh tidak dipersist.");
      return;
    }
    setSavingFase(fase);
    try {
      const dto = await addRekonsiliasi(kunjunganId, {
        fase,
        selesai: data.selesai,
        catatan: data.catatan || undefined,
        waktu: data.tanggal ? new Date(data.tanggal) : undefined,
        obatList: data.obatList.map((o) => ({
          namaObat: o.namaObat,
          dosis: o.dosis || undefined,
          rute: o.rute || undefined,
          frekuensi: o.frekuensi || undefined,
          sumber: o.sumber || undefined,
          keputusan: o.keputusan,
          gantiDengan: o.gantiDengan || undefined,
          alasan: o.alasan || undefined,
          isHAM: o.isHAM,
        })),
      });
      setHistory((h) => [dto, ...h]);
      setDataMap((p) => ({ ...p, [fase]: dtoToRekonData(dto) })); // re-seed dari snapshot kanonik
      toast.success("Rekonsiliasi tersimpan", `Fase ${fase} · ${dto.obatList.length} obat`);
    } catch (e) {
      toast.error("Gagal menyimpan rekonsiliasi", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSavingFase(null);
    }
  }

  const totalHAM  = Object.values(dataMap).reduce(
    (acc, d) => acc + d.obatList.filter((o) => o.isHAM).length,
    0,
  );

  return (
    <div className="flex flex-col gap-3">

      {/* Sub-menu: Rekonsiliasi (form) | Riwayat */}
      <div className="flex items-center gap-1 self-start rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
        <SubTab active={view === "form"} onClick={() => setView("form")} icon={ClipboardList} label="Rekonsiliasi" />
        <SubTab active={view === "riwayat"} onClick={() => setView("riwayat")} icon={History} label="Riwayat" count={history.length} />
      </div>

      <AnimatePresence mode="wait">
        {view === "form" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
          >
            <HAMBanner count={totalHAM} />

            {context === "ri" && <HomeMedsBanner obatSaatIni={patient.obatSaatIni} />}

            {/* Card containing compliance note + all sections */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">

              {/* Compliance note */}
              <div className="flex items-start gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
                <Info size={11} className="mt-0.5 shrink-0 text-slate-400" />
                <p className="text-[10px] text-slate-400">
                  SNARS PP 3.1 · SKP 3 · PMK 72/2016 — Rekonsiliasi wajib di setiap titik transisi perawatan pasien
                </p>
              </div>

              {/* Sections */}
              {phases.map((phase, idx) => (
                <div key={phase.id} className={cn(idx > 0 && "border-t border-slate-100")}>
                  <RekonSection
                    phase={phase}
                    data={dataMap[phase.id]}
                    onChange={(d) => setDataMap((p) => ({ ...p, [phase.id]: d }))}
                    isOpen={open === phase.id}
                    onToggle={() => setOpen((prev) => (prev === phase.id ? null : phase.id))}
                    petugasLogin={session?.namaTampil}
                    catalog={catalog}
                    onSimpan={() => handleSave(phase.id)}
                    saving={savingFase === phase.id}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="riwayat"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <RekonHistory history={history} isPersisted={isPersisted} loading={loadingHistory} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-tab pill ───────────────────────────────────────────

function SubTab({
  active, onClick, icon: Icon, label, count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof ClipboardList;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
        active ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:bg-slate-50",
      )}
    >
      <Icon size={13} />
      {label}
      {count !== undefined && count > 0 && (
        <span className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
          active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500",
        )}>
          {count}
        </span>
      )}
    </button>
  );
}
