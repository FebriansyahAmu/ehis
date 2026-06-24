// Pemetaan Spesialistik (SMF, label HR di master.Pegawai) → kode poli BPJS (poliKontrol SPRI).
//
// Kunci = nilai `SPESIALISTIK_OPTS` (penggunaShared) yang tersimpan di Pegawai.spesialistik.
// Nilai = { kode, nama } poli tujuan BPJS. SMF pasien rawat inap diturunkan dari DPJP terpilih
// (DPJP = Dokter ber-spesialistik) → poliKontrol = peta ini.
//
// ⚠️ Kode poli di bawah = APROKSIMASI gaya BPJS (2–3 huruf). Saat integrasi V-Claim, RECONCILE
// dengan referensi resmi `getPoliRK`/`getDokterRK` (lihat src/lib/bpjs/vClaimRencanaKontrol.ts
// spec 10–11) — kode bisa berbeda per regional/PPK. Lihat docs/MOCK-SPRI-RAWAT-INAP.md.

export interface PoliBpjs {
  kode: string;
  nama: string;
}

/** Spesialistik (label persis SPESIALISTIK_OPTS) → poli BPJS tujuan rawat inap. */
export const SMF_POLI_MAP: Record<string, PoliBpjs> = {
  "Penyakit Dalam (Sp.PD)":            { kode: "INT", nama: "Penyakit Dalam" },
  "Anak (Sp.A)":                       { kode: "ANA", nama: "Anak" },
  "Obstetri & Ginekologi (Sp.OG)":     { kode: "OBG", nama: "Kebidanan & Kandungan" },
  "Bedah Umum (Sp.B)":                 { kode: "BED", nama: "Bedah" },
  "Jantung & Pembuluh Darah (Sp.JP)":  { kode: "JAN", nama: "Jantung & Pembuluh Darah" },
  "Paru / Pulmonologi (Sp.P)":         { kode: "PAR", nama: "Paru" },
  "Saraf / Neurologi (Sp.S)":          { kode: "SAR", nama: "Saraf" },
  "Kedokteran Jiwa (Sp.KJ)":           { kode: "JIW", nama: "Jiwa" },
  "Mata (Sp.M)":                       { kode: "MAT", nama: "Mata" },
  "THT-KL (Sp.THT-KL)":                { kode: "THT", nama: "THT-KL" },
  "Kulit & Kelamin (Sp.DV)":           { kode: "KK",  nama: "Kulit & Kelamin" },
  "Anestesiologi (Sp.An)":             { kode: "ANE", nama: "Anestesi" },
  "Radiologi (Sp.Rad)":                { kode: "RAD", nama: "Radiologi" },
  "Patologi Klinik (Sp.PK)":           { kode: "PK",  nama: "Patologi Klinik" },
  "Patologi Anatomi (Sp.PA)":          { kode: "PA",  nama: "Patologi Anatomi" },
  "Mikrobiologi Klinik (Sp.MK)":       { kode: "MIK", nama: "Mikrobiologi Klinik" },
  "Urologi (Sp.U)":                    { kode: "URO", nama: "Urologi" },
  "Orthopedi & Traumatologi (Sp.OT)":  { kode: "ORT", nama: "Orthopedi" },
  "Bedah Saraf (Sp.BS)":               { kode: "BDS", nama: "Bedah Saraf" },
  "Bedah Plastik (Sp.BP)":             { kode: "BPL", nama: "Bedah Plastik" },
  "Rehabilitasi Medik (Sp.KFR)":       { kode: "REH", nama: "Rehabilitasi Medik" },
  "Kedokteran Emergensi (Sp.EM)":      { kode: "EMG", nama: "Kedokteran Emergensi" },
  "Gizi Klinik (Sp.GK)":               { kode: "GIZ", nama: "Gizi Klinik" },
  "Forensik (Sp.F)":                   { kode: "FOR", nama: "Forensik" },
};

/** Resolusi SMF→poli. Null bila spesialistik kosong (mis. dokter umum) atau tak terpetakan. */
export function resolvePoliBpjs(spesialistik: string | null | undefined): PoliBpjs | null {
  if (!spesialistik) return null;
  return SMF_POLI_MAP[spesialistik] ?? null;
}
