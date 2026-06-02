"use client";

import { useState, useMemo } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { PatientMaster, KunjunganRecord } from "@/lib/data";
import { addKunjungan } from "@/lib/registration/registrationStore";
import type { PendaftaranKunjunganInput } from "@/lib/registration/types";
import { emitTask, setStatus } from "@/lib/antrean/antreanStore";
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
import {
  genSEP, isBpjs,
  type KunjunganForm, type PenjaminForm, type RujukanPick, type WizardStep,
} from "./daftar-kunjungan/config";

export function DaftarKunjunganModal({
  patient,
  onClose,
  kodebooking,
}: {
  patient: PatientMaster;
  onClose: () => void;
  /** ANT4 — bila dipicu dari Respon Kedatangan antrean: link + emit task 3. */
  kodebooking?: string;
}) {
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [form, setForm] = useState<KunjunganForm>({
    unit: "Rawat Jalan", tanggal: today, jam: nowTime, caraMasuk: "Datang Sendiri",
    dokter: "", keluhan: "", triase: 3, caraDatang: "Jalan Kaki",
    poli: "Poli Umum", asalMasuk: "Dari Poli", kelasRawat: "2",
  });

  const [penjamin, setPenjamin] = useState<PenjaminForm>({
    tipe: patient.penjamin.tipe,
    nama: PENJAMIN_CFG[patient.penjamin.tipe].label,
    nomor: patient.penjamin.nomor ?? "",
    kelas: (patient.penjamin.kelas as PenjaminForm["kelas"]) ?? "",
    noPolis: patient.penjamin.noPolis ?? "",
  });

  const [bpjsData, setBpjsData] = useState<BpjsData | null>(null);
  const [rujukan, setRujukan] = useState<RujukanPick>({ source: "masuk", noRujukan: "", diagnosa: null });
  const [sepDraft, setSepDraft] = useState<SepDraft>(() => ({
    ...BLANK_DRAFT,
    noMR: patient.noRM,
    tglSep: today,
    jnsPelayanan: "2",
    ppkPelayanan: "0107R001",
    user: "Operator Loket",
  }));

  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [done, setDone] = useState(false);
  const [created, setCreated] = useState<KunjunganRecord | null>(null);

  const bpjsFlow = isBpjs(penjamin.tipe);
  const needsRujukan = bpjsFlow && form.unit === "Rawat Jalan";

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

  const goNext = () => {
    if (!canNext) return;
    const target = Math.min(safeIdx + 1, steps.length - 1);
    // Seed field SEP turunan-kunjungan saat masuk step SEP (lalu bebas diedit operator).
    if (steps[target].id === "sep") {
      setSepDraft((s) => ({
        ...s,
        jnsPelayanan: form.unit === "Rawat Inap" ? "1" : "2",
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
      }));
    }
    setDir(1);
    setStepIdx(target);
  };
  const goBack = () => { setDir(-1); setStepIdx(Math.max(safeIdx - 1, 0)); };

  function handleDaftar() {
    const noSEP = bpjsFlow ? genSEP() : undefined;
    // Rawat Jalan BPJS → no. rujukan & diagnosa dari step Rujukan.
    const noRujukan = needsRujukan ? rujukan.noRujukan || undefined : undefined;
    const input: PendaftaranKunjunganInput = {
      unit: form.unit,
      tanggal: form.tanggal,
      dokter: form.dokter.trim() || "—",
      keluhan: form.keluhan.trim(),
      caraMasuk: form.caraMasuk,
      poli: form.unit === "Rawat Jalan" ? form.poli : undefined,
      kelas: form.unit === "Rawat Inap" ? form.kelasRawat : undefined,
      triase: form.unit === "IGD" ? form.triase : undefined,
      penjamin: PENJAMIN_CFG[penjamin.tipe].label,
      noPenjamin: penjamin.nomor || undefined,
      noSEP,
      noRujukan,
      diagnosa: needsRujukan ? rujukan.diagnosa?.name : undefined,
      kodeICD: needsRujukan ? rujukan.diagnosa?.code : undefined,
      kodebooking,
    };
    const rec = addKunjungan(patient.noRM, input);
    if (kodebooking) {
      emitTask(kodebooking, 3);
      setStatus(kodebooking, "MenungguPoli");
    }
    setCreated(rec);
    setDone(true);
  }

  const navBtn =
    "flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-95";

  return (
    <ModalShell
      title="Pendaftaran Kunjungan Baru"
      subtitle={`${patient.name} · ${patient.noRM}`}
      onClose={onClose}
      size="2xl"
    >
      {done && created ? (
        <SuccessPanel created={created} kodebooking={kodebooking} onClose={onClose} />
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
                {current === "kunjungan" && <StepKunjungan form={form} setForm={setForm} />}
                {current === "penjamin" && (
                  <StepPenjamin
                    patient={patient}
                    penjamin={penjamin}
                    setPenjamin={setPenjamin}
                    bpjsData={bpjsData}
                    setBpjsData={setBpjsData}
                    setSepDraft={setSepDraft}
                  />
                )}
                {current === "rujukan" && (
                  <StepRujukan
                    noBpjs={penjamin.nomor || bpjsData?.noKartu || patient.penjamin.nomor || "—"}
                    rujukan={rujukan}
                    setRujukan={setRujukan}
                  />
                )}
                {current === "sep" && <StepSEP draft={sepDraft} setDraft={setSepDraft} />}
                {current === "review" && (
                  <StepReview form={form} penjamin={penjamin} isBpjsFlow={bpjsFlow} rujukan={needsRujukan ? rujukan : null} draft={sepDraft} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer nav */}
          <div className="flex shrink-0 items-center gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-3.5">
            {safeIdx > 0 ? (
              <button type="button" onClick={goBack} className={cn(navBtn, "cursor-pointer")}>
                <ChevronLeft size={13} /> Kembali
              </button>
            ) : (
              <button type="button" onClick={onClose} className={cn(navBtn, "cursor-pointer")}>
                Batal
              </button>
            )}
            <span className="flex-1 text-center text-[10px] text-slate-400">
              Langkah {safeIdx + 1} dari {steps.length}
            </span>
            {isLast ? (
              <button
                type="button"
                onClick={handleDaftar}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
              >
                <CalendarPlus size={13} />
                {bpjsFlow ? "Daftarkan & Terbitkan SEP" : "Daftarkan Kunjungan"}
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
  );
}
