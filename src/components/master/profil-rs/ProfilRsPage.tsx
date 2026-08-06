"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, BadgeCheck, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RS_PROFIL_INITIAL } from "@/lib/master/rsProfilStore";
import type { RSProfil } from "@/lib/master/rsProfilStore";
import { setRsProfilCache, dtoToFull } from "@/lib/master/rsProfilClient";
import { getRsProfil, saveRsProfil, uploadRsLogo, removeRsLogo } from "@/lib/api/master/profilRs";
import { getSectionCfg } from "./profilRsShared";
import type { SectionKey } from "./profilRsShared";
import ProfilRsSidebar from "./ProfilRsSidebar";
import IdentitasSection  from "./sections/IdentitasSection";
import AlamatSection     from "./sections/AlamatSection";
import AkreditasiSection from "./sections/AkreditasiSection";
import ShiftSection      from "./sections/ShiftSection";
import LogoSection       from "./sections/LogoSection";
import KopSuratSection   from "./sections/KopSuratSection";

// ── Skeleton ─────────────────────────────────────────────

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

function PageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-3 w-32" />
          <Bone className="h-5 w-52" />
          <Bone className="h-3 w-80" />
        </div>
        <div className="flex gap-2">
          <Bone className="h-11 w-20" />
          <Bone className="h-11 w-20" />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 gap-4">
        <Bone className="h-full w-[260px]" />
        <Bone className="h-full flex-1" />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

export default function ProfilRsPage() {
  const [profil,   setProfil]   = useState<RSProfil>(RS_PROFIL_INITIAL);
  const [draft,    setDraft]    = useState<RSProfil>(() => structuredClone(RS_PROFIL_INITIAL));
  const [logo,     setLogo]     = useState<string | null>(null);
  const [section,  setSection]  = useState<SectionKey>("identitas");
  const [loaded,   setLoaded]   = useState(false);
  const [saved,    setSaved]    = useState<SectionKey | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);
  const [err,      setErr]      = useState<string | null>(null);

  // Muat profil dari DB (fallback konstanta bila belum tersimpan / gagal).
  useEffect(() => {
    const ac = new AbortController();
    getRsProfil(ac.signal)
      .then((dto) => {
        const { logoDataUrl, ...text } = dtoToFull(dto);
        setProfil(text);
        setDraft(structuredClone(text));
        setLogo(logoDataUrl);
      })
      .catch(() => { /* pertahankan fallback konstanta */ })
      .finally(() => { if (!ac.signal.aborted) setLoaded(true); });
    return () => ac.abort();
  }, []);

  const isDirty = useMemo(
    () => JSON.stringify(profil) !== JSON.stringify(draft),
    [profil, draft],
  );

  const handlePatch = (patch: Partial<RSProfil>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    try {
      await saveRsProfil(draft);
      const savedText = structuredClone(draft);
      setProfil(savedText);
      setRsProfilCache({ ...savedText, logoDataUrl: logo }); // KOP cetak tercermin seketika
      setSaved(section);
      setTimeout(() => setSaved(null), 2200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal menyimpan profil RS.");
    } finally {
      setSaving(false);
    }
  };

  // Logo — endpoint terpisah (persist seketika, di luar alur Simpan/Batal teks).
  const handleUploadLogo = async (dataUrl: string) => {
    setLogoBusy(true);
    setErr(null);
    try {
      const dto = await uploadRsLogo(dataUrl);
      setLogo(dto.logoDataUrl);
      setRsProfilCache({ ...profil, logoDataUrl: dto.logoDataUrl });
    } finally {
      setLogoBusy(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoBusy(true);
    setErr(null);
    try {
      await removeRsLogo();
      setLogo(null);
      setRsProfilCache({ ...profil, logoDataUrl: null });
    } finally {
      setLogoBusy(false);
    }
  };

  const handleCancel = () => {
    if (isDirty && !confirm("Buang perubahan yang belum tersimpan?")) return;
    setDraft(structuredClone(profil));
  };

  const handleSectionChange = (key: SectionKey) => {
    if (isDirty && !confirm("Ada perubahan belum tersimpan. Buang & pindah bagian?")) return;
    setDraft(structuredClone(profil));
    setSection(key);
  };

  const sectionCfg  = getSectionCfg(section);
  const SectionIcon = sectionCfg.icon;

  const sectionProps = { draft, isDirty, onPatch: handlePatch, onSave: handleSave, onCancel: handleCancel };

  return (
    <div className="flex h-full flex-col">
      <AnimatePresence mode="wait">
        {!loaded ? (
          <motion.div key="skel" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="h-full">
            <PageSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col gap-4 p-6"
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex shrink-0 items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-teal-600">
                  EHIS Master · Konfigurasi
                </p>
                <h1 className="mt-0.5 text-xl font-bold text-slate-900">Profil Rumah Sakit</h1>
                <p className="mt-0.5 text-xs text-slate-500">
                  Identitas, lokasi, akreditasi, shift kerja, dan KOP surat resmi RS — digunakan
                  seluruh modul EHIS.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <AnimatePresence>
                  {saved && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200"
                    >
                      <BadgeCheck size={12} />
                      Tersimpan
                    </motion.span>
                  )}
                </AnimatePresence>
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-teal-500">
                    Kelas RS
                  </p>
                  <p className="text-sm font-black text-teal-800">Kelas {profil.kelas}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                    Kode
                  </p>
                  <p className="text-sm font-black text-slate-900">{profil.kode}</p>
                </div>
              </div>
            </motion.div>

            {/* Error banner */}
            <AnimatePresence>
              {err && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700 ring-1 ring-rose-100"
                >
                  <AlertTriangle size={14} className="shrink-0" /> {err}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Body — two-panel */}
            <div className="flex min-h-0 flex-1 gap-4">
              <ProfilRsSidebar
                activeSection={section}
                onSelect={handleSectionChange}
                isDirty={isDirty}
                savedSection={saved}
              />

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={section}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Section header strip */}
                    <div className="shrink-0 border-b border-slate-100 px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg",
                          sectionCfg.accent.bg,
                        )}>
                          <SectionIcon size={15} className={sectionCfg.accent.text} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{sectionCfg.label}</p>
                          <p className="text-[11px] text-slate-400">{sectionCfg.desc}</p>
                        </div>
                      </div>
                    </div>

                    {/* Section content */}
                    <div className="flex-1 overflow-y-auto">
                      {section === "identitas"  && <IdentitasSection  {...sectionProps} />}
                      {section === "alamat"      && <AlamatSection      {...sectionProps} />}
                      {section === "akreditasi"  && <AkreditasiSection  {...sectionProps} />}
                      {section === "shift"       && <ShiftSection       {...sectionProps} />}
                      {section === "logo"        && (
                        <LogoSection
                          logo={logo}
                          nama={draft.nama}
                          kode={draft.kode}
                          busy={logoBusy}
                          onUpload={handleUploadLogo}
                          onRemove={handleRemoveLogo}
                        />
                      )}
                      {section === "kop"         && <KopSuratSection    {...sectionProps} />}
                    </div>

                    {/* Footer actions — logo persist seketika, tak butuh Simpan/Batal teks */}
                    {section !== "logo" && (
                      <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                        <button
                          onClick={handleCancel}
                          disabled={!isDirty || saving}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-30"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={!isDirty || saving}
                          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-40"
                        >
                          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                          {saving ? "Menyimpan…" : "Simpan Perubahan"}
                        </button>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
