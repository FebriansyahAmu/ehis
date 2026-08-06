# Kecelakaan Kerja (JKK / BPJS Ketenagakerjaan) & e-PLKK — Aturan & Implementasi

> Referensi kanonik penjaminan **Kecelakaan Kerja (KK)** + Penyakit Akibat Kerja (PAK) pada tab
> **Data Kecelakaan → Kecelakaan Kerja** (registrasi detail kunjungan). Pendamping [SEP-KLL-JASARAHARJA.md](SEP-KLL-JASARAHARJA.md)
> (KLL/Jasa Raharja) — keduanya sub-menu tab yang sama, tapi **rel penjaminan berbeda**.
> Baca sebelum menyentuh jaminan kecelakaan kerja / SEP KK-PAK / e-PLKK.

## 1. Prinsip — KK ditanggung BPJS Ketenagakerjaan, BUKAN BPJS Kesehatan

Kecelakaan kerja & PAK **dialihkan** dari BPJS Kesehatan ke **BPJS Ketenagakerjaan (program JKK)**.

- **Manfaat medis JKK = tanpa batas** (*"sesuai kebutuhan medis"*) selama dirawat di **PLKK** (faskes ber-PKS
  dengan BPJS TK) → **direct-bill**; RS **non-PLKK** → pasien bayar dulu lalu **reimburse** (butuh kuitansi).
- Cakupan KK termasuk **kecelakaan perjalanan berangkat/pulang kerja (PP)** & **perjalanan dinas**. Bila PP itu
  berupa **kecelakaan lalu lintas** → menjadi **KLL + KK** (dua penjamin): **Jasa Raharja dulu** (≤Rp20 jt) →
  sisanya BPJS TK.

**BPJS Kesehatan (JKN) ≠ BPJS Ketenagakerjaan (JKK)** — dua badan hukum terpisah, kartu terpisah (KIS vs KPJ),
sistem terpisah (V-Claim/SEP vs e-PLKK). Yang menyatukan di satu pasien adalah **dua sumbu berbeda**:

| Pertanyaan | Jawaban | Direkam di |
|---|---|---|
| **Siapa pasien ini?** (identitas kepesertaan) | Peserta **JKN** / **Umum** | `kunjungan.penjaminTipe` (loket) |
| **Siapa bayar kecelakaan ini?** (penjamin kasus) | **BPJS TK** (+JR bila PP-laka) | flag kecelakaan (`lakaLantas`+`penjamin`) + `encounter.Kecelakaan.penjaminBadan` |

Memilih **BPJS/JKN** di loket = pernyataan **identitas peserta**, BUKAN deklarasi siapa bayar. Pola identik KLL
(pasien JKN + ditanggung Jasa Raharja).

## 2. Regulasi terkini (2026)

| Tingkat | Regulasi | Isi relevan |
|---|---|---|
| UU | UU 24/2011 (BPJS) + UU 40/2004 (SJSN) | KK dialihkan ke BPJS TK |
| PP | **PP 44/2015 jo. PP 82/2019** | Manfaat JKK naik: **medis unlimited**, *Return to Work*, homecare, beasiswa. **Daluwarsa hak klaim = 5 tahun** (Pasal 26 PP 82/2019) |
| Permenaker | **Permenaker 5/2021** | *Tata cara* operasional RS: **Formulir KK1/KK2/KK3**, **pelaporan 2 tahap maks 2×24 jam**, PLKK |
| Permenaker | **Permenaker 1/2025** (ubah 5/2021) | **Perluasan kriteria KK: kekerasan fisik & pemerkosaan di tempat kerja**; wajib lapor BPJS TK **+ Disnaker**; non-ASN penyelenggara negara wajib JKK/JKM |
| PMK | **PMK 141/2018** | **Koordinasi antar penyelenggara jaminan** (JR ↔ BPJS TK ↔ BPJS Kesehatan) — *penetapan penjamin* via **flag KK-PAK di SEP V-Claim**. **Bukan CoB** (CoB = Perbpjs 4/2016, BPJS Kes + asuransi swasta) |

*(PP 6/2025 & PP 36/2025 hanya soal iuran/JKP/diskon padat karya — di luar alur klaim medis.)*

Dasar hukum banner tab **wajib** = `PP 44/2015 jo. PP 82/2019 · Permenaker 5/2021 jo. Permenaker 1/2025` (bukan
lagi `PP 44/2015` polos).

## 3. Apakah perlu SEP? — SEP milik JKN; BPJS TK pakai e-PLKK

**BPJS Ketenagakerjaan TIDAK menerbitkan SEP.** SEP (Surat Eligibilitas Peserta) = instrumen BPJS Kesehatan
(V-Claim + tarif INA-CBG/iDRG). Padanan di BPJS TK = aplikasi **e-PLKK (Trauma Center)**:

| Fungsi | JKN (BPJS Kesehatan) | BPJS TK (JKK) |
|---|---|---|
| Cek eligibilitas | **SEP** via V-Claim | **e-PLKK** (validasi KPJ) |
| Dokumen jaminan/klaim | SEP → INA-CBG | **Formulir KK1 / KK2 / KK3** |
| Penagihan | Klaim INA-CBG | RS PLKK **tagih langsung** ke BPJS TK via e-PLKK |

**SEP hanya muncul sebagai penetapan/koordinasi penjaminan (PMK 141/2018)** — **bukan CoB** — dan kondisional:
- Pasien **juga peserta JKN** + dugaan KK/PAK → RS terbitkan **SEP ber-flag KK-PAK** (`lakaLantas`=KK,
  `penjamin`=2 BPJS TK) = **jejak penetapan penjamin** + jaring pengaman. Sejak **go-live nasional Des 2025**
  (integrasi e-PLKK↔V-Claim), alur otomatis: validasi kepesertaan → penerbitan SEP → pencatatan INA-CBG.
- Pasien **hanya peserta BPJS TK** (bukan JKN) → **tidak ada SEP** → murni e-PLKK + KK1/KK2/KK3.

Bila BPJS TK **menolak** dugaan KK → SEP JKN **jatuh balik** sebagai sakit biasa (inilah alasan tetap
mendaftarkan pasien di bawah kepesertaan JKN-nya).

### Penetapan penjaminan ≠ CoB (penting)
KK/PAK dan JKN menanggung **hal berbeda** → **saling eksklusif** (satu kasus, satu penjamin akhir), jadi **bukan
CoB**. Bedakan tiga hal:
- **CoB sejati** (Perbpjs 4/2016) = BPJS Kesehatan **+ asuransi swasta**, split **manfaat kesehatan yang sama**.
- **KLL → Jasa Raharja ↔ BPJS Kesehatan** = **berjenjang** (JR ≤Rp20 jt, BPJS menanggung sisa) → mirip CoB (ada
  plafon → ada sisa). Lihat [SEP-KLL-JASARAHARJA.md](SEP-KLL-JASARAHARJA.md).
- **KK/PAK → BPJS TK ↔ BPJS Kesehatan** = **penetapan penjaminan** (PMK 141/2018). JKK **unlimited** → **tak ada
  sisa** untuk BPJS Kesehatan; BPJS Kesehatan hanya **penjamin kedua/fallback** bila ditetapkan **bukan** KK.
  SEP KK-PAK = **routing saat fase "dugaan"** untuk penetapan penjamin, **bukan** pembagian tagihan.

## 4. Kode `lakaLantas` + `penjamin` (badan penyelenggara)

| lakaLantas | Enum `bpjs.LakaLantas` | Makna | `penjamin` (V-Claim) |
|---|---|---|---|
| `2` | `KLL_KK` | KLL saat kerja (mis. PP / dinas laka) | **`1,2`** = Jasa Raharja + BPJS TK |
| `3` | `KK` | Kecelakaan kerja murni | **`2`** = BPJS Ketenagakerjaan |

`penjamin`: `1`=Jasa Raharja · `2`=BPJS TK · `3`=Taspen · `4`=Asabri (gabung koma bila >1).
**Derivasi**: `jenis=kerja` + `lingkupKerja=pp/dinas berunsur laka` → `KLL_KK` (`penjamin` `1,2`); selain itu → `KK`
(`penjamin` `2`).

## 5. Alur end-to-end (contoh real — Pak Budi, tangan terjepit press)

> Pak Budi (38), operator PT Maju Jaya. Tangan kanan terjepit mesin press pukul 10:15 di area produksi. Dibawa ke
> IGD RS kita (RS **PLKK**). Peserta **JKN Non-PBI** aktif **dan** peserta **BPJS TK** (punya KPJ).

| # | Langkah | Penjamin/dokumen |
|---|---|---|
| 1 | **Triase IGD** — gawat darurat dilayani dulu, tak nunggu administrasi | — |
| 2 | **Loket**: verifikasi kartu → peserta JKN → **penjamin = BPJS Non-PBI**. Terbit **SEP ber-flag KK** (`lakaLantas`=KK "dugaan", `penjamin`=2). No. LP **tak wajib** (KK ≠ KLL) | SEP JKN (tiket penetapan) |
| 3 | **Tab Data Kecelakaan → Kecelakaan Kerja**: isi dossier JKK — perusahaan **+NPP**, **No. KPJ**, jenis kerja, **lingkup = di tempat kerja**, mekanisme = terjepit mesin, tgl/jam/kronologi, **PLKK = ya** | Dossier JKK |
| 4 | **e-PLKK + penetapan penjaminan**: kasus dugaan KK di-input di **e-PLKK** (validasi KPJ) → terintegrasi V-Claim. **Pemberi kerja lapor KK1 (Tahap I) maks 2×24 jam** ke BPJS TK **+ Disnaker** | Form KK1 |
| 5 | **Pelayanan** IGD → (bila perlu) rawat inap. **JKK tanpa batas** selama di PLKK; **pasien tak bayar** | JKK direct-bill |
| 6 | **Investigasi BPJS TK**: benar KK? **Diterima** → TK penjamin biaya (e-PLKK/INA-CBG). **Ditolak** → jatuh balik ke **JKN sebagai sakit biasa** | — |
| 7 | **Sembuh → Tahap II**: **KK2 + KK3 (Surat Ket. Dokter)** → santunan STMB/cacat + *Return to Work* | KK2/KK3 |
| 8 | **Billing/klaim**: tagihan diarahkan ke **penjamin kasus (BPJS TK)**, bukan pasien. Daluwarsa 5 tahun | Klaim JKK |

Bila Pak Budi **bukan** peserta JKN → loket pilih **Umum**, langkah 2 (SEP) dilewati, sisanya sama; billing baca
`penjaminBadan`/`isPlkk` agar tak diperlakukan self-pay.

## 6. Keputusan arsitektur — TIDAK menambah `TipePenjamin` baru

**BPJS Ketenagakerjaan BUKAN pilihan penjamin di loket.** Keputusan (2026-08-04):

- `TipePenjamin` (`Umum·BPJS_Non_PBI·BPJS_PBI·Asuransi·Jamkesda`) = tipe **kepesertaan primer** (memicu SEP + tier
  tarif BPJS/UMUM + e-klaim), dipakai di **~127 file / 484 tempat**. BPJS TK = penjamin **berbasis kasus** (hanya
  KK/PAK & kematian, bukan sakit umum) → **bukan peer**.
- BPJS TK dimodelkan sebagai **lapisan penjamin kecelakaan**: `lakaLantas`+`penjamin` (SEP) + `penjaminBadan`/
  `isPlkk` (`encounter.Kecelakaan`) — mirror struktur V-Claim (peserta vs `jaminan.penjamin`).
- Menambah enum = duplikasi sumber kebenaran "siapa bayar" (drift) + blast radius luas + memaksa pilih satu
  padahal KK sering **dobel-cover** (JKN + TK). Jasa Raharja pun pola sama (`penjamin=1`), bukan `TipePenjamin`.

Edge **pekerja non-JKN murni BPJS TK** di PLKK → penjaminTipe `Umum`, ditandai `penjaminBadan=2`+`isPlkk=true` →
**billing baca penanda** (follow-up) agar tagihan ke BPJS TK, bukan self-pay. Penanda coverage, bukan tipe peserta.

## 7. Implementasi di sistem (berlapis)

> Batas: **e-PLKK & pelaporan KK1 ke BPJS TK terjadi di portal BPJS TK**, bukan SIMRS. Tugas SIMRS = tangkap data
> sisi-RS, nyalakan flag SEP penetapan-penjaminan (KK-PAK), lacak status, cetak KK1.

**Fase A — Model (migrasi additive):**
- `encounter.Kecelakaan` + kolom: `npp`, `lingkupKerja` (`tempat_kerja|dinas|pp`), `statusLaporanKk`
  (`belum|proses|terkirim`), `isPlkk` (bool), `penjaminBadan` (text, mis. `"2"`/`"1,2"`) — migrasi `20260804120000`.
- **Penetapan** (migrasi `20260806120000`): `statusPenjaminanKk` (`menunggu|dijamin|ditolak`) + `noJaminanKk`
  (No. Jaminan/Kasus e-PLKK) — hasil penetapan BPJS TK (RS hanya merekam; penetapan di e-PLKK/eRSTC).
- `bpjs.SEP` + `penjamin` (text nullable) → `bpjsDal.updateSepJaminan` tulis `penjamin`.
- `kecelakaanService.deriveLakaLantas` sadar lingkup (KK vs KLL_KK) + set `penjamin`.
- Selaraskan schema Zod ([kecelakaan.ts](../src/lib/schemas/kecelakaan/kecelakaan.ts)) / DAL / DTO / `KecelakaanDraft` / `dtoToDraft`.

**Fase B — Rombak KKPanel** ([KKPanel.tsx](../src/components/registration/kunjungan/Tabs/kecelakaan/KKPanel.tsx)) setara [KLLPanel.tsx](../src/components/registration/kunjungan/Tabs/kecelakaan/KLLPanel.tsx):
widget JKK (unlimited@PLKK · dasar hukum benar · daluwarsa 5 th) · Data Perusahaan (+NPP · No.KPJ · jenis kerja) ·
**Lingkup kejadian** (tempat/dinas/PP → PP-laka picu badge KLL_KK) · Mekanisme (+ "Kekerasan fisik/pemerkosaan di
tempat kerja") · **Pelaporan Tahap I (KK1)** status + **⏱ deadline 2×24 jam** + reminder lapor Disnaker ·
**PLKK toggle** (direct-bill vs reimburse) · **Badan penjamin** (BPJS TK primer, +JR bila PP-laka) ·
**Penjaminan JKK (e-PLKK)** — status penetapan (menunggu/dijamin/ditolak→fallback JKN) + No. Jaminan e-PLKK
(hint: penetapan oleh BPJS TK, RS melapor & merawat).

**Fase C — SEP bridge KK-aware & kondisional** ([SepBridgePanel.tsx](../src/components/registration/kunjungan/Tabs/kecelakaan/SepBridgePanel.tsx) · [kecelakaanService.ts](../src/lib/services/kecelakaan/kecelakaanService.ts)):
render **hanya bila pasien JKN**; relabel "Penetapan Penjaminan — dugaan KK-PAK"; `syncToSep` tulis `lakaLantas`+
`penjamin`; copy jelaskan SEP = jejak penetapan penjamin (PMK 141/2018), penjamin utama BPJS TK via e-PLKK.

**Fase D — (opsional) Cetak Form 3 KK1** — modal cetak A4 untuk tombol "Buat Laporan BPJS Naker", mirror
[SuratJRModal.tsx](../src/components/registration/kunjungan/Tabs/kecelakaan/SuratJRModal.tsx).

## 8. Gap (1:1)

| # | Gap | Langkah | Fase | Status |
|---|---|---|---|---|
| **G1** | Dasar hukum banner masih `PP 44/2015` (usang) → `PP 82/2019 · Permenaker 5/2021 jo 1/2025` | 3 | B | ❌ |
| **G2** | **NPP perusahaan** belum ditangkap | 3,4 | A,B | ❌ |
| **G3** | **Lingkup kejadian** (tempat/dinas/PP) — penentu KLL_KK & JR ikut | 3 | A,B | ❌ |
| **G4** | **Kriteria KK baru** (kekerasan/pemerkosaan di tempat kerja) belum ada di `MEKANISME_KK` | 3 | B | ❌ |
| **G5** | **Status Laporan Tahap I (KK1) + deadline 2×24 jam + reminder Disnaker** | 4 | A,B | ❌ |
| **G6** | **Indikator PLKK** (direct-bill vs reimburse) | 5 | A,B | ❌ |
| **G7** | **Badan penjamin** — kolom `bpjs.SEP.penjamin` + `encounter.Kecelakaan.penjaminBadan` belum ada | 2,6 | A | ❌ |
| **G8** | **SEP bridge** belum KK-aware/kondisional (copy rasa-JR, selalu muncul) | 2 | C | 🟡 |
| **G9** | `deriveLakaLantas` `kerja`→selalu `KK`, tak deteksi **KLL_KK** (PP-laka) | 2 | A,C | 🟡 |
| **G10** | Tombol **"Buat Laporan BPJS Naker (Form 3 KK1)"** masih no-op | 4,7 | D | ❌ |
| **G11** | Kualitas UI panel KK datar (KLL sudah dirombak) | 3 | B | 🟡 |

**Follow-up di luar cakupan tab ini (📋):**
- Billing baca `penjaminBadan`/`isPlkk` → arahkan tagihan ke BPJS TK (langkah 8; ranah billing).
- Konektor **e-PLKK / KK2 / KK3 / STMB / suplesiCek** NYATA (ranah portal BPJS TK; kini mock/tracker manual).
- `lokasiLaka` KLL (butuh referensi wilayah BPJS) — lihat [SEP-KLL-JASARAHARJA.md §6](SEP-KLL-JASARAHARJA.md).

## 9. Aturan main (DoD)

- **Tak ada `TipePenjamin` baru.** BPJS TK = lapisan penjamin kecelakaan (`penjaminBadan`/`isPlkk`+`SEP.penjamin`).
- `penjaminTipe` kunjungan = kepesertaan asli (JKN/Umum); jangan paksa JKN untuk pasien non-JKN.
- SEP bridge KK **hanya** untuk peserta JKN (backend `syncToSep` tetap tolak non-BPJS; FE sembunyikan bila non-JKN).
- `lakaLantas`/`penjamin` = **derivasi server** dari data kecelakaan (jenis+lingkup), bukan input bebas FE.
- Migrasi **additive** (kolom baru nullable/default) — jangan drift; selaraskan Zod/DAL/DTO/draft 1:1.
- Jembatan membaca record kecelakaan **tersimpan** → simpan dulu sebelum sync.
- Jangan tulis `lokasiKd*` sampai referensi/mapping BPJS tersedia.
