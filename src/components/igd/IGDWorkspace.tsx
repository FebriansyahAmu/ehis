"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";
import { igdPatients, type IGDPatient } from "@/lib/data";
import { listKunjungan, transitionKunjungan, type KunjunganListItemDTO } from "@/lib/api/kunjungan";
import { listRuanganByType } from "@/lib/api/ruangan";
import { listDokter } from "@/lib/api/dokter";
import { listActiveBedAllocations, type BedAllocationDTO } from "@/lib/api/bedAllocation";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import type { LocationNode } from "@/components/master/ruangan/ruanganShared";
import IGDBoard from "./IGDBoard";
import IGDOrderInbox from "./IGDOrderInbox";
import IGDRuanganMasterPanel from "./IGDRuanganMasterPanel";
import { splitIgd, dtoToIgdPatient, type IgdOrder } from "./igdBoardApi";

const isAbort = (e: unknown): boolean => e instanceof DOMException && e.name === "AbortError";

/** Peta Dokter.id → nama tampil (semua dokter aktif). Limit endpoint = 50 → ikuti cursor. */
async function loadDokterMap(signal?: AbortSignal): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let cursor: string | undefined;
  for (let i = 0; i < 10; i++) {
    const { items, cursor: next } = await listDokter({ status: "Aktif", limit: 50, cursor }, signal);
    for (const d of items) map.set(d.id, d.namaTampil);
    if (!next) break;
    cursor = next;
  }
  return map;
}

/**
 * Workspace IGD (client): fetch kunjungan IGD (order belum diterima + pasien di-IGD) & ruangan
 * master, hitung stat dari data nyata, dan tangani aksi Terima/Batalkan order (transisi DB).
 * Pasien seed (Joko) dari mock tetap tampil di board.
 */
export default function IGDWorkspace() {
  const [items, setItems] = useState<KunjunganListItemDTO[]>([]);
  const [selesaiItems, setSelesaiItems] = useState<KunjunganListItemDTO[]>([]);
  const [dokterById, setDokterById] = useState<Map<string, string>>(new Map());
  const [kunjError, setKunjError] = useState(false);
  const [rooms, setRooms] = useState<LocationNode[]>([]);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState(false);
  const [allocations, setAllocations] = useState<BedAllocationDTO[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const mounted = useRef(true);

  const loadKunjungan = useCallback(async (signal?: AbortSignal) => {
    try {
      const { items } = await listKunjungan(
        { unit: "IGD", status: "Registered,Queued,InService", limit: 50 },
        signal,
      );
      if (!mounted.current) return;
      setItems(items);
      setKunjError(false);
    } catch (e) {
      if (!isAbort(e) && mounted.current) setKunjError(true);
    }
  }, []);

  // Kunjungan IGD yang sudah Selesai (Completed) — disaring "hari ini" di derive.
  const loadSelesai = useCallback(async (signal?: AbortSignal) => {
    try {
      const { items } = await listKunjungan({ unit: "IGD", status: "Completed", limit: 50 }, signal);
      if (mounted.current) setSelesaiItems(items);
    } catch { /* seksi opsional → kosong bila gagal */ }
  }, []);

  const loadAllocations = useCallback(async (signal?: AbortSignal) => {
    try {
      const rows = await listActiveBedAllocations("IGD", signal);
      if (mounted.current) setAllocations(rows);
    } catch { /* okupansi opsional → bed tampil tersedia bila gagal */ }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const ctrl = new AbortController();
    loadKunjungan(ctrl.signal);
    loadSelesai(ctrl.signal);
    loadAllocations(ctrl.signal);
    listRuanganByType("IGD", ctrl.signal)
      .then((rows) => { if (mounted.current) { setRooms(rows); setRoomError(false); } })
      .catch((e) => { if (!isAbort(e) && mounted.current) setRoomError(true); })
      .finally(() => { if (mounted.current) setRoomLoading(false); });
    // Peta DPJP (Dokter.id → nama tampil) untuk resolve dokter di kartu. Opsional → gagal = "—".
    loadDokterMap(ctrl.signal)
      .then((map) => { if (mounted.current) setDokterById(map); })
      .catch(() => {});
    return () => { mounted.current = false; ctrl.abort(); };
  }, [loadKunjungan, loadSelesai, loadAllocations]);

  // Derive order/board dari items + peta dokter & ruangan (DPJP/ruangan ter-resolve walau
  // dokter/ruangan telat load). Peta ruangan: Location.id → nama (ruanganId kunjungan).
  const ruanganById = useMemo(() => new Map(rooms.map((r) => [r.id, r.name])), [rooms]);
  const { orders, board } = useMemo(
    () => splitIgd(items, { dokterById, ruanganById }),
    [items, dokterById, ruanganById],
  );

  // Pasien IGD yang sudah Selesai (Completed) → kartu klik = rekam medis read-only/terkunci.
  // Tampil di board hanya saat view "Selesai" (filter di IGDBoard). API sudah batasi 50 +
  // urut terbaru; di sini urut by waktu selesai desc. TIDAK disaring "hari ini" agar pasien
  // yang baru saja diselesaikan tetap terlihat (hindari drift zona waktu UTC↔lokal).
  const selesaiPatients = useMemo<IGDPatient[]>(
    () =>
      [...selesaiItems]
        .sort((a, b) =>
          (b.selesaiAt ?? b.waktuKunjungan).localeCompare(a.selesaiAt ?? a.waktuKunjungan),
        )
        .map((k) => dtoToIgdPatient(k, { dokterById, ruanganById })),
    [selesaiItems, dokterById, ruanganById],
  );

  // Okupansi dari alokasi aktif: set bed terisi + peta kunjungan→bed (untuk nama bed di kartu).
  const occupiedBedIds = useMemo(() => new Set(allocations.map((a) => a.bedId)), [allocations]);
  const bedById = useMemo(
    () => new Map(rooms.flatMap((r) => r.beds.map((b) => [b.id, b] as const))),
    [rooms],
  );
  const bedNamaByKunjungan = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of allocations) {
      const bed = bedById.get(a.bedId);
      if (bed) m.set(a.kunjunganId, bed.kode);
    }
    return m;
  }, [allocations, bedById]);

  // Board = seed (Joko) + pasien InService (di-enrich nama bed) + selesai hari ini.
  // Pemisahan aktif vs selesai ditangani filter status di IGDBoard (default "Sedang Dilayani").
  const boardPatients = useMemo<IGDPatient[]>(() => {
    const enriched = board.map((p) => {
      const bedNama = bedNamaByKunjungan.get(p.id);
      return bedNama ? { ...p, bedNama } : p;
    });
    return [...igdPatients, ...enriched, ...selesaiPatients];
  }, [board, bedNamaByKunjungan, selesaiPatients]);

  async function runAction(o: IgdOrder, action: "receive" | "cancel", bedId?: string) {
    if (pendingId) return;
    setPendingId(o.id);
    try {
      await transitionKunjungan(o.id, action, o.version, { bedId });
      toast.success(
        action === "receive" ? "Pasien diterima" : "Order dibatalkan",
        o.patient.name,
      );
      await Promise.all([loadKunjungan(), loadAllocations()]); // refresh dari DB
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal memproses aksi";
      toast.error(action === "receive" ? "Gagal menerima pasien" : "Gagal membatalkan order", msg);
    } finally {
      if (mounted.current) setPendingId(null);
    }
  }

  // ── Stat dihitung dari data nyata (order + board + seed) ──
  const allPatients: IGDPatient[] = [...igdPatients, ...board, ...orders.map((o) => o.patient)];
  const countTriage = (t: IGDPatient["triage"]) => allPatients.filter((p) => p.triage === t).length;
  const bedsTotal = rooms.reduce((s, r) => s + r.beds.length, 0);
  const bedsAvailable = rooms.reduce(
    (s, r) => s + r.beds.filter((b) => b.status === "active" && !occupiedBedIds.has(b.id)).length,
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Summary stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Ringkasan IGD">
        <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:col-span-1">
          <p className="text-2xl font-bold tabular-nums text-slate-900">{allPatients.length}</p>
          <p className="mt-0.5 text-sm font-medium text-slate-600">Total Pasien IGD</p>
          <p className="text-xs text-slate-400">{orders.length} menunggu diterima</p>
        </div>
        <StatTriage value={countTriage("P1")} label="P1 · Kritis" sub="Prioritas tertinggi" tone="rose" />
        <StatTriage value={countTriage("P2")} label="P2 · Urgent" sub="Segera ditangani" tone="amber" />
        <StatTriage value={countTriage("P3")} label="P3 · Non-urgent" sub="Dapat menunggu" tone="emerald" />
      </section>

      {/* Bed indicator */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <BedDouble size={14} className="text-slate-400" aria-hidden="true" />
          Bed IGD tersedia:{" "}
          <strong className={cn(bedsAvailable <= 2 ? "text-rose-600" : "text-emerald-600")}>
            {bedsAvailable} / {bedsTotal}
          </strong>
        </span>
      </div>

      {/* Room classification (master) */}
      <IGDRuanganMasterPanel rooms={rooms} occupiedBedIds={occupiedBedIds} loading={roomLoading} error={roomError} />

      {/* Order inbox (belum diterima) */}
      {kunjError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-600">
          Gagal memuat data kunjungan IGD. Muat ulang halaman untuk mencoba lagi.
        </div>
      ) : (
        <IGDOrderInbox
          orders={orders}
          rooms={rooms}
          occupiedBedIds={occupiedBedIds}
          pendingId={pendingId}
          onTerima={(o, bedId) => runAction(o, "receive", bedId)}
          onBatalkan={(o) => runAction(o, "cancel")}
        />
      )}

      {/* Board pasien IGD — filter status (Sedang Dilayani ⟷ Selesai) di dalam board.
          Kartu Selesai = klik → rekam medis read-only/terkunci. */}
      <IGDBoard patients={boardPatients} />
    </div>
  );
}

const TRIAGE_TONE = {
  rose:    { card: "border-rose-200 bg-rose-50",       dot: "bg-rose-500",    num: "text-rose-700",    label: "text-rose-600",    sub: "text-rose-400" },
  amber:   { card: "border-amber-200 bg-amber-50",     dot: "bg-amber-400",   num: "text-amber-700",   label: "text-amber-600",   sub: "text-amber-400" },
  emerald: { card: "border-emerald-200 bg-emerald-50", dot: "bg-emerald-500", num: "text-emerald-700", label: "text-emerald-600", sub: "text-emerald-400" },
} as const;

function StatTriage({
  value, label, sub, tone,
}: {
  value: number;
  label: string;
  sub: string;
  tone: keyof typeof TRIAGE_TONE;
}) {
  const c = TRIAGE_TONE[tone];
  return (
    <div className={cn("rounded-xl border p-4 shadow-sm", c.card)}>
      <div className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", c.dot)} aria-hidden="true" />
        <p className={cn("text-2xl font-bold tabular-nums", c.num)}>{value}</p>
      </div>
      <p className={cn("mt-0.5 text-sm font-medium", c.label)}>{label}</p>
      <p className={cn("text-xs", c.sub)}>{sub}</p>
    </div>
  );
}
