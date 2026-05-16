// Types, options, and validation for Pendaftaran Pasien Baru

export interface FormState {
  // Step 1 — Identitas
  namaLengkap: string; nik: string; tempatLahir: string; tanggalLahir: string;
  gender: "L" | "P" | ""; golonganDarah: string; statusPerkawinan: string;
  agama: string; pekerjaan: string; pendidikan: string; suku: string; kewarganegaraan: string;
  // Step 2 — Alamat
  rtRw: string;
  alamat: string; kelurahan: string; kecamatan: string;
  kota: string; provinsi: string; kodePos: string;
  samaAlamat: string;
  alamatDomisili: string; kelurahanDomisili: string; kecamatanDomisili: string;
  kotaDomisili: string; provinsiDomisili: string; kodePosDomisili: string;
  // Step 3 — Kontak
  noHp: string; email: string;
  kontakDaruratNama: string; kontakDaruratHubungan: string; kontakDaruratNoHp: string;
  alergiInput: string; alergi: string[];
}

export type Errors = Record<string, string>;

export const INITIAL_FORM: FormState = {
  namaLengkap: "", nik: "", tempatLahir: "", tanggalLahir: "",
  gender: "", golonganDarah: "", statusPerkawinan: "", agama: "",
  pekerjaan: "", pendidikan: "", suku: "", kewarganegaraan: "WNI",
  rtRw: "",
  alamat: "", kelurahan: "", kecamatan: "", kota: "", provinsi: "", kodePos: "",
  samaAlamat: "ya",
  alamatDomisili: "", kelurahanDomisili: "", kecamatanDomisili: "",
  kotaDomisili: "", provinsiDomisili: "", kodePosDomisili: "",
  noHp: "", email: "",
  kontakDaruratNama: "", kontakDaruratHubungan: "", kontakDaruratNoHp: "",
  alergiInput: "", alergi: [],
};

export const GOL_DARAH    = ["A+","A-","B+","B-","AB+","AB-","O+","O-","Tidak Diketahui"];
export const AGAMA_OPT    = ["Islam","Kristen Protestan","Kristen Katolik","Hindu","Buddha","Konghucu","Lainnya"];
export const STATUS_NIKAH = ["Belum Menikah","Menikah","Cerai Hidup","Cerai Mati"];
export const PENDIDIKAN   = ["Tidak Sekolah","SD/Sederajat","SMP/Sederajat","SMA/Sederajat","D3/Sederajat","S1/Sederajat","S2+"];
export const HUBUNGAN     = ["Suami","Istri","Ayah","Ibu","Anak","Kakak","Adik","Saudara","Lainnya"];
export const PROVINSI     = [
  "Aceh","Sumatera Utara","Sumatera Barat","Riau","Kepulauan Riau","Jambi","Bengkulu",
  "Sumatera Selatan","Kepulauan Bangka Belitung","Lampung","Banten","DKI Jakarta",
  "Jawa Barat","Jawa Tengah","DI Yogyakarta","Jawa Timur","Bali","Nusa Tenggara Barat",
  "Nusa Tenggara Timur","Kalimantan Barat","Kalimantan Tengah","Kalimantan Selatan",
  "Kalimantan Timur","Kalimantan Utara","Sulawesi Utara","Gorontalo","Sulawesi Tengah",
  "Sulawesi Barat","Sulawesi Selatan","Sulawesi Tenggara","Maluku","Maluku Utara",
  "Papua Barat","Papua",
];

export function validateStep(step: number, f: FormState): Errors {
  const e: Errors = {};
  if (step === 1) {
    if (!f.namaLengkap.trim()) e.namaLengkap     = "Nama wajib diisi";
    if (f.nik.length !== 16)   e.nik              = "NIK harus 16 digit angka";
    if (!f.tempatLahir.trim()) e.tempatLahir      = "Tempat lahir wajib diisi";
    if (!f.tanggalLahir)       e.tanggalLahir     = "Tanggal lahir wajib diisi";
    if (!f.gender)             e.gender           = "Jenis kelamin wajib dipilih";
    if (!f.statusPerkawinan)   e.statusPerkawinan = "Status perkawinan wajib dipilih";
    if (!f.agama)              e.agama            = "Agama wajib dipilih";
  }
  if (step === 2) {
    if (!f.alamat.trim())  e.alamat   = "Alamat KTP wajib diisi";
    if (!f.kota.trim())    e.kota     = "Kota wajib diisi";
    if (!f.provinsi)       e.provinsi = "Provinsi wajib dipilih";
    if (f.samaAlamat === "tidak") {
      if (!f.alamatDomisili.trim()) e.alamatDomisili = "Alamat domisili wajib diisi";
      if (!f.kotaDomisili.trim())   e.kotaDomisili   = "Kota domisili wajib diisi";
    }
  }
  if (step === 3) {
    if (!f.noHp.trim())              e.noHp                  = "No. HP wajib diisi";
    if (!f.kontakDaruratNama.trim()) e.kontakDaruratNama     = "Nama kontak darurat wajib diisi";
    if (!f.kontakDaruratHubungan)    e.kontakDaruratHubungan = "Hubungan wajib dipilih";
    if (!f.kontakDaruratNoHp.trim()) e.kontakDaruratNoHp     = "No. HP darurat wajib diisi";
  }
  return e;
}
