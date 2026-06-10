"use client";

// Penandaan Gambar (status lokalis) — kanvas 3D anatomis (Dewasa/Anak, orbit bebas +
// preset Depan/Belakang/Kepala-Leher, raycast marking per-regio) + Odontogram FDI 2D.
// Sub-komponen di ./penandaan/ (HumanModel · Viewer3D · OdontogramChart · PenandaanPanels).

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Save,
  RotateCcw,
  Crosshair,
  FileText,
  Eye,
  Layers,
  ScanEye,
  PersonStanding,
  Baby,
  Smile,
  Loader2,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  SEV,
  SEV_ORDER,
  MODEL_LABEL,
  VIEW_PRESETS,
  type Anotasi,
  type KanvasMode,
  type PendingMark,
  type Severitas,
  type ViewPresetId,
} from "./penandaan/penandaanShared";
import OdontogramCanvas from "./penandaan/OdontogramChart";
import {
  AnotasiForm,
  AnotasiItem,
  DetailPanel,
  SaveToast,
} from "./penandaan/PenandaanPanels";

// Canvas WebGL hanya di client
const Viewer3D = dynamic(() => import("./penandaan/Viewer3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-105 w-full items-center justify-center rounded-lg bg-slate-50 sm:h-120 lg:h-135">
      <div className="flex flex-col items-center gap-2">
        <Loader2 size={20} className="animate-spin text-indigo-400" />
        <p className="text-[10px] font-medium text-slate-400">
          Memuat model 3D…
        </p>
      </div>
    </div>
  ),
});

const MODE_TABS: { id: KanvasMode; label: string; icon: typeof PersonStanding }[] = [
  { id: "dewasa", label: "Dewasa", icon: PersonStanding },
  { id: "anak", label: "Anak", icon: Baby },
  { id: "gigi", label: "Odontogram", icon: Smile },
];

export default function PenandaanGambarTab({
  patient: _patient,
}: {
  patient: IGDPatientDetail;
}) {
  const [mode, setMode] = useState<KanvasMode>("dewasa");
  const [view, setView] = useState<ViewPresetId | null>("depan");
  const [anotasiList, setAnotasiList] = useState<Anotasi[]>([]);
  const [pending, setPending] = useState<PendingMark | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const onModeAnotasi = useMemo(
    () => anotasiList.filter((a) => a.mode === mode),
    [anotasiList, mode],
  );

  const switchMode = (m: KanvasMode) => {
    setMode(m);
    setPending(null);
    setSelectedId(null);
    if (m !== "gigi") setView("depan");
  };

  // klik tubuh 3D → pending mark dengan regio terdeteksi
  const handleMark3D = (pos: [number, number, number], region: string) => {
    if (pending) return;
    setPending({ mode, pos3d: pos, koordinat2d: null, region });
    setSelectedId(null);
  };

  // klik chart gigi → pending mark koordinat-%
  const handleMarkGigi = (koordinat: { x: number; y: number }) => {
    setPending({
      mode: "gigi",
      pos3d: null,
      koordinat2d: koordinat,
      region: "Gigi / Odontogram",
    });
    setSelectedId(null);
  };

  const handleSave = (
    data: Pick<Anotasi, "label" | "deskripsi" | "severitas">,
  ) => {
    if (!pending) return;
    const now = new Date().toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const next: Anotasi = {
      id: `an-${Date.now()}`,
      mode: pending.mode,
      pos3d: pending.pos3d,
      koordinat2d: pending.koordinat2d,
      region: pending.region,
      createdAt: now,
      ...data,
    };
    setAnotasiList((prev) => [...prev, next]);
    setSelectedId(next.id);
    setPending(null);
  };

  const handleDelete = (id: string) => {
    setAnotasiList((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleReset = () => {
    setAnotasiList((prev) => prev.filter((a) => a.mode !== mode));
    setSelectedId(null);
    setPending(null);
  };

  const handleSaveAll = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const displayList = filterActive ? onModeAnotasi : anotasiList;
  const selectedAnotasi = selectedId
    ? (anotasiList.find((a) => a.id === selectedId) ?? null)
    : null;

  const sevCounts = SEV_ORDER.reduce<Partial<Record<Severitas, number>>>(
    (acc, s) => {
      const n = anotasiList.filter((a) => a.severitas === s).length;
      if (n > 0) acc[s] = n;
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col gap-3">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <ScanEye size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">
            Penandaan Gambar 3D
          </p>
          <p className="text-[10px] text-slate-400">
            Putar model, klik permukaan tubuh untuk menandai status lokalis
          </p>
        </div>

        {anotasiList.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
              <MapPin size={10} className="text-indigo-400" />
              <span className="text-[10px] font-semibold text-slate-600">
                {anotasiList.length}
              </span>
            </div>
            {SEV_ORDER.filter((s) => sevCounts[s]).map((s) => {
              const c = SEV[s];
              return (
                <span
                  key={s}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ring-1",
                    c.bg,
                    c.text,
                    c.ring,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
                  {sevCounts[s]}
                </span>
              );
            })}
            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xs transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <Save size={10} /> Simpan Semua
            </button>
          </div>
        )}
      </div>

      {/* ── Toolbar: model + view preset ── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xs">
        {/* segmented model */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {MODE_TABS.map((t) => {
            const Icon = t.icon;
            const act = mode === t.id;
            const cnt = anotasiList.filter((a) => a.mode === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => switchMode(t.id)}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-all duration-150",
                  act
                    ? "bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon size={13} className={act ? "text-indigo-500" : "text-slate-400"} />
                {t.label}
                {cnt > 0 && (
                  <span
                    className={cn(
                      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white",
                      act ? "bg-indigo-600" : "bg-slate-400",
                    )}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* view presets — hanya mode 3D */}
        {mode !== "gigi" && (
          <div className="flex items-center gap-1 sm:ml-auto">
            <span className="mr-1 hidden text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:inline">
              Tampilan
            </span>
            {VIEW_PRESETS.map((v) => {
              const act = view === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all duration-150",
                    act
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  {v.label}
                </button>
              );
            })}
            {view === null && (
              <span className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[10px] font-medium text-slate-400">
                Orbit bebas
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Workspace ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
        {/* Kiri: kanvas */}
        <div className="min-w-0 flex-1">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            {/* toolbar kanvas */}
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
              <Layers size={11} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-700">
                {MODEL_LABEL[mode]}
              </p>
              <span className="text-[10px] text-slate-400">
                {mode === "gigi"
                  ? "— FDI chart · 32 gigi"
                  : "— model anatomi 3D interaktif"}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                {onModeAnotasi.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-500 transition hover:bg-rose-100"
                  >
                    <RotateCcw size={9} /> Reset
                  </button>
                )}
                <div
                  className={cn(
                    "flex items-center gap-1 rounded-md border px-2 py-0.5",
                    pending
                      ? "border-indigo-200 bg-indigo-50"
                      : "border-slate-200 bg-slate-50",
                  )}
                >
                  <Crosshair
                    size={9}
                    className={pending ? "text-indigo-500" : "text-slate-400"}
                  />
                  <span
                    className={cn(
                      "text-[9px]",
                      pending ? "font-semibold text-indigo-600" : "text-slate-400",
                    )}
                  >
                    {pending ? "Isi detail anotasi…" : "Klik untuk tandai"}
                  </span>
                </div>
              </div>
            </div>

            {/* kanvas */}
            <div className="p-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === "gigi" ? (
                    <OdontogramCanvas
                      markers={onModeAnotasi}
                      pending={pending?.koordinat2d ?? null}
                      selectedId={selectedId}
                      onPick={handleMarkGigi}
                      onSelectMarker={(id) =>
                        setSelectedId(id === selectedId ? null : id)
                      }
                    />
                  ) : (
                    <Viewer3D
                      jenis={mode}
                      view={view}
                      onFreeOrbit={() => setView(null)}
                      markers={onModeAnotasi}
                      pendingPos={pending?.pos3d ?? null}
                      selectedId={selectedId}
                      onSelectMarker={(id) =>
                        setSelectedId(id === selectedId ? null : id)
                      }
                      onMark={handleMark3D}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* legend */}
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Severitas:
              </span>
              {SEV_ORDER.map((s) => {
                const c = SEV[s];
                return (
                  <span key={s} className="flex items-center gap-1">
                    <span className={cn("h-2 w-2 rounded-full", c.pinBg)} />
                    <span className="text-[9px] text-slate-500">{s}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kanan: form + list */}
        <div className="flex w-full shrink-0 flex-col gap-3 lg:w-95">
          <AnimatePresence>
            {pending && (
              <AnotasiForm
                key={`form-${pending.region}-${pending.pos3d?.join(",") ?? `${pending.koordinat2d?.x},${pending.koordinat2d?.y}`}`}
                region={pending.region}
                initialLabel={pending.mode === "gigi" ? "" : pending.region}
                onSave={handleSave}
                onCancel={() => setPending(null)}
                labelPlaceholder={
                  pending.mode === "gigi"
                    ? "mis. Gigi 11, 16 karies, 36 fraktur…"
                    : undefined
                }
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selectedAnotasi && !pending && (
              <DetailPanel
                key="detail"
                anotasi={selectedAnotasi}
                displayIdx={onModeAnotasi.indexOf(selectedAnotasi)}
                onClose={() => setSelectedId(null)}
              />
            )}
          </AnimatePresence>

          {anotasiList.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                <FileText size={11} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">
                  Daftar Anotasi
                </p>
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                  {displayList.length}
                </span>
                <button
                  onClick={() => setFilterActive((v) => !v)}
                  className={cn(
                    "ml-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold transition",
                    filterActive
                      ? "bg-indigo-100 text-indigo-600"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                  )}
                >
                  <Eye size={9} />
                  {filterActive ? MODEL_LABEL[mode] : "Semua"}
                </button>
              </div>

              <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto p-2">
                <AnimatePresence initial={false}>
                  {displayList.length === 0 ? (
                    <p className="py-5 text-center text-[10px] text-slate-400">
                      Belum ada anotasi pada {MODEL_LABEL[mode]}
                    </p>
                  ) : (
                    displayList.map((a, i) => (
                      <AnotasiItem
                        key={a.id}
                        anotasi={a}
                        displayIdx={
                          filterActive
                            ? i
                            : anotasiList
                                .filter((x) => x.mode === a.mode)
                                .indexOf(a)
                        }
                        selected={selectedId === a.id}
                        onSelect={() =>
                          setSelectedId(a.id === selectedId ? null : a.id)
                        }
                        onDelete={() => handleDelete(a.id)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            !pending && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs ring-1 ring-slate-200">
                  <MapPin size={20} className="text-slate-300" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Belum ada anotasi
                  </p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">
                    Putar model 3D lalu klik pada
                    <br />
                    permukaan tubuh untuk menandai
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <Crosshair size={10} className="text-indigo-400" />
                  <span className="text-[10px] text-slate-500">
                    Regio terdeteksi otomatis saat klik
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {showToast && (
          <SaveToast key="toast" onDismiss={() => setShowToast(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
