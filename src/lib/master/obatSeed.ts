/**
 * Seed Katalog Obat — data otoritatif awal untuk DB `master.obat`.
 *
 * Dikonsumsi HANYA oleh prisma/scripts/seed-obat.mts (bukan runtime aplikasi).
 * Aplikasi membaca obat dari DB via API (`@/lib/api/master/obat`). File ini =
 * "rumah" data (dulu OBAT_MOCK), dipisah agar mock runtime bisa dihapus.
 *
 * - `id` = seedKey (obt-xxx) → di-remap ke UUID saat seed; juga dipakai me-remap
 *   `lasaPairIds` (soft-ref antar obat).
 * - `kode` TIDAK di-seed — auto-generate `OBT-<YYMM><NNN>` oleh seed script + Service.
 * - `kodeFornas` = kode Fornas BPJS (hanya obat tertanggung) — bukan ATC.
 * - `kfaCode` (opsional) = pointer POA ke KFA_MOCK → script men-derive KfaMapping
 *   (POA/POV/Rute/Bentuk + BZA) untuk kolom JSONB `kfa` (interop FHIR SatuSehat).
 */

import type { ObatRecord } from "./obatMock";

export type ObatSeedRecord = Omit<ObatRecord, "kode"> & {
  /** Pointer ke KFA_MOCK.kfaCode (POA) — derive KfaMapping saat seed. */
  kfaCode?: string;
};

export const OBAT_SEED: ObatSeedRecord[] = [
  // ── Antibiotik ──
  { id: "obt-001", namaGenerik: "Amoxicillin-Clavulanic Acid", namaDagang: "Augmentin", pabrik: "GSK", kategori: "Antibiotik", bentuk: "Tablet", kekuatan: "625 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 8500, het: 11000, kodeFornas: "J01CR02", bpjsCoverage: true, batasResepPerKunjungan: 21, status: "Aktif", kfaCode: "936220010",
    indikasi: "Infeksi saluran nafas atas/bawah, infeksi saluran kemih, infeksi kulit & jaringan lunak.",
    kontraindikasi: "Hipersensitif terhadap penisilin/sefalosporin. Riwayat jaundice akibat amoxicillin-clavulanic.",
    dosisDewasa: "1 tablet 625mg setiap 8 jam selama 5-7 hari.",
    dosisAnak: "25-45 mg/kgBB/hari dibagi 2-3 dosis.",
    efekSamping: "Diare, mual, ruam kulit, kandidiasis." },
  { id: "obt-002", namaGenerik: "Ceftriaxone", namaDagang: "Cefriex", pabrik: "Sanbe", kategori: "Antibiotik", bentuk: "Injeksi", kekuatan: "1 g", satuanTerkecil: "Vial", rute: "IV", isFormularium: true, isHAM: false, golongan: "Keras_G", isColdChain: false, hargaSatuan: 38000, het: 45000, kodeFornas: "J01DD04", bpjsCoverage: true, status: "Aktif", kfaCode: "936220020",
    indikasi: "Infeksi berat (sepsis, meningitis, pneumonia, infeksi intraabdomen).",
    dosisDewasa: "1-2 g IV/IM sekali sehari (atau 2× sehari pada infeksi berat)." },
  { id: "obt-003", namaGenerik: "Azithromycin", namaDagang: "Zithromax", pabrik: "Pfizer", kategori: "Antibiotik", bentuk: "Tablet", kekuatan: "500 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 18500, kodeFornas: "J01FA10", bpjsCoverage: true, status: "Aktif", kfaCode: "936220030" },
  { id: "obt-004", namaGenerik: "Ciprofloxacin", namaDagang: "Ciproxin", pabrik: "Bayer", kategori: "Antibiotik", bentuk: "Tablet", kekuatan: "500 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 6500, kodeFornas: "J01MA02", bpjsCoverage: true, status: "Aktif", kfaCode: "936220040" },

  // ── Analgesik ──
  { id: "obt-010", namaGenerik: "Paracetamol", namaDagang: "Sanmol", pabrik: "Sanbe", kategori: "Analgesik", bentuk: "Tablet", kekuatan: "500 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Bebas", hargaSatuan: 850, het: 1200, kodeFornas: "N02BE01", bpjsCoverage: true, status: "Aktif", kfaCode: "936210001",
    indikasi: "Nyeri ringan-sedang, demam.",
    dosisDewasa: "500 mg-1 g setiap 4-6 jam (max 4 g/hari).",
    dosisAnak: "10-15 mg/kgBB setiap 4-6 jam." },
  { id: "obt-011", namaGenerik: "Ibuprofen", namaDagang: "Proris", pabrik: "Pharos", kategori: "Analgesik", bentuk: "Tablet", kekuatan: "400 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Bebas_Terbatas", hargaSatuan: 1200, kodeFornas: "M01AE01", bpjsCoverage: true, status: "Aktif", kfaCode: "936230010" },
  { id: "obt-012", namaGenerik: "Morfin Sulfat", namaDagang: "MST", pabrik: "Kimia Farma", kategori: "Analgesik", bentuk: "Injeksi", kekuatan: "10 mg/ml", satuanTerkecil: "Ampul", rute: "IV", isFormularium: true, isHAM: true, golongan: "Narkotika_II", isRestricted: true, isLASA: true, lasaPairIds: ["obt-013"], hargaSatuan: 65000, kodeFornas: "N02AA01", bpjsCoverage: true, status: "Aktif", kfaCode: "936230020",
    indikasi: "Nyeri berat (kanker, post-operasi mayor, MI akut).",
    kontraindikasi: "Depresi nafas, asma akut, ileus paralitik, peningkatan TIK.",
    dosisDewasa: "2.5-10 mg IV/IM/SC setiap 4 jam, titrasi.",
    catatanKhusus: "WAJIB double-check 2 perawat sebelum administer. Catat di register narkotika." },
  { id: "obt-013", namaGenerik: "Fentanil", namaDagang: "Durogesic", pabrik: "Janssen", kategori: "Analgesik", bentuk: "Injeksi", kekuatan: "50 mcg/ml", satuanTerkecil: "Ampul", rute: "IV", isFormularium: true, isHAM: true, golongan: "Narkotika_II", isRestricted: true, isLASA: true, lasaPairIds: ["obt-012"], hargaSatuan: 85000, kodeFornas: "N02AB03", bpjsCoverage: true, status: "Aktif" },

  // ── Antihipertensi ──
  { id: "obt-020", namaGenerik: "Captopril", namaDagang: "Capoten", pabrik: "Indofarma", kategori: "Antihipertensi", bentuk: "Tablet", kekuatan: "25 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 750, kodeFornas: "C09AA02", bpjsCoverage: true, status: "Aktif", kfaCode: "936240020" },
  { id: "obt-021", namaGenerik: "Losartan", namaDagang: "Cozaar", pabrik: "MSD", kategori: "Antihipertensi", bentuk: "Tablet", kekuatan: "50 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 3200, kodeFornas: "C09CA01", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-022", namaGenerik: "Amlodipine", namaDagang: "Norvask", pabrik: "Pfizer", kategori: "Antihipertensi", bentuk: "Tablet", kekuatan: "10 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 2100, kodeFornas: "C08CA01", bpjsCoverage: true, status: "Aktif", kfaCode: "936240010" },

  // ── Kardiovaskular ──
  { id: "obt-030", namaGenerik: "Asam Asetilsalisilat (Aspilet)", namaDagang: "Aspilet", pabrik: "Medifarma", kategori: "Kardiovaskular", bentuk: "Tablet", kekuatan: "80 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Bebas_Terbatas", hargaSatuan: 1500, kodeFornas: "B01AC06", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-031", namaGenerik: "Bisoprolol", namaDagang: "Concor", pabrik: "Merck", kategori: "Kardiovaskular", bentuk: "Tablet", kekuatan: "5 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 4200, kodeFornas: "C07AB07", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-032", namaGenerik: "Enoxaparin", namaDagang: "Lovenox", pabrik: "Sanofi", kategori: "Kardiovaskular", bentuk: "Injeksi", kekuatan: "60 mg/0.6ml", satuanTerkecil: "Ampul", rute: "SC", isFormularium: true, isHAM: true, isColdChain: true, golongan: "Keras_G", hargaSatuan: 145000, kodeFornas: "B01AB05", bpjsCoverage: true, status: "Aktif",
    indikasi: "Profilaksis & terapi DVT/PE, sindrom koroner akut.",
    catatanKhusus: "Simpan 2-8°C. WAJIB cek dosis berdasarkan BB & fungsi ginjal." },
  { id: "obt-033", namaGenerik: "Furosemide", namaDagang: "Lasix", pabrik: "Sanofi", kategori: "Kardiovaskular", bentuk: "Tablet", kekuatan: "40 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 950, kodeFornas: "C03CA01", bpjsCoverage: true, status: "Aktif", kfaCode: "936270020" },

  // ── Antidiabetik ──
  { id: "obt-040", namaGenerik: "Metformin", namaDagang: "Glucophage", pabrik: "Merck", kategori: "Antidiabetik", bentuk: "Tablet", kekuatan: "500 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 1100, kodeFornas: "A10BA02", bpjsCoverage: true, status: "Aktif", kfaCode: "936250010" },
  { id: "obt-041", namaGenerik: "Insulin Reguler (Actrapid)", namaDagang: "Actrapid", pabrik: "Novo Nordisk", kategori: "Antidiabetik", bentuk: "Injeksi", kekuatan: "100 IU/ml", satuanTerkecil: "Vial", rute: "SC", isFormularium: true, isHAM: true, isColdChain: true, isLASA: true, lasaPairIds: ["obt-042"], golongan: "Keras_G", hargaSatuan: 175000, kodeFornas: "A10AB01", bpjsCoverage: true, status: "Aktif", kfaCode: "936250020",
    catatanKhusus: "Simpan 2-8°C. HAM — double-check dosis & kecepatan drip." },
  { id: "obt-042", namaGenerik: "Insulin Glargine", namaDagang: "Lantus", pabrik: "Sanofi", kategori: "Antidiabetik", bentuk: "Injeksi", kekuatan: "100 IU/ml", satuanTerkecil: "Vial", rute: "SC", isFormularium: false, isHAM: true, isColdChain: true, isLASA: true, lasaPairIds: ["obt-041"], golongan: "Keras_G", hargaSatuan: 285000, bpjsCoverage: false, status: "Aktif" },

  // ── Saluran Cerna ──
  { id: "obt-050", namaGenerik: "Omeprazole", namaDagang: "Losec", pabrik: "AstraZeneca", kategori: "Saluran_Cerna", bentuk: "Kapsul", kekuatan: "20 mg", satuanTerkecil: "Kapsul", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 1850, kodeFornas: "A02BC01", bpjsCoverage: true, status: "Aktif", kfaCode: "936260010" },
  { id: "obt-051", namaGenerik: "Metoclopramide", namaDagang: "Primperan", pabrik: "Sanofi", kategori: "Saluran_Cerna", bentuk: "Tablet", kekuatan: "10 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 1450, kodeFornas: "A03FA01", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-052", namaGenerik: "Ondansetron", namaDagang: "Zofran", pabrik: "Novartis", kategori: "Saluran_Cerna", bentuk: "Injeksi", kekuatan: "4 mg/2ml", satuanTerkecil: "Ampul", rute: "IV", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 9500, kodeFornas: "A04AA01", bpjsCoverage: true, status: "Aktif", kfaCode: "936260020" },

  // ── Saluran Nafas ──
  { id: "obt-060", namaGenerik: "Salbutamol", namaDagang: "Ventolin", pabrik: "GSK", kategori: "Saluran_Nafas", bentuk: "Inhaler", kekuatan: "100 mcg/dosis", satuanTerkecil: "Pcs", rute: "Inhalasi", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 55000, kodeFornas: "R03AC02", bpjsCoverage: true, status: "Aktif", kfaCode: "936270010" },
  { id: "obt-061", namaGenerik: "Ipratropium Bromide", namaDagang: "Atrovent", pabrik: "Boehringer Ingelheim", kategori: "Saluran_Nafas", bentuk: "Cairan", kekuatan: "250 mcg/ml", satuanTerkecil: "Botol", rute: "Inhalasi", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 28500, kodeFornas: "R03BB04", bpjsCoverage: true, status: "Aktif" },

  // ── Neurologi ──
  { id: "obt-070", namaGenerik: "Fenitoin", namaDagang: "Dilantin", pabrik: "Pfizer", kategori: "Neurologi", bentuk: "Tablet", kekuatan: "100 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: true, isHAM: false, golongan: "Keras_G", hargaSatuan: 2150, kodeFornas: "N03AB02", bpjsCoverage: true, status: "Aktif" },
  { id: "obt-071", namaGenerik: "Diazepam", namaDagang: "Valium", pabrik: "Roche", kategori: "Neurologi", bentuk: "Injeksi", kekuatan: "10 mg/2ml", satuanTerkecil: "Ampul", rute: "IV", isFormularium: true, isHAM: true, isRestricted: true, golongan: "Psikotropika_IV", hargaSatuan: 12500, kodeFornas: "N03AE01", bpjsCoverage: true, status: "Aktif",
    catatanKhusus: "Psikotropika — catat di register. Sediakan resusitasi karena risiko depresi nafas." },

  // ── Vitamin & Cairan ──
  { id: "obt-080", namaGenerik: "NaCl 0.9%", namaDagang: "Otsuka NaCl", pabrik: "Otsuka", kategori: "Vitamin_Cairan", bentuk: "Cairan", kekuatan: "500 ml", satuanTerkecil: "Botol", rute: "IV", isFormularium: true, isHAM: false, golongan: "Bebas", hargaSatuan: 15000, kodeFornas: "B05BB01", bpjsCoverage: true, status: "Aktif", kfaCode: "936280010" },
  { id: "obt-081", namaGenerik: "Ringer Laktat", namaDagang: "Otsuka RL", pabrik: "Otsuka", kategori: "Vitamin_Cairan", bentuk: "Cairan", kekuatan: "500 ml", satuanTerkecil: "Botol", rute: "IV", isFormularium: true, isHAM: false, golongan: "Bebas", hargaSatuan: 16500, kodeFornas: "B05BA03", bpjsCoverage: true, status: "Aktif", kfaCode: "936280011" },
  { id: "obt-082", namaGenerik: "Vitamin C", namaDagang: "Cernevit", pabrik: "Baxter", kategori: "Vitamin_Cairan", bentuk: "Tablet", kekuatan: "500 mg", satuanTerkecil: "Tablet", rute: "PO", isFormularium: false, isHAM: false, golongan: "Bebas", hargaSatuan: 850, bpjsCoverage: false, status: "Aktif" },
];
