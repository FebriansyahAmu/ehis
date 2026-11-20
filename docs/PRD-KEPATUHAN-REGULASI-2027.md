# PRD — Kepatuhan Regulasi & Akreditasi EHIS (target 2027)

| | |
|---|---|
| **Status** | Draft, menunggu tinjauan |
| **Versi** | 0.1 · 21 November 2026 |
| **Pemilik produk** | _(isi)_ |
| **Pemilik teknis** | _(isi)_ |
| **Dasar** | Riset regulasi, akreditasi, dan perbandingan SIMRS (21 Nov 2026) + pemeriksaan repo pada tanggal yang sama |
| **Dokumen terkait** | [TODO-FHIR.md](../TODO-FHIR.md) · [FHIR-GAP.md](FHIR-GAP.md) · [TODO-EKLAIM.md](../TODO-EKLAIM.md) · [TODO-BPJS-WS.md](../TODO-BPJS-WS.md) · [SECURITY-GAP.md](SECURITY-GAP.md) · [TECH_DEBT.md](../TECH_DEBT.md) · [ENGINEERING-RULES.md](ENGINEERING-RULES.md) |

> **Ringkasan.** Regulasi 2026 menggeser syarat SIMRS dari "punya RME" menjadi "RME yang terhubung ke SATUSEHAT, ditandatangani secara sah, dan menjadi dasar klaim JKN". Mulai **Juni 2027** klaim JKN wajib bersumber dari RME terintegrasi SATUSEHAT, dan PP PDP berlaku **16 Januari 2027**. EHIS kuat di data klinis terstruktur, tetapi hampir semua jalur keluarnya (SATUSEHAT, TTE, validasi NIK, E-Klaim, antrean BPJS) masih tiruan. PRD ini menetapkan apa yang harus dibangun, dengan urutan prioritas yang mengikuti tenggat.

---

## 1. Latar belakang

Pada 21 November 2026 kami memetakan regulasi dan standar akreditasi terbaru terhadap kondisi EHIS, lalu membandingkannya dengan SIMRS lain yang banyak dipakai (Khanza, SIMGOS v2, vendor komersial). Temuan utamanya:

- **Fondasi RME EHIS kuat.** Data klinis IGD, Rawat Inap, dan Rawat Jalan tersimpan terstruktur dan berkode (ICD, SNOMED subset, KFA). Akses diatur per peran (RBAC) dan per unit kerja (ABAC). Catatan klinis bersifat append-only, dengan kunci dan buka-kembali yang wajib beralasan.
- **Integrasi ke pihak luar belum nyata.** Pemetaan SATUSEHAT sekitar 65% selesai, tetapi masih mode tiruan dan berada di branch yang belum di-merge. TTE masih QR tiruan, NIK belum diverifikasi, E-Klaim baru tampilan, dan semua operasi tulis BPJS masih tiruan.
- **Beberapa bab akreditasi STARKES belum punya modul**, yaitu PMKP (IKP, INM), PAB (kamar operasi dan anestesi), surveilans PPI, dan PPRA.

## 2. Masalah yang diselesaikan

1. **Risiko klaim JKN.** SEB 30 Juli 2026 mewajibkan klaim elektronik dari RME terintegrasi SATUSEHAT ("No RME, No Claim") mulai Juni 2027. Syaratnya NIK tervalidasi Dukcapil dan dokumen bertanda tangan elektronik tersertifikasi. Sanksinya bisa berupa penurunan status akreditasi sampai pembekuan izin. EHIS saat ini belum memenuhi satu pun dari ketiga syarat itu.
2. **Risiko perlindungan data.** Data kesehatan termasuk data pribadi spesifik. Saat PP 33/2026 berlaku pada 16 Januari 2027, EHIS belum punya pencatatan persetujuan pemrosesan, log akses baca rekam medis, maupun prosedur penanganan kebocoran.
3. **Celah akreditasi.** STARKES (KMK 1596/2024) menilai mutu, keselamatan, bedah dan anestesi, pengendalian infeksi, dan pengelolaan rekam medis. Sebagian besar bab ini belum didukung sistem, sehingga bukti akreditasi harus disiapkan manual.
4. **Pelaporan manual.** Laporan wajib seperti SIRS RL, RS Online/SIRANAP, dan RL 3.19.8 (AMR) belum ditarik dari data EHIS.

## 3. Tujuan, non-tujuan, dan ukuran keberhasilan

### Tujuan

| ID | Tujuan | Ukuran keberhasilan (usulan, disepakati saat tinjauan) |
|---|---|---|
| G1 | Klaim JKN layanan Juni 2027 lolos syarat SEB | 100% berkas klaim JKN bersumber dari RME, ber-TTE tersertifikasi, NIK tervalidasi, dan punya ID Encounter SATUSEHAT |
| G2 | RME terkirim ke SATUSEHAT produksi | ≥ 95% kunjungan selesai terkirim dalam 24 jam; antrean gagal kirim ditinjau setiap hari |
| G3 | Patuh UU PDP saat PP 33/2026 berlaku | Log akses baca aktif di semua modul klinis; persetujuan pemrosesan tercatat untuk setiap pasien baru; prosedur kebocoran teruji lewat simulasi |
| G4 | Bukti akreditasi STARKES dari sistem | Setiap bab STARKES punya minimal satu sumber bukti di EHIS (lihat §8) |
| G5 | Laporan wajib otomatis | SIRS RL dan data tempat tidur RS Online terkirim dari EHIS tanpa input ulang |

### Non-tujuan

- Membangun ulang modul klinis yang sudah DB-wired. PRD ini menambah lapisan kepatuhan dan integrasi di atasnya.
- Menghitung tarif grouper sendiri. Hasil grouping dan tarif selalu diambil dari grouper resmi (E-Klaim/INA-Grouper).
- Menjadi penyelenggara sertifikat elektronik. EHIS hanya memanggil PSrE.
- Mengganti aplikasi milik BPJS (V-Claim, FRISTA, Mobile JKN). EHIS hanya bridging.

## 4. Konteks regulasi dan tenggat

| Regulasi | Isi yang relevan untuk SIMRS | Tenggat / status | Dampak ke produk |
|---|---|---|---|
| UU 17/2023 + PP 28/2024 | Aturan induk kesehatan; PP 46/2014 tentang SIK dicabut | Berlaku | Acuan umum |
| Permenkes 24/2022 Rekam Medis | RME wajib dan interoperabel dengan SATUSEHAT; hak pasien atas isi RM; penyimpanan dan pemusnahan | Berlaku (tenggat 31 Des 2023 sudah lewat) | E1, E5, E12 |
| Permenkes 6/2026 Rumah Sakit (diundangkan 12 Jun 2026) | Klasifikasi berdasarkan kemampuan layanan (paripurna/utama/madya/dasar); wajib mendukung SATUSEHAT; mencabut PMK 82/2013 tentang SIMRS | Sumber sekunder menyebut masa transisi sampai 12 Jun 2028 | E1, E13 |
| STARKES — KMK HK.01.07/MENKES/1596/2024 | 16 bab · 228 standar · 805 elemen penilaian; MRMIK 5 (RME), MRMIK 8 (jejak koreksi), MRMIK 11 (retensi), MRMIK 13 (SIMRS) | Berlaku sejak Okt 2024 | Seluruh epik (§8) |
| KMK 62/2026 | Lembaga penyelenggara akreditasi | 3 Mar 2026 | Tidak ada dampak teknis |
| SEB 30 Jul 2026 (Kemenkes, BPJS, Kemendagri, KPK, BSSN) | Klaim JKN dari RME SATUSEHAT; NIK tervalidasi Dukcapil; TTE tersertifikasi (BSrE untuk RS pemerintah, PSrE lain untuk swasta; gambar tanda tangan tidak cukup) | Transisi mulai layanan Agustus 2026, **wajib Juni 2027** | E1–E4 |
| UU 27/2022 PDP + PP 33/2026 | Data kesehatan = data pribadi spesifik; dasar pemrosesan, keamanan, notifikasi kebocoran | **PP berlaku 16 Jan 2027**; Lembaga PDP belum terbentuk | E5 |
| Perpres 59/2024 (KRIS) | 12 kriteria ruang rawat, maksimal 4 tempat tidur per kamar | Bertahap 2026 | E11 |
| Tarif JKN: PMK 3/2023 + KMK 177/2026 | Lihat §4.1 | Tarif masih INA-CBG; iDRG dalam uji coba | E4 |
| Permenkes 16/2024 Rujukan | Rujukan berbasis kompetensi lewat SATUSEHAT Rujukan dan data tempat tidur | Bertahap 2026 | E13 |
| BPJS FRISTA | Verifikasi wajah saat penerbitan SEP | Sudah diterapkan di banyak RS; kewajiban nasional belum terkonfirmasi | E6 |
| SIRS Online, bridging RS Online v3 (27 Jan 2026), RL 3.19.8 | Laporan RL, ketersediaan tempat tidur, resistensi antimikroba | Berjalan; RL 3.19.8 disosialisasikan Jun 2026 | E7, E10 |

### 4.1 Status iDRG: praktik lapangan vs dasar tarif

- **Praktik lapangan (konfirmasi tim, 21 Nov 2026).** Koding dan grouping klaim **sudah memakai iDRG**: kode ICD-10-IM dan ICD-9-CM-IM, digroup oleh grouper iDRG.
- **Dasar tarif pembayaran.** Sumber sekunder per September–Oktober 2026 menyebut besaran tarif JKN masih mengacu ke INA-CBG (PMK 3/2023). KMK HK.01.07/Menkes/177/2026 hanya membentuk tim uji coba iDRG, tanpa tanggal berlaku nasional. Perubahan yang sudah dirasakan RS ada di tuntutan dokumentasi dan koding, bukan di besaran tarif.
- **Keputusan produk.** iDRG tetap menjadi grouper utama di EHIS. Ini sesuai arsitektur yang ada: routing `eraGrouper` di [groupingResolver.ts](../src/lib/eklaim/groupingResolver.ts) sudah menjadikan iDRG primary dan INA-CBG sebagai engine kedua. Ada dua penyesuaian:
  - Adapter INA-CBG bukan lagi "legacy untuk klaim sebelum Okt 2025". Selama transisi, adapter ini menjadi sumber tarif yang berlaku.
  - Rekaman klaim harus menyimpan hasil grouping iDRG **bersama** tarif yang dibayarkan dan versi grouper-nya. Saat ini kedua hasil masih saling eksklusif lewat `eraGrouper`.
- **Belum pasti:** bagaimana E-Klaim versi terpasang mengeluarkan tarif dari hasil grouping iDRG (lihat Q2).

> Koreksi atas analisis 21 Nov sebelumnya. Rekomendasi "INA-CBG sebagai jalur produksi aktif" terlalu jauh. Yang benar: koding dan grouping memakai iDRG, sedangkan INA-CBG hanya relevan sebagai acuan tarif selama transisi.

## 5. Kondisi EHIS saat ini (baseline 21 Nov 2026)

**Sudah kuat (tersimpan di DB):**

- Rekam medis lintas unit: CPPT, TTV, diagnosa, tindakan, asesmen, keperawatan SDKI, care plan, MAR, intake/output, konsultasi, discharge planning, resume medik, dan disposisi (dengan kunci dan Batal Selesai beralasan).
- Penunjang: Lab, Rad, dan Farmasi, dengan aturan bahwa hanya petugas yang ditugaskan boleh memproses ([ASSIGNMENT-RULES.md](ASSIGNMENT-RULES.md)).
- Billing (proyeksi, finalisasi, audit) dan Inventory (ledger).
- Data wilayah Kemendagri dan data kecelakaan KLL/KK.

**Ada tetapi belum siap produksi:**

| Area | Kondisi | Rujukan |
|---|---|---|
| SATUSEHAT | Sekitar 65% (S1–S6b), mode tiruan, di branch `feat/fhir-*` yang belum di-merge, belum pernah ke sandbox; LOINC 0% | [TODO-FHIR.md](../TODO-FHIR.md) · [FHIR-GAP.md](FHIR-GAP.md) |
| BPJS V-Claim | Referensi sudah live; semua operasi tulis (SEP, rujukan, rencana kontrol) masih tiruan | [TODO-BPJS-WS.md](../TODO-BPJS-WS.md) |
| TTE | QR deterministik tiruan, bukan sertifikat elektronik | [TteQr.tsx](../src/components/shared/TteQr.tsx) |
| E-Klaim | Tampilan lengkap, data tiruan, belum ada backend | [TODO-EKLAIM.md](../TODO-EKLAIM.md) |
| Antrean | Tampilan saja, belum ada API maupun model | [src/app/ehis-antrian/](../src/app/ehis-antrian/) |
| NIK | Hanya kolom; resolve Patient SATUSEHAT masih tiruan | FH2 di [TODO-FHIR.md](../TODO-FHIR.md) |
| General consent | Belum ada kolom di skema | TECH_DEBT G-E |
| PPI isolasi / bundle HAIs | Tampilan RI tanpa persistensi | [ppiIsolasi/](../src/components/rawat-inap/ppiIsolasi/) |
| Audit log | Hanya untuk billing, BPJS, dan FHIR; belum ada log akses baca | — |
| Dashboard & Laporan | Kerangka kosong | [src/app/ehis-dashboard/](../src/app/ehis-dashboard/) · [src/app/ehis-report/](../src/app/ehis-report/) |

**Belum ada sama sekali:**

- IBS/kamar operasi dan anestesi.
- IKP dan INM.
- Surveilans HAIs dan PPRA/AMR.
- Laporan SIRS RL, bridging RS Online/SIRANAP, dan SATUSEHAT Rujukan.
- FRISTA dan Antrean Online BPJS.
- Siklus hidup rekam medis (retensi, pemusnahan, rilis informasi).
- Log akses baca.
- Program nasional selain skrining TB.

## 6. Pengguna

| Persona | Kebutuhan utama dari PRD ini |
|---|---|
| Koder / Tim Casemix | Koding ICD-10-IM/ICD-9-CM-IM, grouping iDRG, berkas klaim lengkap dari RME |
| Tim Klaim | Pengiriman klaim elektronik, status, banding |
| DPJP, Perawat, PPA lain | TTE sah tanpa langkah tambahan berarti; checklist bedah; pelaporan insiden |
| Petugas loket & admisi | Validasi NIK, consent, antrean, verifikasi biometrik SEP |
| Unit Rekam Medis (MRMIK) | Jejak koreksi, log akses, retensi, rilis informasi |
| Komite Mutu (PMKP) | IKP, INM, laporan bulanan |
| Komite PPI & Tim PPRA | Surveilans HAIs, penggunaan antibiotik, laporan AMR |
| Admin IT / DPO | Kredensial integrasi, pemantauan antrean kirim, penanganan kebocoran |
| Manajemen (TKRS) | Dashboard kepatuhan dan indikator RS |

## 7. Ruang lingkup: epik dan kebutuhan

Prioritas: **P0** wajib sebelum tenggat Januari/Juni 2027 · **P1** paruh kedua 2027 · **P2** sampai tenggat transisi Permenkes 6/2026 (Juni 2028).

Setiap epik mengikuti [ENGINEERING-RULES.md](ENGINEERING-RULES.md): branch per fitur, OWASP S1–S11, verifikasi bertingkat, dan DoD per branch. Semua integrasi eksternal mengikuti pola outbox, sehingga aksi klinis tidak pernah gagal karena layanan luar ([FHIR-RULES.md](FHIR-RULES.md), [BPJS-WS-RULES.md](BPJS-WS-RULES.md)).

### P0

#### E1 — SATUSEHAT produksi

**Acuan:** Permenkes 24/2022 · Permenkes 6/2026 · SEB 30 Jul 2026 · STARKES MRMIK.

| ID | Kebutuhan |
|---|---|
| FR-1.1 | Merge stack FHIR S1–S6b ke `main` secara berurutan sebelum menambah fitur baru, agar tidak makin jauh menyimpang |
| FR-1.2 | Ajukan kredensial sandbox SATUSEHAT, uji token, dan jalankan onboarding Organization/Location di sandbox |
| FR-1.3 | Isi LOINC untuk tes Lab dan pemeriksaan Rad prioritas (picker S6c), agar resource diagnostik ikut terkirim |
| FR-1.4 | Runner outbox aktif di lingkungan produksi, dengan panel antrean gagal kirim untuk ditinjau harian |
| FR-1.5 | ID Encounter SATUSEHAT tersedia per kunjungan sebagai prasyarat berkas klaim (E4) |

**Kriteria penerimaan:**

- Satu kunjungan IGD, RI, dan RJ lengkap terkirim ke sandbox tanpa error validasi.
- Resource yang gagal tampil di konsol dengan alasan yang bisa ditindaklanjuti.
- Ada jalur pindah dari sandbox ke produksi lewat konfigurasi, tanpa ubah kode.

#### E2 — TTE tersertifikasi

**Acuan:** SEB 30 Jul 2026 · UU ITE · STARKES MRMIK.

| ID | Kebutuhan |
|---|---|
| FR-2.1 | Integrasi PSrE (BSrE untuk RS pemerintah, PSrE berinduk untuk swasta; lihat Q1) lewat adapter server-side. Kredensial tidak pernah sampai ke browser |
| FR-2.2 | Tanda tangan PDF untuk dokumen klaim dan dokumen klinis keluar: resume medik, hasil Lab/Rad, surat-surat, dan berkas klaim |
| FR-2.3 | Penanda tangan diautentikasi per tanda tangan (passphrase/OTP sesuai PSrE). Passphrase tidak disimpan |
| FR-2.4 | Penyimpanan dokumen bertanda tangan (object storage) beserta hash. Ini sekaligus menutup placeholder upload di [TECH_DEBT.md](../TECH_DEBT.md) |
| FR-2.5 | QR tiruan di [TteQr.tsx](../src/components/shared/TteQr.tsx) diganti tautan verifikasi PSrE. Selama transisi, dokumen lama diberi label "tanda tangan internal" |

**Kriteria penerimaan:**

- Resume medik yang ditandatangani lolos verifikasi di layanan verifikasi PSrE.
- Penanda tangan tercatat di audit.
- Dokumen tidak bisa diubah setelah ditandatangani; revisi menghasilkan dokumen baru.

#### E3 — Validasi identitas pasien (NIK)

**Acuan:** SEB 30 Jul 2026 · STARKES SKP 1.

| ID | Kebutuhan |
|---|---|
| FR-3.1 | Validasi NIK lewat resolve Patient SATUSEHAT (FH2) dan/atau Dukcapil (lihat Q4) saat pendaftaran pasien baru dan saat klaim |
| FR-3.2 | Status verifikasi tersimpan per pasien: sumber, waktu, dan hasil (cocok / tidak cocok / belum) |
| FR-3.3 | Jalur khusus untuk pasien tanpa NIK (bayi baru lahir memakai NIK ibu, pasien tanpa identitas) yang tidak memblokir pelayanan |
| FR-3.4 | Klaim JKN tidak bisa difinalisasi bila NIK belum terverifikasi. Pelayanan klinis tetap tidak diblokir |

**Kriteria penerimaan:** Ketidakcocokan nama, tanggal lahir, atau gender ditandai untuk ditinjau petugas, bukan ditimpa otomatis.

#### E4 — Klaim elektronik JKN (backend E-Klaim)

**Acuan:** SEB 30 Jul 2026 · PMK 3/2023 · KMK 177/2026 · Pedoman Pengodean iDRG 2025.

| ID | Kebutuhan |
|---|---|
| FR-4.1 | Koding memakai **ICD-10-IM dan ICD-9-CM-IM** (praktik lapangan saat ini). Pastikan master ICD memuat edisi IM (Q3) |
| FR-4.2 | Grouping **iDRG** lewat bridging web service E-Klaim/INA-Grouper. Urutan metodenya mengikuti manual E-Klaim versi terpasang |
| FR-4.3 | Rekaman klaim menyimpan hasil grouping iDRG, tarif yang berlaku saat klaim (INA-CBG selama transisi), dan versi grouper. Bentuk `eraGrouper` diubah agar keduanya tersimpan bersamaan (§4.1) |
| FR-4.4 | Berkas klaim dirakit dari data RME (resume medik, hasil penunjang, SEP, rincian billing final), lalu ditandatangani via E2 |
| FR-4.5 | Gerbang "No RME, No Claim": klaim hanya bisa dikirim bila Encounter sudah terkirim ke SATUSEHAT (E1), NIK terverifikasi (E3), dan berkas sudah ber-TTE (E2) |
| FR-4.6 | Klaim dibuat dari invoice billing berstatus Final (Slice 2f), bukan dari proyeksi yang masih berubah |
| FR-4.7 | Operasi tulis V-Claim nyata (insert SEP) sesuai [TODO-BPJS-WS.md](../TODO-BPJS-WS.md) |

**Kriteria penerimaan:**

- Satu klaim RI dan satu klaim RJ melewati alur koding → grouping → final → kirim di lingkungan uji.
- Hasil grouping EHIS sama dengan hasil aplikasi E-Klaim untuk kasus yang sama.

#### E5 — Perlindungan data pribadi dan keamanan rekam medis

**Acuan:** UU 27/2022 · PP 33/2026 · Permenkes 24/2022 · STARKES MRMIK 8 · [SECURITY-GAP.md](SECURITY-GAP.md).

| ID | Kebutuhan |
|---|---|
| FR-5.1 | **Log akses baca rekam medis**: siapa, kapan, pasien/kunjungan apa, dari modul mana. Append-only dan bisa dicari Unit RM |
| FR-5.2 | Akses di luar unit/penugasan memakai "break-the-glass" dengan alasan wajib, lalu ditandai untuk ditinjau |
| FR-5.3 | Persetujuan umum (general consent) dan pemberitahuan pemrosesan data tercatat di DB (menutup TECH_DEBT G-E), termasuk penarikan persetujuan |
| FR-5.4 | Jejak koreksi seragam lintas domain (nilai lama → nilai baru, oleh siapa, alasan) sesuai MRMIK 8 |
| FR-5.5 | Tooling insiden kebocoran: register insiden, penilaian dampak, dan templat notifikasi (UU PDP mengatur batas waktu notifikasi; verifikasi pasalnya) |
| FR-5.6 | Permintaan salinan RM oleh pasien beserta jejak penyerahannya (hak pasien, Permenkes 24/2022) |
| FR-5.7 | Tutup temuan P1 di [SECURITY-GAP.md](SECURITY-GAP.md): security header, cek Origin (CSRF), dan default `AUTH_ENFORCE` |

**Kriteria penerimaan:**

- Unit RM bisa menjawab "siapa saja yang membuka RM pasien X bulan ini" dalam satu kueri di UI.
- Simulasi kebocoran berjalan sesuai prosedur sampai templat notifikasi terisi.

**Catatan organisasi (di luar sistem):** penunjukan DPO, register aktivitas pemrosesan, dan kebijakan retensi resmi RS.

### P1

#### E6 — Antrean Online BPJS dan FRISTA

| ID | Kebutuhan |
|---|---|
| FR-6.1 | Model dan API antrean nyata menggantikan tampilan tiruan di `/ehis-antrian` |
| FR-6.2 | Bridging Antrean FKRTL: kirim waktu tiap tahap (task ID) dari timestamp lifecycle kunjungan dan farmasi yang sudah ada |
| FR-6.3 | Status verifikasi biometrik FRISTA tercatat saat penerbitan SEP, termasuk jalur pengecualian. Kewajiban di wilayah RS dikonfirmasi dulu (Q5) |

#### E7 — Pelaporan pemerintah

| ID | Kebutuhan |
|---|---|
| FR-7.1 | Bridging RS Online v3: ketersediaan tempat tidur dari `BedAllocation` (data yang sama untuk SIRANAP) |
| FR-7.2 | SIRS RL (format RL 6.x) dibangkitkan dari kunjungan, diagnosa, dan disposisi; ada pratinjau sebelum kirim |
| FR-7.3 | Aplicares nyata (ketersediaan kamar BPJS) dari sumber tempat tidur yang sama |

#### E8 — Mutu dan keselamatan pasien (PMKP)

| ID | Kebutuhan |
|---|---|
| FR-8.1 | Pelaporan IKP (KTD/KNC/KTC/KPC/sentinel): grading risiko, investigasi sederhana atau RCA, dan ekspor ke format pelaporan nasional |
| FR-8.2 | Dashboard INM. Indikator yang bisa diturunkan dari data EHIS dihitung otomatis; sisanya diinput komite |
| FR-8.3 | Laporan bulanan untuk Komite Mutu |

Pemetaan INM rumah sakit ke sumber data. Daftar diambil dari PMK 30/2022; verifikasi ke JDIH.

| Indikator | Sumber di EHIS |
|---|---|
| Kepatuhan identifikasi pasien | Verifikasi identitas (SKP 1) yang sudah ada |
| Waktu tunggu rawat jalan | Timestamp lifecycle kunjungan RJ |
| Pelaporan hasil kritis laboratorium | `criticalNotifs` di hasil Lab |
| Kepatuhan penggunaan Fornas | Order resep × master obat |
| Kepatuhan upaya pencegahan risiko jatuh | Asesmen risiko (Morse dan sejenisnya) |
| Kepatuhan waktu visite dokter | CPPT DPJP |
| Penundaan operasi elektif · waktu tanggap SC emergensi | Butuh E9 |
| Kepatuhan kebersihan tangan · penggunaan APD | Input audit PPI |
| Kepatuhan alur klinis (clinical pathway) | Input komite (fase berikut: clinical pathway di sistem) |
| Kecepatan tanggap komplain · kepuasan pasien | Input / survei |

#### E9 — Kamar operasi dan anestesi (PAB + SKP 4)

| ID | Kebutuhan |
|---|---|
| FR-9.1 | Penjadwalan operasi (elektif dan emergensi) dari order DPJP |
| FR-9.2 | Checklist keselamatan bedah WHO (sign in / time out / sign out) dan penandaan lokasi operasi |
| FR-9.3 | Asesmen pra-anestesi/pra-sedasi, catatan anestesi intra-operasi, dan pemantauan pasca-anestesi |
| FR-9.4 | Laporan operasi yang menjadi Procedure SATUSEHAT dan charge billing (reuse pola `TindakanMedis`) |

### P2

| Epik | Ringkasan kebutuhan | Acuan |
|---|---|---|
| **E10 — PPRA dan surveilans infeksi** | Persistensi bundle HAIs dan isolasi RI yang kini masih tiruan; surveilans HAIs dengan denominator hari pemasangan alat; data penggunaan antibiotik; laporan RL 3.19.8 (AMR) | STARKES PPI · PKPO · Prognas |
| **E11 — KRIS** | Checklist 12 kriteria KRIS per ruangan di master ruangan, beserta bukti; validasi maksimal 4 tempat tidur per kamar; laporan kesiapan | Perpres 59/2024 |
| **E12 — Siklus hidup rekam medis** | Kebijakan retensi per jenis dokumen, pemusnahan dengan berita acara, rilis informasi ke pihak ketiga dengan otorisasi, dan peminjaman RM | Permenkes 24/2022 · MRMIK 11 |
| **E13 — Rujukan dan kemampuan layanan** | SATUSEHAT Rujukan / rujukan berbasis kompetensi; profil kemampuan layanan RS (paripurna/utama/madya/dasar) di Profil RS | Permenkes 16/2024 · Permenkes 6/2026 |
| **E14 — Program nasional** | Pelaporan TB (lanjutan skrining yang sudah ada), HIV, PONEK, stunting, dan geriatri, sesuai prioritas RS | STARKES Prognas |
| **E15 — Dashboard dan laporan manajemen** | Mengisi `/ehis-dashboard` dan `/ehis-report`: indikator pelayanan (BOR, LOS, TOI, BTO, NDR, GDR), kepatuhan integrasi, mutu | STARKES TKRS |

## 8. Peta STARKES ke epik

| Bab | Sudah didukung | Epik penutup celah |
|---|---|---|
| TKRS | — | E15 |
| KPS | Master pegawai/dokter, STR/SIP dengan penanda kedaluwarsa, penugasan SDM | Pembatasan order berdasarkan kewenangan klinis (backlog Mapping Hub Kewenangan) |
| MFK | Master bed dan inventory | E11, E7 |
| PMKP | — | E8 |
| MRMIK | RME terstruktur, append-only, kunci/buka-kembali beralasan | E5 (MRMIK 8), E12 (MRMIK 11), E1 |
| PPI | Tampilan isolasi dan bundle HAIs | E10 |
| PPK | — | Dokumentasi pendidikan klinis (backlog, Permenkes 6/2026) |
| AKP | Triase, SPRI/admisi, transfer, rujukan, discharge planning | E13, E7 |
| HPK | Informed consent | E5 (general consent, PDP); DNR/advance directive (backlog) |
| PP | Asesmen awal, skala risiko dari master | — |
| PAP | CPPT, care plan, MAR, I/O, gizi | Transfusi (backlog) |
| PAB | — | E9 |
| PKPO | Resep, telaah, dispensing, rekonsiliasi, obat high-alert | E10 (PPRA); dispensing memotong stok (backlog Inventory) |
| KE | Edukasi terstruktur | — |
| SKP | Identitas dua penanda, TBaK, high-alert, risiko jatuh | E9 (penandaan lokasi operasi) |
| Prognas | Skrining TB | E14, E10 |

## 9. Persyaratan non-fungsional

- **Keamanan:** OWASP ASVS 5.0 L2, Top 10:2025, dan API Top 10 (aturan S1–S11). Rahasia integrasi hanya di server. Data PII di log integrasi di-hash.
- **Ketahanan:** semua panggilan eksternal lewat outbox, idempoten, dengan retry dan circuit breaker. Kegagalan layanan luar tidak membatalkan aksi klinis.
- **Audit:** log audit integrasi minimal 5 tahun (BPJS-WS-RULES R8). Log akses baca dan jejak koreksi bersifat append-only.
- **Penempatan data:** di wilayah Indonesia. Dasar kewajibannya (PP 71/2019, PP 28/2024) dikonfirmasi bersama tim legal.
- **Konfigurasi per lingkungan:** mode `mock`/`sandbox`/`prod` per integrasi (pola `BPJS_MODE`/`SATUSEHAT` yang sudah ada).
- **Aksesibilitas UI:** WCAG 2.2 AA, mengikuti aturan UI di ENGINEERING-RULES §4.
- **Verifikasi:** bertingkat sesuai keterbatasan RAM laptop dev. Pemeriksaan penuh (tsc, lint, build) dijalankan di CI.

## 10. Milestone

| Milestone | Waktu | Isi | Gerbang keluar |
|---|---|---|---|
| M0 Persiapan | Des 2026 | Jawab pertanyaan terbuka (§12); merge stack FHIR; ajukan kredensial SATUSEHAT, PSrE, Dukcapil, dan cons-id BPJS produksi (lead time panjang) | Kredensial sandbox diterima |
| M1 PDP minimum | s.d. 16 Jan 2027 | FR-5.1, 5.3, 5.5, 5.7 | Log akses aktif; consent tercatat; header keamanan lolos pemindaian |
| M2 Integrasi identitas & RME | Feb–Mar 2027 | E1 sandbox lulus · FR-1.3 LOINC · E3 | Kunjungan uji terkirim lengkap ke sandbox |
| M3 Klaim | Apr–Mei 2027 | E2 · E4 · uji klaim paralel dengan proses lama | Klaim uji cocok dengan E-Klaim |
| M4 Wajib klaim elektronik | Jun 2027 | SATUSEHAT produksi + klaim elektronik live | Klaim layanan Juni 2027 terkirim sesuai SEB |
| M5 P1 | Semester 2 2027 | E6–E9 | Per epik |
| M6 P2 | 2028 (s.d. 12 Jun 2028) | E10–E15 + penyesuaian Permenkes 6/2026 | Per epik |

## 11. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kredensial dan PKS eksternal (SATUSEHAT, PSrE, Dukcapil, BPJS produksi) lama keluar | M2–M4 mundur | Ajukan di M0; kembangkan dengan adapter mock dan sandbox lebih dulu |
| Stack FHIR di branch makin menyimpang dari `main` | Konflik besar, regresi | FR-1.1: merge sebelum fitur baru |
| Regulasi tarif iDRG berubah di tengah jalan | Rekaman klaim tidak cocok | FR-4.3 menyimpan grouping, tarif, dan versi grouper; engine dipisah lewat adapter |
| Lembaga PDP belum terbentuk, aturan teknis belum jelas | Prosedur notifikasi berubah | Templat dan prosedur dibuat bisa dikonfigurasi |
| Kapasitas tim dan RAM dev terbatas | Laju lambat | Lingkup P0 dijaga ketat; verifikasi berat di CI |
| Banyak rincian regulasi dari sumber sekunder | Salah tafsir | Setiap epik P0 diawali verifikasi pasal ke JDIH / BPJS (lihat §13) |

## 12. Pertanyaan terbuka

| ID | Pertanyaan | Memengaruhi |
|---|---|---|
| Q1 | RS pemerintah atau swasta? (menentukan BSrE atau PSrE lain) | E2 |
| Q2 | E-Klaim versi berapa yang dipakai koder sekarang (desktop atau web service)? Bagaimana hasil grouping iDRG menghasilkan tarif yang dibayarkan? | E4, FR-4.3 |
| Q3 | Apakah master ICD di EHIS sudah memuat edisi ICD-10-IM / ICD-9-CM-IM? | FR-4.1 |
| Q4 | Validasi NIK cukup lewat SATUSEHAT, atau RS perlu PKS akses Dukcapil langsung? | E3 |
| Q5 | Apakah FRISTA wajib di wilayah RS? | E6 |
| Q6 | Siapa DPO, dan sudah ada kebijakan retensi RM resmi? | E5, E12 |
| Q7 | Bagaimana status integrasi SATUSEHAT RS saat ini dengan SIMRS lama (bila ada)? Apakah RS termasuk yang sudah disanksi? | Urgensi M2–M4 |
| Q8 | Kelas kemampuan layanan apa yang ditargetkan RS menurut Permenkes 6/2026? | E13 |

## 13. Lampiran A — Perbandingan SIMRS

| | Khanza (open source) | SIMGOS v2 (Kemenkes) | Vendor komersial (Trustmedis, Medify, dll.) | EHIS |
|---|---|---|---|---|
| Biaya | Gratis (YASKI) | Gratis; sumber berbeda soal RS swasta | Berlangganan | Internal |
| Platform | Desktop Java | Web | Banyak berbasis cloud | Web (Next.js) |
| Skala pakai | Disebut 1.500+ RS | Disebut ~246 RS | Bervariasi | Belum produksi |
| RME terstruktur | Disebut masih banyak teks bebas | Mengikuti metadata KMK 1423/2022 | Klaim sesuai standar | Kuat dan berkode |
| SATUSEHAT | Lewat bridging; sumber saling bertentangan | Terintegrasi | Klaim terintegrasi | Pemetaan dalam, belum nyata (E1) |
| BPJS | Bridging V-Claim | Terintegrasi | Umumnya ada | Referensi live, tulis masih tiruan (E4) |
| TTE & klaim elektronik | Tak terkonfirmasi | Tak terkonfirmasi | Sebagian menawarkan | Belum ada (E2, E4) |

Kesimpulannya, EHIS unggul di kualitas data dan arsitektur, tetapi tertinggal di integrasi nyata, padahal integrasi itulah yang ditagih regulasi 2027. Data pembanding sebagian besar berasal dari blog dan situs vendor.

## 14. Lampiran B — Dokumen internal yang perlu diperbarui

- [.claude/STANDARDS.md](../.claude/STANDARDS.md) dan [.claude/GAP_ANALYSIS.md](../.claude/GAP_ANALYSIS.md) masih merujuk SNARS 1.1 dan PMK 269/2008. Perlu diperbarui ke STARKES (KMK 1596/2024), Permenkes 24/2022, dan kode bab baru.
- [TODO-EKLAIM.md](../TODO-EKLAIM.md) bagian "Standar Grouping iDRG": sesuaikan dengan §4.1 (iDRG untuk koding dan grouping; INA-CBG sebagai acuan tarif selama transisi, bukan "legacy pre-Okt 2025"). Juga ganti rujukan PMK 76/2016.
- [TODO-FHIR.md](../TODO-FHIR.md): tandai FR-1.1 dan FR-1.3 sebagai prasyarat klaim.

## 15. Sumber dan kualitas sumber

Banyak rincian berasal dari blog dan situs vendor. MedMinutes, sumber yang paling sering muncul, menjual produk audit RME dan TTE, jadi bisa bias. Yang terkonfirmasi lewat sumber resmi atau berita adalah:

- Keberadaan Permenkes 6/2026.
- SEB 30 Juli 2026.
- SIMGOS.
- Dokumen bridging RS Online v3.

Hal berikut **wajib diverifikasi** ke JDIH Kemenkes / BPJS sebelum dijadikan dasar implementasi: nomor pasal, angka elemen penilaian per bab, status tarif iDRG, kewajiban nasional FRISTA, daftar INM, dan batas waktu notifikasi PDP.

**Regulasi RS dan akreditasi**

- [Permenkes 6/2026 (JDIH)](https://jdih.kemkes.go.id/storage/documents/pdfs/2026permenkes006.pdf) · [BPK](https://peraturan.bpk.go.id/Details/350851/permenkes-no-6-tahun-2026) · [Sosialisasi (Keslan)](https://keslan.kemkes.go.id/read/3903/sosialisasi-peraturan-menteri-kesehatan-nomor-6-tahun-2026-tentang-rumah-sakit)
- [Daftar Regulasi KARS](https://kars.or.id/daftar-regulasi/) · [KMK 1596 vs 1128](https://medminutes.io/mrmik/kmk-1128-vs-1596/) · [Panduan MRMIK](https://medminutes.io/mrmik/)
- [KMK 62/2026](https://legawa.com/2026/04/27/babak-baru-akreditasi-fasilitas-kesehatan-lanjutan-memahami-kmk-nomor-62-tahun-2026-dan-dampaknya-bagi-rumah-sakit-dan-klinik/)
- [Aturan pelaksana UU Kesehatan (Kemenkes)](https://www.kemkes.go.id/id/pemerintah-terbitkan-aturan-pelaksana-uu-kesehatan) · [Aturan yang dicabut PP 28/2024 (Hukumonline)](https://www.hukumonline.com/berita/a/peraturan-teknis-uu-kesehatan-terbit--ini-sejumlah-aturan-pelaksana-yang-dicabut-lt66a89ff97dafd/?page=all)

**Klaim elektronik, SEB, dan TTE**

- [Kemenkes: klaim JKN dan RME SATUSEHAT](https://keslan.kemkes.go.id/read/4087/kemenkes-perkuat-tata-kelola-klaim-jkn-melalui-integrasi-rekam-medis-elektronik-dengan-satusehat)
- [Bisnis: klaim elektronik Agustus 2026](https://finansial.bisnis.com/read/20260731/215/1992660/cegah-fraud-mulai-agustus-2026-rs-didorong-terapkan-klaim-elektronik)
- [Viva: sanksi RME SATUSEHAT](https://jatim.viva.co.id/gaya-hidup/28827-kemenkes-wajibkan-rekam-medis-elektronik-terintegrasi-satusehat-rs-bisa-kena-sanksi)
- [SEB dan kredensialing FKRTL](https://legawa.com/2026/10/07/rme-terintegrasi-satusehat-kredensialing-fkrtl/) · [TTE dalam SEB](https://medminutes.io/tte/seb-klaim-jkn/)

**iDRG dan tarif JKN**

- [Periskop: JKN bersiap beralih ke iDRG](https://periskop.id/nasional/20260915/jkn-bersiap-beralih-dari-ina-cbgs-ke-idrg-apa-dampaknya-bagi-pasien-dan-rumah-sakit)
- [Transisi INA-CBG ke iDRG (status implementasi)](https://medminutes.io/blog/transisi-ina-cbg-ke-idrg-panduan-lengkap-rumah-sakit/) · [KMK 177/2026 uji coba iDRG](https://medminutes.io/blog/kmk-177-2026-uji-coba-idrg-data-rumah-sakit/) · [Severity level iDRG](https://medminutes.io/blog/idrg-severity-level-rumah-sakit-2026/)
- [iDRG dan mitigasi risiko keuangan RS](https://legawa.com/2026/06/02/idrg-sistem-baru-pembiayaan-jkn-dan-tantangan-mitigasi-risiko-keuangan-rumah-sakit/) · [Urutan investasi SIMRS 2027](https://medminutes.io/blog/urutan-investasi-ti-rs-2027-rme-klaim-elektronik-idrg/)

**KRIS dan rujukan**

- [KRIS (Disway)](https://malang.disway.id/nasional/read/9797/mayoritas-rs-siap-terapkan-kelas-rawat-inap-standar-kemenkes-sinkronisasi-kris-89-persen)
- [Rujukan berbasis kompetensi (Kemenkes)](https://www.kemkes.go.id/id/pemerintah-siapkan-penghapusan-rujukan-berjenjang-pasien-jkn-akan-langsung-ke-rs-yang-paling-kompeten) · [Permenkes 16/2024](https://medminutes.io/blog/sistem-rujukan-2026-permenkes-16-2024-rumah-sakit/)

**Data pribadi**

- [PDP (SNARS)](https://snars.web.id/pdp/pdp-info/peraturan.html) · [PDP dan rekam medis](https://meridianhukum.com/article/membuka-rekam-medis-pasien-tanpa-persetujuan)

**Pelaporan dan biometrik**

- [Bridging RS Online v3](https://sirs.kemkes.go.id/fo/downloads/bridging_rs_online_versi3_27012026.pdf) · [RL 3.19.8](https://legawa.com/2026/06/29/panduan-lengkap-perubahan-pelaporan-sirs-online-rl-3-19-8-strategi-rumah-sakit-menghadapi-era-baru-pengendalian-resistensi-antimikroba/) · [INM Kemenkes](https://keslan.kemkes.go.id/inm/index/16400)
- [Biometrik SEP RSPON](https://keslan.kemkes.go.id/read/3601/rspon-mahar-mardjono-jakarta-dan-bpjs-kesehatan-optimalkan-integrasi-sistem-pelayanan-guna-perkuat-layanan-digital-jkn) · [FRISTA RSUD Sukabumi](https://radarsukabumi.com/kota-sukabumi/mulai-berlaku-pasien-bpjs-di-rsud-bunut-wajib-jalani-pemindaian-wajah/)

**Perbandingan SIMRS**

- [SIMGOS (Kemenkes)](https://keslan.kemkes.go.id/simgos) · [Integrasi SIMRS RS vertikal](https://keslan.kemkes.go.id/read/4209/42-rs-vertikal-kemenkes-percepat-integrasi-simrs-terpusat-dan-satusehat)
- [Khanza vs SIMGOS](https://medminutes.io/blog/cara-memilih-simrs-direktur-rs-tipe-b-c-khanza-simgos-2026/) · [Review 5 SIMRS](https://kardiahis.id/news/blog/review-objektif-5-aplikasi-simrs-terbaik-di-indonesia-untuk-digitalisasi-faskes-2026) · [Medify](https://medify.id/artikel/detail/platform-simrs-yang-banyak-digunakan-di-rumah-sakit-swasta-di-indonesia) · [awesome-simrs](https://github.com/heru/awesome-simrs)
