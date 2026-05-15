"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, X, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientMaster } from "@/lib/data";
import { patientMasterData } from "@/lib/data";

import { parseIndoDate, type JadwalItem } from "./patient/config";
import { PatientLeftPanel } from "./patient/PatientLeftPanel";
import { PatientRightPanel } from "./patient/PatientRightPanel";
import { EditDataModal } from "./patient/modals/EditDataModal";
import { EditKontakModal } from "./patient/modals/EditKontakModal";
import { UbahPenjaminModal } from "./patient/modals/UbahPenjaminModal";
import { AccountingModal } from "./patient/modals/AccountingModal";
import { BillingDetailModal } from "./patient/modals/BillingDetailModal";
import { RiwayatKunjunganModal } from "./patient/modals/RiwayatKunjunganModal";
import { TambahJadwalModal } from "./patient/modals/TambahJadwalModal";
import { DaftarKunjunganModal } from "./patient/modals/DaftarKunjunganModal";
import { InfoDetailModal } from "./patient/modals/InfoDetailModal";

export default function PatientDashboard({ patient: init }: { patient: PatientMaster }) {
  // ── Multi-tab state ────────────────────────────────────────
  const [tabs, setTabs] = useState<PatientMaster[]>([init]);
  const [activeId, setActiveId] = useState(init.id);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const patient = tabs.find((t) => t.id === activeId) ?? tabs[0];

  function setPatient(value: PatientMaster | ((prev: PatientMaster) => PatientMaster)) {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeId ? (typeof value === "function" ? value(t) : value) : t,
      ),
    );
  }

  function switchTab(id: string) {
    setActiveId(id);
    setEditData(false);
    setEditKontak(false);
    setPenjamin(false);
    setKasir(false);
    setRiwayat(false);
    setInfoLengkap(false);
    setOpenBillingId(null);
    setShowSearch(false);
    setShowTambahJadwal(false);
  }

  function openPatient(p: PatientMaster) {
    if (!tabs.some((t) => t.id === p.id)) setTabs((prev) => [...prev, p]);
    switchTab(p.id);
    setSearchQuery("");
  }

  function closeTab(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeId === id) setActiveId(remaining[Math.max(0, idx - 1)].id);
  }

  const allPatients = useMemo(() => Object.values(patientMasterData), []);
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? allPatients.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.noRM.toLowerCase().includes(q) ||
            p.nik.includes(q),
        )
      : allPatients;
    return list.slice(0, 6);
  }, [searchQuery, allPatients]);

  // ── Per-patient modal state ────────────────────────────────
  const [showEditData, setEditData] = useState(false);
  const [showEditKontak, setEditKontak] = useState(false);
  const [showPenjamin, setPenjamin] = useState(false);
  const [showKasir, setKasir] = useState(false);
  const [showRiwayat, setRiwayat] = useState(false);
  const [showDaftarKunjungan, setDaftarKunjungan] = useState(false);
  const [showTambahJadwal, setShowTambahJadwal] = useState(false);
  const [showInfoLengkap, setInfoLengkap] = useState(false);
  const [openBillingId, setOpenBillingId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // ── Derived data ───────────────────────────────────────────
  const jadwalList = useMemo((): JadwalItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return patient.riwayatKunjungan
      .filter((k) => k.jadwalKontrol)
      .map((k) => ({ ...k.jadwalKontrol!, fromKunjungan: k.noKunjungan }))
      .sort((a, b) => {
        const da = parseIndoDate(a.tanggal);
        const db = parseIndoDate(b.tanggal);
        const aUp = da >= today;
        const bUp = db >= today;
        if (aUp !== bUp) return aUp ? -1 : 1;
        return aUp ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
      });
  }, [patient.riwayatKunjungan]);

  const upcomingCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return jadwalList.filter(
      (j) => j.status === "Dijadwalkan" && parseIndoDate(j.tanggal) >= today,
    ).length;
  }, [jadwalList]);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPhotoPreview(URL.createObjectURL(f));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      {/* ── Header: breadcrumb + tab bar ── */}
      <header className="shrink-0 bg-white shadow-xs">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-1.5 text-xs text-slate-400">
          <Link href="/ehis-registration" className="transition hover:text-slate-600">
            Beranda
          </Link>
          <ChevronRight size={10} className="shrink-0" />
          <span className="font-medium text-slate-600">Pasien</span>
          <Link
            href="/ehis-registration"
            className="ml-auto flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          >
            <X size={12} />
          </Link>
        </div>

        {/* Tab bar */}
        <div className="relative flex items-end border-b border-slate-200 bg-slate-50/60 px-3 pt-2">
          {tabs.map((tab) => {
            const isActive = tab.id === activeId;
            const tabInitials = tab.name
              .split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("")
              .toUpperCase();
            const hasActive = tab.riwayatKunjungan.some((k) => k.status === "Aktif");
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={cn(
                  "group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-t-lg border px-3 py-2 text-left transition",
                  isActive
                    ? "z-10 border-b-white border-slate-200 bg-white text-slate-800 shadow-xs"
                    : "border-transparent bg-transparent text-slate-500 hover:bg-white/70 hover:text-slate-700",
                )}
                style={isActive ? { marginBottom: -1 } : undefined}
              >
                <div
                  className={cn(
                    "h-3.5 w-1 shrink-0 rounded-full",
                    tab.gender === "L" ? "bg-sky-400" : "bg-pink-400",
                  )}
                />
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-black",
                    tab.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                  )}
                >
                  {tabInitials}
                </div>
                <div className="min-w-0">
                  <p className="max-w-27.5 truncate text-[11px] font-semibold leading-tight">
                    {tab.name.split(" ").slice(0, 2).join(" ")}
                  </p>
                  <p className="font-mono text-[9px] leading-tight opacity-50">{tab.noRM}</p>
                </div>
                {hasActive && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />}
                {tabs.length > 1 && (
                  <span
                    role="button"
                    onClick={(e) => closeTab(tab.id, e)}
                    className="ml-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-0 transition hover:bg-slate-200 group-hover:opacity-100"
                  >
                    <X size={9} />
                  </span>
                )}
              </button>
            );
          })}

          {/* Search / add tab button */}
          <div className="relative mb-0.5 ml-1 pb-1.5">
            <button
              onClick={() => { setShowSearch((v) => !v); setSearchQuery(""); }}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition",
                showSearch
                  ? "border-teal-300 bg-teal-50 text-teal-700"
                  : "border-dashed border-slate-300 bg-white text-slate-400 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600",
              )}
            >
              <Plus size={11} />
              <span>Tambah Pasien</span>
            </button>

            {showSearch && (
              <div className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5">
                  <Search size={13} className="shrink-0 text-slate-400" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nama, No. RM, atau NIK…"
                    className="flex-1 bg-transparent text-xs text-slate-700 placeholder-slate-300 outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="cursor-pointer text-slate-300 hover:text-slate-500"
                    >
                      <X size={11} />
                    </button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="py-5 text-center text-xs text-slate-400">Tidak ada hasil.</p>
                  ) : (
                    <>
                      {!searchQuery && (
                        <p className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Semua Pasien
                        </p>
                      )}
                      {searchResults.map((p) => {
                        const pInitials = p.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
                        const isOpen = tabs.some((t) => t.id === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => openPatient(p)}
                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50"
                          >
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                                p.gender === "L" ? "bg-sky-100 text-sky-700" : "bg-pink-100 text-pink-700",
                              )}
                            >
                              {pInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{p.name}</p>
                              <p className="font-mono text-[10px] text-slate-400">{p.noRM} · {p.age} thn</p>
                            </div>
                            {isOpen ? (
                              <span className="shrink-0 rounded-full bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-600">
                                Terbuka
                              </span>
                            ) : (
                              <Plus size={11} className="shrink-0 text-slate-300" />
                            )}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 border-b border-slate-200" style={{ marginBottom: -1 }} />
        </div>
      </header>

      {showSearch && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSearch(false)} />
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <PatientLeftPanel
            patient={patient}
            upcomingCount={upcomingCount}
            photoPreview={photoPreview}
            photoRef={photoRef}
            onInfoLengkap={() => setInfoLengkap(true)}
            onDaftarKunjungan={() => setDaftarKunjungan(true)}
            onKasir={() => setKasir(true)}
            onOpenBilling={(id) => setOpenBillingId(id)}
          />
          <PatientRightPanel
            patient={patient}
            jadwalList={jadwalList}
            upcomingCount={upcomingCount}
            onUbahPenjamin={() => setPenjamin(true)}
            onLihatRiwayat={() => setRiwayat(true)}
            onTambahJadwal={() => setShowTambahJadwal(true)}
          />
        </div>
      </div>

      {/* ── Modals ── */}
      {showEditData && (
        <EditDataModal patient={patient} onClose={() => setEditData(false)} onSave={setPatient} />
      )}
      {showEditKontak && (
        <EditKontakModal patient={patient} onClose={() => setEditKontak(false)} onSave={setPatient} />
      )}
      {showPenjamin && (
        <UbahPenjaminModal
          current={patient.penjamin}
          onClose={() => setPenjamin(false)}
          onSave={(pj) => setPatient((p) => ({ ...p, penjamin: pj }))}
        />
      )}
      {showInfoLengkap && (
        <InfoDetailModal
          patient={patient}
          onClose={() => setInfoLengkap(false)}
          onEditData={() => setEditData(true)}
          onEditKontak={() => setEditKontak(true)}
        />
      )}
      {showKasir && patient.kasir && (
        <AccountingModal kasir={patient.kasir} patient={patient} onClose={() => setKasir(false)} />
      )}
      {showRiwayat && (
        <RiwayatKunjunganModal kunjungan={patient.riwayatKunjungan} onClose={() => setRiwayat(false)} />
      )}
      {showDaftarKunjungan && (
        <DaftarKunjunganModal patient={patient} onClose={() => setDaftarKunjungan(false)} />
      )}
      {showTambahJadwal && (
        <TambahJadwalModal patient={patient} onClose={() => setShowTambahJadwal(false)} />
      )}
      {openBillingId &&
        (() => {
          const rec = patient.billing.find((b) => b.id === openBillingId);
          return rec ? (
            <BillingDetailModal record={rec} onClose={() => setOpenBillingId(null)} />
          ) : null;
        })()}

      <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
    </div>
  );
}
