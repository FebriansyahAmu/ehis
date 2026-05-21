"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCog, Save, Trash2, IdCard, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type DokterRecord, type JadwalSlot, type SpesialisCode,
  STATUS_CFG, SPESIALIS_LABEL,
} from "./dokterShared";
import MappingSourceBadge from "../shared/MappingSourceBadge";
import ProfilLisensiTab from "./sections/ProfilLisensiTab";
import JadwalTab from "./sections/JadwalTab";

interface DokterDetailProps {
  dokter: DokterRecord;
  onSave: (next: DokterRecord) => void;
  onDelete: (dokter: DokterRecord) => void;
}

type TabKey = "profil" | "jadwal";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "profil", label: "Profil & Lisensi", icon: IdCard },
  { key: "jadwal", label: "Jadwal Praktik",   icon: CalendarRange },
];

export default function DokterDetail({ dokter, onSave, onDelete }: DokterDetailProps) {
  const [form, setForm] = useState<DokterRecord>(dokter);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("profil");

  useEffect(() => {
    setForm(dokter);
    setDirty(false);
    setActiveTab("profil");
  }, [dokter]);

  const update = <K extends keyof DokterRecord>(key: K, value: DokterRecord[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  const updateSpesialis = (s: SpesialisCode) => {
    setForm((f) => ({ ...f, spesialis: s, kualifikasi: SPESIALIS_LABEL[s] }));
    setDirty(true);
  };

  const addJadwal = () => {
    update("jadwal", [...form.jadwal, { hari: "Senin", jamMulai: "08:00", jamSelesai: "12:00" }]);
  };

  const updateJadwal = (idx: number, patch: Partial<JadwalSlot>) => {
    update("jadwal", form.jadwal.map((j, i) => (i === idx ? { ...j, ...patch } : j)));
  };

  const removeJadwal = (idx: number) => {
    update("jadwal", form.jadwal.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setDirty(false);
  };

  const status = STATUS_CFG[form.status];
  const spesialisLabel = useMemo(
    () => (form.spesialis ? SPESIALIS_LABEL[form.spesialis] : null),
    [form.spesialis],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 ring-2 ring-teal-100">
            <UserCog size={18} className="text-teal-600" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600">
              Dokter / Nakes
            </p>
            <h2 className="truncate text-sm font-bold text-slate-900">
              {form.nama || "Dokter Baru"}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {spesialisLabel && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {spesialisLabel}
                </span>
              )}
              <span className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                status.bg, status.text,
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(dokter)}
          className="flex shrink-0 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 size={11} />
          Hapus
        </button>
      </div>

      {/* Mapping Hub pointer — Penugasan Poli/Unit dikelola di SDM Assignment */}
      <MappingSourceBadge
        subpage="sdm"
        title="Penugasan Poli & Unit"
        description="Penugasan dokter ke poli, unit klinis, dan ruangan dikelola di Mapping Hub → SDM Assignment. Termasuk masa berlaku tugas dan multi-unit assignment."
        ctaLabel="Atur Penugasan"
      />

      {/* Tab nav */}
      <div
        role="tablist"
        aria-label="Detail dokter"
        className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/70 p-1"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-teal-300",
                active
                  ? "bg-white text-teal-700 shadow-sm ring-1 ring-teal-200"
                  : "text-slate-500 hover:text-slate-700",
              )}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "profil" ? (
          <ProfilLisensiTab
            key="profil"
            form={form}
            onUpdate={update}
            onUpdateSpesialis={updateSpesialis}
          />
        ) : (
          <JadwalTab
            key="jadwal"
            jadwal={form.jadwal}
            onAdd={addJadwal}
            onUpdate={updateJadwal}
            onRemove={removeJadwal}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <p className="text-[10px] text-slate-400">
          {dirty ? "Perubahan belum disimpan" : "Tidak ada perubahan"}
        </p>
        <button
          type="submit"
          disabled={!dirty}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-sm transition outline-none",
            dirty
              ? "bg-teal-600 text-white hover:bg-teal-700 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-teal-300"
              : "cursor-not-allowed bg-slate-100 text-slate-400",
          )}
        >
          <Save size={12} />
          Simpan Perubahan
        </button>
      </div>
    </form>
  );
}
