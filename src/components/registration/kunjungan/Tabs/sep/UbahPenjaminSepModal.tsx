"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertTriangle, Printer, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import { changePenjamin, type KunjunganDTO } from "@/lib/api/kunjungan";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import { ModalShell } from "@/components/registration/patient/primitives";
import { PENJAMIN_CFG } from "@/components/registration/patient/config";
import { WizardStepper } from "@/components/registration/patient/modals/daftar-kunjungan/WizardStepper";
import { StepRujukan } from "@/components/registration/patient/modals/daftar-kunjungan/StepRujukan";
import { StepSEP } from "@/components/registration/patient/modals/daftar-kunjungan/StepSEP";
import { StepReview } from "@/components/registration/patient/modals/daftar-kunjungan/StepReview";
import { SepPrintModal } from "@/components/registration/patient/modals/daftar-kunjungan/SepCetak";
import type {
  KunjunganForm, PenjaminForm as PenjaminFormState, RujukanPick, UnitDaftar, WizardStep,
} from "@/components/registration/patient/modals/daftar-kunjungan/config";
import { BLANK_DRAFT, SLIDE_VARIANTS, type SepDraft, type BpjsData } from "./sepTypes";
import { buildChangePenjaminInput } from "./ubahPenjaminApi";

const KLS_MAP: Record<string, "1" | "2" | "3"> = { "Kelas I": "1", "Kelas II": "2", "Kelas III": "3" };
const UNIT_MAP: Record<string, UnitDaftar> = {
  IGD: "IGD", "Rawat Jalan": "Rawat Jalan", "Rawat Inap": "Rawat Inap",
};

// Label field penyebab penolakan SEP (BpjsMetaError.field) → teks operator (mirror DaftarKunjunganModal).
const SEP_FIELD_LABEL: Record<string, string> = {
  noTelp: "No. Telepon", diagAwal: "Diagnosa Awal (ICD-10)", skdpNoSurat: "No. Referensi SPRI",
  noKartu: "No. Kartu BPJS", ppkPelayanan: "Kode PPK Pelayanan",
};

/**
 * Modal penerbitan/ganti SEP untuk **kunjungan yang sudah ada** (tab Ubah Penjamin).
 * Reuse langkah SEP dari pendaftaran kunjungan-baru; langkah ADAPTIF per unit:
 *   RJ BPJS → Rujukan → SEP → Review · IGD/RI → SEP → Review.
 * Submit → POST /kunjungan/:id/penjamin (ganti penjamin + terbitkan/ganti SEP, supersede lama).
 */
export function UbahPenjaminSepModal({
  patient, kunjungan, bpjsData, onClose, onIssued,
}: {
  patient: PatientMaster;
  kunjungan: KunjunganRecord;
  bpjsData: BpjsData;
  onClose: () => void;
  onIssued: (k: KunjunganDTO) => void;
}) {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const { session } = useSession();
  const operatorNama = session?.namaTampil ?? "Operator Loket";

  const reviewUnit = UNIT_MAP[kunjungan.unit] ?? "Rawat Jalan";
  const needsRujukan = reviewUnit === "Rawat Jalan";
  const isRanap = reviewUnit === "Rawat Inap";
  const isIgd = reviewUnit === "IGD";
  const penjaminTipe = bpjsData.jenis === "PBI" ? "BPJS_PBI" : "BPJS_Non_PBI";

  const [terbitSep, setTerbitSep] = useState(true);
  const [rujukan, setRujukan] = useState<RujukanPick>({ source: "masuk", noRujukan: "", diagnosa: null });
  const [sepDraft, setSepDraft] = useState<SepDraft>(() => ({
    ...BLANK_DRAFT,
    noKartu: bpjsData.noKartu,
    namaPeserta: bpjsData.nama,
    klsRawatHak: KLS_MAP[bpjsData.kelas] ?? "2",
    jenisPeserta: bpjsData.jenis,
    jnsPelayanan: isRanap ? "1" : "2",
    tglSep: today,
    noMR: patient.noRM,
    noTelp: patient.noHp ?? "",
    ppkPelayanan: "0107R001",
    poliTujuan: needsRujukan ? (kunjungan.poli ?? "") : "",
    diagAwal: kunjungan.kodeICD?.split(",")[0]?.trim() ?? "",
    user: operatorNama,
    // Unit internal (IGD/RI) → rujukan INTERNAL RS otomatis (Faskes 2). IGD tetap SEP RJ.
    ...(!needsRujukan ? { asalRujukan: "2" as const, tglRujukan: today, ppkRujukan: "0107R001" } : {}),
  }));

  const steps = useMemo<WizardStep[]>(() => {
    const s: WizardStep[] = [];
    if (needsRujukan) s.push({ id: "rujukan", label: "Rujukan" });
    s.push({ id: "sep", label: "SEP" });
    s.push({ id: "review", label: "Review" });
    return s;
  }, [needsRujukan]);

  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [created, setCreated] = useState<KunjunganDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sepReject, setSepReject] = useState<{ code: string; message: string; field?: string } | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  const submitAbort = useRef<AbortController | null>(null);
  useEffect(() => () => submitAbort.current?.abort(), []);

  const safeIdx = Math.min(stepIdx, steps.length - 1);
  const current = steps[safeIdx].id;
  const isLast = safeIdx === steps.length - 1;
  const sepStepIdx = steps.findIndex((s) => s.id === "sep");

  const canNext = useMemo(() => {
    if (current === "rujukan") return rujukan.noRujukan.length > 0 && rujukan.diagnosa !== null;
    return true;
  }, [current, rujukan]);

  const nextHint = !canNext && current === "rujukan" ? "Isi No. Rujukan dan pilih diagnosa (ICD-10)." : null;

  const goNext = () => {
    if (!canNext) return;
    setSubmitError(null); setSepReject(null);
    const target = Math.min(safeIdx + 1, steps.length - 1);
    // Masuk step SEP → seed field turunan rujukan (RJ) lalu bebas diedit operator.
    if (steps[target].id === "sep" && needsRujukan) {
      setSepDraft((s) => ({
        ...s,
        noRujukan: rujukan.noRujukan,
        diagAwal: rujukan.diagnosa?.code ?? s.diagAwal,
        asalRujukan: rujukan.source === "kontrol" ? "2" : "1",
        tglRujukan: s.tglRujukan || today,
        poliTujuan: kunjungan.poli ?? s.poliTujuan,
      }));
    }
    setDir(1); setStepIdx(target);
  };
  const goBack = () => { setSubmitError(null); setSepReject(null); setDir(-1); setStepIdx(Math.max(safeIdx - 1, 0)); };

  // Review objects (bentuk daftar-kunjungan) — reuse StepReview tanpa fork.
  const reviewForm: KunjunganForm = {
    unit: reviewUnit,
    tanggal: kunjungan.tanggal,
    jam: "",
    caraMasuk: "Datang Sendiri",
    dokter: kunjungan.dokter && kunjungan.dokter !== "—" ? kunjungan.dokter : "",
    keluhan: kunjungan.keluhan ?? "",
    triase: null,
    poli: kunjungan.poli ?? "",
    poliRuanganId: "",
    asalMasuk: "—",
    kelasRawat: sepDraft.klsRawatHak || "2",
    kelasKamar: "",
    ruanganId: "",
    ruanganNama: kunjungan.ruangan ?? "",
    dpjpId: "",
    dpjpNama: kunjungan.dokter && kunjungan.dokter !== "—" ? kunjungan.dokter : "",
    bedId: "",
    bedNama: "",
  };
  const reviewPenjamin: PenjaminFormState = {
    tipe: penjaminTipe,
    nama: PENJAMIN_CFG[penjaminTipe].label,
    nomor: bpjsData.noKartu,
    kelas: (sepDraft.klsRawatHak as PenjaminFormState["kelas"]) || "",
    noPolis: "",
  };

  async function submit(force = false) {
    setSubmitError(null); setSepReject(null); setSubmitting(true);
    const controller = new AbortController();
    submitAbort.current = controller;
    try {
      const input = buildChangePenjaminInput({
        penjaminTipe, issueSep: terbitSep, sepDraft,
        rujukan: needsRujukan ? rujukan : null, needsRujukan,
        noKartu: bpjsData.noKartu, forceSep: force,
      });
      const { kunjungan: updated } = await changePenjamin(kunjungan.id, input, controller.signal);
      if (updated.sepError) {
        toast.error("SEP belum terbit", `${updated.sepError.message} — penjamin tetap diperbarui`);
      } else {
        toast.success(
          "Penjamin diperbarui",
          updated.sep?.noSep ? `SEP ${updated.sep.noSep} terbit` : `Kunjungan ${updated.noKunjungan}`,
        );
      }
      setCreated(updated); setDone(true); onIssued(updated);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof ApiError) {
        const sr = (err.details as { sepReject?: { code: string; message: string; field?: string } } | undefined)?.sepReject;
        if (sr) {
          setSepReject(sr);
          if (sepStepIdx >= 0 && safeIdx !== sepStepIdx) { setDir(-1); setStepIdx(sepStepIdx); }
          toast.error("SEP ditolak BPJS", sr.message);
          return;
        }
        const fe = err.fieldErrors();
        setSubmitError(fe.length ? `${err.message}: ${fe.map((f) => f.message).join(", ")}` : err.message);
        toast.error("Gagal ubah penjamin", err.message);
      } else {
        setSubmitError("Gagal memperbarui penjamin. Periksa koneksi lalu coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const navBtn =
    "flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40";

  return (
    <>
      <ModalShell
        title="Ubah Penjamin — Penerbitan SEP"
        subtitle={`${patient.name} · ${kunjungan.noKunjungan} · ${reviewUnit}`}
        onClose={onClose}
        size="2xl"
      >
        {done && created ? (
          <SuccessView created={created} onClose={onClose} onCetakSep={() => setShowPrint(true)} />
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden" style={{ minHeight: 480 }}>
            <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <WizardStepper steps={steps} currentIdx={safeIdx} />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={current}
                  custom={dir}
                  variants={SLIDE_VARIANTS}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  {current === "rujukan" && (
                    <StepRujukan
                      patientId={patient.id}
                      noBpjs={bpjsData.noKartu || patient.penjamin.nomor || "—"}
                      rujukan={rujukan}
                      setRujukan={setRujukan}
                    />
                  )}
                  {current === "sep" && (
                    <StepSEP patientId={patient.id} draft={sepDraft} setDraft={setSepDraft} terbitSep={terbitSep} setTerbitSep={setTerbitSep} forceInternalRujukan={isIgd} />
                  )}
                  {current === "review" && (
                    <StepReview form={reviewForm} penjamin={reviewPenjamin} isBpjsFlow terbitSep={terbitSep} rujukan={needsRujukan ? rujukan : null} draft={sepDraft} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* SEP ditolak BPJS → tetap simpan (tangguhkan SEP) ATAU revisi */}
            {sepReject && (
              <div className="shrink-0 px-6 pt-1">
                <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                      <AlertTriangle size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-amber-800">SEP ditolak BPJS · kode {sepReject.code}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-amber-700">
                        {sepReject.message}
                        {sepReject.field && SEP_FIELD_LABEL[sepReject.field] && (
                          <> — periksa <span className="font-semibold">{SEP_FIELD_LABEL[sepReject.field]}</span> di langkah SEP.</>
                        )}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => submit(true)}
                          disabled={submitting}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                        >
                          {submitting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Tetap Simpan (SEP ditangguhkan)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setSepReject(null); if (sepStepIdx >= 0) { setDir(-1); setStepIdx(sepStepIdx); } }}
                          disabled={submitting}
                          className="cursor-pointer rounded-lg border border-amber-300 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-50 active:scale-95 disabled:opacity-60"
                        >
                          Revisi Dulu
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {submitError && (
              <div className="shrink-0 px-6">
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            <div className="flex shrink-0 items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
              {safeIdx > 0 ? (
                <button type="button" onClick={goBack} disabled={submitting} className={cn(navBtn, "cursor-pointer")}>
                  <ChevronLeft size={13} /> Kembali
                </button>
              ) : (
                <button type="button" onClick={onClose} disabled={submitting} className={cn(navBtn, "cursor-pointer")}>
                  Batal
                </button>
              )}
              <span className="flex-1 text-center text-[10px] text-slate-400">
                {nextHint
                  ? <span className="font-medium text-amber-600">{nextHint}</span>
                  : `Langkah ${safeIdx + 1} dari ${steps.length}`}
              </span>
              {isLast ? (
                <button
                  type="button"
                  onClick={() => submit()}
                  disabled={submitting}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70 active:scale-[0.98]"
                >
                  {submitting
                    ? <><Loader2 size={13} className="animate-spin" /> Menyimpan…</>
                    : <><CheckCircle2 size={13} /> {terbitSep ? "Terbitkan SEP" : "Simpan Penjamin"}</>}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-5 py-2 text-xs font-bold transition",
                    canNext
                      ? "cursor-pointer bg-sky-600 text-white shadow-sm shadow-sky-200/70 hover:bg-sky-700 active:scale-95"
                      : "cursor-not-allowed bg-slate-100 text-slate-400",
                  )}
                >
                  Lanjut <ChevronRight size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </ModalShell>

      {showPrint && created && <SepPrintModal kunjungan={created} onClose={() => setShowPrint(false)} />}
    </>
  );
}

// ── Success ───────────────────────────────────────────────────
const PENJAMIN_LABEL: Record<string, string> = {
  Umum: "Umum / Mandiri", BPJS_Non_PBI: "BPJS Non-PBI", BPJS_PBI: "BPJS PBI",
  Asuransi: "Asuransi", Jamkesda: "Jamkesda",
};

function SuccessView({
  created, onClose, onCetakSep,
}: {
  created: KunjunganDTO;
  onClose: () => void;
  onCetakSep: () => void;
}) {
  const sep = created.sep;
  const sepError = created.sepError;
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-12 text-center" style={{ minHeight: 440 }}>
      <motion.div
        initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50"
      >
        <CheckCircle2 size={28} className="text-emerald-600" strokeWidth={2.5} />
      </motion.div>
      <div>
        <p className="text-lg font-black text-slate-900">Penjamin Diperbarui</p>
        <p className="mt-1 text-sm text-slate-500">{created.pasien.nama} · {created.poli ?? created.unit}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2 rounded-2xl bg-slate-50 px-6 py-5 text-left ring-1 ring-slate-200">
        <Row label="No. Kunjungan" value={created.noKunjungan} />
        <Row label="Penjamin" value={PENJAMIN_LABEL[created.penjaminTipe] ?? created.penjaminTipe} />
        {sep?.noSep && <Row label="No. SEP" value={sep.noSep} highlight />}
      </div>

      {sep?.noSep && (
        <p className="flex max-w-xs items-center justify-center gap-1.5 text-xs text-sky-600">
          <FileText size={12} /> SEP baru berhasil diterbitkan (SEP lama digantikan).
        </p>
      )}

      {sepError && (
        <div className="flex w-full max-w-xs items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-left">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="text-[11px] leading-relaxed text-amber-700">
            <p className="font-bold">SEP belum terbit ({sepError.code}).</p>
            <p>{sepError.message}. Penjamin tetap diperbarui — terbitkan SEP nanti dari menu BPJS setelah data diperbaiki.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        {sep?.noSep && (
          <button
            onClick={onCetakSep}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
          >
            <Printer size={15} /> Cetak SEP
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 active:scale-[0.98]"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className={cn("font-mono text-xs font-semibold", highlight ? "text-sky-600" : "text-slate-700")}>{value}</span>
    </div>
  );
}
