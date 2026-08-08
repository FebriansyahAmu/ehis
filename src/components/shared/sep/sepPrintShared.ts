// Kontrak cetak SEP — data ternormalisasi + builder, dipakai SEMUA gate cetak SEP
// (pendaftaran kunjungan baru · ubah penjamin · tab Cetak Dokumen · modul BPJS) agar
// tampilan SEP KONSISTEN 1:1 dengan format resmi BPJS Kesehatan.

import type { KunjunganDTO } from "@/lib/api/kunjungan";

// ── Label maps (kode internal → teks form SEP) ────────────────────────────────
const JNS_RAWAT: Record<string, string> = { RawatJalan: "Rawat Jalan", RawatInap: "Rawat Inap" };
const TUJUAN_KUNJ: Record<string, string> = { Normal: "Normal", Prosedur: "Prosedur", KonsulDokter: "Konsul Dokter" };
const KLS_ROMAN: Record<string, string> = { "1": "I", "2": "II", "3": "III" };
const KLS_NAIK: Record<string, string> = {
  "1": "VVIP", "2": "VIP", "3": "Kelas I", "4": "Kelas II", "5": "Kelas III", "6": "ICCU", "7": "ICU", "8": "Di Atas Kelas I",
};
const PENJAMIN_SEGMEN: Record<string, string> = {
  BPJS_Non_PBI: "Non-PBI", BPJS_PBI: "PBI (APBN/APBD)", Umum: "Umum", Asuransi: "Asuransi", Jamkesda: "Jamkesda",
};

// ── Format tanggal (dd-mm-yyyy) ───────────────────────────────────────────────
export function fmtDMY(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "-";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}

/** dd-mm-yyyy HH:MM:SS (baris "Cetakan Ke"). */
export function fmtCetakStamp(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// ── Data ternormalisasi (semua string siap-render, mirror field form SEP) ─────
export interface SepPrintData {
  rsNama:        string;
  noSep:         string;
  tglSep:        string;
  noKartu:       string;
  noRm:          string;
  namaPeserta:   string;
  tglLahir:      string;
  kelamin:       string;
  noTelepon:     string;
  subSpesialis:  string;
  dokter:        string;
  faskesPerujuk: string;
  diagAwalKode:  string;
  diagAwalNama:  string;
  catatan:       string;
  peserta:       string;
  jnsRawat:      string;
  jnsKunjungan:  string;
  prosedur:      string;
  assesmentPlyn: string;
  poliPerujuk:   string;
  kelasHak:      string;
  kelasRawat:    string;
  penjamin:      string;
  cetakanKe:     number;
  cetakAt:       string;
}

const dash = (v: string | null | undefined) => (v && v.trim() ? v : "-");

export interface BuildSepOpts {
  rsNama:        string;
  dpjpNama?:     string; // dari master Dokter (resolusi klien)
  spesialisLabel?: string;
  cetakanKe?:    number;
}

/** KunjunganDTO (hasil pendaftaran/detail) → SepPrintData. null bila tak ada SEP. */
export function buildSepPrintDataFromKunjungan(k: KunjunganDTO, opts: BuildSepOpts): SepPrintData | null {
  const sep = k.sep;
  if (!sep) return null;

  // Faskes perujuk: rujukan eksternal (ppk ≠ ppk kita) → kode faskes; internal/RI/tanpa
  // rujukan → nama RS (sesuai perilaku SEP internal pada contoh PDF).
  const isInternalRef = !k.rujukan?.ppkRujukan || k.rujukan.ppkRujukan === sep.ppkPelayanan;
  const faskesPerujuk = isInternalRef ? opts.rsNama : (k.rujukan?.ppkRujukan ?? opts.rsNama);

  // Kelas rawat = kelas naik (bila naik kelas) else hak.
  const kelasRawatRoman = sep.naikKelas && sep.klsRawatNaik
    ? (KLS_NAIK[sep.klsRawatNaik] ?? `Kelas ${sep.klsRawatNaik}`)
    : sep.klsRawatHak ? `Kelas ${KLS_ROMAN[sep.klsRawatHak] ?? sep.klsRawatHak}` : "-";

  return {
    rsNama:        opts.rsNama,
    noSep:         dash(sep.noSep),
    tglSep:        fmtDMY(sep.tglSep),
    noKartu:       dash(sep.noKartu),
    noRm:          dash(sep.noMr ?? k.pasien.noRm),
    namaPeserta:   dash(k.pasien.nama),
    tglLahir:      fmtDMY(k.pasien.tanggalLahir),
    kelamin:       k.pasien.gender === "L" ? "Laki-laki" : k.pasien.gender === "P" ? "Perempuan" : "-",
    noTelepon:     dash(sep.noTelp),
    subSpesialis:  dash(opts.spesialisLabel ?? k.poli),
    dokter:        dash(opts.dpjpNama),
    faskesPerujuk: faskesPerujuk,
    diagAwalKode:  dash(sep.diagAwal ?? k.rujukan?.diagnosaKode),
    diagAwalNama:  k.rujukan?.diagnosaNama ?? k.diagnosaMasuk ?? "",
    catatan:       sep.catatan ?? "",
    peserta:       PENJAMIN_SEGMEN[k.penjaminTipe] ?? k.penjaminTipe,
    jnsRawat:      JNS_RAWAT[sep.jnsPelayanan] ?? sep.jnsPelayanan,
    jnsKunjungan:  TUJUAN_KUNJ[sep.tujuanKunj] ?? sep.tujuanKunj,
    prosedur:      "Tidak ada",
    assesmentPlyn: "Tidak ada",
    poliPerujuk:   k.rujukan?.poliTujuan ?? "0",
    kelasHak:      sep.klsRawatHak ? `KELAS ${KLS_ROMAN[sep.klsRawatHak] ?? sep.klsRawatHak}` : "-",
    kelasRawat:    kelasRawatRoman,
    penjamin:      "",
    cetakanKe:     opts.cetakanKe ?? 1,
    cetakAt:       fmtCetakStamp(),
  };
}
