# EHIS-Care — Gap Analysis

> Audit kelengkapan fitur vs standar regulasi & akreditasi.
> Update saat item selesai (tandai ~~strikethrough~~ + ✅) atau gap baru ditemukan.

---

## IGD — Audit Kelengkapan

### ✅ Tab / Fitur Sudah Ada

| Tab                                                                 | File                                    | Standar Terpenuhi            |
| ------------------------------------------------------------------- | --------------------------------------- | ---------------------------- |
| Triase (P1-P4, ABCDE, keluhan)                                      | `TriaseTab.tsx`                         | PMK 47/2018 · ESI            |
| TTV (TD, nadi, RR, suhu, SpO2, GCS, BB/TB) + Skala Nyeri NRS       | shared `TTVTab.tsx`                     | SNARS AP 1 · AP 1.2          |
| Monitoring Observasi Terjadwal (P1=15mnt/P2=30mnt/P3-P4=60mnt)     | shared `TTVTab.tsx` prop `triage`       | SNARS AP 2 · PMK 47/2018     |
| Asesmen Medis (Anamnesis, Riwayat, Alergi, Skrining Gizi, Edukasi) | `AsesmenMedisTab.tsx`                   | SNARS AP 1.1 · AP 1.4        |
| Diagnosa ICD-10 + ICD-9, status kepastian, alasan, INA-CBG         | shared `DiagnosaTab.tsx`                | PMK 269/2008 · PMK 76/2016   |
| CPPT/SOAP + DPJP verify + template + flag                           | shared `CPPTTab.tsx`                    | SNARS AP 2                   |
| Tindakan / Prosedur                                                 | `TindakanTab.tsx`                       | INA-CBG prosedur             |
| Informed Consent                                                    | shared `InformedConsentTab.tsx`         | PMK 290/2008 · HPK 2.1–2.2   |
| Rekonsiliasi Obat                                                   | `RekonsiliasTab.tsx`                    | SNARS PP 3.1                 |
| Asuhan Keperawatan (SDKI-based)                                     | `KeperawatanTab.tsx`                    | PPNI SDKI/SLKI/SIKI          |
| Pemeriksaan Fisik (11 sistem head-to-toe)                           | `PemeriksaanTab.tsx`                    | SNARS AP 1                   |
| Penilaian / Scoring (Morse, Braden, Barthel, NRS)                  | `PenilaianTab.tsx`                      | SKP 6 · SNARS AP 1.2–1.5     |
| Edukasi Terstruktur (topik checklist + metode + evaluasi)           | `EdukasiPane.tsx`                       | HPK 2                        |
| Penandaan Gambar (body diagram)                                     | `PenandaanGambarTab.tsx`                | Dokumentasi trauma/luka      |
| Daftar Order (order tracker)                                        | shared `DaftarOrderTab.tsx`             | PP 1                         |
| Resep Pasien                                                        | `ResepPasienTab.tsx`                    | PP obat                      |
| Order Lab                                                           | shared `OrderLabTab.tsx`                | SNARS AP 5                   |
| Order Radiologi                                                     | shared `OrderRadTab.tsx`                | SNARS AP 5                   |
| Rujukan Keluar (SBAR-based)                                         | `RujukanKeluarTab.tsx`                  | PMK 47/2018 · SKP 2          |
| Pasien Pulang (6 status) + SBAR Transfer IGD→RI                     | `PasienPulangTab.tsx` + `pasienPulang/` | PMK 269/2008 · ARK 5 · SKP 2 |
| Serah Terima Shift SBAR (Handover)                                  | shared `HandoverTab.tsx`                | SKP 2 · SNARS IPSG 2         |

### ❌ Gap IGD — Belum Ada / Belum Sesuai Standar

| Gap                                             | Standar                   | Prioritas  | Keterangan                                                                                           |
| ----------------------------------------------- | ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| **GCS Total Auto-calculate**                    | Clinical best practice    | 🟡 Sedang  | Total GCS tidak dihitung otomatis dari Eye + Verbal + Motor. Dikerjakan bersamaan dengan NEWS2.      |
| **NEWS2 / MEWS Auto-score**                     | Clinical decision support | 🟡 Sedang  | Tidak ada early warning score otomatis dari nilai TTV. → Tier 2 aktif                               |
| **High-Alert Medication (HAM) Label**           | SKP 3                     | 🟡 Sedang  | Pelabelan HAM di Resep/Rekonsiliasi IGD. RI sudah ada. → Tier 2 aktif                               |
| **Identifikasi Pasien sebelum Tindakan**        | SKP 1 · JCI IPSG 1        | 🟡 Sedang  | Konfirmasi 2 identitas (nama + tgl lahir / noRM) sebelum prosedur. → Tier 3 Backlog                 |
| **TBaK (Tulis Baca Konfirmasi)**                | SKP 2                     | 🟢 Rendah  | Dokumentasi instruksi verbal dokter. Bisa diintegrasikan ke CPPT                                    |
| **DNR / Advance Directive**                     | HPK 2.4                   | 🟢 Rendah  | Form keputusan akhir hidup untuk pasien terminal                                                     |
| **Laporan Insiden Keselamatan Pasien (IKP)**    | PMK 11/2017 · SNARS SKP   | ⏸ Ditunda  | Kemungkinan modul EHIS-Safety tersendiri                                                             |
| **Hasil Lab / Rad — Link ke EHIS-Lab/EHIS-Rad** | SNARS AP 5                | ⏸ Ditunda  | Ditunda sampai EHIS-Lab/EHIS-Rad real dibangun                                                       |

---

## Rawat Inap — Audit Kelengkapan

### ✅ Sudah Ada (Semua 14 Tab)

| Tab                                                                          | File                                          | Standar                    |
| ---------------------------------------------------------------------------- | --------------------------------------------- | -------------------------- |
| Asesmen Awal (5 sub-tab: Anamnesis/Riwayat/Alergi/Skrining/Penilaian Risiko) | `AsesmenAwalTab.tsx` + `asesmenAwal/`        | SNARS AP 1.1–1.5 + PP      |
| CPPT/SOAP date-grouped + DPJP verify + template + search + flag              | `CPPTTab.tsx` → shared                        | SNARS AP 2                 |
| TTV multi-shift expandable                                                   | `TTVTab.tsx` → shared                         | SNARS AP 1                 |
| Diagnosa ICD-10 + ICD-9, INA-CBG, status kepastian                           | `DiagnosaTab.tsx` → shared                    | PMK 269 · PMK 76           |
| Asuhan Keperawatan SDKI (15 dx), evaluasi shift, SLKI outcome                | `KeperawatanTab.tsx`                          | PPNI SDKI/SLKI/SIKI        |
| Pemeriksaan Fisik head-to-toe 11 sistem, quick-normal, body map              | `PemeriksaanTab.tsx`                          | SNARS AP 1                 |
| Intake/Output per shift, IWL auto-calc, balance, target DPJP                 | `IntakeOutputTab.tsx`                         | SNARS PP · fluid balance   |
| Resep Aktif (draft→confirm) + MAR Harian + Rekonsiliasi                      | `ResepTab.tsx` + `resep/`                     | SNARS PP 3.1 · PMK 72/2016 |
| Order Lab                                                                    | `OrderLabTab.tsx` → shared                    | SNARS AP 5                 |
| Order Radiologi                                                               | `OrderRadTab.tsx` → shared                    | SNARS AP 5                 |
| Konsultasi Antar SMF (SBAR + closed-loop + 22 SMF + timer)                   | `KonsultasiTab.tsx` + `konsultasi/`           | SNARS PP 1 · SKP 2         |
| Discharge Planning 3-step (Asesmen / Edukasi / Checklist H-1)                | `DischargePlanTab.tsx` + `discharge/`         | SNARS ARK 5                |
| Daftar Order                                                                 | `DaftarOrderTab.tsx` → shared                 | PP 1                       |
| Serah Terima Shift SBAR (Handover)                                            | `HandoverTab.tsx` → shared                    | SKP 2 · SNARS IPSG 2       |
| Pasien Pulang (Status + Obat & Jadwal + Surat + Resume Medik + Resume Pulang) | `PasienPulangTab.tsx` + `pasienPulang/`      | PMK 269/2008 · PMK 24/2022 |

### ❌ Gap RI — Belum Ada / Belum Sesuai Standar

| Gap                                                | Standar                       | Prioritas  | Keterangan                                                                              |
| -------------------------------------------------- | ----------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| **GCS + NEWS2 Auto-score**                         | SNARS AP 2                    | 🟡 Sedang  | TTV per shift sudah ada; perlu NEWS2/MEWS score otomatis. → Tier 2 aktif               |
| **Informed Consent (IC) di RI**                    | PMK 290/2008 · HPK 2.1–2.2    | 🔴 Tinggi  | IC wajib untuk tindakan invasif selama RI. Belum direncanakan. Shared IC tab bisa reuse |
| **Isolasi dan Precaution (PPI)**                   | SNARS PPI 1–7                 | 🟡 Sedang  | Jenis isolasi (Contact/Droplet/Airborne) + bundle VAP/CAUTI/CLABSI. → Tier 2 aktif     |
| **Rencana Asuhan Terintegrasi / Care Plan**        | SNARS PP 1                    | 🟡 Sedang  | Care plan DPJP + Perawat + PPA, target outcome harian. → Tier 2 aktif                  |
| **Print / Export Rekam Medis PDF**                 | PMK 269/2008                  | 🟡 Sedang  | CPPT, TTV, Resume Medis harus dapat dicetak sebagai dokumen legal. → Tier 2 aktif      |
| **Konsultasi Gizi / Monitoring Nutrisi**           | SNARS AP 1.4 · PMK gizi       | 🟡 Sedang  | Form konsultasi dietitian + rencana diet + monitoring asupan. Tier 3 Backlog            |
| **ICU/HCU Severity Scoring (APACHE II / SOFA)**    | SNARS PP · ICU international  | 🟡 Sedang  | Scoring harian + trending untuk ri-3 Syok Sepsis. Tier 3 Backlog                       |
| **Clinical Pathway (CP) Integration**              | PERMENKES 1438/2010 · INA-CBG | 🟡 Sedang  | Alur tatalaksana standar per diagnosis, CBG-aligned. Tier 3 Backlog                    |
| **Transfusi Darah**                                | SNARS PP 4                    | 🟢 Opsional | Pre/intra/post-transfusi checklist. Relevan untuk anemia/perdarahan                    |
| **Hasil Lab / Rad — Link ke EHIS-Lab/EHIS-Rad**    | SNARS AP 5                    | ⏸ Ditunda  | Ditunda sampai EHIS-Lab/EHIS-Rad real dibangun                                          |
| **Laporan IKP**                                    | PMK 11/2017 · SNARS SKP       | ⏸ Ditunda  | Kemungkinan modul EHIS-Safety tersendiri                                                |
