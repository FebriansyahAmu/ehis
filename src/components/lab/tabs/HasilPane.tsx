"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Save, AlertTriangle, CheckCircle2, Lock,
  PhoneCall, MessageSquare, Users, UserCircle,
  X, TrendingUp, TrendingDown,
} from "lucide-react";
import { getPreviousResult, calcDelta } from "../trend/trendShared";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { useLabRoster } from "../useLabRoster";
import AssignmentGuardBanner from "../AssignmentGuardBanner";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { getLabTestParams } from "@/lib/api/lab/labCatalog";
import { getLabResult, saveLabResult, type LabResultDTO } from "@/lib/api/lab/labResult";
import {
  type LabOrder, type HasilItem, type CriticalNotif,
  FLAG_CFG, KATEGORI_CFG,
  autoFlag, hasCriticalResult, updateLabWorkflow, buildHasilFromCatalog, hasilKey, dtoValueToHasil,
} from "../labShared";

interface Props { order: LabOrder; onStatusChange: () => void }

type MetodeNotif = "Telepon" | "SMS" | "WhatsApp" | "Langsung";

// ── Critical Value Modal ──────────────────────────────────

interface CriticalModalProps {
  items:     CriticalNotif[];
  onConfirm: (confirmed: CriticalNotif[]) => void;
}

function CriticalValueModal({ items, onConfirm }: CriticalModalProps) {
  const [confirmations, setConfirmations] = useState<CriticalNotif[]>(
    items.map((i) => ({ ...i, confirmed: false })),
  );
  const [petugasNotif, setPetugasNotif] = useState("");

  function updateItem(idx: number, patch: Partial<CriticalNotif>) {
    setConfirmations((prev) => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  }

  const allConfirmed = confirmations.every(
    (c) => c.metode && c.konfirmasiOleh,
  ) && petugasNotif.trim().length > 0;

  function handleConfirm() {
    if (!allConfirmed) return;
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    onConfirm(
      confirmations.map((c) => ({ ...c, confirmed: true, waktu: now })),
    );
  }

  const METODE: MetodeNotif[] = ["Telepon", "SMS", "WhatsApp", "Langsung"];
  const METODE_ICONS: Record<MetodeNotif, React.ReactNode> = {
    Telepon:  <PhoneCall size={12} />,
    SMS:      <MessageSquare size={12} />,
    WhatsApp: <MessageSquare size={12} />,
    Langsung: <Users size={12} />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="bg-rose-600 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
              <AlertTriangle size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white">Nilai Kritis Terdeteksi!</p>
              <p className="text-[11px] text-rose-200">
                Wajib konfirmasi ke dokter pengirim · ISO 15189 §5.6.2 · SNARS AP 5.9
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Critical list */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-rose-800">{item.testNama}</p>
                    <p className="text-[12px] text-rose-700">
                      Nilai: <span className="font-bold">{item.nilai}</span>
                      <span className="ml-2 text-rose-500">(threshold: {item.threshold})</span>
                    </p>
                  </div>
                  {confirmations[idx]?.metode && confirmations[idx]?.konfirmasiOleh && (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  )}
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {/* Metode */}
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-700 mb-1">
                      Metode Notifikasi *
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {METODE.map((m) => (
                        <button
                          key={m}
                          onClick={() => updateItem(idx, { metode: m })}
                          className={cn(
                            "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors",
                            confirmations[idx]?.metode === m
                              ? "bg-rose-600 text-white"
                              : "bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100",
                          )}
                        >
                          {METODE_ICONS[m]}
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dokter yang dikonfirmasi */}
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-700 mb-1">
                      Dikonfirmasi Kepada *
                    </label>
                    <input
                      value={confirmations[idx]?.konfirmasiOleh ?? ""}
                      onChange={(e) => updateItem(idx, { konfirmasiOleh: e.target.value })}
                      placeholder="Nama dokter / perawat"
                      className="w-full rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Petugas lab yang melapor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Dilaporkan Oleh (Analis/Petugas Lab) *
            </label>
            <input
              value={petugasNotif}
              onChange={(e) => setPetugasNotif(e.target.value)}
              placeholder="Nama analis yang melaporkan"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
            Modal ini tidak dapat ditutup tanpa mengisi semua konfirmasi.
            Semua nilai kritis wajib dilaporkan dan dikonfirmasi dalam log.
          </div>

          <button
            onClick={handleConfirm}
            disabled={!allConfirmed}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-700 disabled:opacity-40"
          >
            <CheckCircle2 size={15} />
            Konfirmasi Semua Nilai Kritis &amp; Lanjutkan
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Hasil Row ─────────────────────────────────────────────

function HasilRow({
  item, editable, onChange,
}: { item: HasilItem; editable: boolean; onChange: (nilai: string) => void }) {
  const flag    = item.flag ?? autoFlag(item.nilai, item.nilaiMin, item.nilaiMax, item.criticalLow, item.criticalHigh);
  const flagCfg = flag ? FLAG_CFG[flag] : null;

  return (
    <tr className={cn(
      "border-b border-slate-100 transition-colors last:border-0",
      flag === "C" && item.nilai ? "bg-rose-50" : flag === "H" && item.nilai ? "bg-amber-50/40" : flag === "L" && item.nilai ? "bg-sky-50/40" : "",
    )}>
      <td className="py-2 pl-4 pr-3">
        <div>
          <p className="text-[12px] font-medium text-slate-800">{item.nama}</p>
          <p className="text-[10px] text-slate-400">{item.kode}</p>
        </div>
      </td>
      <td className="py-2 pr-3">
        {editable ? (
          <input
            value={item.nilai ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="—"
            className={cn(
              "w-24 rounded-lg border px-2.5 py-1.5 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-400",
              flag === "C" && item.nilai ? "border-rose-300 bg-rose-50 text-rose-800" :
              flag === "H" && item.nilai ? "border-amber-200 bg-amber-50 text-amber-800" :
              flag === "L" && item.nilai ? "border-sky-200 bg-sky-50 text-sky-800" :
              "border-slate-200 bg-white text-slate-800",
            )}
          />
        ) : (
          <span className={cn("text-sm font-bold", flagCfg?.cls ?? "text-slate-500")}>
            {item.nilai ?? "—"}
          </span>
        )}
      </td>
      <td className="py-2 pr-3 text-[11px] text-slate-500">{item.satuan || "—"}</td>
      <td className="py-2 pr-3 text-[11px] text-slate-400">{item.rujukanStr}</td>
      <td className="py-2">
        {flag && item.nilai && (
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            flag === "C" ? "bg-rose-100 text-rose-700" :
            flag === "H" ? "bg-amber-100 text-amber-700" :
            flag === "L" ? "bg-sky-100 text-sky-700" :
            "bg-emerald-50 text-emerald-700",
          )}>
            {flagCfg?.label}
          </span>
        )}
      </td>
    </tr>
  );
}

// ── Main ──────────────────────────────────────────────────

export default function HasilPane({ order, onStatusChange }: Props) {
  const isLocked   = ["Divalidasi", "Selesai"].includes(order.status);
  // Sampel diambil di luar aplikasi → entry hasil terbuka langsung sejak order Diterima.
  const canEnter   = ["Diterima", "Sampel Diterima", "Dianalisa"].includes(order.status);
  const isRejected = order.status === "Ditolak";

  const { session } = useSession();

  // Analis HARUS petugas ter-assign ke Laboratorium (SDM Assignment) — ditegakkan juga di server
  // (saveHasil). Superuser/global bypass; tanpa sesi (dev) tak diblok. Peringatan muncul setelah
  // roster termuat (anti-kedip).
  const { loading: rosterLoading, isAssigned } = useLabRoster(order.id);
  const notAssigned =
    !rosterLoading && !!session && !session.isSuperuser && !session.isGlobal && !isAssigned(session.pegawaiId);

  const initialHasil = order.hasil ?? order.items.map((item) => ({
    rowKey: item.id, kode: item.kode, nama: item.nama, kategori: item.kategori,
    satuan: "", rujukanStr: "—",
  }));

  const [hasil,         setHasil]         = useState<HasilItem[]>(initialHasil);
  const [savedResult,   setSavedResult]   = useState<LabResultDTO | null>(null);
  const [showCritical,  setShowCritical]  = useState(false);
  const [saving,        setSaving]        = useState(false);

  // Analis pelaksana = user login (read-only). Fallback ke hasil tersimpan / overlay.
  const analisName = savedResult?.analis || order.analis || session?.namaTampil || "";

  // 1) Ambil hasil tersimpan (DB) → kalau ada, jadi sumber tampilan. 2) Belum ada → susun baris
  // dari parameter katalog (master.LabTest), rujukan disesuaikan gender+usia. Jangan timpa nilai diketik.
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const res = await getLabResult(order.id, ac.signal);
        if (ac.signal.aborted) return;
        if (res) {
          setSavedResult(res);
          setHasil(res.values.map(dtoValueToHasil));
          return;
        }
        if (order.hasil) return;
        const ids = [...new Set(order.items.map((i) => i.labTestId).filter((x): x is string => !!x))];
        if (ids.length === 0) return;
        const tests = await getLabTestParams(ids, ac.signal);
        if (ac.signal.aborted) return;
        const rows = buildHasilFromCatalog(order, tests);
        setHasil((prev) => (prev.some((h) => h.nilai) ? prev : rows));
      } catch { /* diam — baris fallback tetap dipakai */ }
    })();
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  const pendingCritical = useMemo(
    () => hasil.filter((h) => {
      const f = autoFlag(h.nilai, h.nilaiMin, h.nilaiMax, h.criticalLow, h.criticalHigh);
      return f === "C" && h.nilai;
    }).map((h) => ({
      testNama: h.nama,
      nilai: `${h.nilai} ${h.satuan}`,
      threshold: h.criticalHigh !== undefined && parseFloat(h.nilai!) > h.criticalHigh
        ? `> ${h.criticalHigh} ${h.satuan}`
        : `< ${h.criticalLow} ${h.satuan}`,
      confirmed: false,
    } satisfies CriticalNotif)),
    [hasil],
  );

  const alreadyConfirmed = ((savedResult?.criticalNotifs as CriticalNotif[] | undefined) ?? order.criticalNotifs ?? [])
    .filter((n) => n.confirmed);

  const deltaAlerts = useMemo(() =>
    hasil
      .filter((h) => {
        if (!h.nilai) return false;
        const v = parseFloat(h.nilai);
        if (isNaN(v)) return false;
        const prev = getPreviousResult(order.noRM, h.nama);
        if (!prev) return false;
        return calcDelta(v, prev.nilai, h.nama)?.triggered ?? false;
      })
      .map((h) => {
        const v    = parseFloat(h.nilai!);
        const prev = getPreviousResult(order.noRM, h.nama)!;
        return { nama: h.nama, delta: calcDelta(v, prev.nilai, h.nama)! };
      }),
    [hasil, order.noRM],
  );

  function updateNilai(key: string, nilai: string) {
    setHasil((prev) =>
      prev.map((h) =>
        hasilKey(h) === key
          ? { ...h, nilai, flag: autoFlag(nilai, h.nilaiMin, h.nilaiMax, h.criticalLow, h.criticalHigh) }
          : h,
      ),
    );
  }

  function handleSave() {
    const hasCritical = hasCriticalResult(hasil);
    const unconfirmed = pendingCritical.filter((p) =>
      !alreadyConfirmed.some((a) => a.testNama === p.testNama),
    );
    if (hasCritical && unconfirmed.length > 0) {
      setShowCritical(true);
      return;
    }
    commitSave(alreadyConfirmed);
  }

  function commitSave(criticalNotifs: CriticalNotif[]) {
    const finalHasil = hasil.map((h) => ({
      ...h,
      flag: autoFlag(h.nilai, h.nilaiMin, h.nilaiMax, h.criticalLow, h.criticalHigh),
    }));
    setSaving(true);
    void (async () => {
      try {
        await saveLabResult(order.id, {
          analis: analisName,
          criticalNotifs,
          values: finalHasil.map((h) => ({
            rowKey: hasilKey(h),
            kodeTes: h.kode,
            nama: h.nama,
            kategori: h.kategori,
            nilai: h.nilai,
            satuan: h.satuan,
            rujukanStr: h.rujukanStr,
            nilaiMin: h.nilaiMin,
            nilaiMax: h.nilaiMax,
            criticalLow: h.criticalLow,
            criticalHigh: h.criticalHigh,
            flag: h.flag,
          })),
        });
        // Overlay in-session agar Validasi (pane lain) langsung lihat hasil; status final dari DB.
        updateLabWorkflow(order.id, {
          status: "Divalidasi",
          hasil: finalHasil,
          analis: analisName,
          criticalNotifs,
          timestamps: { analisa: new Date().toISOString().slice(0, 16) },
        });
        setShowCritical(false);
        toast.success("Hasil tersimpan", "Menunggu validasi SpPK");
        onStatusChange();
      } catch (e) {
        toast.error("Gagal menyimpan hasil", e instanceof ApiError ? e.message : undefined);
      } finally {
        setSaving(false);
      }
    })();
  }

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, HasilItem[]>();
    for (const h of hasil) {
      const list = map.get(h.kategori) ?? [];
      list.push(h);
      map.set(h.kategori, list);
    }
    return map;
  }, [hasil]);

  if (isRejected) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-rose-200 py-16 text-center">
        <X size={28} className="text-rose-300" />
        <p className="text-sm font-medium text-slate-400">Specimen ditolak — tidak ada hasil untuk dientry</p>
      </div>
    );
  }

  if (!canEnter && !isLocked) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-center">
        <Lock size={28} className="text-slate-300" />
        <p className="text-sm font-medium text-slate-400">Terima order pada tab Penerimaan terlebih dahulu</p>
      </div>
    );
  }

  return (
    <>
      {showCritical && (
        <CriticalValueModal
          items={pendingCritical.filter((p) => !alreadyConfirmed.some((a) => a.testNama === p.testNama))}
          onConfirm={(confirmed) => commitSave([...alreadyConfirmed, ...confirmed])}
        />
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_300px]">

        {/* Left — Results Table */}
        <div className="space-y-4">
          {/* Confirmed critical banner */}
          {alreadyConfirmed.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="mb-1.5 text-[11px] font-bold text-rose-800">
                ⚠ {alreadyConfirmed.length} Nilai Kritis Sudah Dikonfirmasi
              </p>
              {alreadyConfirmed.map((n, i) => (
                <p key={i} className="text-[11px] text-rose-700">
                  · {n.testNama}: {n.nilai} — {n.metode} kepada {n.konfirmasiOleh} pukul {n.waktu}
                </p>
              ))}
            </div>
          )}

          {/* Delta check alert */}
          {deltaAlerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-200 bg-amber-50 p-3"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <TrendingUp size={13} className="text-amber-600" />
                <p className="text-[11px] font-bold text-amber-800">Delta Check Terpicu</p>
              </div>
              <div className="space-y-0.5">
                {deltaAlerts.map((a, i) => (
                  <p key={i} className="flex items-center gap-1 text-[11px] text-amber-700">
                    {a.delta.direction === "up"
                      ? <TrendingUp size={9} className="shrink-0" />
                      : <TrendingDown size={9} className="shrink-0" />}
                    {a.nama}: {a.delta.direction === "up" ? "+" : "-"}{a.delta.absolute}
                    <span className="text-amber-500">— {a.delta.thresholdLabel}</span>
                  </p>
                ))}
              </div>
              <p className="mt-1.5 text-[9px] text-amber-600">
                Review konsistensi klinis sebelum simpan · ISO 15189 §5.6.2
              </p>
            </motion.div>
          )}

          {/* Tables per category */}
          {[...grouped.entries()].map(([kat, items]) => {
            const kCfg = KATEGORI_CFG[kat as keyof typeof KATEGORI_CFG];
            return (
              <div key={kat} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className={cn("flex items-center gap-2 px-4 py-2.5", kCfg.badge.replace("ring-1", ""))}>
                  <span className={cn("h-2 w-2 rounded-full", kCfg.dot)} />
                  <p className="text-[11px] font-bold">{kat}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full px-4">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase text-slate-400">Parameter</th>
                        <th className="px-4 py-2 text-center text-[10px] font-semibold uppercase text-slate-400">Hasil</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase text-slate-400">Satuan</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase text-slate-400">Nilai Rujukan</th>
                        <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase text-slate-400">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 px-4">
                      {items.map((item) => (
                        <HasilRow
                          key={hasilKey(item)}
                          item={item}
                          editable={!isLocked}
                          onChange={(v) => updateNilai(hasilKey(item), v)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Analis + Save */}
          {!isLocked && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Analis Pelaksana <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <UserCircle size={16} className="shrink-0 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{analisName || "—"}</span>
                  <span className="ml-auto rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">user login</span>
                </div>
              </div>
              {notAssigned && (
                <AssignmentGuardBanner message="Anda belum ditugaskan ke unit Laboratorium pada SDM Assignment. Hanya analis ter-assign yang dapat entry hasil. Hubungi admin untuk penugasan." />
              )}
              <button
                onClick={handleSave}
                disabled={!analisName.trim() || saving || notAssigned}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-40"
              >
                {saving ? "Menyimpan…" : (
                  <>
                    <Save size={15} />
                    Simpan Hasil &amp; Kirim ke Validasi
                  </>
                )}
              </button>
            </div>
          )}

          {isLocked && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Hasil Tersimpan</p>
                <p className="text-[11px] text-emerald-700">Analis: {order.analis} · Menunggu validasi SpPK</p>
              </div>
            </div>
          )}
        </div>

        {/* Right — Legend */}
        <div className="space-y-3">
          {/* Pengingat kriteria penolakan sampel — pengambilan dilakukan di luar aplikasi,
              jadi kualitas sampel jadi bahan pertimbangan analis sebelum entry hasil. */}
          {!isLocked && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <div className="mb-2 flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <h4 className="text-[12px] font-bold text-amber-800">Pertimbangkan Kualitas Sampel</h4>
                  <p className="text-[10px] text-amber-700">
                    Periksa kondisi sampel sebelum entry. Jangan entry bila memenuhi kriteria penolakan — minta pengambilan ulang.
                  </p>
                </div>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {[
                  { k: "Hemolisis",         d: "Sampel merah keruh, Hb terlepas dari eritrosit" },
                  { k: "Lipemia",           d: "Serum keruh/putih seperti susu karena lemak" },
                  { k: "Bekuan",            d: "Sampel membeku, tidak dapat dianalisa" },
                  { k: "Volume Kurang",     d: "Volume tidak mencukupi untuk semua pemeriksaan" },
                  { k: "Salah Tabung",      d: "Jenis tabung/antikoagulan tidak sesuai" },
                  { k: "Label Rusak/Salah", d: "Label rusak, tulisan tidak terbaca, atau tidak cocok" },
                ].map(({ k, d }) => (
                  <div key={k} className="flex gap-2">
                    <span className="w-24 shrink-0 font-semibold text-rose-600">{k}</span>
                    <span className="text-slate-500">{d}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 border-t border-amber-200/70 pt-2 text-[10px] text-amber-600">
                Ref: ISO 15189:2022 §5.4.5 · PMK 43/2013
              </p>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Flag Hasil</h4>
            <div className="space-y-2">
              {(Object.entries(FLAG_CFG) as [string, typeof FLAG_CFG[keyof typeof FLAG_CFG]][]).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={cn("text-sm font-bold w-14", v.cls)}>{v.label}</span>
                  <span className="text-[11px] text-slate-500">
                    {k === "N" ? "Dalam rentang normal" :
                     k === "H" ? "Di atas nilai rujukan" :
                     k === "L" ? "Di bawah nilai rujukan" :
                     "Di luar batas kritis — wajib lapor dokter"}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[9px] text-slate-400">ISO 15189:2022 §5.5 · SNARS AP 5.9</p>
          </div>

          <div className="rounded-xl border border-rose-100 bg-rose-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 text-rose-600 shrink-0" />
              <div className="text-[11px]">
                <p className="font-bold text-rose-800">Nilai Kritis (Panic Value)</p>
                <p className="mt-0.5 text-rose-700">Wajib dilaporkan ke dokter pengirim dalam waktu &lt; 30 menit setelah terdeteksi. Simpan log konfirmasi.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Pemeriksaan</h4>
            {order.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                <p className="text-[11px] text-slate-700">{i.nama}</p>
                <p className="text-[10px] text-slate-400">{i.waktuTunggu}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
