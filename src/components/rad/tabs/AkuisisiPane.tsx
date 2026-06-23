"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, CheckCircle2, ShieldAlert, AlertTriangle,
  TrendingUp, TrendingDown, Minus, UserCheck, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { DateTimePicker } from "@/components/shared/inputs/DateTimePicker";
import {
  type RadOrder, type ProteksiChecklist, type RadiograferRef,
} from "../radShared";
import { useRadRoster } from "../useRadRoster";
import RadiograferPicker from "../RadiograferPicker";
import { saveRadAkuisisi, type SaveRadAkuisisiBody } from "@/lib/api/rad/radAkuisisi";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";

// ── DRL Gauge ─────────────────────────────────────────────

function DRLGauge({ label, value, drl, unit }: {
  label: string; value?: number; drl?: number; unit: string;
}) {
  if (!drl) return null;
  const pct     = value !== undefined ? Math.min((value / drl) * 100, 150) : 0;
  const isOver  = value !== undefined && value > drl;
  const color   = !value ? "bg-slate-200" : isOver ? "bg-rose-500" : pct > 80 ? "bg-amber-500" : "bg-emerald-500";
  const Icon    = !value ? Minus : isOver ? TrendingUp : TrendingDown;
  const iconCls = !value ? "text-slate-400" : isOver ? "text-rose-600" : "text-emerald-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-600">{label}</p>
        <Icon size={13} className={iconCls} />
      </div>
      <div className="mb-1.5 flex items-end gap-1.5">
        <p className={cn("text-lg font-black", isOver ? "text-rose-700" : "text-slate-900")}>
          {value !== undefined ? value.toFixed(1) : "—"}
        </p>
        <p className="mb-0.5 text-[11px] text-slate-400">{unit}</p>
        <p className="mb-0.5 ml-auto text-[10px] text-slate-400">DRL: {drl} {unit}</p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct, 100)}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {isOver && (
        <p className="mt-1 text-[9px] font-bold text-rose-600">
          ↑ {((value! - drl) / drl * 100).toFixed(0)}% di atas DRL
        </p>
      )}
    </div>
  );
}

// ── Proteksi checkbox ─────────────────────────────────────

function ProteksiCheck({
  label, checked, onChange, locked,
}: { label: string; checked: boolean; onChange: () => void; locked: boolean }) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onChange}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[11px] font-medium transition-all",
        checked
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-500 hover:border-teal-200",
        locked && "opacity-60 cursor-not-allowed",
      )}
    >
      <div className={cn(
        "h-4 w-4 shrink-0 rounded border-2 transition-all flex items-center justify-center",
        checked ? "border-emerald-500 bg-emerald-500" : "border-slate-300",
      )}>
        {checked && <CheckCircle2 size={10} className="text-white" />}
      </div>
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function AkuisisiPane({
  order, onStatusChange,
}: { order: RadOrder; onStatusChange: () => void }) {
  const mod     = order.items[0]?.modalitas ?? "Konvensional";
  // Radiasi pengion? USG (gelombang suara) & MRI (medan magnet + RF) TIDAK pakai radiasi → tanpa
  // log dosis & tanpa proteksi radiasi (apron/collar). Selaras riset: dosis hanya modalitas pengion.
  const isIonizing = mod !== "USG" && mod !== "MRI";
  const saved   = order.akuisisi;
  const isDone  = saved?.isDone ||
    ["Expertise", "Verifikasi_Hasil", "Selesai"].includes(order.status);

  // Radiografer pelaksana — bisa >1, dari roster ter-assign Radiologi (SDM Assignment).
  // Default = user login (bila ter-assign); user bisa override. Default DIDERIVASI (useMemo) bukan
  // ditulis via effect → hindari setState-in-effect; `pick` = null artinya "belum disentuh".
  const { session } = useSession();
  const { petugas, loading: rosterLoading, isAssigned } = useRadRoster(order.id);
  const [pick, setPick] = useState<string[] | null>(() => {
    const ids = saved?.radiografer?.map((r) => r.pegawaiId).filter(Boolean) ?? [];
    return ids.length ? ids : null;
  });
  const defaultIds = useMemo<string[]>(
    () => (!saved && session?.pegawaiId && isAssigned(session.pegawaiId) ? [session.pegawaiId] : []),
    [saved, session, isAssigned],
  );
  const radiograferIds = pick ?? defaultIds;
  const setRadiograferIds = (ids: string[]) => setPick(ids);

  // Technical params
  const [kvp,  setKvp]  = useState(saved?.kvp?.toString() ?? "");
  const [mas,  setMas]  = useState(saved?.mas?.toString() ?? "");
  const [fov,  setFov]  = useState(saved?.fov ?? "");
  const [slice,setSlice] = useState(saved?.slice ?? "");
  const [probe,setProbe] = useState(saved?.probe ?? "");
  const [freq, setFreq]  = useState(saved?.frekuensi ?? "");
  const [kv,   setKv]   = useState(saved?.kv?.toString() ?? "");
  const [mAs,  setMAs]  = useState(saved?.mAs?.toString() ?? "");

  // Dose
  const [ctdiVol, setCtdiVol] = useState(saved?.dosis?.ctdiVol?.toString() ?? "");
  const [dlp,     setDlp]     = useState(saved?.dosis?.dlp?.toString() ?? "");
  const [dap,     setDap]     = useState(saved?.dosis?.dap?.toString() ?? "");
  const [wFluoro, setWFluoro] = useState(saved?.dosis?.waktuFluoro?.toString() ?? "");
  const [dose,    setDose]    = useState(saved?.dosis?.doseEntrance?.toString() ?? "");

  // Proteksi
  const [prot, setProt] = useState<ProteksiChecklist>(
    saved?.proteksi ?? { apron: false, collar: false, gonadShield: false },
  );
  const toggleProt = (key: keyof ProteksiChecklist) =>
    setProt((p) => ({ ...p, [key]: !p[key] }));

  // Waktu = DateTimePicker (kontrak "YYYY-MM-DDTHH:mm"). Default kosong (tanpa auto-fill); tombol
  // "Sekarang" tersedia di picker. Init dari timestamp tersimpan bila order sudah selesai akuisisi.
  const [waktuMulai,   setWaktuMulai]   = useState(saved ? order.timestamps.akuisisiMulai?.slice(0, 16) ?? "" : "");
  const [waktuSelesai, setWaktuSelesai] = useState(saved ? order.timestamps.akuisisiSelesai?.slice(0, 16) ?? "" : "");

  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(isDone);

  // DRL reference values (PMK 1014/2008 Annex / IAEA)
  const DRL = {
    ctdiVol:     mod === "CT" ? 30 : undefined,
    dlp:         mod === "CT" ? 900 : undefined,
    drlCtdiVol:  mod === "CT" ? 30 : undefined,
    drlDlp:      mod === "CT" ? 900 : undefined,
    dap:         mod === "Fluoroskopi" ? 20000 : undefined,
    doseEntrance: mod === "Konvensional" ? 0.5 : mod === "Mammografi" ? 2.0 : undefined,
    drlEntrance:  mod === "Konvensional" ? 0.5 : mod === "Mammografi" ? 2.0 : undefined,
  };

  // Akuisisi & Dosis = OPSIONAL — tidak ada field wajib; boleh dikonfirmasi/dilewati tanpa data.
  const canSubmit = !done;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    // Nama radiografer diturunkan dari roster (anti-spoof) — bukan input bebas.
    const radiografer: RadiograferRef[] = radiograferIds.map((id) => ({
      pegawaiId: id,
      nama: petugas.find((p) => p.pegawaiId === id)?.namaTampil ?? "—",
    }));

    const num = (s: string) => (s ? Number(s) : undefined);
    const str = (s: string) => (s ? s : undefined);

    // Parameter teknis sesuai modalitas.
    const paramTeknis: SaveRadAkuisisiBody["paramTeknis"] =
      mod === "CT"           ? { kvp: num(kvp), mas: num(mas), fov: str(fov), slice: str(slice) }
      : mod === "USG"        ? { probe: str(probe), frekuensi: str(freq) }
      : mod === "Konvensional" ? { kv: num(kv), mAs: num(mAs) }
      : undefined;

    // Dosis & proteksi hanya untuk modalitas radiasi pengion.
    let dosis: SaveRadAkuisisiBody["dosis"];
    if (isIonizing) {
      const d: NonNullable<SaveRadAkuisisiBody["dosis"]> = {};
      if (ctdiVol) d.ctdiVol = parseFloat(ctdiVol);
      if (dlp)     d.dlp     = parseFloat(dlp);
      if (dap)     d.dap     = parseFloat(dap);
      if (wFluoro) d.waktuFluoro = parseFloat(wFluoro);
      if (dose)    d.doseEntrance = parseFloat(dose);
      if (DRL.drlCtdiVol)  d.drlCtdiVol  = DRL.drlCtdiVol;
      if (DRL.drlDlp)      d.drlDlp      = DRL.drlDlp;
      if (DRL.drlEntrance) d.drlEntrance = DRL.drlEntrance;
      if (Object.keys(d).length > 0) dosis = d;
    }

    const body: SaveRadAkuisisiBody = {
      radiografer,
      paramTeknis,
      proteksi: isIonizing ? prot : undefined,
      dosis,
      mulaiAt: waktuMulai || undefined,
      selesaiAt: waktuSelesai || undefined,
    };

    try {
      await saveRadAkuisisi(order.id, body);
      toast.success("Akuisisi tersimpan");
      setDone(true);
      onStatusChange();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menyimpan akuisisi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_260px]">

      {/* ── Left: acquisition form ── */}
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-3 rounded-xl bg-orange-500 px-4 py-3 text-white">
          <Camera size={20} className="shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold">Akuisisi Gambar</p>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide">Opsional</span>
            </div>
            <p className="text-[11px] text-orange-100">
              {isIonizing
                ? `${mod} · Proteksi Radiasi · Perka BAPETEN No. 2/2018`
                : `${mod} · Tanpa Radiasi Pengion`}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
                  <Camera size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800">Akuisisi Selesai</p>
                  <p className="text-sm text-emerald-600">
                    Radiografer: {saved?.radiografer?.map((r) => r.nama).join(", ") || "—"}
                  </p>
                  <p className="text-[11px] text-emerald-500">
                    {order.timestamps.akuisisiMulai?.slice(11, 16)} — {order.timestamps.akuisisiSelesai?.slice(11, 16)}
                  </p>
                </div>
              </div>
              {saved?.dosis && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {saved.dosis.ctdiVol !== undefined && (
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
                      CTDIvol: {saved.dosis.ctdiVol} mGy
                    </span>
                  )}
                  {saved.dosis.dlp !== undefined && (
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
                      DLP: {saved.dosis.dlp} mGy·cm
                    </span>
                  )}
                  {saved.dosis.doseEntrance !== undefined && (
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
                      Dose: {saved.dosis.doseEntrance} mGy
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="form" className="flex flex-col gap-4">

              {/* Radiografer + Waktu */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-[11px] font-bold text-slate-500">Petugas & Waktu</p>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      <Users size={11} className="text-teal-500" />
                      Radiografer Pelaksana
                      <span className="font-normal text-slate-400">· opsional · bisa lebih dari satu</span>
                    </label>
                    <RadiograferPicker
                      petugas={petugas}
                      value={radiograferIds}
                      onChange={setRadiograferIds}
                      loading={rosterLoading}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-500">Mulai Akuisisi</label>
                      <DateTimePicker value={waktuMulai} onChange={setWaktuMulai} placeholder="Pilih waktu mulai" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-slate-500">Selesai Akuisisi</label>
                      <DateTimePicker value={waktuSelesai} onChange={setWaktuSelesai} placeholder="Pilih waktu selesai" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical params per modalitas */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-3 text-[11px] font-bold text-slate-500">Parameter Teknis — {mod}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {mod === "CT" && (<>
                    <div><label className="mb-1 block text-[10px] font-bold text-slate-500">kVp</label>
                      <input type="number" placeholder="mis. 120" value={kvp} onChange={(e) => setKvp(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                    <div><label className="mb-1 block text-[10px] font-bold text-slate-500">mAs efektif</label>
                      <input type="number" placeholder="mis. 250" value={mas} onChange={(e) => setMas(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                    <div><label className="mb-1 block text-[10px] font-bold text-slate-500">FOV</label>
                      <input type="text" placeholder="mis. 36 cm" value={fov} onChange={(e) => setFov(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                    <div><label className="mb-1 block text-[10px] font-bold text-slate-500">Tebal Irisan</label>
                      <input type="text" placeholder="mis. 1.25 mm" value={slice} onChange={(e) => setSlice(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                  </>)}
                  {mod === "USG" && (<>
                    <div><label className="mb-1 block text-[10px] font-bold text-slate-500">Jenis Probe</label>
                      <input type="text" placeholder="mis. Linear 7.5 MHz" value={probe} onChange={(e) => setProbe(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                    <div><label className="mb-1 block text-[10px] font-bold text-slate-500">Frekuensi</label>
                      <input type="text" placeholder="mis. 7.5 MHz" value={freq} onChange={(e) => setFreq(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                  </>)}
                  {mod === "Konvensional" && (<>
                    <div><label className="mb-1 block text-[10px] font-bold text-slate-500">kV</label>
                      <input type="number" placeholder="mis. 70" value={kv} onChange={(e) => setKv(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                    <div><label className="mb-1 block text-[10px] font-bold text-slate-500">mAs</label>
                      <input type="number" placeholder="mis. 16" value={mAs} onChange={(e) => setMAs(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                  </>)}
                  {(mod === "MRI") && (
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[10px] font-bold text-slate-500">Sekuens MRI (pisahkan koma)</label>
                      <input type="text" placeholder="mis. T1 axial, T2 FLAIR, DWI, T1 CE"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                    </div>
                  )}
                </div>
              </div>

              {/* Dose log — hanya modalitas radiasi pengion */}
              {isIonizing && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="mb-3 text-[11px] font-bold text-slate-500">Log Dosis Radiasi · BAPETEN</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {mod === "CT" && (<>
                      <div><label className="mb-1 block text-[10px] font-bold text-slate-500">CTDIvol (mGy)</label>
                        <input type="number" step="0.1" placeholder={`DRL: ${DRL.ctdiVol}`} value={ctdiVol} onChange={(e) => setCtdiVol(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                      <div><label className="mb-1 block text-[10px] font-bold text-slate-500">DLP (mGy·cm)</label>
                        <input type="number" step="1" placeholder={`DRL: ${DRL.dlp}`} value={dlp} onChange={(e) => setDlp(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                    </>)}
                    {mod === "Fluoroskopi" && (<>
                      <div><label className="mb-1 block text-[10px] font-bold text-slate-500">DAP (mGy·cm²)</label>
                        <input type="number" value={dap} onChange={(e) => setDap(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                      <div><label className="mb-1 block text-[10px] font-bold text-slate-500">Waktu Fluoroskopi (detik)</label>
                        <input type="number" value={wFluoro} onChange={(e) => setWFluoro(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                    </>)}
                    {(mod === "Konvensional" || mod === "Mammografi") && (
                      <div><label className="mb-1 block text-[10px] font-bold text-slate-500">Entrance Surface Dose (mGy)</label>
                        <input type="number" step="0.01" placeholder={`DRL: ${DRL.doseEntrance}`} value={dose} onChange={(e) => setDose(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" /></div>
                    )}
                  </div>
                </div>
              )}

              {/* Proteksi radiasi — hanya modalitas radiasi pengion */}
              {isIonizing && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldAlert size={14} className="text-teal-600" />
                    <p className="text-[11px] font-bold text-slate-500">Peralatan Proteksi Radiasi</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { key: "apron",         label: "Apron Pb"      },
                      { key: "collar",        label: "Collar Tiroid" },
                      { key: "gonadShield",   label: "Gonad Shield"  },
                      { key: "thyroidShield", label: "Thyroid Shield"},
                    ] as { key: keyof ProteksiChecklist; label: string }[]).map(({ key, label }) => (
                      <ProteksiCheck
                        key={key} label={label}
                        checked={!!prot[key]}
                        onChange={() => toggleProt(key)}
                        locked={done}
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">
                    Untuk CT: apron tidak digunakan di dalam gantry. Untuk X-Ray konvensional: lindungi organ sensitif (gonad/tiroid).
                  </p>
                </div>
              )}

              {/* Submit */}
              <motion.button
                onClick={handleSubmit}
                disabled={!canSubmit || loading}
                whileHover={canSubmit ? { scale: 1.01 } : {}}
                whileTap={canSubmit ? { scale: 0.99 } : {}}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all",
                  canSubmit
                    ? "bg-teal-600 text-white shadow-md shadow-teal-200 hover:bg-teal-700"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                )}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                ) : <Camera size={16} />}
                {loading
                  ? "Menyimpan..."
                  : radiograferIds.length > 0
                    ? "Konfirmasi Akuisisi Selesai → Expertise"
                    : "Lewati Akuisisi → Expertise"}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right: DRL panel ── */}
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            <p className="text-[11px] font-bold text-slate-600">DRL Monitor · PMK 1014/2008</p>
          </div>
          {mod === "CT" && (
            <div className="flex flex-col gap-3">
              <DRLGauge label="CTDIvol" value={ctdiVol ? parseFloat(ctdiVol) : saved?.dosis?.ctdiVol}
                drl={DRL.drlCtdiVol} unit="mGy" />
              <DRLGauge label="DLP" value={dlp ? parseFloat(dlp) : saved?.dosis?.dlp}
                drl={DRL.drlDlp} unit="mGy·cm" />
            </div>
          )}
          {(mod === "Konvensional" || mod === "Mammografi") && (
            <DRLGauge label="Entrance Dose"
              value={dose ? parseFloat(dose) : saved?.dosis?.doseEntrance}
              drl={DRL.drlEntrance} unit="mGy" />
          )}
          {mod === "USG" && (
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-[11px] font-bold text-emerald-700">USG — Tidak Menggunakan Radiasi Pengion</p>
              <p className="text-[10px] text-emerald-600 mt-1">Tidak diperlukan log dosis</p>
            </div>
          )}
          {mod === "MRI" && (
            <div className="rounded-xl bg-sky-50 p-3 text-center">
              <p className="text-[11px] font-bold text-sky-700">MRI — Tidak Menggunakan Radiasi Pengion</p>
              <p className="text-[10px] text-sky-600 mt-1">Tidak diperlukan log dosis</p>
            </div>
          )}
        </div>

        {isIonizing && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] font-bold text-slate-500">Tentang DRL</p>
            <p className="mt-1 text-[10px] text-slate-400 leading-relaxed">
              Diagnostic Reference Level (DRL) adalah nilai acuan dosis radiasi untuk pemeriksaan tertentu. Dosis pasien sebaiknya di bawah DRL. Jika melebihi, evaluasi teknik dan laporkan ke penanggung jawab proteksi radiasi.
            </p>
          </div>
        )}

        {/* Proteksi reminder — prinsip ALARA hanya relevan utk radiasi pengion */}
        {isIonizing && (
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-3">
            <div className="flex items-center gap-2">
              <UserCheck size={13} className="text-teal-600" />
              <p className="text-[10px] font-bold text-teal-800">Prinsip ALARA</p>
            </div>
            <p className="mt-1 text-[10px] text-teal-600 leading-relaxed">
              As Low As Reasonably Achievable. Optimalkan dosis seminimal mungkin dengan tetap menghasilkan gambar diagnostik yang memadai.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
