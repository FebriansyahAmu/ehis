"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarClock, FlaskConical, Scan, Building2, Plus, Trash2, MessageSquare,
  ChevronDown, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DischargeFollowUp, JadwalKontrol, JadwalPemeriksaan } from "./dischargeShared";

type Props = {
  data:     DischargeFollowUp;
  onChange: (d: DischargeFollowUp) => void;
};

function Toggle({ checked }: { checked: boolean }) {
  return (
    <div className={cn(
      "pointer-events-none relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
      checked ? "bg-sky-500" : "bg-slate-300",
    )}>
      <span className={cn(
        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-4" : "translate-x-0.5",
      )} />
    </div>
  );
}

function formatTanggal(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch { return iso; }
}

function daysUntil(iso: string): number {
  if (!iso) return -999;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function DaysBadge({ days }: { days: number }) {
  if (days < 0)  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-500">Lewat</span>;
  if (days === 0) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">Hari ini</span>;
  if (days <= 7)  return <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700">{days} hari lagi</span>;
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-medium text-slate-500">{days} hari lagi</span>;
}

// ── Section collapse component ────────────────────────────

function CollapsibleSection({
  icon: Icon, title, count, open, onToggle, children,
}: {
  icon: React.ElementType; title: string; count?: number;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2.5 px-4 py-3"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-50">
          <Icon size={12} className="text-sky-600" />
        </div>
        <p className="flex-1 text-left text-xs font-semibold text-slate-700">{title}</p>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">{count}</span>
        )}
        <ChevronDown size={14} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="section-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-4 pb-4 pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Inline add forms ──────────────────────────────────────

function AddKontrolInline({ onAdd }: { onAdd: (j: JadwalKontrol) => void }) {
  const [form, setForm] = useState({ tanggal: "", poli: "", dokter: "", catatan: "" });
  function setF(k: keyof typeof form, v: string) { setForm(f => ({ ...f, [k]: v })); }
  function handleAdd() {
    if (!form.poli.trim()) return;
    onAdd({ id: `jk-${Date.now()}`, ...form });
    setForm({ tanggal: "", poli: "", dokter: "", catatan: "" });
  }
  return (
    <div className="space-y-2.5">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="date"
          value={form.tanggal}
          onChange={e => setF("tanggal", e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
        />
        <input
          value={form.poli}
          onChange={e => setF("poli", e.target.value)}
          placeholder="Poliklinik / unit tujuan *"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
        />
        <input
          value={form.dokter}
          onChange={e => setF("dokter", e.target.value)}
          placeholder="Nama dokter (opsional)"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
        />
        <input
          value={form.catatan}
          onChange={e => setF("catatan", e.target.value)}
          placeholder="Catatan / persiapan"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
        />
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!form.poli.trim()}
        className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-600 disabled:opacity-40"
      >
        <Plus size={12} /> Tambah Jadwal
      </button>
    </div>
  );
}

function AddPeriksaInline({ onAdd }: { onAdd: (j: JadwalPemeriksaan) => void }) {
  const [form, setForm] = useState<Omit<JadwalPemeriksaan, "id">>({ jenis: "Lab", nama: "", tanggal: "", catatan: "" });
  function setF<K extends keyof Omit<JadwalPemeriksaan, "id">>(k: K, v: Omit<JadwalPemeriksaan, "id">[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }
  function handleAdd() {
    if (!form.nama.trim()) return;
    onAdd({ id: `jp-${Date.now()}`, ...form });
    setForm({ jenis: "Lab", nama: "", tanggal: "", catatan: "" });
  }
  return (
    <div className="space-y-2.5">
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={form.jenis}
          onChange={e => setF("jenis", e.target.value as "Lab" | "Radiologi")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
        >
          <option value="Lab">Laboratorium</option>
          <option value="Radiologi">Radiologi</option>
        </select>
        <input
          type="date"
          value={form.tanggal}
          onChange={e => setF("tanggal", e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
        />
        <input
          value={form.nama}
          onChange={e => setF("nama", e.target.value)}
          placeholder="Nama pemeriksaan *"
          className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
        />
        <input
          value={form.catatan}
          onChange={e => setF("catatan", e.target.value)}
          placeholder="Catatan / indikasi"
          className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
        />
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={!form.nama.trim()}
        className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-600 disabled:opacity-40"
      >
        <Plus size={12} /> Tambah Pemeriksaan
      </button>
    </div>
  );
}

// ── Appointment card (for right panel grid) ───────────────

function AppointmentCard({
  type, title, subtitle, date, onDelete,
}: {
  type: "kontrol" | "lab" | "rad";
  title: string; subtitle: string; date: string; onDelete: () => void;
}) {
  const days = daysUntil(date);

  const cfg = {
    kontrol: { bg: "bg-sky-50",     border: "border-sky-200",     icon: CalendarClock, iconCls: "text-sky-600",     iconBg: "bg-sky-100"     },
    lab:     { bg: "bg-emerald-50", border: "border-emerald-200", icon: FlaskConical,  iconCls: "text-emerald-600", iconBg: "bg-emerald-100" },
    rad:     { bg: "bg-violet-50",  border: "border-violet-200",  icon: Scan,          iconCls: "text-violet-600",  iconBg: "bg-violet-100"  },
  }[type];

  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group relative rounded-xl border p-3 shadow-sm transition-all hover:shadow-md",
        cfg.bg, cfg.border,
      )}
    >
      <button
        type="button"
        onClick={onDelete}
        className="absolute right-2 top-2 hidden rounded-lg p-1 text-slate-400 transition hover:bg-white/60 hover:text-red-500 group-hover:flex"
      >
        <Trash2 size={11} />
      </button>

      <div className={cn("mb-2 flex h-8 w-8 items-center justify-center rounded-lg", cfg.iconBg)}>
        <Icon size={14} className={cfg.iconCls} />
      </div>

      <p className="pr-5 text-xs font-bold leading-tight text-slate-800">{title}</p>
      {subtitle && <p className="mt-0.5 truncate text-[10px] text-slate-500">{subtitle}</p>}

      <div className="mt-2.5 flex items-center justify-between gap-1">
        <p className="text-[10px] font-medium text-slate-600">{formatTanggal(date)}</p>
        <DaysBadge days={days} />
      </div>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────

export default function StepFollowUp({ data, onChange }: Props) {
  const [openKontrol, setOpenKontrol] = useState(true);
  const [openPeriksa, setOpenPeriksa] = useState(true);

  function set<K extends keyof DischargeFollowUp>(key: K, val: DischargeFollowUp[K]) {
    onChange({ ...data, [key]: val });
  }

  function addKontrol(j: JadwalKontrol) { set("jadwalKontrol", [...data.jadwalKontrol, j]); }
  function removeKontrol(id: string) { set("jadwalKontrol", data.jadwalKontrol.filter(j => j.id !== id)); }
  function addPemeriksaan(j: JadwalPemeriksaan) { set("jadwalPemeriksaan", [...data.jadwalPemeriksaan, j]); }
  function removePemeriksaan(id: string) { set("jadwalPemeriksaan", data.jadwalPemeriksaan.filter(j => j.id !== id)); }

  const allAppointments = [
    ...data.jadwalKontrol.map(j => ({
      id: j.id, type: "kontrol" as const,
      title: j.poli, subtitle: j.dokter, date: j.tanggal,
      onDelete: () => removeKontrol(j.id),
    })),
    ...data.jadwalPemeriksaan.map(j => ({
      id: j.id, type: j.jenis === "Lab" ? "lab" as const : "rad" as const,
      title: j.nama, subtitle: j.catatan, date: j.tanggal,
      onDelete: () => removePemeriksaan(j.id),
    })),
  ].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  return (
    <div className="flex flex-col gap-4 xl:flex-row">

      {/* ── Left: Forms ── */}
      <div className="min-w-0 flex-1 space-y-3">

        {/* Jadwal Kontrol */}
        <CollapsibleSection
          icon={CalendarClock} title="Jadwal Kontrol Poliklinik"
          count={data.jadwalKontrol.length}
          open={openKontrol} onToggle={() => setOpenKontrol(o => !o)}
        >
          {data.jadwalKontrol.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {data.jadwalKontrol.map(j => (
                <div key={j.id} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <CalendarClock size={12} className="shrink-0 text-sky-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{j.poli}</p>
                    <p className="text-[10px] text-slate-500">{j.dokter && `${j.dokter} · `}{formatTanggal(j.tanggal)}</p>
                  </div>
                  <button type="button" onClick={() => removeKontrol(j.id)} className="shrink-0 rounded p-1 text-slate-400 hover:text-red-500">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {data.jadwalKontrol.length === 0 && (
            <p className="mb-3 text-xs text-slate-400">Belum ada jadwal. Tambahkan minimal 1 kontrol pasca pulang.</p>
          )}
          <AddKontrolInline onAdd={addKontrol} />
        </CollapsibleSection>

        {/* Jadwal Pemeriksaan */}
        <CollapsibleSection
          icon={FlaskConical} title="Jadwal Lab & Radiologi"
          count={data.jadwalPemeriksaan.length}
          open={openPeriksa} onToggle={() => setOpenPeriksa(o => !o)}
        >
          {data.jadwalPemeriksaan.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {data.jadwalPemeriksaan.map(j => (
                <div key={j.id} className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  {j.jenis === "Lab"
                    ? <FlaskConical size={12} className="shrink-0 text-emerald-500" />
                    : <Scan size={12} className="shrink-0 text-violet-500" />
                  }
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-800">{j.nama}</p>
                    <p className="text-[10px] text-slate-500">{j.jenis} · {formatTanggal(j.tanggal)}</p>
                  </div>
                  <button type="button" onClick={() => removePemeriksaan(j.id)} className="shrink-0 rounded p-1 text-slate-400 hover:text-red-500">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <AddPeriksaInline onAdd={addPemeriksaan} />
        </CollapsibleSection>

        {/* Rujukan FKTP */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => set("adaRujukanFKTP", !data.adaRujukanFKTP)}
            className="flex w-full items-center gap-2.5 text-left transition"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-50">
              <Building2 size={12} className="text-sky-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-700">Rujukan ke FKTP / Fasilitas Lain</p>
              <p className="text-[11px] text-slate-400">Puskesmas atau klinik pratama terdekat</p>
            </div>
            <Toggle checked={data.adaRujukanFKTP} />
          </button>
          <AnimatePresence initial={false}>
            {data.adaRujukanFKTP && (
              <motion.div
                key="fktp-fields"
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  <input
                    value={data.fktpNama}
                    onChange={e => set("fktpNama", e.target.value)}
                    placeholder="Nama FKTP / fasilitas rujukan"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
                  />
                  <input
                    value={data.fktpTujuan}
                    onChange={e => set("fktpTujuan", e.target.value)}
                    placeholder="Tujuan rujukan / yang perlu dipantau..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Instruksi Khusus */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-sky-50">
              <MessageSquare size={12} className="text-sky-600" />
            </div>
            <p className="text-xs font-semibold text-slate-700">Instruksi & Pesan Khusus</p>
          </div>
          <textarea
            value={data.instruksiKhusus}
            onChange={e => set("instruksiKhusus", e.target.value)}
            rows={4}
            placeholder="Instruksi spesifik pasca pulang: tanda bahaya, target klinis, kapan harus ke IGD..."
            className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          />
        </div>

      </div>

      {/* ── Right: Jadwal Visual ── */}
      <div className="w-full shrink-0 xl:w-72">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays size={14} className="text-sky-600" />
            <p className="text-xs font-bold text-slate-700">Jadwal Mendatang</p>
            {allAppointments.length > 0 && (
              <span className="ml-auto rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {allAppointments.length}
              </span>
            )}
          </div>

          {allAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarDays size={32} className="mb-2 text-slate-200" />
              <p className="text-xs font-medium text-slate-400">Belum ada jadwal</p>
              <p className="mt-0.5 text-[11px] text-slate-300">Tambahkan jadwal kontrol dan pemeriksaan di panel kiri</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <AnimatePresence>
                {allAppointments.map(apt => (
                  <AppointmentCard
                    key={apt.id}
                    type={apt.type}
                    title={apt.title}
                    subtitle={apt.subtitle}
                    date={apt.date}
                    onDelete={apt.onDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* FKTP summary */}
          {data.adaRujukanFKTP && data.fktpNama && (
            <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 p-3">
              <div className="mb-1 flex items-center gap-2">
                <Building2 size={11} className="shrink-0 text-teal-600" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">Rujukan FKTP</p>
              </div>
              <p className="text-xs font-semibold text-teal-800">{data.fktpNama}</p>
              {data.fktpTujuan && (
                <p className="mt-0.5 line-clamp-2 text-[11px] text-teal-700">{data.fktpTujuan}</p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
