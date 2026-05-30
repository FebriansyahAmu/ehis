// ANT-ONSITE — Tipe state wizard kiosk APM (shared antar step + orchestrator).

import type { AntreanRecord, CaraBayar, JenisPasienAntrean } from "@/lib/antrean/types";

export type ApmStep =
  | "welcome"
  | "cari"
  | "inputBaru"
  | "penjamin"
  | "poliDokter"
  | "struk";

/** Pasien yang sedang diproses di kiosk (hasil cari / draft baru). */
export interface ApmPasien {
  noRM?: string;        // ada bila Lama / draft baru sudah dapat norm
  nik: string;
  nama: string;
  tglLahir?: string;    // display id ("DD Month YYYY") atau ISO
  kontak?: string;
  tempatLahir?: string;
}

/** Rujukan terpilih (ringkas dari RujukanRecord). */
export interface ApmRujukan {
  noRujukan: string;
  poliKode: string;
  poliNama: string;
  diagnosa: string;
  asalRujukan: string;
  berlakuSampai: string;
}

export interface ApmWizardState {
  step: ApmStep;
  jenisPasien: JenisPasienAntrean | null;
  pasien: ApmPasien | null;
  caraBayar: CaraBayar | null;
  noKartu?: string;
  rujukan: ApmRujukan | null;
  poliKode?: string;
  kodedokter?: string;
  /** hasil akhir setelah Ambil Antrean. */
  result: AntreanRecord | null;
}

export const INITIAL_WIZARD: ApmWizardState = {
  step: "welcome",
  jenisPasien: null,
  pasien: null,
  caraBayar: null,
  noKartu: undefined,
  rujukan: null,
  poliKode: undefined,
  kodedokter: undefined,
  result: null,
};
