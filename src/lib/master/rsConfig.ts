/**
 * Profil RS — placeholder konstanta sebelum modul Profil RS (Tier 4) dibangun.
 *
 * Data identitas RS Induk (nama, kode, alamat). Dipakai sebagai seed root
 * Organization di Unified Tree `/ehis-master/ruangan`.
 *
 * Saat Profil RS dibangun: pindahkan ke DB + expose via API / server component.
 * Modul lain tetap import dari sini agar migrasi cukup 1 file.
 *
 * Catatan: konfigurasi integrasi SatuSehat (Org_id root, API kredensial)
 * dikelola di modul terpisah `/ehis-fhir` — TIDAK di sini.
 */
export const RS_PROFIL = {
  nama: "RS Harapan Sehat",
  kode: "RSHS",
  telp: "021-555-0000",
  email: "info@rsharapansehat.id",
  alamat: {
    jalan: "Jl. Harapan Sehat No. 1",
    kelurahan: "Kebon Sirih",
    kecamatan: "Menteng",
    kota: "Jakarta Pusat",
    provinsi: "DKI Jakarta",
    kodePos: "10340",
    kodeWilayah: "3171010001",
  },
} as const;

/** Pseudo-ID node tree untuk RS root. */
export const RS_ROOT_ID = "rs-root";
