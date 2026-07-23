"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSession } from "@/contexts/SessionContext";
import type { PatientMaster } from "@/lib/data";
import { emitTask, setStatus } from "@/lib/antrean/antreanStore";
import { registerKunjungan, type KunjunganDTO } from "@/lib/api/kunjungan";
import { getPatientNoKartu } from "@/lib/api/patients";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/ui/toastStore";
import {
  BLANK_DRAFT, SLIDE_VARIANTS,
  type SepDraft, type BpjsData,
} from "@/components/registration/kunjungan/Tabs/sep/sepTypes";
import { ModalShell } from "../primitives";
import { PENJAMIN_CFG } from "../config";
import { WizardStepper } from "./daftar-kunjungan/WizardStepper";
import { StepKunjungan } from "./daftar-kunjungan/StepKunjungan";
import { StepPenjamin } from "./daftar-kunjungan/StepPenjamin";
import { StepRujukan } from "./daftar-kunjungan/StepRujukan";
import { StepSEP } from "./daftar-kunjungan/StepSEP";
import { StepReview } from "./daftar-kunjungan/StepReview";
import { SuccessPanel } from "./daftar-kunjungan/SuccessPanel";
import { SepPrintModal } from "./daftar-kunjungan/SepCetak";
import { buildRegisterInput } from "./daftar-kunjungan/daftarKunjunganApi";
import { KelasMismatchDialog, type KelasDecision } from "./daftar-kunjungan/KelasMismatchDialog";
import {
  isBpjs, HAK_TO_RIKELAS,
  type KunjunganForm, type PenjaminForm, type RujukanPick, type WizardStep, type SpriDpjpHint,
} from "./daftar-kunjungan/config";

// id pasien DB = UUID v7; pasien demo/seed = "RM-2025-..." → hanya UUID yang bisa ke API.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Label field penyebab penolakan SEP (BpjsMetaError.field) → teks yang dikenali operator.
const SEP_FIELD_LABEL: Record<string, string> = {
  noTelp: "No. Telepon",
  diagAwal: "Diagnosa Awal (ICD-10)",
  skdpNoSurat: "No. Referensi SPRI",
  noKartu: "No. Kartu BPJS",
  ppkPelayanan: "Kode PPK Pelayanan",
};

export function DaftarKunjunganModal({
  patient,
  onClose,
  kodebooking,
  onRegistered,
  initial,
  spriDpjp,
}: {
  patient: PatientMaster;
  onClose: () => void;
  /** ANT4 — bila dipicu dari Respon Kedatangan antrean: link + emit task 3. */
  kodebooking?: string;
  /** Dipanggil setelah kunjungan tersimpan → dashboard refresh Riwayat + Jaminan. */
  onRegistered?: (kunjungan: KunjunganDTO) => void;
  /** Seed awal form (mis. admisi dari SPRI → unit Rawat Inap). Default = Rawat Jalan. */
  initial?: Partial<KunjunganForm>;
  /** DPJP yang ditetapkan SPRI (admisi RI) → peringatan bila operator pilih DPJP berbeda. */
  spriDpjp?: SpriDpjpHint;
}) {
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);
  const { session } = useSession(); // sesi SSR-seed (ModuleLayout) → nama operator SEP = user login

  const operatorNama = session?.namaTampil ?? "Operator Loket";

  const [form, setForm] = useState<KunjunganForm>({
    unit: "Rawat Jalan", tanggal: today, jam: nowTime, caraMasuk: "Datang Sendiri",
    dokter: "", keluhan: "", triase: null,
    poli: "Poli Umum", poliRuanganId: "", asalMasuk: "Dari Poli", kelasRawat: "2", kelasKamar: "",
    ruanganId: "", ruanganNama: "", dpjpId: "", dpjpNama: "",
    bedId: "", bedNama: "",
    ...initial,
  });

  const [penjamin, setPenjamin] = useState<PenjaminForm>({
    tipe: patient.penjamin.tipe,
    nama: PENJAMIN_CFG[patient.penjamin.tipe].label,
    nomor: patient.penjamin.nomor ?? "",
    kelas: (patient.penjamin.kelas as PenjaminForm["kelas"]) ?? "",
    noPolis: patient.penjamin.noPolis ?? "",
  });

  const [bpjsData, setBpjsData] = useState<BpjsData | null>(null);
  // Terbitkan SEP saat pendaftaran (true) atau tangguhkan/buat nanti (false). Hanya relevan BPJS.
  const [terbitSep, setTerbitSep] = useState(true);
  const [rujukan, setRujukan] = useState<RujukanPick>({ source: "masuk", noRujukan: "", diagnosa: null });
  const [sepDraft, setSepDraft] = useState<SepDraft>(() => ({
    ...BLANK_DRAFT,
    noMR: patient.noRM,
    tglSep: today,
    jnsPelayanan: "2",
    ppkPelayanan: "0107R001",
    // No. telepon dari data pasien (wajib utk SEP). Operator boleh ubah di form.
    noTelp: patient.noHp ?? "",
    user: operatorNama, // nama user login (server tetap otoritatif saat terbit — anti-spoof)
  }));

  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [created, setCreated] = useState<KunjunganDTO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // SEP DITOLAK BPJS (data tak lengkap / peserta non-aktif) → tawarkan "Tetap daftarkan" / "Revisi".
  const [sepReject, setSepReject] = useState<{ code: string; message: string; field?: string } | null>(null);
  const [showPrint, setShowPrint] = useState(false);
  // No. Kartu BPJS PENUH dari DB (un-mask) → prefill Verifikasi Kepesertaan (Step Penjamin).
  // Ditarik saat modal buka (pasien DB) supaya operator tinggal "Cari Kepesertaan".
  const [prefilledNoKartu, setPrefilledNoKartu] = useState<string | undefined>(undefined);
  const submitAbort = useRef<AbortController | null>(null);

  // Batalkan request in-flight saat unmount (anti memory leak / set-state-after-unmount).
  useEffect(() => () => submitAbort.current?.abort(), []);

  // Prefetch No. Kartu penuh (pasien DB) — sudah ter-insert saat daftar IGD/RJ/RI sebelumnya.
  useEffect(() => {
    if (!UUID_RE.test(patient.id)) return;
    const ac = new AbortController();
    getPatientNoKartu(patient.id, ac.signal)
      .then(({ noKartu }) => { if (noKartu) setPrefilledNoKartu(noKartu); })
      .catch(() => { /* abaikan → fallback nomor masked dari DTO pasien */ });
    return () => ac.abort();
  }, [patient.id]);

  const bpjsFlow = isBpjs(penjamin.tipe);
  const needsRujukan = bpjsFlow && form.unit === "Rawat Jalan";
  const isDbPatient = UUID_RE.test(patient.id);

  // ── Konfirmasi kelas RI (hanya BPJS): kamar terpilih ≠ hak kelas → dialog Titipan/Beda kelas ──
  const hakRIKelas = bpjsFlow && penjamin.kelas ? HAK_TO_RIKELAS[penjamin.kelas] : "";
  const kelasMismatch =
    form.unit === "Rawat Inap" && !!hakRIKelas && !!form.kelasKamar && hakRIKelas !== form.kelasKamar;
  const [kelasDialogOpen, setKelasDialogOpen] = useState(false);
  const kelasAckRef = useRef(false);           // sudah dikonfirmasi → jangan tampilkan ulang
  const kelasDecisionRef = useRef<KelasDecision | null>(null); // {titipan, alasan}
  const pendingForceRef = useRef(false);        // nilai `force` yang tertunda saat dialog terbuka
  // Reset konfirmasi bila kamar/hak kelas berubah → wajib konfirmasi ulang.
  useEffect(() => { kelasAckRef.current = false; kelasDecisionRef.current = null; }, [form.kelasKamar, penjamin.kelas]);

  const steps = useMemo<WizardStep[]>(() => {
    const s: WizardStep[] = [
      { id: "kunjungan", label: "Kunjungan" },
      { id: "penjamin", label: "Penjamin" },
    ];
    if (needsRujukan) s.push({ id: "rujukan", label: "Rujukan" });
    if (bpjsFlow) s.push({ id: "sep", label: "SEP" });
    s.push({ id: "review", label: "Review" });
    return s;
  }, [bpjsFlow, needsRujukan]);

  const safeIdx = Math.min(stepIdx, steps.length - 1);
  const current = steps[safeIdx].id;
  const isLast = safeIdx === steps.length - 1;

  const canNext = useMemo(() => {
    if (current === "penjamin") {
      if (bpjsFlow) return !!bpjsData;
      if (penjamin.tipe === "Asuransi" || penjamin.tipe === "Jamkesda") return penjamin.nama.trim().length > 0;
    }
    if (current === "rujukan") return rujukan.noRujukan.length > 0 && rujukan.diagnosa !== null;
    return true;
  }, [current, bpjsFlow, bpjsData, penjamin, rujukan]);

  // Pesan validasi yang JELAS untuk tombol Lanjut yang ter-disable.
  const nextHint = useMemo(() => {
    if (canNext) return null;
    if (current === "penjamin") {
      return bpjsFlow
        ? "Verifikasi kepesertaan BPJS dulu (cek No. Kartu / NIK)."
        : "Lengkapi nama penjamin.";
    }
    if (current === "rujukan") return "Isi No. Rujukan dan pilih diagnosa (ICD-10).";
    return "Lengkapi data yang diperlukan.";
  }, [canNext, current, bpjsFlow]);

  const goNext = () => {
    if (!canNext) return;
    setSubmitError(null);
    setSepReject(null);
    const target = Math.min(safeIdx + 1, steps.length - 1);
    // Seed field SEP turunan-kunjungan saat masuk step SEP (lalu bebas diedit operator).
    if (steps[target].id === "sep") {
      const isRanap = form.unit === "Rawat Inap";
      const isIgd = form.unit === "IGD";
      // IGD & Rawat Inap = rujukan INTERNAL RS (bukan FKTP). IGD tetap SEP Rawat Jalan.
      const internalRujukan = isRanap || isIgd;
      setSepDraft((s) => ({
        ...s,
        jnsPelayanan: isRanap ? "1" : "2",
        tglSep: form.tanggal,
        noMR: patient.noRM,
        // Rujukan & poli (Rawat Jalan BPJS) dari step Rujukan.
        ...(needsRujukan
          ? {
              noRujukan: rujukan.noRujukan,
              diagAwal: rujukan.diagnosa?.code ?? "",
              asalRujukan: rujukan.source === "kontrol" ? ("2" as const) : ("1" as const),
              tglRujukan: s.tglRujukan || form.tanggal,
              poliTujuan: form.poli,
            }
          : {}),
        // Rujukan INTERNAL (IGD gawat darurat / IGD → RI). t_sep tetap butuh blok rujukan, tapi
        // asal = RS sendiri (Faskes 2), tgl = tgl sistem, PPK = faskes RS sendiri. No. rujukan
        // auto-gen & diagAwal (diagnosa utama) diisi saat build payload — lihat TECH_DEBT.
        ...(internalRujukan
          ? {
              asalRujukan: "2" as const,
              tglRujukan: s.tglRujukan || form.tanggal,
              ppkRujukan: s.ppkRujukan || s.ppkPelayanan,
              poliTujuan: "",
            }
          : {}),
      }));
    }
    setDir(1);
    setStepIdx(target);
  };
  const goBack = () => { setSubmitError(null); setSepReject(null); setDir(-1); setStepIdx(Math.max(safeIdx - 1, 0)); };

  const sepStepIdx = steps.findIndex((s) => s.id === "sep");
  const kunjStepIdx = steps.findIndex((s) => s.id === "kunjungan");

  /** `force` true = "Tetap daftarkan walau SEP error" (kunjungan dibuat, SEP ditangguhkan). */
  // Gate: konfirmasi kelas RI (BPJS) bila kamar ≠ hak → dialog Titipan/Beda kelas dulu.
  async function handleDaftar(force = false) {
    if (kelasMismatch && !kelasAckRef.current) {
      pendingForceRef.current = force;
      setKelasDialogOpen(true);
      return;
    }
    return doSubmit(force);
  }

  // Hasil dialog konfirmasi kelas → simpan keputusan (titipan/alasan) lalu lanjut submit.
  function onKelasConfirm(d: KelasDecision) {
    kelasAckRef.current = true;
    kelasDecisionRef.current = d;
    setKelasDialogOpen(false);
    void doSubmit(pendingForceRef.current);
  }

  async function doSubmit(force = false) {
    // Guard pre-submit dengan pesan jelas (hindari error server membingungkan).
    if (!isDbPatient) {
      setSubmitError("Pasien demo tidak dapat didaftarkan ke server. Gunakan pasien hasil pendaftaran.");
      return;
    }

    setSubmitError(null);
    setSepReject(null);
    setSubmitting(true);
    const controller = new AbortController();
    submitAbort.current = controller;
    try {
      const input = buildRegisterInput({
        patientId: patient.id, form, penjamin, rujukan, sepDraft,
        issueSep: bpjsFlow && terbitSep, needsRujukan, noKartu: bpjsData?.noKartu, forceSep: force,
        titipan: kelasDecisionRef.current?.titipan, titipanAlasan: kelasDecisionRef.current?.alasan,
      });
      const { kunjungan, message } = await registerKunjungan(input, controller.signal);
      if (kunjungan.sepError) {
        toast.error("SEP belum terbit", `${kunjungan.sepError.message} — kunjungan tetap terdaftar`);
      } else {
        toast.success(
          message ?? "Kunjungan terdaftar",
          kunjungan.sep?.noSep ? `SEP ${kunjungan.sep.noSep} terbit` : `No. ${kunjungan.noKunjungan}`,
        );
      }
      // ANT4 (mock antrean — backend antrean belum ada): teruskan status booking.
      if (kodebooking) { emitTask(kodebooking, 3); setStatus(kodebooking, "MenungguPoli"); }
      setCreated(kunjungan);
      setDone(true);
      onRegistered?.(kunjungan); // dashboard refresh Riwayat + Jaminan (jaminan ikut kunjungan terakhir)
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return; // dibatalkan
      if (err instanceof ApiError) {
        // SEP DITOLAK BPJS → JANGAN tutup modal; arahkan ke step SEP + tawarkan pilihan.
        const sr = (err.details as { sepReject?: { code: string; message: string; field?: string } } | undefined)?.sepReject;
        if (sr) {
          setSepReject(sr);
          if (sepStepIdx >= 0 && safeIdx !== sepStepIdx) { setDir(-1); setStepIdx(sepStepIdx); }
          toast.error("SEP ditolak BPJS", sr.message);
          return;
        }
        const fe = err.fieldErrors();
        setSubmitError(fe.length ? `${err.message}: ${fe.map((f) => f.message).join(", ")}` : err.message);
        toast.error("Gagal mendaftarkan kunjungan", err.message);
      } else {
        setSubmitError("Gagal mendaftarkan kunjungan. Periksa koneksi lalu coba lagi.");
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
        title="Pendaftaran Kunjungan Baru"
        subtitle={`${patient.name} · ${patient.noRM}`}
        onClose={onClose}
        size="2xl"
      >
        {done && created ? (
          <SuccessPanel
            created={created}
            kodebooking={kodebooking}
            onClose={onClose}
            onCetakSep={() => setShowPrint(true)}
          />
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden" style={{ minHeight: 520 }}>
            {/* Stepper */}
            <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <WizardStepper steps={steps} currentIdx={safeIdx} />
            </div>

            {/* Step content */}
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
                  {current === "kunjungan" && <StepKunjungan form={form} setForm={setForm} spriDpjp={spriDpjp} />}
                  {current === "penjamin" && (
                    <StepPenjamin
                      patient={patient}
                      penjamin={penjamin}
                      setPenjamin={setPenjamin}
                      bpjsData={bpjsData}
                      setBpjsData={setBpjsData}
                      setSepDraft={setSepDraft}
                      prefilledNoKartu={prefilledNoKartu}
                    />
                  )}
                  {current === "rujukan" && (
                    <StepRujukan
                      patientId={patient.id}
                      noBpjs={penjamin.nomor || bpjsData?.noKartu || patient.penjamin.nomor || "—"}
                      rujukan={rujukan}
                      setRujukan={setRujukan}
                    />
                  )}
                  {current === "sep" && (
                    <StepSEP patientId={patient.id} draft={sepDraft} setDraft={setSepDraft} terbitSep={terbitSep} setTerbitSep={setTerbitSep} forceInternalRujukan={form.unit === "IGD"} />
                  )}
                  {current === "review" && (
                    <StepReview form={form} penjamin={penjamin} isBpjsFlow={bpjsFlow} terbitSep={terbitSep} rujukan={needsRujukan ? rujukan : null} draft={sepDraft} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* SEP ditolak BPJS → tetap daftarkan (tangguhkan SEP) ATAU revisi dulu */}
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
                          onClick={() => handleDaftar(true)}
                          disabled={submitting}
                          className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-60"
                        >
                          {submitting ? <Loader2 size={12} className="animate-spin" /> : <CalendarPlus size={12} />}
                          Tetap Daftarkan (SEP ditangguhkan)
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

            {/* Error & validation banners */}
            {(submitError || (isLast && !isDbPatient)) && (
              <div className="shrink-0 px-6">
                <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700 ring-1 ring-rose-200">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span>{submitError ?? "Pasien demo tidak dapat didaftarkan ke server."}</span>
                </div>
              </div>
            )}

            {/* Footer nav */}
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
                {!canNext && nextHint
                  ? <span className="font-medium text-amber-600">{nextHint}</span>
                  : `Langkah ${safeIdx + 1} dari ${steps.length}`}
              </span>
              {isLast ? (
                <button
                  type="button"
                  onClick={() => handleDaftar()}
                  disabled={submitting}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-70 active:scale-[0.98]"
                >
                  {submitting
                    ? <><Loader2 size={13} className="animate-spin" /> Mendaftarkan…</>
                    : <><CalendarPlus size={13} /> {bpjsFlow && terbitSep ? "Daftarkan & Terbitkan SEP" : "Daftarkan Kunjungan"}</>}
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

      {showPrint && created && (
        <SepPrintModal kunjungan={created} onClose={() => setShowPrint(false)} />
      )}

      <KelasMismatchDialog
        open={kelasDialogOpen}
        hakKelas={hakRIKelas}
        kamarKelas={form.kelasKamar}
        busy={submitting}
        onConfirm={onKelasConfirm}
        onCancel={() => {
          setKelasDialogOpen(false);
          // "Perbaiki Kamar" → kembali ke langkah Kunjungan untuk ganti ruangan/bed.
          if (kunjStepIdx >= 0) { setDir(-1); setStepIdx(kunjStepIdx); }
        }}
      />
    </>
  );
}
