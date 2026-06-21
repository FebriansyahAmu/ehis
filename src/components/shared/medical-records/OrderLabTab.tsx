"use client";

// Tab Order Lab (shared IGD/RI/RJ). Katalog = tes lab TER-ASSIGN ke ruangan Laboratorium dari master
// (GET /master/lab-test-tersedia, gate clinical.tindakan) — bukan mock. Harga & Paket Cepat di-resolve
// dari Tarif Matrix. Konfigurasi/tipe/mock/riwayat diekstrak ke ./orderLab/* (file size < 800).

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Search, X, FlaskConical, User, Building2, Calendar, Clock, Stethoscope,
  CheckCircle2, AlertCircle, Ban, FileText, Activity, Wallet, Loader2, Info, Check, ServerCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import { listLabTestTersedia } from "@/lib/api/master/labTestTersedia";
import { createLabOrder, type LabOrderDTO } from "@/lib/api/lab/labOrder";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import {
  KATEGORI_ICON, KATEGORI_COLOR, STATUS_ORDER_BADGE, KategoriChip,
  TARIF_PENJAMIN_KODE, tarifTierForUnit, dtoToLabTest, fmtRp, PAKET_DEFS,
  toKategoriLab, DEFAULT_WAKTU_TUNGGU,
  type LabTest, type OrderItem, type ActiveOrder, type StatusOrder,
} from "./orderLab/orderLabShared";
import { ACTIVE_ORDERS_MOCK, RIWAYAT_LAB_MOCK } from "./orderLab/orderLabMock";
import RiwayatLabSection from "./orderLab/OrderLabHistory";
import RiwayatOrderLab from "./orderLab/RiwayatOrderLab";

// ── Normalized patient interface ──────────────────────────

export interface OrderLabPatient {
  /** kunjunganId — UUID → persist order ke DB (medicalrecord.LabOrder → worklist Lab); selain itu lokal (mock). */
  kunjunganId?: string;
  doctor:       string;
  name:         string;
  noRM:         string;
  age:          number;
  gender:       "L" | "P";
  tglOrder:     string;
  unitPengirim: string;
}

// kunjunganId UUID → mode DB (persist ke medicalrecord.LabOrder); selain itu lokal (mock).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** prioritas FE → vocab PrioritasLabEnum (CITO/Segera/Rutin). */
const PRIORITAS_API: Record<"Rutin" | "Cito", "CITO" | "Rutin"> = { Rutin: "Rutin", Cito: "CITO" };

// ── Lab search (katalog ter-assign, prop-driven) ──────────

function LabSearch({
  catalog, existing, loading, onSelect,
}: {
  catalog: LabTest[];
  existing: Set<string>;
  loading: boolean;
  onSelect: (test: LabTest) => void;
}) {
  const [query,   setQuery]   = useState("");
  const [open,    setOpen]    = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return [];
    return catalog
      .filter((t) => t.nama.toLowerCase().includes(q) || t.kode.toLowerCase().includes(q))
      .slice(0, 8);
  }, [q, catalog]);

  const pick = (test: LabTest) => {
    if (existing.has(test.id)) return;
    setQuery("");
    setOpen(false);
    onSelect(test);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(e.target.value.trim().length >= 2); }}
          onFocus={() => q.length >= 2 && setOpen(true)}
          disabled={loading}
          placeholder={loading ? "Memuat katalog laboratorium…" : "Ketik nama pemeriksaan atau kode (mis. DR, ELE)…"}
          className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 shadow-xs outline-none transition focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 disabled:bg-slate-50 disabled:text-slate-400"
        />
        {loading && <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-300" />}
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-400">Tidak ada pemeriksaan cocok di katalog unit</p>
          ) : (
            results.map((test) => {
              const color = KATEGORI_COLOR[test.kategori];
              const Icon  = KATEGORI_ICON[test.kategori];
              const added = existing.has(test.id);
              return (
                <button
                  key={test.id}
                  type="button"
                  disabled={added}
                  onClick={() => pick(test)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-slate-50 px-3 py-2.5 text-left text-xs last:border-0 transition",
                    added ? "cursor-default opacity-45" : "hover:bg-slate-50",
                  )}
                >
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md ring-1", color.bg, color.ring)}>
                    <Icon size={11} className={color.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-800">{test.nama}</p>
                    <p className="text-[10px] text-slate-400">{test.kode || "—"} · {test.kategori}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    {test.harga != null ? (
                      <span className="font-semibold tabular-nums text-emerald-600">{fmtRp(test.harga)}</span>
                    ) : (
                      <span className="text-[10px] text-amber-500">Belum bertarif</span>
                    )}
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      {added ? "sudah ada" : <><Clock size={9} /> {test.waktuTunggu}</>}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────

function EmptyOrder() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
        <FlaskConical size={18} />
      </span>
      <p className="text-xs text-slate-400">Belum ada pemeriksaan dalam daftar order</p>
      <p className="text-[11px] text-slate-300">Cari tindakan lab di kolom kiri</p>
    </div>
  );
}

// ── Active order card ─────────────────────────────────────

function ActiveOrderCard({ order, onCancel }: { order: ActiveOrder; onCancel: (id: string) => void }) {
  const canCancel = order.status === "Menunggu";

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border shadow-xs",
      order.status === "Dibatalkan" ? "border-slate-200 opacity-60" : "border-slate-200 bg-white",
    )}>
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-[11px] font-semibold text-slate-700">{order.noOrder}</span>
          <span className="text-[11px] text-slate-400">{order.jam} · {order.tanggal}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", STATUS_ORDER_BADGE[order.status])}>
            {order.status}
          </span>
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(order.id)}
              className="flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600 transition hover:bg-rose-100"
            >
              <Ban size={10} /> Batalkan
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Stethoscope size={11} className="shrink-0 text-slate-400" />
          <span>{order.dokter}</span>
          {order.catatan && (
            <>
              <span className="text-slate-300">·</span>
              <span className="text-amber-600">{order.catatan}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {order.items.map((item) => {
            const color = KATEGORI_COLOR[item.kategori];
            const Icon  = KATEGORI_ICON[item.kategori];
            return (
              <span
                key={item.id}
                className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1", color.bg, color.text, color.ring)}
              >
                <Icon size={10} className={color.icon} />
                {item.nama}
                <span className="ml-0.5 text-[10px] opacity-70">({item.waktuTunggu})</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────

export default function OrderLabTab({ patient }: { patient: OrderLabPatient }) {
  const [catalog,      setCatalog]      = useState<LabTest[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [orderItems,   setOrderItems]   = useState<OrderItem[]>([]);
  const [catatan,      setCatatan]      = useState("");
  const [priority,     setPriority]     = useState<"Rutin" | "Cito">("Rutin");
  const [submitted,    setSubmitted]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>(ACTIVE_ORDERS_MOCK[patient.noRM] ?? []);
  // Naik tiap order persisted terkirim → panel Riwayat Order Lab refetch (tampilkan order baru).
  const [riwayatSignal, setRiwayatSignal] = useState(0);

  const canCancel = useSession().can("clinical.tindakan", "update");

  const isPersisted = !!patient.kunjunganId && UUID_RE.test(patient.kunjunganId);
  const riwayat = RIWAYAT_LAB_MOCK[patient.noRM] ?? [];

  // Muat katalog tes lab ter-assign (Laboratorium) sekali saat mount. Harga via tier unit pengirim.
  // setState dijalankan di dalam alur async (pasca-await) → hindari set-state-in-effect sinkron.
  useEffect(() => {
    const ac = new AbortController();
    let alive = true;
    (async () => {
      try {
        const dtos = await listLabTestTersedia(
          { penjaminKode: TARIF_PENJAMIN_KODE, jenisRuangan: tarifTierForUnit(patient.unitPengirim) },
          ac.signal,
        );
        if (alive) { setCatalog(dtos.map(dtoToLabTest)); setCatalogError(null); }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (alive) setCatalogError("Gagal memuat katalog lab ter-assign");
      } finally {
        if (alive && !ac.signal.aborted) setLoading(false);
      }
    })();
    return () => { alive = false; ac.abort(); };
  }, [patient.unitPengirim]);

  const catalogByKode = useMemo(() => {
    const m = new Map<string, LabTest>();
    for (const t of catalog) if (t.kode) m.set(t.kode, t);
    return m;
  }, [catalog]);

  // Paket cepat dari master: resolve anggota by kode, sembunyikan paket tanpa anggota, harga = jumlah.
  const pakets = useMemo(
    () =>
      PAKET_DEFS.map((p) => {
        const tests = p.codes.map((c) => catalogByKode.get(c)).filter((t): t is LabTest => !!t);
        return { label: p.label, tests, total: tests.reduce((s, t) => s + (t.harga ?? 0), 0) };
      }).filter((p) => p.tests.length > 0),
    [catalogByKode],
  );

  const addedIds = useMemo(
    () => new Set(orderItems.map((i) => i.testId).filter((x): x is string => !!x)),
    [orderItems],
  );

  const addTest = (test: LabTest) =>
    setOrderItems((prev) =>
      prev.some((i) => i.testId === test.id)
        ? prev
        : [
            ...prev,
            {
              id: `oi-${Date.now()}-${test.id.slice(0, 8)}`,
              testId: test.id,
              kode: test.kode,
              nama: test.nama,
              kategori: test.kategori,
              waktuTunggu: test.waktuTunggu,
              harga: test.harga,
            },
          ],
    );

  const removeTest  = (id: string) => setOrderItems((prev) => prev.filter((i) => i.id !== id));

  // Salin order lama → form (re-order): tambah item yg belum ada, set prioritas/catatan.
  const copyOrderToForm = (o: LabOrderDTO) => {
    setOrderItems((prev) => {
      const seen = new Set(prev.map((i) => i.testId).filter((x): x is string => !!x));
      const add: OrderItem[] = [];
      o.items.forEach((it, idx) => {
        if (it.labTestId && seen.has(it.labTestId)) return;
        const kat = toKategoriLab(it.kategori);
        add.push({
          id: `oi-${Date.now()}-${idx}`,
          testId: it.labTestId ?? undefined,
          kode: it.kodeTes,
          nama: it.namaTes,
          kategori: kat,
          waktuTunggu: it.waktuTunggu || DEFAULT_WAKTU_TUNGGU[kat] || "1 jam",
          harga: it.harga,
        });
        if (it.labTestId) seen.add(it.labTestId);
      });
      return [...prev, ...add];
    });
    if (o.prioritas === "CITO") setPriority("Cito");
    if (o.catatan) setCatatan(o.catatan);
    toast.success("Pemeriksaan disalin ke form", `${o.items.length} pemeriksaan dari order ${o.labNama}`);
  };

  const cancelOrder = (orderId: string) =>
    setActiveOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "Dibatalkan" as StatusOrder } : o)));

  const estTotal   = orderItems.reduce((s, i) => s + (i.harga ?? 0), 0);
  const untariffed = orderItems.filter((i) => i.harga == null).length;

  const addLocalActiveOrder = () => {
    const newOrder: ActiveOrder = {
      id:       `ao-${Date.now()}`,
      noOrder:  `LAB/2026/04/${String(Math.floor(Math.random() * 900) + 100).padStart(4, "0")}`,
      tanggal:  patient.tglOrder,
      jam:      new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      dokter:   patient.doctor,
      status:   "Menunggu",
      catatan:  priority === "Cito" ? "CITO" : catatan || undefined,
      items:    orderItems,
    };
    setActiveOrders((prev) => [newOrder, ...prev]);
  };

  const handleSubmit = async () => {
    if (orderItems.length === 0 || submitting) return;

    // kunjunganId UUID → persist ke DB (medicalrecord.LabOrder) → muncul di worklist Lab.
    if (isPersisted) {
      setSubmitting(true);
      try {
        await createLabOrder(patient.kunjunganId!, {
          labNama: "Laboratorium",
          catatan: catatan || undefined,
          prioritas: PRIORITAS_API[priority],
          items: orderItems.map((i) => ({
            labTestId: i.testId && UUID_RE.test(i.testId) ? i.testId : undefined,
            kodeTes: i.kode,
            namaTes: i.nama,
            kategori: i.kategori,
            waktuTunggu: i.waktuTunggu,
            harga: i.harga ?? undefined,
          })),
        });
        toast.success("Order Lab dikirim", `${orderItems.length} pemeriksaan → Laboratorium`);
        // Bukan takeover layar sukses: bersihkan form & refetch Riwayat Order Lab → order
        // baru langsung tampil di panel riwayat (mirip alur worklist).
        setOrderItems([]);
        setCatatan("");
        setPriority("Rutin");
        setRiwayatSignal((n) => n + 1);
      } catch (e) {
        toast.error("Gagal mengirim order lab", e instanceof ApiError ? e.message : undefined);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Pasien demo (non-UUID) → tetap lokal (mock).
    addLocalActiveOrder();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={28} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">Order Lab Berhasil Dikirim</p>
          <p className="mt-1 text-xs text-slate-500">
            {orderItems.length} pemeriksaan · prioritas{" "}
            <span className={cn("font-semibold", priority === "Cito" ? "text-rose-600" : "text-slate-700")}>{priority}</span>
            {estTotal > 0 && <> · estimasi <span className="font-semibold text-emerald-700">{fmtRp(estTotal)}</span></>}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">Pengirim: {patient.doctor}</p>
        </div>
        <button
          onClick={() => { setSubmitted(false); setOrderItems([]); setCatatan(""); setPriority("Rutin"); }}
          className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Buat Order Baru
        </button>
      </div>
    );
  }

  const nonCancelledActiveOrders = activeOrders.filter((o) => o.status !== "Dibatalkan");
  const cancelledOrders          = activeOrders.filter((o) => o.status === "Dibatalkan");

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header info ── */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <User size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dokter Pengirim</p>
              <p className="text-xs font-semibold text-slate-800">{patient.doctor}</p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <FileText size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pasien</p>
              <p className="text-xs font-semibold text-slate-800">{patient.name}</p>
              <p className="text-[11px] text-slate-400">
                {patient.noRM} · {patient.age} thn · {patient.gender === "L" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Calendar size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal Order</p>
              <p className="text-xs font-semibold text-slate-800">{patient.tglOrder}</p>
            </div>
          </div>

          <div className="hidden h-7 w-px bg-slate-100 sm:block" />

          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Building2 size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Unit Pengirim</p>
              <p className="text-xs font-semibold text-slate-800">{patient.unitPengirim}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column area ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* ── Left: Search + paket + form ── */}
        <div className="flex flex-col gap-3">

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700">Tambah Pemeriksaan</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                {loading ? <Loader2 size={9} className="animate-spin" /> : <FlaskConical size={9} />}
                {loading ? "memuat…" : `${catalog.length} tes tersedia`}
              </span>
            </div>

            {catalogError ? (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                <ServerCog size={13} className="mt-0.5 shrink-0 text-rose-500" />
                <p className="text-[11px] leading-snug text-rose-700">
                  {catalogError}. Pastikan Anda login &amp; punya hak <span className="font-mono">clinical.tindakan</span>.
                </p>
              </div>
            ) : !loading && catalog.length === 0 ? (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/60 px-3 py-2">
                <Info size={13} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-[11px] leading-snug text-amber-700">
                  <strong>Belum ada tes lab ter-assign.</strong> Hubungi admin master untuk memetakan
                  tes ke ruangan Laboratorium via <em>Mapping Hub → Layanan Unit</em>.
                </p>
              </div>
            ) : null}

            <div className="flex flex-col gap-3">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Cari Tindakan Lab <span className="text-rose-400">*</span>
                </p>
                <LabSearch catalog={catalog} existing={addedIds} loading={loading} onSelect={addTest} />
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Ketik minimal 2 karakter · katalog = tes ter-assign ke Laboratorium (master)
                </p>
              </div>

              {pakets.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Paket Cepat</p>
                  <div className="flex flex-wrap gap-1.5">
                    {pakets.map((pkg) => {
                      const allAdded = pkg.tests.every((t) => addedIds.has(t.id));
                      return (
                        <button
                          key={pkg.label}
                          type="button"
                          disabled={allAdded}
                          title={pkg.tests.map((t) => t.nama).join(", ")}
                          onClick={() => pkg.tests.forEach(addTest)}
                          className={cn(
                            "group flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition",
                            allAdded
                              ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-600"
                              : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700",
                          )}
                        >
                          {allAdded ? <Check size={10} /> : <span className="text-slate-400 group-hover:text-indigo-500">+</span>}
                          <span>{pkg.label}</span>
                          <span className={cn("rounded px-1 text-[9px] font-semibold", allAdded ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500")}>
                            {pkg.tests.length}
                          </span>
                          {pkg.total > 0 && (
                            <span className="tabular-nums text-[9px] text-emerald-600">{fmtRp(pkg.total)}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Prioritas</p>
                <div className="flex gap-2">
                  {(["Rutin", "Cito"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                        priority === p
                          ? p === "Cito"
                            ? "border-rose-400 bg-rose-50 text-rose-700"
                            : "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {p === "Cito" && <AlertCircle size={11} />}
                      {p}
                    </button>
                  ))}
                </div>
                {priority === "Cito" && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-600">
                    <AlertCircle size={10} />
                    Order CITO memerlukan konfirmasi telepon ke laboratorium
                  </p>
                )}
              </div>

              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Catatan Klinis</p>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  rows={2}
                  placeholder="Contoh: pasien sedang antikoagulan, kondisi O₂ saat pengambilan AGD..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Daftar order + active orders ── */}
        <div className="flex flex-col gap-3">

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-700">Daftar Order Baru</p>
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
                  {orderItems.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {estTotal > 0 && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <Wallet size={11} className="text-emerald-500" /> {fmtRp(estTotal)}
                  </span>
                )}
                {orderItems.length > 0 && (
                  <button
                    onClick={() => setOrderItems([])}
                    className="text-[11px] text-slate-400 transition hover:text-rose-500"
                  >
                    Hapus semua
                  </button>
                )}
              </div>
            </div>
            <div className="p-3">
              {orderItems.length === 0 ? (
                <EmptyOrder />
              ) : (
                <div className="flex flex-col gap-2">
                  {orderItems.map((item) => {
                    const color = KATEGORI_COLOR[item.kategori];
                    const Icon  = KATEGORI_ICON[item.kategori];
                    return (
                      <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1", color.bg, color.ring)}>
                          <Icon size={14} className={color.icon} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800">{item.nama}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <KategoriChip kategori={item.kategori} />
                            <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                              <Clock size={9} /> {item.waktuTunggu}
                            </span>
                          </div>
                        </div>
                        {item.harga != null ? (
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-700">{fmtRp(item.harga)}</span>
                        ) : (
                          <span className="shrink-0 text-[10px] text-amber-500">Belum bertarif</span>
                        )}
                        <button
                          onClick={() => removeTest(item.id)}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {activeOrders.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2.5">
                <Activity size={13} className="text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">Order Aktif</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {nonCancelledActiveOrders.length} order
                </span>
              </div>
              <div className="flex flex-col gap-3 p-3">
                {nonCancelledActiveOrders.map((order) => (
                  <ActiveOrderCard key={order.id} order={order} onCancel={cancelOrder} />
                ))}
                {cancelledOrders.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Dibatalkan</p>
                    {cancelledOrders.map((order) => (
                      <ActiveOrderCard key={order.id} order={order} onCancel={cancelOrder} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Order Lab (DB) — pasien terpersist (UUID); status pemenuhan + Salin/Batalkan. */}
      <RiwayatOrderLab
        kunjunganId={patient.kunjunganId ?? ""}
        onCopy={copyOrderToForm}
        canWrite={canCancel}
        refreshSignal={riwayatSignal}
      />

      {riwayat.length > 0 && <RiwayatLabSection riwayat={riwayat} />}

      {/* ── Sticky footer ── */}
      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {orderItems.length === 0 ? (
            <p className="text-xs text-slate-400">Tambahkan pemeriksaan ke daftar order terlebih dahulu</p>
          ) : (
            <>
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{orderItems.length} pemeriksaan</span> siap dikirim
              </p>
              {estTotal > 0 && (
                <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <Wallet size={10} /> Estimasi {fmtRp(estTotal)}
                </span>
              )}
              {untariffed > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-amber-600">
                  <AlertCircle size={10} /> {untariffed} belum bertarif
                </span>
              )}
              {priority === "Cito" && (
                <span className="flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600 ring-1 ring-rose-200">
                  <AlertCircle size={10} /> CITO
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            Simpan Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={orderItems.length === 0 || submitting}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40",
              priority === "Cito" ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700",
            )}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <FlaskConical size={13} />}
            {submitting ? "Mengirim…" : priority === "Cito" ? "Kirim Order CITO" : "Kirim Order ke Lab"}
          </button>
        </div>
      </div>
    </div>
  );
}
