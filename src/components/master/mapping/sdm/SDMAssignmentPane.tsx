"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Building2, Link2, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import { getTree } from "@/lib/api/ruangan";
import { listDokter, type DokterListItemDTO } from "@/lib/api/dokter";
import {
  listPenugasan, createPenugasan, deletePenugasan, type PenugasanRuanganDTO,
} from "@/lib/api/penugasanRuangan";
import { toast } from "@/lib/ui/toastStore";
import type { AnyNode } from "@/components/master/ruangan/ruanganShared";
import {
  type AssignmentMap, type SDMItem,
  deriveSDMList, ruanganFromTree, countTotalAssignments,
} from "./sdmShared";
import RuanganTreePanel from "./RuanganTreePanel";
import SDMRosterPanel from "./SDMRosterPanel";
import BulkMoveModal from "./BulkMoveModal";

interface SDMAssignmentPaneProps {
  /** Tree Ruangan dari SSR (API-RULES §6.1). Ada → first paint langsung; absen → client fetch. */
  initialTree?: AnyNode[];
  /** Daftar dokter (API /master/dokter) dari SSR. Absen → client fetch. */
  initialDokters?: DokterListItemDTO[];
  /** Penugasan ruangan (API /master/penugasan-ruangan) dari SSR. Absen → client fetch. */
  initialPenugasan?: PenugasanRuanganDTO[];
}

const edgeKey = (sdmId: string, kode: string) => `${sdmId}::${kode}`;

export default function SDMAssignmentPane({ initialTree, initialDokters, initialPenugasan }: SDMAssignmentPaneProps) {
  // Tree REAL dari master/ruangan. SSR hybrid: pakai initialTree bila ada, else fetch client
  // (degradasi anggun). `units` (ruangan datar) diturunkan utk roster/bulk-move/stats; tree
  // mentah (`nodes`) diteruskan ke panel kiri untuk tampilan Unit → Ruangan.
  const prefetched = initialTree != null;
  const [nodes, setNodes] = useState<AnyNode[]>(initialTree ?? []);
  const [unitsLoading, setUnitsLoading] = useState(!prefetched);
  const [unitsErr, setUnitsErr] = useState<string | null>(null);

  const units = useMemo(() => ruanganFromTree(nodes), [nodes]);

  // SDM = dokter REAL (API /master/dokter, didaftarkan di Dokter & Nakes) + pengguna mock.
  const [dokters, setDokters] = useState<DokterListItemDTO[]>(initialDokters ?? []);
  const sdmList = useMemo(() => deriveSDMList(dokters), [dokters]);

  // Penugasan = SUMBER TUNGGAL state assignment (DTO dari API). assignments map + edge-id
  // di-derive darinya (no duplikasi state). Mutasi = optimistik update array ini + persist.
  const [penugasan, setPenugasan] = useState<PenugasanRuanganDTO[]>(initialPenugasan ?? []);

  const [selectedUnitKode, setSelectedUnitKode] = useState<string | null>(null);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkMoveIds, setBulkMoveIds] = useState<string[]>([]);

  // ── Resolvers (kode ⇄ id ⇄ sdmId) ──────────────────────────────────────────
  const pegawaiToSdmId = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sdmList) if (s.pegawaiId) m.set(s.pegawaiId, s.id);
    return m;
  }, [sdmList]);

  const ruangByKode = useMemo(() => {
    const id = new Map<string, string>();
    const nama = new Map<string, string>();
    for (const n of nodes) if (n.type === "Location") { id.set(n.kode, n.id); nama.set(n.kode, n.name); }
    return { id, nama };
  }, [nodes]);

  // assignments (sdmId → kode[]) + edgeIds (`sdmId::kode` → penugasanId) di-derive dari DTO.
  const { assignments, edgeIds } = useMemo(() => {
    const map: AssignmentMap = {};
    const edges: Record<string, string> = {};
    for (const p of penugasan) {
      const sdmId = pegawaiToSdmId.get(p.pegawaiId);
      if (!sdmId) continue; // penugasan utk pegawai yg tak ada di roster (mis. non-dokter) → skip tampilan
      (map[sdmId] ??= []).push(p.ruanganKode);
      edges[edgeKey(sdmId, p.ruanganKode)] = p.id;
    }
    return { assignments: map, edgeIds: edges };
  }, [penugasan, pegawaiToSdmId]);

  // ── Fetch fallback (bila SSR tak menyediakan) ───────────────────────────────
  useEffect(() => {
    if (prefetched) return;
    const ctrl = new AbortController();
    setUnitsLoading(true);
    getTree(ctrl.signal)
      .then((tree) => { setNodes(tree); setUnitsErr(null); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setUnitsErr(e instanceof ApiError ? e.message : "Gagal memuat daftar ruangan");
      })
      .finally(() => setUnitsLoading(false));
    return () => ctrl.abort();
  }, [prefetched]);

  useEffect(() => {
    if (initialDokters != null) return;
    const ctrl = new AbortController();
    listDokter({ limit: 50 }, ctrl.signal)
      .then(({ items }) => setDokters(items))
      .catch((e) => { if (!(e instanceof DOMException && e.name === "AbortError")) { /* pengguna mock tetap tampil */ } });
    return () => ctrl.abort();
  }, [initialDokters]);

  useEffect(() => {
    if (initialPenugasan != null) return;
    const ctrl = new AbortController();
    listPenugasan({ limit: 100 }, ctrl.signal)
      .then(({ items }) => setPenugasan(items))
      .catch((e) => { if (!(e instanceof DOMException && e.name === "AbortError")) { /* mulai kosong */ } });
    return () => ctrl.abort();
  }, [initialPenugasan]);

  // Pilih ruangan pertama begitu data tersedia (sekali, bila belum ada pilihan).
  useEffect(() => {
    setSelectedUnitKode((cur) => cur ?? units[0]?.kode ?? null);
  }, [units]);

  const selectedUnit = useMemo(
    () => units.find((u) => u.kode === selectedUnitKode) ?? null,
    [units, selectedUnitKode],
  );

  const stats = useMemo(() => {
    const totalSDM = sdmList.length;
    const totalAssignments = countTotalAssignments(assignments);
    const unitsWithSDM = units.filter(
      (u) => Object.values(assignments).some((arr) => arr.includes(u.kode)),
    ).length;
    return { totalSDM, totalAssignments, unitsWithSDM };
  }, [sdmList, assignments, units]);

  // ── Mutasi (optimistik + persist) ───────────────────────────────────────────
  /** Tugaskan sdm ke ruangan (kode). Optimistik tambah → POST → ganti temp dgn DTO real.
   *  `silent` → tanpa toast sukses (dipakai bulk-move yg punya toast agregat sendiri). */
  const assignOne = async (sdm: SDMItem, kode: string, silent = false) => {
    if (!sdm.pegawaiId) return; // pengguna mock tak bisa persist
    if (edgeIds[edgeKey(sdm.id, kode)]) return; // sudah ada
    const locationId = ruangByKode.id.get(kode);
    if (!locationId) return;
    const ruanganNama = ruangByKode.nama.get(kode) ?? kode;
    const tempId = `temp-${sdm.id}-${kode}`;
    const temp: PenugasanRuanganDTO = {
      id: tempId, pegawaiId: sdm.pegawaiId, namaTampil: sdm.nama, nip: "", profesi: null,
      locationId, ruanganKode: kode, ruanganNama,
      peran: null, createdAt: new Date().toISOString(),
    };
    setPenugasan((prev) => [...prev, temp]);
    try {
      const dto = await createPenugasan({ pegawaiId: sdm.pegawaiId, locationId });
      setPenugasan((prev) => prev.map((p) => (p.id === tempId ? dto : p)));
      if (!silent) toast.success("SDM ditugaskan", `${sdm.nama} → ${ruanganNama}`);
    } catch (e) {
      setPenugasan((prev) => prev.filter((p) => p.id !== tempId));
      toast.error("Gagal menugaskan", e instanceof ApiError ? e.message : `${sdm.nama}`);
    }
  };

  /** Lepas penugasan (kode). Optimistik hapus → DELETE → revert bila gagal. */
  const unassignOne = async (sdmId: string, kode: string, silent = false) => {
    const id = edgeIds[edgeKey(sdmId, kode)];
    if (!id || id.startsWith("temp-")) return;
    const removed = penugasan.find((p) => p.id === id);
    setPenugasan((prev) => prev.filter((p) => p.id !== id));
    try {
      await deletePenugasan(id);
      if (!silent) toast.warning("Penugasan dilepas", `${removed?.namaTampil ?? "SDM"} dari ${removed?.ruanganNama ?? kode}`);
    } catch (e) {
      if (removed) setPenugasan((prev) => [...prev, removed]);
      toast.error("Gagal melepas", e instanceof ApiError ? e.message : "");
    }
  };

  const handleToggle = (sdmId: string, unitKode: string) => {
    const sdm = sdmList.find((s) => s.id === sdmId);
    if (!sdm) return;
    if (!sdm.pegawaiId) {
      toast.warning("Belum bisa ditugaskan", "Hanya dokter terdaftar yang dapat ditugaskan saat ini.");
      return;
    }
    if (assignments[sdmId]?.includes(unitKode)) void unassignOne(sdmId, unitKode);
    else void assignOne(sdm, unitKode);
  };

  const handleOpenBulkMove = (ids: string[]) => {
    setBulkMoveIds(ids);
    setBulkMoveOpen(true);
  };

  const handleBulkMoveConfirm = async (toKode: string, alsoRemove: boolean) => {
    if (!selectedUnit) return;
    const fromKode = selectedUnit.kode;
    setBulkMoveOpen(false);
    const targets = sdmList.filter((s) => bulkMoveIds.includes(s.id) && s.pegawaiId);
    setBulkMoveIds([]);
    await Promise.all(
      targets.map(async (sdm) => {
        await assignOne(sdm, toKode, true);
        if (alsoRemove) await unassignOne(sdm.id, fromKode, true);
      }),
    );
    if (targets.length) toast.success("Penugasan diperbarui", `${targets.length} SDM dipindah ke ${ruangByKode.nama.get(toKode) ?? toKode}`);
  };

  const bulkMoveSDMs: SDMItem[] = useMemo(
    () => sdmList.filter((s) => bulkMoveIds.includes(s.id)),
    [sdmList, bulkMoveIds],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Pane Header — title + stats inline (no long scroll) */}
      <PaneHeader stats={stats} />

      {/* Two-panel body */}
      {unitsLoading ? (
        <UnitsLoading />
      ) : unitsErr ? (
        <UnitsError message={unitsErr} />
      ) : units.length === 0 ? (
        <UnitsEmpty />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <RuanganTreePanel
            nodes={nodes}
            assignments={assignments}
            selectedKode={selectedUnitKode}
            onSelect={setSelectedUnitKode}
          />
          {selectedUnit ? (
            <SDMRosterPanel
              unit={selectedUnit}
              allSDM={sdmList}
              assignments={assignments}
              onToggle={handleToggle}
              onOpenBulkMove={handleOpenBulkMove}
            />
          ) : (
            <EmptyUnitSelection />
          )}
        </div>
      )}

      {/* Bulk move modal */}
      {selectedUnit && (
        <BulkMoveModal
          open={bulkMoveOpen}
          fromUnit={selectedUnit}
          selectedSDMs={bulkMoveSDMs}
          availableUnits={units}
          onClose={() => setBulkMoveOpen(false)}
          onConfirm={handleBulkMoveConfirm}
        />
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────

function PaneHeader({
  stats,
}: {
  stats: { totalSDM: number; totalAssignments: number; unitsWithSDM: number };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="m-base font-bold text-slate-900">SDM Assignment</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            Pilih ruangan di kiri → tambah / lepas SDM di kanan. Bulk action di-aktifkan saat
            ada SDM dipilih.
          </p>
        </div>
        <div className="flex gap-2">
          <Stat icon={Users}     label="Total SDM"   value={stats.totalSDM}        cls="bg-teal-50 text-teal-600" />
          <Stat icon={Link2}     label="Assignment" value={stats.totalAssignments} cls="bg-emerald-50 text-emerald-600" />
          <Stat icon={Building2} label="Ruangan Aktif" value={stats.unitsWithSDM}  cls="bg-sky-50 text-sky-600" />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon, label, value, cls,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-md", cls)}>
        <Icon size={12} />
      </span>
      <div>
        <p className="m-mini font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="m-base font-black leading-none text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function EmptyUnitSelection() {
  return (
    <section className="flex h-full min-w-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <Building2 size={20} className="text-slate-400" />
        </span>
        <p className="mt-3 m-sm font-semibold text-slate-700">Pilih ruangan di kiri</p>
        <p className="mt-1 m-tiny text-slate-400">untuk melihat & mengelola SDM</p>
      </div>
    </section>
  );
}

// ── Unit fetch states ────────────────────────────────────

function StateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="text-center">{children}</div>
    </div>
  );
}

function UnitsLoading() {
  return (
    <StateShell>
      <Loader2 size={22} className="mx-auto animate-spin text-teal-500" />
      <p className="mt-3 m-sm font-semibold text-slate-600">Memuat ruangan…</p>
      <p className="mt-1 m-tiny text-slate-400">mengambil data dari Master Ruangan</p>
    </StateShell>
  );
}

function UnitsError({ message }: { message: string }) {
  return (
    <StateShell>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50">
        <AlertCircle size={20} className="text-rose-500" />
      </span>
      <p className="mt-3 m-sm font-semibold text-rose-600">Gagal memuat ruangan</p>
      <p className="mt-1 m-tiny text-slate-400">{message}</p>
    </StateShell>
  );
}

function UnitsEmpty() {
  return (
    <StateShell>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Building2 size={20} className="text-slate-400" />
      </span>
      <p className="mt-3 m-sm font-semibold text-slate-700">Belum ada ruangan</p>
      <p className="mt-1 m-tiny text-slate-400">
        Tambahkan ruangan lebih dulu di <span className="font-semibold text-slate-600">Master → Unit &amp; Ruangan</span>.
      </p>
    </StateShell>
  );
}
