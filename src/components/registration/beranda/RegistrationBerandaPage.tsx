"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, CalendarDays, BedDouble, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { PasienBaruModal } from "@/components/registration/pasien-baru/PasienBaruModal";
import AdmisiRanapBoard from "@/components/registration/admisi/AdmisiRanapBoard";
import AdmisiRjBoard from "@/components/registration/admisi/AdmisiRjBoard";

type AdmisiTab = "ranap" | "rj";

const TABS: { id: AdmisiTab; label: string; icon: typeof BedDouble }[] = [
  { id: "ranap", label: "Admisi IGD & RI", icon: BedDouble },
  { id: "rj", label: "Admisi RJ", icon: Stethoscope },
];

// ── Aksi Cepat ─────────────────────────────────────────────

function QuickActions({ onDaftarBaru }: { onDaftarBaru: () => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-bold text-slate-800">Aksi Cepat</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          onClick={onDaftarBaru}
          className="flex items-center justify-center gap-2.5 rounded-xl bg-teal-600 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-teal-700 active:scale-[0.98]"
        >
          <UserPlus size={13} className="shrink-0" />
          Daftar Pasien Baru
        </button>
        <Link
          href="/ehis-registration/antrian"
          className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
        >
          <CalendarDays size={13} className="shrink-0" />
          Lihat Antrian
        </Link>
        <Link
          href="/ehis-registration/pasien"
          className="flex items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
        >
          <Users size={13} className="shrink-0" />
          Daftar Semua Pasien
        </Link>
      </div>
    </div>
  );
}

// ── Tab Bar ────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: AdmisiTab; onChange: (t: AdmisiTab) => void }) {
  return (
    <div className="inline-flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors",
              isActive ? "text-teal-700" : "text-slate-500 hover:text-slate-700",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="admisi-tab-pill"
                className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-slate-200"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <Icon size={13} className="relative z-10 shrink-0" />
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function RegistrationBerandaPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<AdmisiTab>("ranap");

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <>
      <div className="flex flex-col gap-5 p-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-slate-900">Beranda Registrasi</h1>
            <p className="mt-0.5 text-xs text-slate-400">{today}</p>
          </div>
          <Link
            href="/ehis-registration/pasien"
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
          >
            <Users size={12} />
            Semua Pasien
          </Link>
        </div>

        {/* ── Aksi Cepat ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <QuickActions onDaftarBaru={() => setModalOpen(true)} />
        </motion.div>

        {/* ── Worklist Admisi (tab IGD & RI / RJ) ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <TabBar active={tab} onChange={setTab} />
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {tab === "ranap" ? <AdmisiRanapBoard /> : <AdmisiRjBoard />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <PasienBaruModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
