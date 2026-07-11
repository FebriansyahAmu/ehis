"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navigation, User, Stethoscope, Calendar, Loader2, Info,
  Check, CheckCircle2, Printer, Hospital, BedDouble, Send,
  type LucideIcon,
} from "lucide-react";
import type { RJPatientDetail } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/ui/toastStore";
import { ApiError } from "@/lib/api/client";
import { createSpri } from "@/lib/api/spri/spri";
import type { SpriInput } from "@/lib/schemas/disposisi/disposisi";
import type { PulangPatient } from "@/components/igd/tabs/pasienPulang/pasienPulangShared";
import SpriIssuePanel from "@/components/shared/spri/SpriIssuePanel";
import SpriRiwayatPanel from "@/components/shared/spri/SpriRiwayatPanel";
import RujukEksternalForm from "./disposisi/RujukEksternalForm";
import RujukanCetakModal from "./disposisi/RujukanCetakModal";
import RujukanKeluarWidget from "./disposisi/RujukanKeluarWidget";
import type { RujukanCetakData } from "./disposisi/RujukanCetakTemplate";
import { SectionHeader, type DisposisiResult } from "./disposisi/shared";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ── Types ──────────────────────────────────────────────────

type DisposisiTipe = "rujuk-eksternal" | "admisi-ri";

// ── Config ─────────────────────────────────────────────────

interface DisposisiDef {
  id: DisposisiTipe;
  label: string;
  sub: string;
  icon: LucideIcon;
  sel: string;
  idle: string;
  dot: string;
}

const DISPOSISI: DisposisiDef[] = [
  {
    id: "rujuk-eksternal",
    label: "Rujuk Eksternal",
    sub: "FKRTL / RS lain",
    icon: Send,
    sel: "border-indigo-400 bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/40",
    dot: "bg-indigo-500",
  },
  {
    id: "admisi-ri",
    label: "Admisi Rawat Inap",
    sub: "Masuk bangsal / perawatan",
    icon: BedDouble,
    sel: "border-emerald-400 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    idle: "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50/40",
    dot: "bg-emerald-500",
  },
];

// ── Admisi Rawat Inap Form — Penerbitan SPRI (form IDENTIK IGD via SpriIssuePanel) ──
// Menerbitkan SPRI (Surat Perintah Rawat Inap) dari poliklinik, ditautkan ke kunjungan RJ berjalan
// (= patient.id). Persist via POST /api/v1/spri → muncul di Worklist Admisi Rawat Inap (Registrasi).

function AdmisiRIForm({ patient, isPersisted, onSubmit }: {
  patient: RJPatientDetail;
  isPersisted: boolean;
  onSubmit: (r: DisposisiResult) => void;
}) {
  const [spriForm, setSpriForm] = useState<SpriInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [riwayatVer, setRiwayatVer] = useState(0); // bump → panel kanan refetch riwayat SPRI

  // Adapter RJ → PulangPatient (tipe sempit SPRIPanel; hanya doctor + noBpjs yang dipakai form).
  const pulangPatient = useMemo<PulangPatient>(() => ({
    id: patient.id,
    noRM: patient.noRM,
    noKunjungan: "",
    name: patient.name,
    age: patient.age,
    gender: patient.gender,
    doctor: "", // DPJP dipilih eksplisit dari daftar (nama dpjp-tersedia tanpa gelar → hindari pra-isi tak cocok)
    diagnosa: patient.diagnosa,
    tglKunjungan: patient.tanggalKunjungan,
    arrivalTime: patient.waktuDaftar,
    noBpjs: patient.noBpjs,
    namaKeluarga: patient.namaKeluarga,
    hubunganKeluarga: patient.hubunganKeluarga,
    noHp: patient.noTelp,
  }), [patient]);

  async function handleSubmit() {
    if (!spriForm || busy) return;
    setBusy(true);
    try {
      if (isPersisted) {
        // SPRI ditautkan ke kunjungan RJ berjalan (= patient.id). No. Kartu di-resolusi server.
        const dto = await createSpri({ ...spriForm, kunjunganId: patient.id, noKartu: "" });
        toast.success("SPRI diterbitkan", dto.noReferensi ? `No. Ref ${dto.noReferensi}` : "Menunggu No. Referensi BPJS");
        setRiwayatVer((v) => v + 1); // panel kanan refetch
        onSubmit({ spri: dto });
      } else {
        // Pasien demo (non-UUID) → tak persist.
        toast.info("Mode demo", "SPRI tidak disimpan untuk pasien contoh.");
        onSubmit({ spriDemo: true });
      }
    } catch (e) {
      toast.error("Gagal menerbitkan SPRI", e instanceof ApiError ? e.message : undefined);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
      {/* Panel kiri — form penerbitan SPRI (IDENTIK IGD) */}
      <div className="flex flex-col gap-4">
        <SpriIssuePanel
          patient={pulangPatient}
          onChange={setSpriForm}
          submitHint={
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info size={11} className="shrink-0" />
              SPRI terbit &amp; masuk Worklist Admisi Registrasi saat menekan{" "}
              <span className="font-semibold text-slate-500">Terbitkan SPRI</span>.
            </p>
          }
        />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] text-slate-400">
            {spriForm
              ? "Form SPRI lengkap — siap diterbitkan."
              : "Lengkapi DPJP, tanggal, jenis ruang, & indikasi untuk melanjutkan."}
          </p>
          <button
            onClick={handleSubmit}
            disabled={!spriForm || busy}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <BedDouble size={13} />}
            {busy ? "Menerbitkan…" : "Terbitkan SPRI"}
          </button>
        </div>
      </div>

      {/* Panel kanan — riwayat SPRI pasien */}
      <SpriRiwayatPanel kunjunganId={patient.id} isPersisted={isPersisted} refreshKey={riwayatVer} />
    </div>
  );
}

// ── Success screen ─────────────────────────────────────────

function SuccessScreen({
  tipe, patient, result, onBack,
}: {
  tipe: DisposisiTipe;
  patient: RJPatientDetail;
  result: DisposisiResult | null;
  onBack: () => void;
}) {
  const MAP = {
    "rujuk-eksternal": { label: "Surat Rujukan Berhasil Dibuat",                cls: "bg-indigo-100 text-indigo-600" },
    "admisi-ri":       { label: "SPRI (Surat Perintah Rawat Inap) Diterbitkan", cls: "bg-emerald-100 text-emerald-600" },
  } as const;
  const def = MAP[tipe];
  const [cetakOpen, setCetakOpen] = useState(false);
  const hasSurat = !!result?.rujukan;
  const spri = result?.spri ?? null;
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
      <RujukanCetakModal open={cetakOpen} onClose={() => setCetakOpen(false)} data={result?.rujukan ?? null} />
      <span className={cn("flex h-16 w-16 items-center justify-center rounded-2xl", def.cls)}>
        <CheckCircle2 size={30} />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-800">{def.label}</p>
        <p className="mt-1 text-xs text-slate-500">
          {patient.name} ({patient.noRM})
        </p>
        {result?.noRujukan && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            No. Rujukan BPJS: {result.noRujukan}
          </p>
        )}
        {tipe === "admisi-ri" && (
          <>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              {spri?.noReferensi
                ? `No. Referensi BPJS: ${spri.noReferensi}`
                : result?.spriDemo
                ? "Mode demo — SPRI tidak disimpan"
                : "Menunggu No. Referensi BPJS"}
            </p>
            {!result?.spriDemo && (
              <p className="mx-auto mt-3 max-w-sm text-[11px] leading-relaxed text-slate-400">
                Pasien kini muncul di <span className="font-semibold text-slate-500">Worklist Admisi Rawat Inap</span> (Registrasi) untuk didaftarkan ke bangsal.
              </p>
            )}
          </>
        )}
      </div>
      <div className="flex gap-2">
        {hasSurat ? (
          <button onClick={() => setCetakOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700">
            <Printer size={13} /> Cetak Surat Rujukan
          </button>
        ) : tipe === "rujuk-eksternal" ? (
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
            <Printer size={13} /> Cetak Dokumen
          </button>
        ) : null}
        <button onClick={onBack}
          className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700">
          Kembali ke Form
        </button>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────

export default function DisposisiRJTab({ patient }: { patient: RJPatientDetail }) {
  const [tipe, setTipe]     = useState<DisposisiTipe | null>(null);
  const [result, setResult] = useState<DisposisiResult | null>(null);
  const [rujukanVer, setRujukanVer] = useState(0); // bump → widget refetch surat rujukan (persisted)
  const [demoRujukan, setDemoRujukan] = useState<RujukanCetakData[]>([]); // pasien demo (non-UUID)
  const isPersisted = UUID_RE.test(patient.id);

  function handleTipeChange(newTipe: DisposisiTipe) {
    setTipe(newTipe);
    setResult(null);
  }

  const penjaminLabel = patient.penjamin.replace(/_/g, " ");

  return (
    <div className="flex flex-col gap-4">

      {/* ── Info bar ── */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <User size={14} />
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
              <Stethoscope size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">DPJP</p>
              <p className="text-xs font-semibold text-slate-800">{patient.dokter}</p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Hospital size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Poli</p>
              <p className="text-xs font-semibold text-slate-800">{patient.poli.replace(/_/g, " ")}</p>
            </div>
          </div>
          <div className="hidden h-7 w-px bg-slate-100 sm:block" />
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Calendar size={14} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kunjungan</p>
              <p className="text-xs font-semibold text-slate-800">
                {new Date(patient.tanggalKunjungan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="text-[11px] text-slate-400">Daftar: {patient.waktuDaftar}</p>
            </div>
          </div>
          <div className="ml-auto">
            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {penjaminLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tipe selector ── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader icon={Navigation} title="Jenis Disposisi" />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
          {DISPOSISI.map(opt => {
            const Icon = opt.icon;
            const sel = tipe === opt.id;
            return (
              <button key={opt.id} type="button" onClick={() => handleTipeChange(opt.id)}
                className={cn("flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition", sel ? opt.sel : opt.idle)}>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                  sel ? "bg-white/60 text-current" : "bg-slate-100 text-slate-500")}>
                  <Icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] leading-snug opacity-60">{opt.sub}</p>
                </div>
                {sel && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/60">
                    <Check size={10} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Widget "Surat Rujukan Sudah Terbit" (hijau) — di bawah Jenis Disposisi ── */}
      {tipe === "rujuk-eksternal" && (
        <RujukanKeluarWidget
          kunjunganId={patient.id}
          isPersisted={isPersisted}
          localItems={demoRujukan}
          onRemoveLocal={(nomor) => setDemoRujukan((prev) => prev.filter((x) => x.noRujukan !== nomor))}
          refreshKey={rujukanVer}
        />
      )}

      {/* ── Form area ── */}
      <AnimatePresence mode="wait">
        {!tipe && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-20 text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Navigation size={22} />
            </span>
            <p className="font-semibold text-slate-500">Pilih jenis disposisi</p>
            <p className="mt-1 text-sm text-slate-400">Rujuk eksternal atau admisi rawat inap</p>
          </motion.div>
        )}

        {tipe && result && (
          <motion.div key="success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <SuccessScreen tipe={tipe} patient={patient} result={result} onBack={() => setResult(null)} />
          </motion.div>
        )}

        {tipe && !result && tipe === "rujuk-eksternal" && (
          <motion.div key="eksternal" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <RujukEksternalForm patient={patient} onSubmit={(r) => {
              setResult(r);
              if (r.rujukan) {
                if (isPersisted) setRujukanVer((v) => v + 1);
                else setDemoRujukan((prev) => [r.rujukan!, ...prev]);
              }
            }} />
          </motion.div>
        )}

        {tipe && !result && tipe === "admisi-ri" && (
          <motion.div key="admisi" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <AdmisiRIForm patient={patient} isPersisted={isPersisted} onSubmit={(r) => setResult(r)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
