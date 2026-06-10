"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Plus, Trash2, Search, X, ArrowRight, Building2, ShieldCheck,
  Filter, CheckCircle2, MinusCircle, Link2, Building,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PENJAMIN_INITIAL, MAPPING_INITIAL,
  type PenjaminRecord, type MappingRuanganRecord,
} from "@/lib/master/penjaminStore";
import { RUANGAN_MOCK, type LocationNode } from "@/components/master/ruangan/ruanganShared";
import { TIPE_CFG } from "@/components/master/penjamin/penjaminShared";

// ── Lokasi terdaftar (Location node dari Ruangan tree) ───
const LOCATIONS: LocationNode[] = RUANGAN_MOCK.filter(
  (n): n is LocationNode => n.type === "Location",
);

// ── Pane ─────────────────────────────────────────────────

export default function PenjaminRuanganPane() {
  const penjaminList = useMemo(() => structuredClone(PENJAMIN_INITIAL) as PenjaminRecord[], []);
  const [mappings, setMappings] = useState<MappingRuanganRecord[]>(
    () => structuredClone(MAPPING_INITIAL),
  );

  const [filterPenjamin, setFilterPenjamin] = useState<string>("all");
  const [filterStatus,   setFilterStatus]   = useState<"all" | "Aktif" | "Non_Aktif">("all");
  const [search,         setSearch]         = useState("");
  const [showAdd,        setShowAdd]        = useState(false);

  // ── Handlers ──
  const handleAdd = (m: Omit<MappingRuanganRecord, "id">) => {
    setMappings((prev) => [...prev, { ...m, id: `map-${Date.now()}` }]);
    setShowAdd(false);
  };

  const handleUpdate = (id: string, p: Partial<MappingRuanganRecord>) => {
    setMappings((prev) => prev.map((m) => (m.id === id ? { ...m, ...p } : m)));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Hapus mapping ini?")) return;
    setMappings((prev) => prev.filter((m) => m.id !== id));
  };

  // ── Derived ──
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return mappings.filter((m) => {
      if (filterPenjamin !== "all" && m.penjaminId !== filterPenjamin) return false;
      if (filterStatus !== "all" && m.status !== filterStatus) return false;
      if (!q) return true;
      const p = penjaminList.find((x) => x.id === m.penjaminId);
      const k = p?.kelas.find((x) => x.id === m.penjaminKelasId);
      const r = LOCATIONS.find((x) => x.id === m.ruanganId);
      return (
        (p?.nama.toLowerCase().includes(q) ?? false) ||
        (k?.kode.toLowerCase().includes(q) ?? false) ||
        (k?.nama.toLowerCase().includes(q) ?? false) ||
        (r?.name.toLowerCase().includes(q) ?? false) ||
        (r?.kode.toLowerCase().includes(q) ?? false)
      );
    });
  }, [mappings, filterPenjamin, filterStatus, search, penjaminList]);

  const stats = useMemo(() => {
    const aktif = mappings.filter((m) => m.status === "Aktif").length;
    return {
      total: mappings.length,
      aktif,
      penjamin: new Set(mappings.map((m) => m.penjaminId)).size,
      ruangan:  new Set(mappings.map((m) => m.ruanganId)).size,
    };
  }, [mappings]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Pane Header */}
      <PaneHeader stats={stats} />

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Add form (slide-in) */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-emerald-100 bg-emerald-50/40"
            >
              <AddMappingForm
                penjaminList={penjaminList}
                onSubmit={handleAdd}
                onCancel={() => setShowAdd(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="shrink-0 flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/40 px-4 py-2">
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode / nama..."
              className="m-tiny w-56 rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-3 text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter size={11} className="text-slate-400" />
            <span className="m-mini font-semibold uppercase tracking-wide text-slate-500">Penjamin:</span>
            <select
              value={filterPenjamin}
              onChange={(e) => setFilterPenjamin(e.target.value)}
              className="m-tiny rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 outline-none focus:border-emerald-400"
            >
              <option value="all">Semua</option>
              {penjaminList.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-0.5 rounded-md border border-slate-200 bg-white p-0.5">
            <FilterTab active={filterStatus === "all"}       onClick={() => setFilterStatus("all")}>Semua</FilterTab>
            <FilterTab active={filterStatus === "Aktif"}     onClick={() => setFilterStatus("Aktif")}     tone="emerald">Aktif</FilterTab>
            <FilterTab active={filterStatus === "Non_Aktif"} onClick={() => setFilterStatus("Non_Aktif")} tone="slate">Non</FilterTab>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="m-mini text-slate-500">{filtered.length} dari {mappings.length}</span>
            <button
              onClick={() => setShowAdd((v) => !v)}
              className={cn(
                "m-tiny flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold shadow-sm transition",
                showAdd
                  ? "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  : "bg-emerald-600 text-white hover:bg-emerald-700",
              )}
            >
              {showAdd ? <><X size={11} /> Batal</> : <><Plus size={11} /> Tambah Mapping</>}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="min-h-0 flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <EmptyState onAdd={() => setShowAdd(true)} />
          ) : (
            <MappingTable
              rows={filtered}
              penjaminList={penjaminList}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── PaneHeader ───────────────────────────────────────────

function PaneHeader({
  stats,
}: {
  stats: { total: number; aktif: number; penjamin: number; ruangan: number };
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
          <h2 className="m-base font-bold text-slate-900">Penjamin × Ruangan</h2>
          <p className="mt-0.5 m-tiny text-slate-500">
            Hubungkan kode ruangan / SMF penjamin (mis. BPJS V-Claim{" "}
            <span className="font-mono">INT/IGD/JAN</span>) dengan ruangan rumah sakit untuk routing klaim & kamar.
          </p>
        </div>
        <div className="flex gap-2">
          <Stat icon={Link2}       label="Mapping"  value={stats.total}    cls="bg-emerald-50 text-emerald-600" />
          <Stat icon={CheckCircle2} label="Aktif"   value={stats.aktif}    cls="bg-teal-50 text-teal-600" />
          <Stat icon={ShieldCheck} label="Penjamin" value={stats.penjamin} cls="bg-sky-50 text-sky-600" />
          <Stat icon={Building}    label="Ruangan"  value={stats.ruangan}  cls="bg-violet-50 text-violet-600" />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({
  icon: Icon, label, value, cls,
}: {
  icon: IconComponent;
  label: string;
  value: number;
  cls: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-1.5 shadow-sm">
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", cls)}>
        <Icon size={13} />
      </div>
      <div>
        <p className="m-sm font-black leading-none text-slate-900">{value}</p>
        <p className="m-mini font-semibold text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ── FilterTab ────────────────────────────────────────────

function FilterTab({
  children, active, onClick, tone,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tone?: "emerald" | "slate";
}) {
  const activeCls = tone === "emerald"
    ? "bg-emerald-600 text-white"
    : tone === "slate"
      ? "bg-slate-600 text-white"
      : "bg-slate-800 text-white";
  return (
    <button
      onClick={onClick}
      className={cn(
        "m-mini rounded px-2 py-0.5 font-semibold transition",
        active ? activeCls : "text-slate-500 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}

// ── EmptyState ───────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
        <Network size={22} className="text-slate-400" />
      </div>
      <div>
        <p className="m-sm font-semibold text-slate-700">Belum ada mapping</p>
        <p className="mt-0.5 m-mini text-slate-500">
          Tambahkan mapping pertama untuk menghubungkan kelas penjamin ke ruangan rumah sakit.
        </p>
      </div>
      <button
        onClick={onAdd}
        className="m-tiny flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        <Plus size={11} /> Tambah Mapping
      </button>
    </div>
  );
}

// ── MappingTable ─────────────────────────────────────────

function MappingTable({
  rows, penjaminList, onUpdate, onDelete,
}: {
  rows: MappingRuanganRecord[];
  penjaminList: PenjaminRecord[];
  onUpdate: (id: string, p: Partial<MappingRuanganRecord>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <thead className="sticky top-0 z-10 bg-white">
        <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
          <Th className="w-10 pl-4">#</Th>
          <Th>Penjamin</Th>
          <Th>Penjamin Ruangan</Th>
          <Th className="w-8 text-center"><ArrowRight size={11} className="mx-auto text-slate-400" /></Th>
          <Th>Ruangan Rumah Sakit</Th>
          <Th className="w-28">Status</Th>
          <Th className="w-14 pr-4 text-right">Aksi</Th>
        </tr>
      </thead>
      <tbody>
        <AnimatePresence initial={false}>
          {rows.map((m, idx) => (
            <MappingRow
              key={m.id}
              row={m}
              index={idx}
              penjaminList={penjaminList}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </AnimatePresence>
      </tbody>
    </table>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("m-mini px-3 py-2 font-bold uppercase tracking-wide text-slate-500", className)}>
      {children}
    </th>
  );
}

function MappingRow({
  row, index, penjaminList, onUpdate, onDelete,
}: {
  row: MappingRuanganRecord;
  index: number;
  penjaminList: PenjaminRecord[];
  onUpdate: (id: string, p: Partial<MappingRuanganRecord>) => void;
  onDelete: (id: string) => void;
}) {
  const penjamin = penjaminList.find((p) => p.id === row.penjaminId);
  const kelas    = penjamin?.kelas.find((k) => k.id === row.penjaminKelasId);
  const ruangan  = LOCATIONS.find((l) => l.id === row.ruanganId);
  const tipeCfg  = penjamin ? TIPE_CFG[penjamin.tipe] : null;
  const isAktif  = row.status === "Aktif";

  return (
    <motion.tr
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.015, 0.18) }}
      className={cn(
        "border-b border-slate-100 transition",
        isAktif ? "hover:bg-emerald-50/30" : "bg-slate-50/30 text-slate-500 hover:bg-slate-100/60",
      )}
    >
      <td className="m-tiny pl-4 font-mono text-slate-400">{index + 1}</td>

      {/* Penjamin */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={12} className={cn(tipeCfg?.text ?? "text-slate-400")} />
          <div className="min-w-0">
            <p className="m-tiny truncate font-semibold text-slate-800">
              {penjamin?.nama ?? "—"}
            </p>
            {tipeCfg && (
              <span className={cn(
                "m-mini inline-block rounded px-1 py-0.5 font-bold uppercase",
                tipeCfg.bg, tipeCfg.text,
              )}>
                {tipeCfg.short}
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Penjamin Ruangan (kelas/SMF) */}
      <td className="px-3 py-2">
        {penjamin && penjamin.kelas.length > 0 ? (
          <select
            value={row.penjaminKelasId}
            onChange={(e) => onUpdate(row.id, { penjaminKelasId: e.target.value })}
            className="m-tiny rounded-md border border-slate-200 bg-white px-2 py-1 font-mono font-semibold text-slate-700 outline-none focus:border-emerald-400"
          >
            {penjamin.kelas.map((k) => (
              <option key={k.id} value={k.id}>
                {k.kode} — {k.nama}
              </option>
            ))}
          </select>
        ) : (
          <span className="m-tiny text-rose-500">Tidak ada kelas</span>
        )}
        {kelas?.deskripsi && (
          <p className="m-mini mt-0.5 max-w-43 truncate text-slate-500">{kelas.deskripsi}</p>
        )}
      </td>

      <td className="px-2 text-center text-slate-300">
        <ArrowRight size={11} />
      </td>

      {/* Ruangan RS */}
      <td className="px-3 py-2">
        <select
          value={row.ruanganId}
          onChange={(e) => onUpdate(row.id, { ruanganId: e.target.value })}
          className="m-tiny rounded-md border border-slate-200 bg-white px-2 py-1 text-slate-700 outline-none focus:border-emerald-400"
        >
          {LOCATIONS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.kode} — {l.name}
            </option>
          ))}
        </select>
        {ruangan && (
          <p className="m-mini mt-0.5 max-w-50 truncate text-slate-500">
            <Building2 size={9} className="mb-0.5 mr-0.5 inline" />
            {ruangan.locationType.replace("_", " ")} · {ruangan.kelas === "—" ? "tanpa kelas" : ruangan.kelas.replace("_", " ")}
          </p>
        )}
      </td>

      {/* Status */}
      <td className="px-3 py-2">
        <button
          onClick={() => onUpdate(row.id, { status: isAktif ? "Non_Aktif" : "Aktif" })}
          className={cn(
            "m-mini flex items-center gap-1 rounded-md px-2 py-1 font-bold uppercase ring-1 transition",
            isAktif
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100"
              : "bg-slate-100 text-slate-500 ring-slate-200 hover:bg-slate-200",
          )}
        >
          {isAktif ? <CheckCircle2 size={10} /> : <MinusCircle size={10} />}
          {isAktif ? "Aktif" : "Non"}
        </button>
      </td>

      {/* Aksi */}
      <td className="pr-4 text-right">
        <button
          onClick={() => onDelete(row.id)}
          className="rounded-md p-1.5 text-rose-500 transition hover:bg-rose-50"
        >
          <Trash2 size={11} />
        </button>
      </td>
    </motion.tr>
  );
}

// ── AddMappingForm ───────────────────────────────────────

function AddMappingForm({
  penjaminList, onSubmit, onCancel,
}: {
  penjaminList: PenjaminRecord[];
  onSubmit: (m: Omit<MappingRuanganRecord, "id">) => void;
  onCancel: () => void;
}) {
  const [penjaminId, setPenjaminId] = useState<string>(penjaminList[0]?.id ?? "");
  const [kelasId,    setKelasId]    = useState<string>("");
  const [ruanganId,  setRuanganId]  = useState<string>(LOCATIONS[0]?.id ?? "");

  const penjamin = penjaminList.find((p) => p.id === penjaminId);

  useEffect(() => {
    setKelasId(penjamin?.kelas[0]?.id ?? "");
  }, [penjaminId, penjamin?.kelas]);

  const valid = !!penjaminId && !!kelasId && !!ruanganId;

  return (
    <div className="px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Plus size={12} className="text-emerald-600" />
        <p className="m-mini font-bold uppercase tracking-wide text-emerald-700">
          Tambah Mapping Baru
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
        <FormField label="Penjamin">
          <select
            value={penjaminId}
            onChange={(e) => setPenjaminId(e.target.value)}
            className="m-tiny w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
          >
            {penjaminList.map((p) => (
              <option key={p.id} value={p.id}>{p.kode} — {p.nama}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Penjamin Ruangan">
          <select
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
            disabled={!penjamin || penjamin.kelas.length === 0}
            className="m-tiny w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400"
          >
            {!penjamin || penjamin.kelas.length === 0 ? (
              <option value="">Belum ada kelas</option>
            ) : (
              penjamin.kelas.map((k) => (
                <option key={k.id} value={k.id}>{k.kode} — {k.nama}</option>
              ))
            )}
          </select>
        </FormField>
        <FormField label="Ruangan Rumah Sakit">
          <select
            value={ruanganId}
            onChange={(e) => setRuanganId(e.target.value)}
            className="m-tiny w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100"
          >
            {LOCATIONS.map((l) => (
              <option key={l.id} value={l.id}>{l.kode} — {l.name}</option>
            ))}
          </select>
        </FormField>
        <div className="flex items-end gap-1.5">
          <button
            onClick={onCancel}
            className="m-tiny rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            onClick={() => valid && onSubmit({ penjaminId, penjaminKelasId: kelasId, ruanganId, status: "Aktif" })}
            disabled={!valid}
            className="m-tiny flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
          >
            <Plus size={11} /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="m-mini mb-1 font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      {children}
    </div>
  );
}
