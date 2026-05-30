"use client";

// ANT-ONSITE — Orchestrator kiosk APM. State machine wizard + jembatan ke
// antreanStore (createAntrean/checkin) & registrationStore (addPatient/addKunjungan).
//
// Alur (lihat docs/FLOW-RJ-ONSITE.md):
//   welcome → [Lama: cari | Baru: inputBaru] → penjamin → poliDokter → struk
//   Ambil Antrean:
//     Lama → createAntrean + (BPJS auto-SEP) + kunjungan + checkin (T3, MenungguPoli)
//     Baru → createAntrean + checkin (T1, MenungguAdmisi) → menunggu loket admisi

import { useCallback, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { createAntrean, checkin } from "@/lib/antrean/antreanStore";
import {
  DOKTER_ONSITE,
  estimasiDilayani,
  getPoli,
} from "@/lib/antrean/onsiteMock";
import { addPatient, addKunjungan } from "@/lib/registration/registrationStore";
import type { PatientMaster } from "@/lib/data";
import { ApmShell } from "./ApmShell";
import { PasienRingkasanPanel } from "./PasienRingkasanPanel";
import { ApmKeyboardProvider } from "./keyboard/ApmKeyboardProvider";
import { ApmKeyboard } from "./keyboard/ApmKeyboard";
import { useFullscreen } from "./useFullscreen";
import {
  INITIAL_WIZARD,
  type ApmPasien,
  type ApmRujukan,
  type ApmStep,
  type ApmWizardState,
} from "./apmTypes";
import { StepWelcome } from "./steps/StepWelcome";
import { StepCariPasien } from "./steps/StepCariPasien";
import { StepInputBaru, type InputBaruValue } from "./steps/StepInputBaru";
import { StepPenjamin, type PenjaminValue } from "./steps/StepPenjamin";
import { StepPoliDokter } from "./steps/StepPoliDokter";
import { StepStruk } from "./steps/StepStruk";

// ── Reducer ────────────────────────────────────────────────

type Action =
  | { type: "reset" }
  | { type: "goto"; step: ApmStep }
  | { type: "patch"; patch: Partial<ApmWizardState> };

function reducer(state: ApmWizardState, action: Action): ApmWizardState {
  switch (action.type) {
    case "reset":
      return INITIAL_WIZARD;
    case "goto":
      return { ...state, step: action.step };
    case "patch":
      return { ...state, ...action.patch };
  }
}

// ── Helpers ────────────────────────────────────────────────

/** Jenis kelamin dari NIK (digit 7-8 = tanggal; +40 = perempuan). Fallback "L". */
function genderFromNik(nik: string): "L" | "P" {
  const dd = parseInt(nik.slice(6, 8), 10);
  if (Number.isNaN(dd)) return "L";
  return dd > 40 ? "P" : "L";
}

function genSEP(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `SEP-${ymd}-${seq}`;
}

function patientToPasien(p: PatientMaster): ApmPasien {
  return {
    noRM: p.noRM,
    nik: p.nik,
    nama: p.name,
    tglLahir: p.tanggalLahir,
    kontak: p.noHp,
    tempatLahir: p.tempatLahir,
  };
}

const BACK_MAP: Partial<Record<ApmStep, ApmStep>> = {
  cari: "welcome",
  inputBaru: "welcome",
  penjamin: "welcome", // di-override dinamis di handler
  poliDokter: "penjamin",
};

const IDLE_MS = 120_000;

// ── Component ──────────────────────────────────────────────

export default function ApmKioskPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, INITIAL_WIZARD);
  const { isFullscreen, toggle: toggleFullscreen, enter: enterFullscreen } = useFullscreen();

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  // Auto-reset kiosk setelah idle (kecuali di layar mulai).
  useEffect(() => {
    if (state.step === "welcome") return;
    const t = setTimeout(reset, IDLE_MS);
    return () => clearTimeout(t);
  }, [state, reset]);

  // ── Step handlers ────────────────────────────────────────

  const handleChooseJenis = (jenis: "Lama" | "Baru") => {
    // Tap pertama = user gesture → masuk fullscreen (browser tak izinkan auto saat load).
    enterFullscreen();
    dispatch({
      type: "patch",
      patch: { jenisPasien: jenis, step: jenis === "Lama" ? "cari" : "inputBaru" },
    });
  };

  const handleFoundLama = (p: PatientMaster) => {
    dispatch({
      type: "patch",
      patch: { jenisPasien: "Lama", pasien: patientToPasien(p), step: "penjamin" },
    });
  };

  // Pasien baru benar-benar baru → draft minimal (dilengkapi di loket admisi).
  const handleProceedNew = (value: InputBaruValue) => {
    // TODO(REG): set dataLengkap:false saat field tersedia di schema.
    const created = addPatient({
      nik: value.nik,
      name: value.nama,
      gender: genderFromNik(value.nik),
      tanggalLahir: value.tglLahir,
      tempatLahir: value.tempatLahir,
      alamat: "-",
      kota: "-",
      provinsi: "-",
      noHp: value.noHp,
      kontakDarurat: { nama: "-", hubungan: "-", noHp: "-" },
      sumber: "Walk-in",
    });
    dispatch({
      type: "patch",
      patch: { pasien: patientToPasien(created), step: "penjamin" },
    });
  };

  // NIK ternyata sudah terdaftar → alihkan ke jalur Lama (cegah double-MRN).
  const handleProceedExisting = (p: PatientMaster) => {
    dispatch({
      type: "patch",
      patch: { jenisPasien: "Lama", pasien: patientToPasien(p), step: "penjamin" },
    });
  };

  const handlePenjamin = (value: PenjaminValue) => {
    dispatch({
      type: "patch",
      patch: {
        caraBayar: value.caraBayar,
        noKartu: value.noKartu,
        rujukan: value.rujukan,
        // Poli rujukan jadi pilihan awal → panel ringkasan langsung sinkron.
        poliKode: value.rujukan?.poliKode,
        kodedokter: undefined,
        step: "poliDokter",
      },
    });
  };

  // Sinkronkan pilihan poli/dokter ke wizard state agar panel ringkasan live.
  const handlePoliDokterChange = (poliKode?: string, kodedokter?: string) => {
    dispatch({ type: "patch", patch: { poliKode, kodedokter } });
  };

  const handleAmbilAntrean = (poliKode: string, kodedokter: string) => {
    const poli = getPoli(poliKode);
    const dokter = DOKTER_ONSITE.find((d) => d.kode === kodedokter);
    const { pasien, caraBayar, jenisPasien } = state;
    if (!poli || !dokter || !pasien || !caraBayar || !jenisPasien) return;

    const est = estimasiDilayani(dokter, caraBayar);
    const rec = createAntrean({
      jenisPasien,
      sumber: "Onsite",
      caraBayar,
      pasien: {
        noRM: pasien.noRM,
        nik: pasien.nik,
        nama: pasien.nama,
        tglLahir: pasien.tglLahir,
        kontak: pasien.kontak,
      },
      noKartu: state.noKartu,
      noRujukan: state.rujukan?.noRujukan,
      poli: poli.nama,
      kodepoli: poli.kode,
      dokter: dokter.nama,
      kodedokter: dokter.kode,
      estimasiDilayani: est,
    });

    if (jenisPasien === "Lama" && pasien.noRM) {
      // Auto-terbit kunjungan RJ di APM (+ SEP bila BPJS), skip loket.
      addKunjungan(pasien.noRM, {
        unit: "Rawat Jalan",
        dokter: dokter.nama,
        keluhan: state.rujukan?.diagnosa ?? "",
        poli: poli.nama,
        penjamin: caraBayar === "BPJS" ? "BPJS" : "Umum/Mandiri",
        noPenjamin: state.noKartu,
        noSEP: caraBayar === "BPJS" ? genSEP() : undefined,
        noRujukan: state.rujukan?.noRujukan,
        kodebooking: rec.kodebooking,
      });
    }
    // checkin: Lama → T3 (MenungguPoli) · Baru → T1 (MenungguAdmisi)
    checkin(rec.kodebooking);

    dispatch({ type: "patch", patch: { result: rec, step: "struk" } });
  };

  // ── Back / reset ─────────────────────────────────────────

  const handleBack = () => {
    if (state.step === "penjamin") {
      dispatch({ type: "goto", step: state.jenisPasien === "Lama" ? "cari" : "inputBaru" });
      return;
    }
    const prev = BACK_MAP[state.step];
    if (prev) dispatch({ type: "goto", step: prev });
  };

  const canBack = state.step !== "welcome" && state.step !== "struk";

  // ── Render ───────────────────────────────────────────────

  const renderStep = () => {
    switch (state.step) {
      case "welcome":
        return <StepWelcome onChoose={handleChooseJenis} onExit={() => router.push("/ehis-antrian")} />;
      case "cari":
        return <StepCariPasien onFound={handleFoundLama} onSwitchToBaru={() => handleChooseJenis("Baru")} />;
      case "inputBaru":
        return <StepInputBaru onProceedNew={handleProceedNew} onProceedExisting={handleProceedExisting} />;
      case "penjamin":
        return state.pasien ? (
          <StepPenjamin pasien={state.pasien} jenisPasien={state.jenisPasien!} onSubmit={handlePenjamin} />
        ) : null;
      case "poliDokter":
        return state.caraBayar ? (
          <StepPoliDokter
            caraBayar={state.caraBayar}
            rujukan={state.rujukan}
            onSelectionChange={handlePoliDokterChange}
            onAmbil={handleAmbilAntrean}
          />
        ) : null;
      case "struk":
        return state.result ? <StepStruk record={state.result} onSelesai={reset} /> : null;
    }
  };

  // Panel ringkasan tampil di samping saat data pasien sudah ada (Penjamin → Poli/Dokter).
  const showPanel = (state.step === "penjamin" || state.step === "poliDokter") && state.pasien !== null;

  return (
    <ApmKeyboardProvider>
      <ApmShell
        step={state.step}
        onReset={reset}
        onBack={handleBack}
        canBack={canBack}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        wide={showPanel}
      >
        {showPanel && state.pasien ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">{renderStep()}</div>
            <PasienRingkasanPanel
              pasien={state.pasien}
              jenisPasien={state.jenisPasien!}
              caraBayar={state.caraBayar}
              noKartu={state.noKartu}
              rujukan={state.rujukan}
              poliKode={state.poliKode}
              kodedokter={state.kodedokter}
            />
          </div>
        ) : (
          renderStep()
        )}
      </ApmShell>
      <ApmKeyboard />
    </ApmKeyboardProvider>
  );
}

export type { ApmRujukan };
