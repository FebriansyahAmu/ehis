"use client";

// Halaman Rawat Jalan bertab (pola LabPageView): Order Masuk | Worklist Pasien | Konsultasi.
// Badge angka + pulse merah kedip = ada order/konsul masuk yang belum diterima. Menggantikan
// RJBoardLive (fetch kunjungan + transisi lifecycle diserap ke sini agar badge tahu jumlah
// order tanpa membuka tab). Panel Poliklinik difilter SDM Assignment user login (poli-saya);
// superuser/global/akun tanpa penugasan poli → semua poli.

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox, Users, MessageSquare, Clock, Stethoscope, CheckCircle2, CalendarRange, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/shared/inputs/DatePicker";
import { useSession } from "@/contexts/SessionContext";
import type { RJPatient, RJPoli } from "@/lib/data";
import { listKunjungan, transitionKunjungan, type KunjunganListItemDTO } from "@/lib/api/kunjungan";
import { listKonsultasiWorklist } from "@/lib/api/konsultasi/konsultasi";
import { listRuanganSaya } from "@/lib/api/penugasanRuangan";
import { listDpjpTersedia } from "@/lib/api/master/dpjpTersedia";
import { ApiError } from "@/lib/api/client";
import type { RJOrderStatus } from "@/lib/rawat-jalan/rjQueueStore";
import { dtoToRJPatient, orderFromStatus, rjPoliStrict } from "./rjLiveApi";
import RJBoard, { type BoardApiAction, ORDER_TAB_STATUSES } from "./RJBoard";
import KonsultasiInbox from "./KonsultasiInbox";

type View = "order" | "worklist" | "konsultasi";

// ── Periode helpers (UTC-day — selaras interpretasi server atas waktuKunjungan) ──
function ymdUtc(d: Date): string { return d.toISOString().slice(0, 10); }
function addDaysUtc(base: Date, n: number): Date {
  const d = new Date(base); d.setUTCDate(d.getUTCDate() + n); return d;
}
/** "2026-07-12" → "12 Jul 2026" (split string; hindari shift zona). */
const MON_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function fmtYmd(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MON_SHORT[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

export default function RJPageView() {
  const { session } = useSession();
  const [view, setView]           = useState<View>("worklist"); // default = Worklist Pasien
  const [items, setItems]         = useState<KunjunganListItemDTO[]>([]);
  const [konsulMasuk, setKonsulMasuk] = useState(0);
  const [myPolis, setMyPolis]     = useState<ReadonlySet<RJPoli> | null>(null);
  const [dokterNama, setDokterNama] = useState<Record<string, string>>({}); // dpjpId → nama DPJP
  const [dari, setDari]           = useState(""); // filter periode "YYYY-MM-DD" (kosong = live)
  const [sampai, setSampai]       = useState("");
  const pending = useRef<Set<string>>(new Set()); // cegah aksi ganda in-flight per id
  const periodeAktif = dari !== "" || sampai !== "";

  // ── Tooltip singkat "ada order/konsul masuk" (auto-muncul ±2,5 dtk, antre berurutan) ──
  const [tip, setTip] = useState<View | null>(null);
  const tipTimers   = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tipBusyUntil = useRef(0);

  function flashTip(t: View) {
    const now = Date.now();
    const start = Math.max(0, tipBusyUntil.current - now);
    tipBusyUntil.current = now + start + 3000;
    tipTimers.current.push(setTimeout(() => setTip(t), start));
    tipTimers.current.push(setTimeout(() => setTip((cur) => (cur === t ? null : cur)), start + 2500));
  }

  useEffect(() => () => { tipTimers.current.forEach(clearTimeout); }, []);

  // ── Kunjungan RJ (worklist aktif + selesai terkini) ──
  // Aktif (Registered/Queued/InService) + Completed terkini digabung agar filter/stat "Selesai"
  // nyata (tanpa mock). Order Masuk & badge = subset aktif. Filter periode (dari/sampai) diteruskan
  // ke server (waktuKunjungan inklusif) → refetch saat rentang berubah.
  useEffect(() => {
    const ac = new AbortController();
    const rentang = { dari: dari || undefined, sampai: sampai || undefined };
    Promise.all([
      listKunjungan({ unit: "RawatJalan", limit: 50, ...rentang }, ac.signal),
      listKunjungan({ unit: "RawatJalan", status: "Completed", limit: periodeAktif ? 50 : 30, ...rentang }, ac.signal)
        .catch(() => ({ items: [] as KunjunganListItemDTO[], cursor: null })),
    ])
      .then(([aktif, selesai]) => {
        if (ac.signal.aborted) return;
        setItems([...aktif.items, ...selesai.items]);
        // Tooltip "ada order masuk" hanya di tampilan live (tanpa filter periode) agar tak
        // muncul berulang saat menelusuri riwayat.
        if (periodeAktif) return;
        const n = aktif.items.filter((it) => {
          const o = orderFromStatus(it.status, it.callState);
          return o === "Order_Masuk" || o === "Dipanggil";
        }).length;
        if (n > 0) flashTip("order");
      })
      .catch(() => { /* board tetap tampil (kosong) bila API gagal */ });
    return () => ac.abort();
  }, [dari, sampai, periodeAktif]);

  // ── Badge Konsultasi masuk (KonsultasiInbox lapor ulang saat tab dibuka) ──
  useEffect(() => {
    const ac = new AbortController();
    listKonsultasiWorklist("aktif", ac.signal)
      .then((rows) => {
        if (ac.signal.aborted) return;
        const n = rows.filter((r) => r.status === "Terkirim").length;
        setKonsulMasuk(n);
        if (n > 0) flashTip("konsultasi");
      })
      .catch(() => { /* badge 0 bila gagal */ });
    return () => ac.abort();
  }, []);

  // ── Poli penugasan user login (SDM Assignment) → filter Panel Poliklinik ──
  useEffect(() => {
    if (!session || session.isSuperuser || session.isGlobal) { setMyPolis(null); return; }
    const ac = new AbortController();
    listRuanganSaya(ac.signal)
      .then((rows) => {
        if (ac.signal.aborted) return;
        const polis = new Set<RJPoli>();
        for (const r of rows) {
          const p = rjPoliStrict(r.ruanganNama);
          if (p) polis.add(p);
        }
        // Tanpa penugasan poli (mis. petugas loket/admin unit) → tampilkan semua.
        setMyPolis(polis.size > 0 ? polis : null);
      })
      .catch(() => { if (!ac.signal.aborted) setMyPolis(null); });
    return () => ac.abort();
  }, [session]);

  // ── Nama DPJP (dpjpId → nama) dari katalog dokter RS (fetch sekali) → tampil di kartu. ──
  useEffect(() => {
    const ac = new AbortController();
    listDpjpTersedia(ac.signal)
      .then((rows) => {
        if (ac.signal.aborted) return;
        setDokterNama(Object.fromEntries(rows.map((d) => [d.dokterId, d.nama])));
      })
      .catch(() => { /* gagal → kartu tetap "—" */ });
    return () => ac.abort();
  }, []);

  // ── Derivasi board (sumber kebenaran version/callState/recallCount) ──
  // Resolusi nama DPJP dari dpjpId (kartu RJ menampilkan nama, bukan "—").
  const live = useMemo<RJPatient[]>(
    () => items.map((it) => {
      const p = dtoToRJPatient(it);
      const nama = it.dpjpId ? dokterNama[it.dpjpId] : undefined;
      return nama ? { ...p, dokter: nama } : p;
    }),
    [items, dokterNama],
  );
  const statusOverride = useMemo<Record<string, RJOrderStatus>>(
    () => Object.fromEntries(items.map((it) => [it.id, orderFromStatus(it.status, it.callState)])),
    [items],
  );
  const recallOverride = useMemo<Record<string, number>>(
    () => Object.fromEntries(items.map((it) => [it.id, it.recallCount])),
    [items],
  );
  // Tab "Order Masuk" = antrean pra-pelayanan (Order Masuk + Dipanggil) → badge cocok isinya.
  const orderMasuk = useMemo(
    () => items.filter((it) => {
      const o = orderFromStatus(it.status, it.callState);
      return o === "Order_Masuk" || o === "Dipanggil";
    }).length,
    [items],
  );

  // Statistik NYATA dari worklist DB (menggantikan rjStats mock).
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    let hariIni = 0, menunggu = 0, dilayani = 0, selesai = 0;
    for (const it of items) {
      const o = orderFromStatus(it.status, it.callState);
      if (o === "Order_Masuk" || o === "Dipanggil") menunggu++;
      else if (o === "Dilayani") dilayani++;
      else if (o === "Selesai") selesai++;
      if (it.waktuKunjungan.slice(0, 10) === todayStr) hariIni++;
    }
    return { hariIni, menunggu, dilayani, selesai };
  }, [items]);

  // ── Aksi kartu API → transisi server (version-guarded) → patch item dari respons ──
  const onApiAction = useCallback(async (p: RJPatient, action: BoardApiAction) => {
    if (pending.current.has(p.id)) return { ok: false, message: "Aksi sedang diproses…" };
    const item = items.find((it) => it.id === p.id);
    if (!item) return { ok: false, message: "Data kunjungan tidak ditemukan" };

    pending.current.add(p.id);
    try {
      const u = await transitionKunjungan(p.id, action, item.version);
      setItems((prev) =>
        prev.map((it) =>
          it.id === p.id
            ? { ...it, status: u.status, callState: u.callState, recallCount: u.recallCount, version: u.version }
            : it,
        ),
      );
      return { ok: true };
    } catch (e) {
      const message = e instanceof ApiError ? e.message : "Gagal memproses aksi";
      return { ok: false, message };
    } finally {
      pending.current.delete(p.id);
    }
  }, [items]);

  const TABS: { key: View; label: string; icon: typeof Inbox; badge?: number }[] = [
    { key: "order",      label: "Order Masuk",     icon: Inbox,         badge: orderMasuk },
    { key: "worklist",   label: "Worklist Pasien", icon: Users },
    { key: "konsultasi", label: "Konsultasi",      icon: MessageSquare, badge: konsulMasuk },
  ];

  // ── Preset periode cepat (rentang dihitung UTC-day) ──
  const presets = useMemo(() => {
    const now = new Date();
    const today = ymdUtc(now);
    const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return [
      { key: "hari",   label: "Hari Ini",  dari: today,                       sampai: today },
      { key: "minggu", label: "7 Hari",    dari: ymdUtc(addDaysUtc(now, -6)), sampai: today },
      { key: "bulan",  label: "Bulan Ini", dari: ymdUtc(firstOfMonth),        sampai: today },
    ];
  }, []);
  const activePreset = presets.find((p) => p.dari === dari && p.sampai === sampai)?.key ?? null;

  // Rentang selalu valid (dari ≤ sampai): pilih satu ujung → tarik ujung lain bila menyilang.
  const onDari   = (v: string) => { setDari(v);   if (v && sampai && v > sampai) setSampai(v); };
  const onSampai = (v: string) => { setSampai(v); if (v && dari && v < dari) setDari(v); };
  const resetPeriode = () => { setDari(""); setSampai(""); };

  return (
    <div className="space-y-5">
      {/* ── Statistik nyata (dari worklist DB) ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Kunjungan Hari Ini" value={stats.hariIni} sub="terdaftar hari ini" icon={Users} />
        <StatCard label="Menunggu"           value={stats.menunggu} sub="antrian aktif"     icon={Clock}        variant="warning" />
        <StatCard label="Sedang Dilayani"    value={stats.dilayani} sub="dalam pelayanan"   icon={Stethoscope}  variant="active" />
        <StatCard label="Selesai"            value={stats.selesai}  sub="kunjungan tuntas"  icon={CheckCircle2} variant="success" />
      </div>

      {/* ── Baris kontrol: toggle tab + filter periode ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-semibold transition-all duration-150",
              view === key
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
            )}
          >
            <Icon size={13} />
            {label}
            {/* Notifikasi angka — LINGKARAN ANGKA berkedip saat ada yang masuk (tab non-aktif) */}
            <AnimatePresence>
              {badge ? (
                <motion.span
                  key={badge}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={
                    view === key
                      ? { scale: 1, opacity: 1 }
                      : { scale: [1, 1.18, 1], opacity: [1, 0.45, 1] }
                  }
                  exit={{ scale: 0, opacity: 0 }}
                  transition={
                    view === key
                      ? { type: "spring", stiffness: 500, damping: 16 }
                      : { repeat: Infinity, duration: 1.2, ease: "easeInOut" }
                  }
                  className={cn(
                    "ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black tabular-nums",
                    view === key ? "bg-white text-sky-700" : "bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.55)]",
                  )}
                >
                  {badge}
                </motion.span>
              ) : null}
            </AnimatePresence>

            {/* Tooltip singkat — auto-muncul saat terdeteksi ada yang masuk */}
            <AnimatePresence>
              {tip === key && view !== key && (
                <motion.span
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-xl"
                  role="status"
                >
                  <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-slate-900" />
                  {key === "order" ? "Ada order masuk" : "Ada konsultasi masuk"}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>

        {/* Filter periode (worklist/order saja — Konsultasi punya inbox sendiri) */}
        {view !== "konsultasi" && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <span className="ml-1 hidden items-center gap-1.5 text-[11px] font-semibold text-slate-500 sm:flex">
              <CalendarRange size={14} className="text-slate-400" /> Periode
            </span>
            <DatePicker value={dari} onChange={onDari} placeholder="Dari" className="w-36" clearable={false} />
            <span className="text-slate-300">–</span>
            <DatePicker value={sampai} onChange={onSampai} placeholder="Sampai" className="w-36" clearable={false} />
            <div className="flex items-center gap-1">
              {presets.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => { setDari(p.dari); setSampai(p.sampai); }}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition",
                    activePreset === p.key
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-500 hover:bg-sky-50 hover:text-sky-700",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {periodeAktif && (
              <button
                type="button"
                onClick={resetPeriode}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                title="Hapus filter periode"
              >
                <X size={12} /> Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ringkasan rentang aktif */}
      {periodeAktif && view !== "konsultasi" && (
        <p className="-mt-2 text-[11px] text-slate-500">
          Menampilkan kunjungan periode{" "}
          <b className="text-slate-700">{dari ? fmtYmd(dari) : "…"}</b>
          {" – "}
          <b className="text-slate-700">{sampai ? fmtYmd(sampai) : "…"}</b>
          {" "}<span className="text-slate-400">({items.length} kunjungan)</span>
        </p>
      )}

      {/* ── Konten per tab ── */}
      {view === "order" && (
        <RJBoard
          patients={live}
          statusOverride={statusOverride}
          recallOverride={recallOverride}
          onApiAction={onApiAction}
          lockStatuses={ORDER_TAB_STATUSES}
          allowedPolis={myPolis}
        />
      )}
      {view === "worklist" && (
        <RJBoard
          patients={live}
          statusOverride={statusOverride}
          recallOverride={recallOverride}
          onApiAction={onApiAction}
          allowedPolis={myPolis}
        />
      )}
      {view === "konsultasi" && <KonsultasiInbox onMenungguChange={setKonsulMasuk} />}
    </div>
  );
}

// ── Stat card (data nyata) ────────────────────────────────
type StatVariant = "default" | "warning" | "active" | "success";
const STAT_CLS: Record<StatVariant, { card: string; text: string; lbl: string; ico: string }> = {
  default: { card: "border-slate-200 bg-white",        text: "text-slate-900",   lbl: "text-slate-600",   ico: "text-slate-400"   },
  warning: { card: "border-amber-200 bg-amber-50",     text: "text-amber-700",   lbl: "text-amber-600",   ico: "text-amber-500"   },
  active:  { card: "border-sky-200 bg-sky-50",         text: "text-sky-700",     lbl: "text-sky-600",     ico: "text-sky-500"     },
  success: { card: "border-emerald-200 bg-emerald-50", text: "text-emerald-700", lbl: "text-emerald-600", ico: "text-emerald-500" },
};

function StatCard({
  label, value, sub, icon: Icon, variant = "default",
}: {
  label: string; value: number; sub?: string; icon: LucideIcon; variant?: StatVariant;
}) {
  const s = STAT_CLS[variant];
  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", s.card)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className={cn("text-2xl font-black tabular-nums leading-none", s.text)}>{value}</p>
          <p className={cn("mt-1 text-sm font-medium", s.lbl)}>{label}</p>
          {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
        </div>
        <Icon size={18} className={s.ico} />
      </div>
    </div>
  );
}
