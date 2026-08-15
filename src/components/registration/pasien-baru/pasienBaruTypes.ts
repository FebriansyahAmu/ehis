// Types, options, and validation for Pendaftaran Pasien Baru.
// Mendukung 3 mode identitas: WNI (NIK) · WNA (paspor) · Anonim (Mr.X / pasien tak dikenal).
// Alamat = kode+nama wilayah Kemendagri (master.Wilayah) — flat + kodeWilayah dotted leaf.

/** Mode identitas pasien — menentukan field wajib & jalur dedup di server. */
export type IdentitasMode = "WNI" | "WNA" | "Anonim";

/** Alergi ber-severitas (PMK: reaksi + tingkat) — selaras AlergiInput server. */
export interface AlergiItem { nama: string; reaksi: string; tingkat: string }

export interface FormState {
  identitas: IdentitasMode;

  // ── Step 1 — Identitas ──
  gelarDepan: string; namaLengkap: string; gelarBelakang: string; namaIbu: string;
  nik: string; noKK: string; noPaspor: string;
  tempatLahir: string; tanggalLahir: string;
  perkiraanUmur: string;                 // Anonim — estimasi umur (tahun) → estimasi tgl lahir
  gender: "L" | "P" | "";
  golonganDarah: string; statusPerkawinan: string; agama: string;
  pekerjaan: string; pendidikan: string; suku: string; kewarganegaraan: string;
  catatanIdentitas: string;              // Anonim — ciri fisik / keterangan identitas

  // ── Step 2 — Alamat KTP (wilayah master) ──
  rtRw: string; alamat: string; kodePos: string;
  provinsi: string; kota: string; kecamatan: string; kelurahan: string; kodeWilayah: string;
  // Domisili
  samaAlamat: string;
  alamatDomisili: string; rtRwDomisili: string; kodePosDomisili: string;
  provinsiDomisili: string; kotaDomisili: string; kecamatanDomisili: string; kelurahanDomisili: string; kodeWilayahDomisili: string;

  // ── Step 3 — Kontak & alergi ──
  noHp: string; email: string;
  kontakDaruratNama: string; kontakDaruratHubungan: string; kontakDaruratNoHp: string;
  alergiInput: string; alergiReaksi: string; alergiTingkat: string; alergi: AlergiItem[];
}

export type Errors = Record<string, string>;

export const INITIAL_FORM: FormState = {
  identitas: "WNI",
  gelarDepan: "", namaLengkap: "", gelarBelakang: "", namaIbu: "",
  nik: "", noKK: "", noPaspor: "",
  tempatLahir: "", tanggalLahir: "", perkiraanUmur: "",
  gender: "", golonganDarah: "", statusPerkawinan: "", agama: "",
  pekerjaan: "", pendidikan: "", suku: "", kewarganegaraan: "WNI",
  catatanIdentitas: "",
  rtRw: "", alamat: "", kodePos: "",
  provinsi: "", kota: "", kecamatan: "", kelurahan: "", kodeWilayah: "",
  samaAlamat: "ya",
  alamatDomisili: "", rtRwDomisili: "", kodePosDomisili: "",
  provinsiDomisili: "", kotaDomisili: "", kecamatanDomisili: "", kelurahanDomisili: "", kodeWilayahDomisili: "",
  noHp: "", email: "",
  kontakDaruratNama: "", kontakDaruratHubungan: "", kontakDaruratNoHp: "",
  alergiInput: "", alergiReaksi: "", alergiTingkat: "", alergi: [],
};

export const GOL_DARAH    = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Tidak Diketahui"];
export const AGAMA_OPT    = ["Islam","Kristen Protestan","Kristen Katolik","Hindu","Buddha","Konghucu","Lainnya"];
export const STATUS_NIKAH = ["Belum Menikah","Menikah","Cerai Hidup","Cerai Mati"];
export const PENDIDIKAN   = ["Tidak Sekolah","SD/Sederajat","SMP/Sederajat","SMA/Sederajat","D3/Sederajat","S1/Sederajat","S2+"];
export const HUBUNGAN     = ["Suami","Istri","Ayah","Ibu","Anak","Kakak","Adik","Saudara","Wali","Lainnya"];
export const TINGKAT_ALERGI = ["Ringan","Sedang","Berat"];

// ── Anonim (Mr.Anonym) helper — nama pseudonim untuk pasien tak dikenal ──
// Nama pasien selalu UPPERCASE → pseudonim pun uppercase agar konsisten.
const ANON_RE = /^(TN|NY)\. ANONYM/i;
export const isAnonName = (s: string) => ANON_RE.test(s.trim());
/** "TN. ANONYM-1432" / "NY. ANONYM-1432" (suffix = HHMM saat generate, agar antar-Mr.Anonym terbedakan). */
export function anonName(gender: "L" | "P" | ""): string {
  const prefix = gender === "P" ? "NY. ANONYM" : "TN. ANONYM";
  const suffix = new Date().toTimeString().slice(0, 5).replace(":", "");
  return `${prefix}-${suffix}`;
}

/** Umur terformat dari ISO tgl lahir → "34 tahun 2 bulan" / "8 bulan 12 hari" (bayi). null bila kosong/invalid/masa depan. */
export function formatUmur(iso: string): string | null {
  if (!iso) return null;
  const dob = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  if (dob > now) return null;
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();
  let days = now.getDate() - dob.getDate();
  if (days < 0) { months -= 1; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
  if (months < 0) { years -= 1; months += 12; }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} tahun`);
  if (months > 0) parts.push(`${months} bulan`);
  if (years === 0 && days > 0) parts.push(`${days} hari`);
  return parts.length ? parts.join(" ") : "0 hari";
}

export function validateStep(step: number, f: FormState): Errors {
  const e: Errors = {};
  const anon = f.identitas === "Anonim";
  const wna  = f.identitas === "WNA";

  if (step === 1) {
    if (!f.namaLengkap.trim()) e.namaLengkap = "Nama wajib diisi";
    if (!f.gender)             e.gender      = "Jenis kelamin wajib dipilih";
    if (anon) {
      const u = Number(f.perkiraanUmur);
      if (!f.perkiraanUmur.trim() || Number.isNaN(u) || u <= 0 || u > 140) e.perkiraanUmur = "Perkiraan umur wajib (1–140)";
    } else {
      if (wna) { if (f.noPaspor.trim().length < 4) e.noPaspor = "No. paspor wajib (min 4 karakter)"; }
      else if (f.nik.length !== 16) e.nik = "NIK harus 16 digit angka";
      if (!f.tempatLahir.trim()) e.tempatLahir      = "Tempat lahir wajib diisi";
      if (!f.tanggalLahir)       e.tanggalLahir     = "Tanggal lahir wajib diisi";
      if (!f.statusPerkawinan)   e.statusPerkawinan = "Status perkawinan wajib dipilih";
      if (!f.agama)              e.agama            = "Agama wajib dipilih";
    }
  }

  if (step === 2 && !anon) {
    if (!f.alamat.trim()) e.alamat   = "Alamat KTP wajib diisi";
    if (!f.provinsi)      e.provinsi = "Provinsi wajib dipilih";
    if (!f.kota)          e.kota     = "Kota / kabupaten wajib dipilih";
    if (f.samaAlamat === "tidak") {
      if (!f.alamatDomisili.trim()) e.alamatDomisili = "Alamat domisili wajib diisi";
      if (!f.provinsiDomisili)      e.provinsiDomisili = "Provinsi domisili wajib dipilih";
    }
  }

  if (step === 3 && !anon) {
    if (!f.noHp.trim())              e.noHp                  = "No. HP wajib diisi";
    if (!f.kontakDaruratNama.trim()) e.kontakDaruratNama     = "Nama kontak darurat wajib diisi";
    if (!f.kontakDaruratHubungan)    e.kontakDaruratHubungan = "Hubungan wajib dipilih";
    if (!f.kontakDaruratNoHp.trim()) e.kontakDaruratNoHp     = "No. HP darurat wajib diisi";
  }

  return e;
}
