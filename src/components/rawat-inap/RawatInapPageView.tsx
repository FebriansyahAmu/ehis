"use client";

// Landing Rawat Inap (DB-driven) — orkestrator: census pasien RI (GET /kunjungan?unit=RawatInap)
// + informasi tempat tidur (master bed × alokasi aktif) + statistik nyata. Mengganti seluruh
// data mock (rawatInapPatients/rawatInapRuangan/rawatInapStats).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BedDouble, Users, ArrowDownToLine, DoorOpen, BedSingle, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { listKunjungan, transitionKunjungan } from "@/lib/api/kunjungan";
import { getTree } from "@/lib/api/ruangan";
import { listActiveBedAllocations, type BedAllocationDTO } from "@/lib/api/bedAllocation";
import { listDokter } from "@/lib/api/dokter";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import type { KunjunganListItemDTO } from "@/lib/api/kunjungan";
import type { LocationNode, BedSubRecord } from "@/components/master/ruangan/ruanganShared";
import type { RawatInapPatient, RIKelas, RIStatus } from "@/lib/data";
import RIBoard from "./RIBoard";
import { RIBedInfoPanel } from "./RIBedInfoPanel";
import { RIOrderInbox, type RIOrder, type RIOrderBusy } from "./RIOrderInbox";
import {
  type BedItem, buildBedItems, countBeds, riRoomsFromTree, riKelasOf, toRIPenjamin,
  ageFrom, hariKeFrom, isToday,
} from "./riLandingShared";

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";
const KELAS_SET = new Set<RIKelas>(["VIP", "Kelas_1", "Kelas_2", "Kelas_3", "ICU", "HCU", "Isolasi"]);

interface Data {
  patients: RawatInapPatient[];
  orders: RIOrder[];
  bedItems: BedItem[];
  rooms: LocationNode[];
  masukHariIni: number;
}

export function RawatInapPageView() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<RIOrderBusy>(null);
  const mounted = useRef(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const [worklist, tree, allocs, dokter] = await Promise.all([
        listKunjungan({ unit: "RawatInap", limit: 50 }, signal),
        getTree(signal),
        listActiveBedAllocations(undefined, signal),
        listDokter({ status: "Aktif", limit: 200 }, signal).catch(() => ({ items: [] })),
      ]);
      if (signal?.aborted) return;
      const rooms = riRoomsFromTree(tree);
      const allocByBed = new Map(allocs.map((a) => [a.bedId, a]));
      const allocByKunjungan = new Map(allocs.map((a) => [a.kunjunganId, a]));
      const bedByIdCode = new Map<string, BedSubRecord>();
      const roomById = new Map<string, LocationNode>();
      for (const r of rooms) {
        roomById.set(r.id, r);
        for (const b of r.beds) bedByIdCode.set(b.id, b);
      }
      const dokterById = new Map(dokter.items.map((d) => [d.id, d]));
      const L: Lookups = { roomById, bedByIdCode, allocByKunjungan, dokterById };

      // Order masuk = belum diterima bangsal (Registered, bed direservasi admisi).
      // Census = sudah diterima / dalam perawatan (InService/Queued).
      const orders = worklist.items.filter((k) => k.status === "Registered").map((k) => toOrder(k, L));
      const patients = worklist.items.filter((k) => k.status !== "Registered").map((k) => toPatient(k, L));
      const bedItems = buildBedItems(rooms, allocByBed);
      const masukHariIni = worklist.items.filter((k) => isToday(k.waktuKunjungan)).length;
      if (!signal?.aborted) setData({ patients, orders, bedItems, rooms, masukHariIni });
    } catch (e) {
      if (!isAbort(e) && !signal?.aborted) setError(true);
      throw e;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const ctrl = new AbortController();
    load(ctrl.signal).catch(() => {}).finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => { mounted.current = false; ctrl.abort(); };
  }, [load]);

  // "Terima Order" → transisi receive (RI: Reserved→Occupied) → pasien pindah ke census.
  async function handleTerima(o: RIOrder) {
    if (busy) return;
    setBusy({ id: o.id, action: "receive" });
    try {
      await transitionKunjungan(o.id, "receive", o.version);
      toast.success("Order diterima", `${o.name} mulai dirawat`);
      await load(); // muat ulang dari DB (pindah ke census + bed jadi terisi)
    } catch (e) {
      toast.error("Gagal menerima order", e instanceof ApiError ? e.message : undefined);
    } finally {
      if (mounted.current) setBusy(null);
    }
  }

  // "Batalkan Order" → transisi cancel (Registered→Cancelled) → reservasi bed dilepas.
  async function handleBatalkan(o: RIOrder) {
    if (busy) return;
    setBusy({ id: o.id, action: "cancel" });
    try {
      await transitionKunjungan(o.id, "cancel", o.version);
      toast.success("Order dibatalkan", `${o.name} — reservasi bed dilepas`);
      await load(); // muat ulang dari DB (order hilang + bed kembali tersedia)
    } catch (e) {
      toast.error("Gagal membatalkan order", e instanceof ApiError ? e.message : undefined);
    } finally {
      if (mounted.current) setBusy(null);
    }
  }

  const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const beds = useMemo(() => (data ? countBeds(data.bedItems) : null), [data]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <header className="animate-fade-in flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <BedDouble size={16} className="text-emerald-600" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Rawat Inap</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Data per pukul {now}
            {beds ? <> · {beds.available} tempat tidur tersedia dari {beds.active} aktif</> : null}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-20 text-slate-400">
          <Loader2 size={16} className="animate-spin text-emerald-500" />
          <span className="text-sm">Memuat data rawat inap…</span>
        </div>
      ) : error || !data || !beds ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-600">
          <AlertCircle size={15} /> Gagal memuat data rawat inap. Periksa koneksi lalu muat ulang.
        </div>
      ) : (
        <>
          {/* Stats — nyata dari DB */}
          <section className="animate-fade-in grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" style={{ animationDelay: "60ms" }}>
            <BORGauge value={beds.bor} />
            <StatCard label="Pasien Aktif" value={data.patients.length} sub="dirawat saat ini" icon={Users} />
            <StatCard label="Masuk Hari Ini" value={data.masukHariIni} sub="admisi baru" icon={ArrowDownToLine} variant="info" />
            <StatCard label="Bed Terisi" value={beds.occupied} sub={`+${beds.reserved} dipesan`} icon={BedSingle} variant={beds.bor >= 85 ? "critical" : "default"} />
            <StatCard label="Bed Tersedia" value={beds.available} sub={`dari ${beds.active} aktif`} icon={BedDouble} variant="success" />
            <StatCard label="Bangsal" value={data.rooms.length} sub="ruangan rawat inap" icon={DoorOpen} />
          </section>

          {/* Informasi Tempat Tidur */}
          <section className="animate-fade-in" style={{ animationDelay: "120ms" }}>
            <RIBedInfoPanel items={data.bedItems} />
          </section>

          {/* Order masuk — menunggu diterima bangsal (Terima Order) */}
          {data.orders.length > 0 && (
            <section className="animate-fade-in" style={{ animationDelay: "150ms" }}>
              <RIOrderInbox orders={data.orders} onTerima={handleTerima} onBatalkan={handleBatalkan} busy={busy} />
            </section>
          )}

          {/* Census board */}
          <section className="animate-fade-in" style={{ animationDelay: "180ms" }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-700">Daftar Pasien Rawat Inap</p>
              <p className="text-[11px] text-slate-400">{data.patients.length} pasien teradmisi</p>
            </div>
            {data.patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
                <BedDouble size={32} className="mb-3 text-slate-300" />
                <p className="font-medium text-slate-500">Belum ada pasien rawat inap aktif</p>
                <p className="mt-1 text-sm text-slate-400">Pasien yang diadmisi via pendaftaran akan tampil di sini.</p>
              </div>
            ) : (
              <RIBoard patients={data.patients} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ── Adapter: KunjunganListItemDTO → RawatInapPatient ─────────────────────────────
interface Lookups {
  roomById: Map<string, LocationNode>;
  bedByIdCode: Map<string, BedSubRecord>;
  allocByKunjungan: Map<string, BedAllocationDTO>;
  dokterById: Map<string, { namaTampil: string; spesialisLabel: string }>;
}

function toPatient(k: KunjunganListItemDTO, L: Lookups): RawatInapPatient {
  const room = k.ruanganId ? L.roomById.get(k.ruanganId) : undefined;
  const alloc = L.allocByKunjungan.get(k.id);
  const bed = alloc ? L.bedByIdCode.get(alloc.bedId) : undefined;
  const dok = k.dpjpId ? L.dokterById.get(k.dpjpId) : undefined;

  const kelas: RIKelas =
    k.kelas && KELAS_SET.has(k.kelas as RIKelas) ? (k.kelas as RIKelas) : room ? riKelasOf(room) : "Kelas_3";

  // Lifecycle kunjungan → status board (klinis Kritis/Observasi belum terderivasi dari worklist).
  const status: RIStatus = k.selesaiAt && isToday(k.selesaiAt) ? "Pulang Hari Ini" : "Aktif";

  return {
    id: k.id,
    noRM: k.pasien.noRm,
    name: k.pasien.nama,
    age: ageFrom(k.pasien.tanggalLahir),
    gender: k.pasien.gender,
    ruangan: room?.name ?? "—",
    kelas,
    noBed: bed?.kode ?? alloc?.bedId?.slice(0, 6) ?? "—",
    dpjp: dok?.namaTampil ?? "Belum ditetapkan",
    spesialis: dok?.spesialisLabel ?? "—",
    diagnosis: k.diagnosaMasuk ?? "—",
    kodeIcd: k.kodeIcdMasuk ?? "—",
    admitDate: k.waktuKunjungan,
    hariKe: hariKeFrom(k.waktuKunjungan),
    status,
    penjamin: toRIPenjamin(k.penjaminTipe),
    catatan: k.keluhan ?? undefined,
  };
}

// ── Adapter: KunjunganListItemDTO (Registered) → RIOrder (kartu "Terima Order") ────
function toOrder(k: KunjunganListItemDTO, L: Lookups): RIOrder {
  const room = k.ruanganId ? L.roomById.get(k.ruanganId) : undefined;
  const alloc = L.allocByKunjungan.get(k.id);
  const bed = alloc ? L.bedByIdCode.get(alloc.bedId) : undefined;
  const dok = k.dpjpId ? L.dokterById.get(k.dpjpId) : undefined;

  const kelas: RIKelas =
    k.kelas && KELAS_SET.has(k.kelas as RIKelas) ? (k.kelas as RIKelas) : room ? riKelasOf(room) : "Kelas_3";

  return {
    id: k.id,
    version: k.version,
    noRM: k.pasien.noRm,
    noKunjungan: k.noKunjungan,
    name: k.pasien.nama,
    age: ageFrom(k.pasien.tanggalLahir),
    gender: k.pasien.gender,
    ruangan: room?.name ?? "—",
    kelas,
    bedKode: bed?.kode ?? null,
    dpjp: dok?.namaTampil ?? "Belum ditetapkan",
    diagnosis: k.diagnosaMasuk ?? "—",
    kodeIcd: k.kodeIcdMasuk ?? "—",
    admitDate: k.waktuKunjungan,
    penjamin: toRIPenjamin(k.penjaminTipe),
    sepNoSep: k.sep?.noSep ?? null,
  };
}

// ── BOR gauge + stat card (real data) ────────────────────────────────────────────
function BORGauge({ value }: { value: number }) {
  const isCritical = value >= 85;
  const isOptimal = value >= 60 && value < 85;
  const barColor = isCritical ? "bg-rose-500" : isOptimal ? "bg-amber-400" : "bg-emerald-500";
  const textColor = isCritical ? "text-rose-600" : isOptimal ? "text-amber-600" : "text-emerald-600";
  const label = isCritical ? "Kritis" : isOptimal ? "Optimal" : "Rendah";
  const badgeCls = isCritical ? "bg-rose-100 text-rose-600" : isOptimal ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className={cn("text-2xl font-black tabular-nums leading-none", textColor)}>
            {value}<span className="text-sm font-medium text-slate-400">%</span>
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">BOR</p>
          <p className="text-[10px] text-slate-400">Bed Occupancy Rate</p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", badgeCls)}>{label}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, icon: Icon, variant = "default",
}: {
  label: string; value: string | number; sub?: string; icon: LucideIcon;
  variant?: "default" | "critical" | "warning" | "success" | "info";
}) {
  const s = {
    default: { card: "border-slate-200 bg-white", text: "text-slate-900", lbl: "text-slate-600", ico: "text-slate-400" },
    critical: { card: "border-rose-200 bg-rose-50", text: "text-rose-700", lbl: "text-rose-600", ico: "text-rose-500" },
    warning: { card: "border-amber-200 bg-amber-50", text: "text-amber-700", lbl: "text-amber-600", ico: "text-amber-500" },
    success: { card: "border-emerald-200 bg-emerald-50", text: "text-emerald-700", lbl: "text-emerald-600", ico: "text-emerald-500" },
    info: { card: "border-sky-200 bg-sky-50", text: "text-sky-700", lbl: "text-sky-600", ico: "text-sky-500" },
  }[variant];

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
