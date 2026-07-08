// Tipe view-model Resume Medik — SHARED (Rawat Inap · Rawat Jalan). Rumah kanonik; RI
// `pasienPulangShared` me-RE-EXPORT tipe ini agar konsumen lama tak berubah. Dipakai oleh
// agregator (resumeMedikAggregates) + cetak (ResumeMedikCetak) + pane RI/RJ.

export type AsalMasuk = "IGD" | "Poliklinik" | "Transfer RS Lain" | "Langsung";

export interface ObatPulangItem {
  id:        string;
  namaObat:  string;
  dosis:     string;
  frekuensi: string;
  durasi:    string;
  instruksi: string;
  isHAM:     boolean;
  fromResep: boolean;
}

export interface TVVSummaryItem {
  label:        "Masuk" | "Pulang";
  tanggal:      string;
  tekananDarah: string;
  nadi:         number;
  rr:           number;
  suhu:         number;
  spo2:         number;
  gcs:          number;
  kesadaran:    string;
}

export interface HasilLabSummary {
  nama:    string;
  nilai:   string;
  satuan:  string;
  rujukan: string;
  flag:    "normal" | "tinggi" | "rendah" | "kritis";
  tanggal: string;
}

export interface HasilRadSummary {
  jenis:      string;
  tanggal:    string;
  kesimpulan: string;
}

export interface ObatSelamaRawat {
  namaObat:     string;
  dosis:        string;
  rute:         string;
  mulaiTanggal: string;
  akhirTanggal: string;
  isHAM:        boolean;
}

export interface TindakanResume {
  kodeIcd9:     string;
  namaTindakan: string;
  tanggal:      string;
}

export interface ResumeMedikData {
  // Asal masuk — manual (RI). RJ: tak dipakai (kosong).
  asalMasuk:       AsalMasuk | "";
  tanggalMasukIGD: string;
  diagnosisIGD:    string;

  // Auto-aggregated dari tab terkait (domain DB)
  ttvMasuk:         TVVSummaryItem | null;
  ttvPulang:        TVVSummaryItem | null;
  hasilLabAbnormal: HasilLabSummary[];
  hasilRad:         HasilRadSummary[];
  obatSelamaRawat:  ObatSelamaRawat[];
  tindakan:         TindakanResume[];

  // Manual — diisi DPJP / dokter pemeriksa
  kondisiMasuk:    string;
  kondisiPulang:   string;
  ringkasanKlinis: string;

  // Sign-off
  dpjpApproved:   boolean;
  dpjpApprovedAt: string;
  // TTE server (pasien nyata) — serial + penanda tangan, dipakai QR pada cetakan.
  tteToken?:    string | null;
  tteSignedBy?: string | null;
}
