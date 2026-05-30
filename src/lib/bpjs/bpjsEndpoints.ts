/**
 * BPJS Endpoint URL Config.
 *
 * **Single source of truth** untuk semua URL endpoint V-Claim + Aplicares.
 * Jika BPJS ubah path (atau ada koreksi spec), edit di file ini saja —
 * semua adapter auto-pakai URL baru.
 *
 * Reference: [contracts/SEP-Contracts.md] · [contracts/Peserta-Contracts.md]
 * · [contracts/Rujukan-Contracts.md] · [contracts/RencanaKontrol-Contracts.md]
 * · [contracts/Monitoring-Contracts.md].
 *
 * Konvensi:
 * - Endpoint tanpa param: `string` literal
 * - Endpoint berparameter: fungsi `(params) => string`
 * - Grup by domain (peserta · sep · rujukan · monitoring · rk · aplicares)
 *
 * Backend Phase: prepend `baseUrl` dari `BPJS_CREDS_MOCK.vClaimBaseUrl` /
 * `aplicaresBaseUrl` saat real fetch.
 */

import type { JnsPelayananKode } from "./bpjsShared";

// ── V-Claim Endpoints ──────────────────────────────────

export const VCLAIM_ENDPOINTS = {
  // ── Peserta (2 endpoint per Peserta-Contracts.md)
  peserta: {
    byNoKartu: (noKartu: string, tglSEP: string): string =>
      `/Peserta/nokartu/${noKartu}/tglSEP/${tglSEP}`,
    byNik: (nik: string, tglSEP: string): string =>
      `/Peserta/nik/${nik}/tglSEP/${tglSEP}`,
    // Verifikasi alternatif fingerprint
    randomQuestion: (noKartu: string, tglPelayanan: string): string =>
      `/Peserta/RandomQuestion/noKartu/${noKartu}/tglPelayanan/${tglPelayanan}`,
    randomAnswer: "/Peserta/RandomAnswer",
  },

  // ── SEP (16 endpoint per SEP-Contracts.md)
  sep: {
    insert: "/SEP/2.0/insert",
    update: "/SEP/2.0/update",
    delete: "/SEP/2.0/delete",
    getByNo: (noSEP: string): string => `/SEP/${noSEP}`,
    // Suplesi Jasa Raharja
    suplesiCek: (noKartu: string, tglPelayanan: string): string =>
      `/SEP/SuplesiCek/${noKartu}/${tglPelayanan}`,
    dataIndukKecelakaan: (noKartu: string): string =>
      `/SEP/Kll/PesertaSEP/${noKartu}`,
    // Approval Penjamin
    pengajuan: "/SEP/Pengajuan",
    listPersetujuan: (bulan: number, tahun: number): string =>
      `/SEP/Pengajuan/list/bulan/${bulan}/tahun/${tahun}`,
    // Update Tgl Pulang
    updateTglPulang: "/SEP/updtglplg",
    listUpdateTglPulang: (
      bulan: number,
      tahun: number,
      filter: string,
    ): string =>
      `/SEP/UpdTglPlg/list/bulan/${bulan}/tahun/${tahun}/filter/${filter}`,
    // Integrasi INA-CBGs — FIXED per koreksi spec resmi BPJS V-Claim 2.0
    // (sebelumnya: `/SEP/InsertInacbg/{noSEP}` — typo legacy)
    integrasiInacbg: (noSEP: string): string => `/SEP/Inacbg/${noSEP}`,
    // SEP Internal
    internalGet: (noSEP: string): string => `/SEP/internal/${noSEP}`,
    internalDelete: "/SEP/internal/delete",
    // Finger Print
    fingerPrint: (noKartu: string, tglPelayanan: string): string =>
      `/SEP/FingerPrint/Peserta/${noKartu}/TglPelayanan/${tglPelayanan}`,
    listFingerPrint: (tglPelayanan: string): string =>
      `/SEP/FingerPrint/list/tglPelayanan/${tglPelayanan}`,
  },

  // ── Rujukan (Masuk + Keluar + Referensi)
  rujukan: {
    // Rujukan MASUK (dari FKTP/FKRTL ke RS kita) — lookup
    masuk: {
      // FKTP rujukan by noRujukan
      fktp: (noRujukan: string): string => `/Rujukan/${noRujukan}`,
      // FKRTL rujukan by noRujukan
      fkrtl: (noRujukan: string): string => `/Rujukan/RS/${noRujukan}`,
      // List FKTP per peserta
      listFKTPByKartu: (noKartu: string): string =>
        `/Rujukan/List/Peserta/${noKartu}`,
      // List FKRTL per peserta
      listFKRTLByKartu: (noKartu: string): string =>
        `/Rujukan/RS/List/Peserta/${noKartu}`,
    },

    // Rujukan KELUAR (RS kita rujuk ke RS lain) — CRUD per Rujukan-Contracts.md
    keluar: {
      insert: "/Rujukan/2.0/insert",
      update: "/Rujukan/2.0/update",
      // List spesialistik per PPK Rujukan + tgl — endpoint 3
      listSpesialistikPerPPK: (ppkRujukan: string, tglRujukan: string): string =>
        `/Rujukan/ListSpesialistik/PPKRujukan/${ppkRujukan}/TglRujukan/${tglRujukan}`,
      // List Rujukan Keluar periode — endpoint 4
      listKeluar: (tglMulai: string, tglAkhir: string): string =>
        `/Rujukan/Keluar/List/Bulan/${tglMulai}/Tahun/${tglAkhir}`,
      // Detail Rujukan Keluar by NoRujukan — endpoint 5
      detailKeluar: (noRujukan: string): string =>
        `/Rujukan/Keluar/${noRujukan}`,
      // Jumlah SEP per Rujukan — endpoint 6 (jnsRujukan: 1=FKTP, 2=FKRTL)
      jumlahSepPerRujukan: (jnsRujukan: "1" | "2", noRujukan: string): string =>
        `/Rujukan/JumlahSEP/JenisRujukan/${jnsRujukan}/noRujukan/${noRujukan}`,
    },

    // Rujukan Khusus (endpoint 7-9 spec)
    khusus: {
      insert: "/Rujukan/Khusus/Insert",
      delete: "/Rujukan/Khusus/Delete",
      // List Rujukan Khusus per bulan + tahun
      listPerBulanTahun: (bulan: number, tahun: number): string =>
        `/Rujukan/Khusus/list/bulan/${bulan}/tahun/${tahun}`,
    },

    // Pencarian rujukan dari RS dengan rich detail (endpoint 10-12 spec)
    masukDetail: {
      // Spec 10: by NoRujukan — single rich detail
      byNoRujukan: (noRujukan: string): string =>
        `/Rujukan/RS/${noRujukan}`,
      // Spec 11: by NoKartu — single rich detail
      byKartuSingle: (noKartu: string): string =>
        `/Rujukan/Peserta/${noKartu}`,
      // Spec 12: by NoKartu — list rich detail
      listByKartu: (noKartu: string): string =>
        `/Rujukan/Peserta/List/${noKartu}`,
    },

    // Referensi pendukung Rujukan
    referensi: {
      // Rujukan khusus per diagnosa (kasus kronik/onkologi/dll) — referensi
      khususPerDiagnosa: (kdDiag: string, tglPelayanan: string): string =>
        `/referensi/rujukan/khusus/diagnosa/${kdDiag}/tglPelayanan/${tglPelayanan}`,
      // List spesialistik global (referensi master)
      spesialistik: "/referensi/spesialistik",
      // List sarana/faskes by nama + jenis
      faskes: (nama: string, jenisFaskes: "FKTP" | "FKRTL"): string =>
        `/referensi/faskes/${nama}/${jenisFaskes}`,
    },
  },

  // ── Monitoring (4 endpoint per Monitoring-Contracts.md)
  monitoring: {
    // Spec 1: Data Kunjungan — params: tglSEP + jnsPelayanan (1/2)
    kunjungan: (tglSEP: string, jns: JnsPelayananKode): string =>
      `/monitoring/Kunjungan/Tanggal/${tglSEP}/JnsPelayanan/${jns}`,
    // Spec 2: Data Klaim — params: tglPulang + jnsPelayanan + statusKlaim
    // statusKlaim: "1"=Proses Verifikasi, "2"=Pending Verifikasi, "3"=Klaim
    klaim: (
      tglPulang: string,
      jns: JnsPelayananKode,
      statusKlaim: "1" | "2" | "3",
    ): string =>
      `/monitoring/Klaim/Tanggal/${tglPulang}/JnsPelayanan/${jns}/Status/${statusKlaim}`,
    // Spec 3: Data Histori Pelayanan Peserta — params: noKartu + periode
    historiPelayanan: (
      noKartu: string,
      tglMulai: string,
      tglAkhir: string,
    ): string =>
      `/monitoring/HistoriPelayanan/NoKartu/${noKartu}/tglMulai/${tglMulai}/tglAkhir/${tglAkhir}`,
    // Spec 4: Data Klaim Jaminan Jasa Raharja — params: jnsPelayanan + periode
    // (Catatan: signature SEBELUMNYA salah — pakai single tgl. Spec wajib periode.)
    klaimJasaRaharja: (
      jns: JnsPelayananKode,
      tglMulai: string,
      tglAkhir: string,
    ): string =>
      `/monitoring/KlaimJaminanJasaRaharja/JnsPelayanan/${jns}/tglMulai/${tglMulai}/tglAkhir/${tglAkhir}`,
  },

  // ── Rencana Kontrol (11 endpoint per RencanaKontrol-Contracts.md)
  // Spec endpoint 1-5: CRUD RK V2 + SPRI · 6-7: GET detail · 8-9: List · 10-11: Referensi
  rk: {
    // Spec 1: Insert RK V2 (dengan formPRB untuk 9 penyakit kronik)
    insertV2: "/RencanaKontrol/v2/insert",
    // Spec 2: Update RK V2 (dengan formPRB)
    updateV2: "/RencanaKontrol/v2/update",
    // Spec 3: Hapus RK
    delete: "/RencanaKontrol/Delete",
    // Spec 4: Insert SPRI (tanpa formPRB — pakai noKartu bukan noSEP)
    insertSPRI: "/RencanaKontrol/InsertSPRI",
    // Spec 5: Update SPRI (terpisah dari update RK)
    updateSPRI: "/RencanaKontrol/UpdateSPRI",
    // Spec 6: GET SEP untuk keperluan RK by noSEP
    cariSEPUntukRK: (noSEP: string): string =>
      `/RencanaKontrol/nosep/${noSEP}`,
    // Spec 7: GET detail RK by noSuratKontrol (response include formPRB embed)
    cariNoSurat: (noSurat: string): string =>
      `/RencanaKontrol/noSuratKontrol/${noSurat}`,
    // Spec 8: Data RK by No Kartu + bulan + tahun + filter (1=entri, 2=rencana)
    listByKartu: (
      bulan: string,
      tahun: string,
      noKartu: string,
      filter: "1" | "2",
    ): string =>
      `/RencanaKontrol/ListRencanaKontrol/Bulan/${bulan}/Tahun/${tahun}/Nokartu/${noKartu}/filter/${filter}`,
    // Spec 9: Data RK periode (tglAwal-tglAkhir) + filter
    listFiltered: (
      tglAwal: string,
      tglAkhir: string,
      filter: "1" | "2",
    ): string =>
      `/RencanaKontrol/ListRencanaKontrol/tglAwal/${tglAwal}/tglAkhir/${tglAkhir}/filter/${filter}`,
    // Spec 10: Data Poli/Spesialistik untuk RK
    // jnsKontrol: 1=SPRI, 2=RencanaKontrol · nomor: kartu jika SPRI, noSEP jika RK
    poli: (
      jnsKontrol: "1" | "2",
      nomor: string,
      tglRencana: string,
    ): string =>
      `/RencanaKontrol/Poli/JnsKontrol/${jnsKontrol}/Nomor/${nomor}/TglRencana/${tglRencana}`,
    // Spec 11: Data Dokter per poli untuk RK
    dokter: (
      jnsKontrol: "1" | "2",
      kdPoli: string,
      tglRencana: string,
    ): string =>
      `/RencanaKontrol/JadwalPraktekDokter/JnsKontrol/${jnsKontrol}/KdPoli/${kdPoli}/TglRencanaKontrol/${tglRencana}`,
  },
} as const;

// ── Aplicares Endpoints ────────────────────────────────
// Reference: contracts/Aplicares-contracts.md
// Base: {BPJS_CREDS_MOCK.aplicaresBaseUrl} = "https://apijkn.bpjs-kesehatan.go.id/aplicaresws-rest"

export const APLICARES_ENDPOINTS = {
  ref: {
    // Spec 1: GET /ref/kelas — referensi kelas kamar (kodekelas + namakelas)
    kelas: "/ref/kelas",
  },
  bed: {
    // Spec 2: POST /bed/update/{kodeppk} — update ketersediaan tempat tidur
    update: (kodeppk: string): string => `/bed/update/${kodeppk}`,
    // Spec 3: POST /bed/create/{kodeppk} — insert ruangan baru
    create: (kodeppk: string): string => `/bed/create/${kodeppk}`,
    // Spec 4: GET /bed/read/{kodeppk}/{start}/{limit} — baca data ketersediaan (paginated, start=1)
    read: (kodeppk: string, start: number, limit: number): string =>
      `/bed/read/${kodeppk}/${start}/${limit}`,
    // Spec 5: POST /bed/delete/{kodeppk} — hapus ruangan
    delete: (kodeppk: string): string => `/bed/delete/${kodeppk}`,
  },
} as const;
