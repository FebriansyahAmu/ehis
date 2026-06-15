"use client";

// Penandaan Gambar (status lokalis) — bagan anatomi dari CITRA nyata per jenis kelamin
// (Laki-laki/Perempuan, anterior) dengan alat Pin (titik) & Draw (coretan area) + keterangan,
// plus Odontogram FDI. Sub-komponen di ./penandaan/ (bodyChart · BodyMap2D · OdontogramChart · PenandaanPanels).

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Pencil,
  RotateCcw,
  Crosshair,
  FileText,
  Eye,
  Layers,
  ScanEye,
  Mars,
  Venus,
  Smile,
} from "lucide-react";
import type { IGDPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import {
  SEV,
  SEV_ORDER,
  MODEL_LABEL,
  UUID_RE,
  type Anotasi,
  type AnnTool,
  type KanvasMode,
  type ModelJenis,
  type PendingMark,
  type Severitas,
} from "./penandaan/penandaanShared";
import {
  getPenandaanGambar,
  createPenandaanGambar,
  deletePenandaanGambar,
  type PenandaanGambarDTO,
} from "@/lib/api/penandaanGambar/penandaanGambar";
import OdontogramCanvas from "./penandaan/OdontogramChart";
import BodyMap2D from "./penandaan/BodyMap2D";
import { AnotasiForm, AnotasiItem, DetailPanel } from "./penandaan/PenandaanPanels";

// DTO tersimpan → Anotasi FE (shape hampir identik; pemeriksa tak dipakai di kanvas).
function dtoToAnotasi(d: PenandaanGambarDTO): Anotasi {
  return {
    id: d.id,
    mode: d.mode,
    kind: d.kind,
    koordinat2d: d.koordinat2d,
    path: d.path,
    region: d.region,
    label: d.label,
    deskripsi: d.deskripsi,
    severitas: d.severitas,
    createdAt: d.createdAt,
  };
}

const MODE_TABS: { id: KanvasMode; label: string; icon: typeof Mars }[] = [
  { id: "pria", label: "Laki-laki", icon: Mars },
  { id: "wanita", label: "Perempuan", icon: Venus },
  { id: "gigi", label: "Odontogram", icon: Smile },
];

const TOOL_TABS: { id: AnnTool; label: string; icon: typeof MapPin }[] = [
  { id: "pin", label: "Pin", icon: MapPin },
  { id: "draw", label: "Gambar", icon: Pencil },
];

export default function PenandaanGambarTab({
  patient,
}: {
  patient: IGDPatientDetail;
}) {
  const { session } = useSession();
  const kunjunganId = patient.id ?? "";
  const isPersisted = UUID_RE.test(kunjunganId);
  const perawat = session?.namaTampil ?? "";

  const [mode, setMode] = useState<KanvasMode>("pria");
  const [tool, setTool] = useState<AnnTool>("pin");
  const [panMode, setPanMode] = useState(false); // mode geser kanvas (dikelola di sini → memilih alat mematikannya)
  const [anotasiList, setAnotasiList] = useState<Anotasi[]>([]);
  const [pending, setPending] = useState<PendingMark | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState(false);
  const [saving, setSaving] = useState(false);

  // Muat penanda tersimpan (kunjungan UUID).
  useEffect(() => {
    if (!isPersisted) return;
    const ac = new AbortController();
    getPenandaanGambar(kunjunganId, ac.signal)
      .then((rows) => setAnotasiList(rows.map(dtoToAnotasi)))
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        toast.error("Gagal memuat penandaan gambar", e instanceof ApiError ? e.message : undefined);
      });
    return () => ac.abort();
  }, [isPersisted, kunjunganId]);

  // semua anotasi pada model aktif (= yang tampil di kanvas + daftar + hitungan)
  const canvasAnotasi = useMemo(
    () => anotasiList.filter((a) => a.mode === mode),
    [anotasiList, mode],
  );

  const switchMode = (m: KanvasMode) => {
    setMode(m);
    setPending(null);
    setSelectedId(null);
    setPanMode(false);
  };

  // tandai titik (pin) → pending dengan regio terdeteksi
  const handleMarkBody = (koordinat: { x: number; y: number }, region: string) => {
    if (pending) return;
    setPending({ mode, kind: "pin", koordinat2d: koordinat, path: null, region });
    setSelectedId(null);
  };

  // selesai menggambar (draw) → pending dengan jalur + jangkar label
  const handleDrawBody = (
    path: { x: number; y: number }[],
    anchor: { x: number; y: number },
    region: string,
  ) => {
    if (pending) return;
    setPending({ mode, kind: "draw", koordinat2d: anchor, path, region });
    setSelectedId(null);
  };

  // klik chart gigi → pending titik koordinat-%
  const handleMarkGigi = (koordinat: { x: number; y: number }) => {
    setPending({
      mode: "gigi",
      kind: "pin",
      koordinat2d: koordinat,
      path: null,
      region: "Gigi / Odontogram",
    });
    setSelectedId(null);
  };

  async function handleSave(data: Pick<Anotasi, "label" | "deskripsi" | "severitas">) {
    if (!pending || saving) return;

    // Pasien demo (non-UUID) → simpan lokal saja.
    if (!isPersisted) {
      const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const next: Anotasi = {
        id: `an-${Date.now()}`,
        mode: pending.mode,
        kind: pending.kind,
        koordinat2d: pending.koordinat2d,
        path: pending.path,
        region: pending.region,
        createdAt: now,
        ...data,
      };
      setAnotasiList((prev) => [...prev, next]);
      setSelectedId(next.id);
      setPending(null);
      toast.info("Pasien demo — penandaan tidak tersimpan ke database");
      return;
    }

    try {
      setSaving(true);
      const dto = await createPenandaanGambar(kunjunganId, {
        mode: pending.mode,
        kind: pending.kind,
        koordinat2d: pending.koordinat2d ?? { x: 0, y: 0 },
        path: pending.path ?? undefined,
        region: pending.region,
        label: data.label,
        deskripsi: data.deskripsi || undefined,
        severitas: data.severitas,
        pemeriksa: perawat || undefined,
      });
      const a = dtoToAnotasi(dto);
      setAnotasiList((prev) => [...prev, a]);
      setSelectedId(a.id);
      setPending(null);
      toast.success("Penandaan gambar tersimpan");
    } catch (e) {
      toast.error("Gagal menyimpan penandaan", e instanceof ApiError ? e.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (isPersisted) {
      try {
        await deletePenandaanGambar(kunjunganId, id);
      } catch (e) {
        toast.error("Gagal menghapus penandaan", e instanceof ApiError ? e.message : undefined);
        return;
      }
    }
    setAnotasiList((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  async function handleReset() {
    const ids = canvasAnotasi.map((a) => a.id);
    if (ids.length === 0) return;
    if (isPersisted) {
      try {
        await Promise.all(ids.map((id) => deletePenandaanGambar(kunjunganId, id)));
        toast.success("Penanda pada model ini dihapus");
      } catch (e) {
        toast.error("Gagal mereset penandaan", e instanceof ApiError ? e.message : undefined);
        return;
      }
    }
    setAnotasiList((prev) => prev.filter((a) => a.mode !== mode));
    setSelectedId(null);
    setPending(null);
  }

  const displayList = filterActive ? canvasAnotasi : anotasiList;
  const selectedAnotasi = selectedId
    ? (anotasiList.find((a) => a.id === selectedId) ?? null)
    : null;

  // nomor badge per model → selaras dengan urutan di kanvas
  const pinNumber = (a: Anotasi) =>
    anotasiList.filter((x) => x.mode === a.mode).indexOf(a);

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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600">
          <ScanEye size={15} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">
            Penandaan Gambar
          </p>
          <p className="text-[10px] text-slate-400">
            Tandai status lokalis pada citra anatomi — titik (pin) atau gambar area
          </p>
        </div>

        {anotasiList.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
              <MapPin size={10} className="text-sky-400" />
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
          </div>
        )}
      </div>

      {/* ── Toolbar: model + alat ── */}
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
                    ? "bg-white text-sky-700 shadow-sm ring-1 ring-sky-100"
                    : "text-slate-500 hover:text-slate-700",
                )}
              >
                <Icon size={13} className={act ? "text-sky-500" : "text-slate-400"} />
                {t.label}
                {cnt > 0 && (
                  <span
                    className={cn(
                      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-bold text-white",
                      act ? "bg-sky-600" : "bg-slate-400",
                    )}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* pemilih alat — hanya bagan tubuh */}
        {mode !== "gigi" && (
          <div className="flex items-center gap-1.5 sm:ml-auto">
            <span className="mr-0.5 hidden text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:inline">
              Alat
            </span>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {TOOL_TABS.map((t) => {
                const Icon = t.icon;
                const act = tool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTool(t.id);
                      setPending(null);
                      setPanMode(false);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all duration-150",
                      act
                        ? "bg-white text-sky-700 shadow-sm ring-1 ring-sky-100"
                        : "text-slate-500 hover:text-slate-700",
                    )}
                  >
                    <Icon size={12} className={act ? "text-sky-500" : "text-slate-400"} />
                    {t.label}
                  </button>
                );
              })}
            </div>
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
                  : "— citra anatomi (anterior)"}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                {canvasAnotasi.length > 0 && (
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
                      ? "border-sky-200 bg-sky-50"
                      : "border-slate-200 bg-slate-50",
                  )}
                >
                  <Crosshair
                    size={9}
                    className={pending ? "text-sky-500" : "text-slate-400"}
                  />
                  <span
                    className={cn(
                      "text-[9px]",
                      pending ? "font-semibold text-sky-600" : "text-slate-400",
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
                      markers={canvasAnotasi}
                      pending={pending?.koordinat2d ?? null}
                      selectedId={selectedId}
                      onPick={handleMarkGigi}
                      onSelectMarker={(id) =>
                        setSelectedId(id === selectedId ? null : id)
                      }
                    />
                  ) : (
                    <BodyMap2D
                      gender={mode as ModelJenis}
                      tool={tool}
                      panMode={panMode}
                      onPanModeChange={setPanMode}
                      markers={canvasAnotasi}
                      pending={
                        pending
                          ? { kind: pending.kind, koordinat2d: pending.koordinat2d, path: pending.path }
                          : null
                      }
                      selectedId={selectedId}
                      onSelectMarker={(id) =>
                        setSelectedId(id === selectedId ? null : id)
                      }
                      onMark={handleMarkBody}
                      onDraw={handleDrawBody}
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
                key={`form-${pending.mode}-${pending.kind}-${pending.region}-${pending.koordinat2d?.x},${pending.koordinat2d?.y}`}
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
                displayIdx={pinNumber(selectedAnotasi)}
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
                      ? "bg-sky-100 text-sky-600"
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
                    displayList.map((a) => (
                      <AnotasiItem
                        key={a.id}
                        anotasi={a}
                        displayIdx={pinNumber(a)}
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
                    Pilih alat Pin atau Gambar lalu
                    <br />
                    tandai temuan pada citra anatomi
                  </p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <Crosshair size={10} className="text-sky-400" />
                  <span className="text-[10px] text-slate-500">
                    Regio terdeteksi otomatis saat klik
                  </span>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
