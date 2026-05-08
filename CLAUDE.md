# EHIS — Project Context & Work Queue

> **Read this first every new session.**
> **Before switching tasks or features:** (1) check off completed items, (2) move next item to 🔴 Now, (3) add any new findings to Tech Debt if needed.
> Skill refs: `@.claude/skills/frontend-design/SKILL.md`

---

## Stack

Next.js 16.2.3 App Router · React 19.2.4 · TypeScript 5 · Tailwind v4 (`@tailwindcss/postcss`) · Framer Motion 12 · Lucide React 1.8 · Prisma 7.7 (generated at `src/generated/prisma/`) · ESLint 9  
Utilities: `cn()` · `src/lib/utils.ts` | Navigation config: `src/lib/navigation.ts` | Mock data: `src/lib/data.ts`

---

## Module Map

| Route                | Module        | Layout                                  | Status      |
| -------------------- | ------------- | --------------------------------------- | ----------- |
| `/ehis-dashboard`    | Dashboard     | ModuleLayout                            | 🔧 Scaffold |
| `/ehis-care`         | Clinical Care | Sidebar (main) + Fullpage               | 🚧 Active   |
| `/ehis-registration` | Registration  | (main) ModuleLayout + (fullpage) Pasien | 🚧 Active   |
| `/ehis-billing`      | Billing       | ModuleLayout                            | 🔧 Scaffold |
| `/ehis-master`       | Master Data   | ModuleLayout                            | 🔧 Scaffold |
| `/ehis-report`       | Reports       | ModuleLayout                            | 🔧 Scaffold |
| `/ehis-lab`          | Laboratorium  | ModuleLayout                            | 🔧 Scaffold |
| `/ehis-rad`          | Radiologi     | ModuleLayout                            | 🔧 Scaffold |

Shared layout: `Navbar` · `Sidebar` · `ModuleSwitcher` · `ModuleLayout` → `src/components/layout/`

---

## EHIS-Care: Component Status

### Shared Medical Records (`src/components/shared/medical-records/`)

| Component        | File                | Used By          | Notes                                                                         |
| ---------------- | ------------------- | ---------------- | ----------------------------------------------------------------------------- |
| `CPPTTab`        | `CPPTTab.tsx`       | IGD · Rawat Inap | `showDate`: date-grouped for RI · `requiresVerification`: DPJP co-sign for RI |
| `CPPTEntryCard`  | `CPPTEntryCard.tsx` | CPPTTab          | Sub-component: flag, verification footer, SOAP rows                           |
| `cpptShared`     | `cpptShared.ts`     | CPPTTab · Card   | Constants: `PROFESI_CLS`, `SOAP_BADGE`, `fmtDate`, `todayISO`                 |
| `TTVTab`         | `TTVTab.tsx`        | IGD · Rawat Inap | `history` prop: multi-shift timeline for RI                                   |
| `DiagnosaTab`    | `DiagnosaTab.tsx`   | IGD · Rawat Inap | ICD-10 + ICD-9, status kepastian, alasan/analisa inline, INA-CBG preview      |
| `diagnosaShared` | `diagnosaShared.ts` | DiagnosaTab      | Katalog ICD10/ICD9, `TIPE_CONFIG`, `STATUS_CONFIG`, `INA_CBG_MAP`             |

### IGD (~95% done)

| Layer                                                            | File                                 | Status |
| ---------------------------------------------------------------- | ------------------------------------ | ------ |
| Board                                                            | `components/igd/IGDBoard.tsx`        | ✅     |
| Patient card                                                     | `components/igd/PatientCard.tsx`     | ✅     |
| Room panel                                                       | `components/igd/IGDRuanganPanel.tsx` | ✅     |
| Patient header                                                   | `components/igd/PatientHeader.tsx`   | ✅     |
| Tab router                                                       | `components/igd/IGDRecordTabs.tsx`   | ✅     |
| triase · ttv · asesmen · cppt                                    | tabs/ (ttv+cppt → thin wrappers)     | ✅     |
| diagnosa                                                         | tabs/ (thin wrapper → shared)        | ✅     |
| tindakan · disposisi · rekonsiliasi · keperawatan                | tabs/                                | ✅     |
| pemeriksaan · penilaian · resep · order-lab · order-rad · pulang | tabs/                                | ✅     |
| rujukan                                                          | `tabs/RujukanKeluarTab.tsx`          | ✅     |
| Penandaan Gambar                                                 | tabs/penandaanGambar.tsx             | ✅     |

### Rawat Inap (~40% done)

| Layer            | File                                         | Status                                                                    |
| ---------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| Board            | `components/rawat-inap/RIBoard.tsx`          | ✅ + link ke detail page                                                  |
| Bed panel        | `components/rawat-inap/RIRuanganPanel.tsx`   | ✅                                                                        |
| Patient header   | `components/rawat-inap/RIPatientHeader.tsx`  | ✅ status-based theme, vitals bar                                         |
| Tab router       | `components/rawat-inap/RIRecordTabs.tsx`     | ✅ 3 tab aktif, 7 "Segera Hadir"                                          |
| CPPT/SOAP        | `components/rawat-inap/tabs/CPPTTab.tsx`     | ✅ date-grouped, DPJP verify, template, search/filter, flag tindak lanjut |
| TTV              | `components/rawat-inap/tabs/TTVTab.tsx`      | ✅ multi-shift history, expandable                                        |
| Diagnosa         | `components/rawat-inap/tabs/DiagnosaTab.tsx` | ✅ thin wrapper → shared (ICD-10 + ICD-9, status, alasan, INA-CBG)        |
| Asuhan Kep.      | `components/rawat-inap/tabs/KeperawatanTab.tsx` | ✅ SDKI katalog 15 dx, evaluasi per shift, status luaran badge, SLKI outcome |
| Pemeriksaan      | `components/rawat-inap/tabs/PemeriksaanTab.tsx` | ✅ head-to-toe accordion per sistem, quick-normal template, body map, riwayat harian |
| Intake/Output    | tabs/IntakeOutputTab.tsx                     | 🔜 new (RI-specific)                                                      |
| Resep & Obat     | tabs/ResepTab.tsx                            | 🔜 (reuse shared)                                                         |
| Order Lab        | tabs/OrderLabTab.tsx                         | 🔜 (reuse shared)                                                         |
| Order Radiologi  | tabs/OrderRadTab.tsx                         | 🔜 (reuse shared)                                                         |
| Konsultasi       | tabs/KonsultasiTab.tsx                       | 🔜 new (RI-specific)                                                      |
| Discharge Plan   | tabs/DischargePlanTab.tsx                    | 🔜 new (RI-specific)                                                      |
| Route (fullpage) | `app/ehis-care/(fullpage)/rawat-inap/[id]/`  | ✅ page.tsx + layout.tsx                                                  |
| Mock data        | `data.ts` `rawatInapPatientDetails`          | ✅ ri-1 (GJK) + ri-3 (Syok Sepsis) — diagnosa + status + alasan           |

### Rawat Jalan (~0% — Planned)

| Layer                                  | File                                         | Status |
| -------------------------------------- | -------------------------------------------- | ------ |
| Board / Antrian                        | `components/rawat-jalan/RJBoard.tsx`         | 🔜     |
| Patient header                         | `components/rawat-jalan/RJPatientHeader.tsx` | 🔜     |
| Tab router                             | `components/rawat-jalan/RJRecordTabs.tsx`    | 🔜     |
| Skrining TTV (thin wrapper)            | `tabs/TTVTab.tsx` → shared                   | 🔜     |
| CPPT / Konsultasi (thin wrapper)       | `tabs/CPPTTab.tsx` → shared                  | 🔜     |
| Diagnosa (thin wrapper)                | `tabs/DiagnosaTab.tsx` → shared              | 🔜     |
| Pemeriksaan Fisik (reuse IGD)          | `tabs/PemeriksaanTab.tsx`                    | 🔜     |
| Penilaian / Scoring (reuse IGD)        | `tabs/PenilaianTab.tsx`                      | 🔜     |
| Resep & Obat (reuse shared)            | `tabs/ResepTab.tsx`                          | 🔜     |
| Order Lab (reuse shared)               | `tabs/OrderLabTab.tsx`                       | 🔜     |
| Order Radiologi (reuse shared)         | `tabs/OrderRadTab.tsx`                       | 🔜     |
| Informed Consent (prosedur minor poli) | `tabs/InformedConsentTab.tsx`                | 🔜     |
| Disposisi / Surat                      | `tabs/DisposisiRJTab.tsx`                    | 🔜     |
| Route (fullpage)                       | `app/ehis-care/(fullpage)/rawat-jalan/[id]/` | 🔜     |

### Pasien Master (di bawah `ehis-registration`)

| File                                              | Route                                                    | Status                                             |
| ------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| `components/registration/PatientDashboard.tsx`    | `/ehis-registration/pasien/[id]`                         | ✅ Full (tabs, search, modals, riwayat kunjungan)  |
| `components/registration/KunjunganDetailPage.tsx` | `/ehis-registration/pasien/[id]/kunjungan/[kunjunganId]` | ✅ Halaman detail pendaftaran kunjungan (fullpage) |

---

## Clinical Standards & Compliance

Standards yang menjadi acuan pengembangan EHIS-Care:

### Regulasi Nasional (Kemenkes)

| Peraturan            | Topik                               | Implikasi pada Sistem                                             |
| -------------------- | ----------------------------------- | ----------------------------------------------------------------- |
| PMK 269/2008         | Rekam Medis                         | ICD-10 wajib, resume medis wajib, identifikasi pasien, SOAP       |
| PMK 290/2008         | Persetujuan Tindakan Medis          | IC tertulis wajib sebelum semua tindakan invasif                  |
| PMK 47/2018          | Pelayanan Kegawatdaruratan          | Triase ESI, observasi terjadwal, transfer internal/eksternal      |
| PMK 76/2016          | INA-CBG                             | Grouper diagnosis + prosedur ICD-10/ICD-9 untuk klaim BPJS        |
| PMK 11/2017          | Keselamatan Pasien                  | 6 Sasaran Keselamatan Pasien (SKP / IPSG)                         |
| PMK 72/2016          | Standar Pelayanan Kefarmasian di RS | Formularium RS, HAM, rekonsiliasi obat, unit dose dispensing, MAR |
| PMK 4/2018           | Formularium Nasional (Fornas)       | Obat Fornas wajib untuk pasien BPJS; pengendalian peresepan       |
| PERMENKES 1438/2010  | Standar Pelayanan Kedokteran        | Clinical Pathway per diagnosis wajib per KSM; acuan PPK           |
| SNARS Ed. 1.1 (KARS) | Akreditasi RS                       | Standar AP, ARK, PP, HPK, SKP, PPI — detail di bawah              |

### Standar Klinis Profesi

| Badan     | Standar                      | Konteks                                              |
| --------- | ---------------------------- | ---------------------------------------------------- |
| PPNI      | SDKI · SLKI · SIKI (2018)    | Diagnosa + Luaran + Intervensi Keperawatan Indonesia |
| IDI / KSM | Panduan Praktik Klinis (PPK) | Standar tatalaksana per diagnosis                    |
| PERDICI   | Triase IGD (ESI Level 1–5)   | Emergency Severity Index                             |

### Standar Internasional

| Standar                       | Topik                                                                       |
| ----------------------------- | --------------------------------------------------------------------------- |
| JCI IPSG 1–6                  | Patient identification, SBAR, HAM, surgical safety, hand hygiene, fall      |
| WHO Surgical Safety Checklist | Sign-in → Time-out → Sign-out                                               |
| NEWS2 / MEWS                  | Early Warning Score berbasis TTV otomatis                                   |
| APACHE II / SOFA              | ICU/HCU severity scoring                                                    |
| HIMSS EMRAM Level 1–7         | Tingkat kematangan adopsi EMR — acuan roadmap digitalisasi RS               |
| HL7 FHIR R4                   | Standar interoperabilitas data klinis antar sistem (Lab, Rad, BPJS, P-Care) |

---

## Clinical Documentation Flow

Alur dokumentasi klinis lengkap per setting perawatan — menjadi acuan tab apa saja yang harus ada.

### IGD — Alur Ideal Per Kunjungan

```
[Pendaftaran] ──► [Triase ESI] ──► [TTV Awal + Skala Nyeri] ──► [Asesmen Awal Medis & Kep.]
                                                                        │
                              ┌─────────────────────────────────────────┘
                              ▼
              [Pemeriksaan Fisik] ──► [Penilaian/Scoring: GCS, EWS, Jatuh, Braden, ADL]
                              │
                              ▼
              [Diagnosa ICD-10 + Tipe + Status] ──► [INA-CBG Preview]
                              │
                              ▼
              [Tindakan/Prosedur] ──► [Informed Consent] ──► [Rekonsiliasi Obat]
                              │
                              ├──► [Resep & Obat] ──► [Order Lab] ──► [Order Rad]
                              │
                              ▼
              [CPPT/SOAP ongoing] ◄──► [Monitoring TTV Ulang (terjadwal)]
                              │
                              ▼
              [Asuhan Keperawatan SDKI/SIKI] ──► [Edukasi Pasien & Keluarga]
                              │
                              ▼
         [Disposisi: Pulang | Rawat Inap | Rujuk Keluar | APS | Meninggal]
                              │
              ┌───────────────┼──────────────────┐
              ▼               ▼                  ▼
      [Surat Pulang]  [SBAR Transfer RI]  [Surat Rujukan]
```

### Rawat Inap — Alur Ideal Per Episode

```
[Transfer dari IGD / Masuk Langsung]
          │
          ▼
[Asesmen Awal RI — wajib dalam 24 jam (SNARS AP 1)]
  • Anamnesis lengkap (RPS, RPD, RPK, sosek, spiritual)
  • Pemeriksaan fisik head-to-toe
  • ADL / Barthel Index
  • Asesmen Nutrisi (MST)
  • Asesmen Risiko Jatuh (Morse)
  • Asesmen Risiko Decubitus (Braden)
          │
          ▼
[Diagnosa ICD-10] ──► [Rencana Asuhan Terintegrasi (DPJP + Kep + PPA)]
          │
          ▼
┌─────────────────────── SIKLUS HARIAN ──────────────────────────┐
│  • CPPT/SOAP per shift (DPJP + Perawat + PPA)                  │
│  • TTV per shift (pagi / siang / malam) + NEWS2                │
│  • Asuhan Keperawatan (SDKI/SLKI/SIKI) — evaluasi harian       │
│  • Intake/Output — balance cairan per shift                    │
│  • Pemeriksaan Fisik terjadwal                                 │
│  • Monitoring Nyeri (0–10)                                     │
└────────────────────────────────────────────────────────────────┘
          │
          ├──► [Order Lab] ──► [Order Radiologi] ──► [Konsultasi SMF]
          │
          ├──► [Resep & Obat / MAR (Medication Administration Record)]
          │
          ▼
[Discharge Planning — mulai hari ke-1 (SNARS ARK 5)]
  • Edukasi pasien & keluarga
  • Kebutuhan home care
  • Rencana follow-up & kontrol
  • Obat pulang & instruksi
          │
          ▼
[Resume Medis — wajib PMK 269/2008] ──► [Surat Pulang / Rujukan]
```

### Rawat Jalan — Alur Ideal Per Kunjungan

```
[Pendaftaran / Antrian Poliklinik] ──► [Verifikasi Kepesertaan BPJS / SEP]
          │
          ▼
[Triase / Skrining Awal Perawat]  • TTV + Skala Nyeri  • Keluhan utama
          │
          ▼
[Konsultasi Dokter]
  • Anamnesis + Pemeriksaan Fisik  • CPPT / SOAP  • Diagnosa ICD-10 + Tipe
          │
          ├──► [Resep & Obat] ──► [Order Lab] ──► [Order Rad]
          │
          ├──► [Informed Consent] (untuk prosedur minor di poli)
          │
          ▼
[Hasil Pemeriksaan Lab / Rad] ──► [Re-evaluasi & Follow-up CPPT]
          │
          ▼
[Disposisi: Pulang | Rujuk IGD | Rawat Inap | Konsul SMF Lain]
          │
          ▼
[Surat Kontrol / Surat Rujukan / Resume Kunjungan / Resep Pulang]
```

---

## Gap Analysis: EHIS-Care

### IGD — Audit Kelengkapan

#### ✅ Tab / Fitur Sudah Ada

| Tab                                                                 | File                     | Standar Terpenuhi          |
| ------------------------------------------------------------------- | ------------------------ | -------------------------- |
| Triase (P1-P4, ABCDE, keluhan)                                      | `TriaseTab.tsx`          | PMK 47/2018 · ESI          |
| TTV (TD, nadi, RR, suhu, SpO2, GCS, BB/TB)                          | shared `TTVTab.tsx`      | SNARS AP 1                 |
| Asesmen Medis (Anamnesis, Riwayat, Alergi, Skrining Gizi, Edukasi)  | `AsesmenMedisTab.tsx`    | SNARS AP 1.1 · AP 1.4      |
| Diagnosa ICD-10 + ICD-9, status kepastian, alasan, INA-CBG          | shared `DiagnosaTab.tsx` | PMK 269/2008 · PMK 76/2016 |
| CPPT/SOAP + DPJP verify + template + flag                           | shared `CPPTTab.tsx`     | SNARS AP 2                 |
| Tindakan / Prosedur                                                 | `TindakanTab.tsx`        | INA-CBG prosedur           |
| Rekonsiliasi Obat                                                   | `RekonsiliasTab.tsx`     | SNARS PP 3.1               |
| Asuhan Keperawatan (SDKI-based)                                     | `KeperawatanTab.tsx`     | PPNI SDKI/SLKI/SIKI        |
| Pemeriksaan Fisik (per-sistem)                                      | `PemeriksaanTab.tsx`     | SNARS AP 1                 |
| Penilaian / Scoring (multi-tab)                                     | `PenilaianTab.tsx`       | Clinical decision support  |
| Penandaan Gambar (body diagram)                                     | `PenandaanGambarTab.tsx` | Dokumentasi trauma/luka    |
| Daftar Order (order tracker)                                        | `DaftarOrderTab.tsx`     | PP 1                       |
| Resep Pasien                                                        | `ResepPasienTab.tsx`     | PP obat                    |
| Order Lab                                                           | `OrderLabTab.tsx`        | SNARS AP                   |
| Order Radiologi                                                     | `OrderRadTab.tsx`        | SNARS AP                   |
| Rujukan Keluar (SBAR-based)                                         | `RujukanKeluarTab.tsx`   | PMK 47/2018 · SKP 2        |
| Pasien Pulang (6 status)                                            | `PasienPulangTab.tsx`    | PMK 269/2008 · ARK 5       |
| Morse Fall Scale (risiko jatuh)                                     | `PenilaianTab.tsx`       | SKP 6 · SNARS AP 1.5       |
| Braden Scale (risiko dekubitus)                                     | `PenilaianTab.tsx`       | SNARS PP                   |
| Barthel Index (status fungsional / ADL)                             | `PenilaianTab.tsx`       | SNARS AP 1                 |
| Skala Nyeri NRS (0–10) sebagai scoring panel                        | `PenilaianTab.tsx`       | SNARS AP 1.2               |
| Edukasi Terstruktur (topik checklist + metode + evaluasi pemahaman) | `EdukasiPane.tsx`        | HPK 2                      |

#### ❌ Gap IGD — Belum Ada / Belum Sesuai Standar

| Gap                                             | Standar                    | Prioritas | Keterangan                                                                                                                      |
| ----------------------------------------------- | -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Skala Nyeri di form TTV**                     | SNARS AP 1.2               | 🔴 Kritis | Field `skalaNyeri` ada di type tapi tidak muncul/diisi di TTVTab. Wajib per SNARS                                               |
| **Informed Consent (IC)**                       | PMK 290/2008 · HPK 2.1–2.2 | 🔴 Tinggi | IC tertulis wajib untuk semua tindakan invasif. Belum ada form IC sama sekali                                                   |
| **SBAR Transfer (IGD → Rawat Inap)**            | SKP 2 · PMK 11/2017        | 🔴 Tinggi | Saat ini tidak ada form transfer SBAR internal. Rujukan Keluar sudah ada tapi hanya eksternal                                   |
| **Monitoring Observasi Terjadwal**              | SNARS AP 2                 | 🔴 Tinggi | Re-asesmen berkala wajib: P1=15 mnt, P2=30 mnt, P3=60 mnt. TTV saat ini hanya single-entry                                      |
| **GCS Total Auto-calculate**                    | Clinical best practice     | 🟡 Sedang | Total GCS tidak dihitung otomatis dari Eye + Verbal + Motor                                                                     |
| **NEWS2 / MEWS Auto-score**                     | Clinical decision support  | 🟡 Sedang | Tidak ada early warning score otomatis dari nilai TTV yang dimasukkan                                                           |
| **High-Alert Medication (HAM) Label**           | SKP 3                      | 🟡 Sedang | Pelabelan HAM di Resep/Rekonsiliasi, peringatan double-check belum ada                                                          |
| **Hasil Lab / Rad — Link ke EHIS-Lab/EHIS-Rad** | SNARS AP 5                 | 🟡 Sedang | Arsitektur: hasil ada di modul terpisah EHIS-Lab / EHIS-Rad. Rekam medis IGD perlu menampilkan link/referensi ke hasil tersebut |
| **SBAR Serah Terima Shift (Handover)**          | SKP 2 · SNARS IPSG 2       | 🔴 Tinggi | Tidak ada dokumentasi handover pasien antar shift. Wajib per SKP 2 untuk keselamatan komunikasi efektif                         |
| **Identifikasi Pasien sebelum Tindakan**        | SKP 1 · JCI IPSG 1         | 🟡 Sedang | Konfirmasi 2 identitas (nama + tgl lahir / noRM) sebelum setiap prosedur. Perlu mekanisme verifikasi di UI                      |
| **Laporan Insiden Keselamatan Pasien (IKP)**    | PMK 11/2017 · SNARS SKP    | 🟡 Sedang | Form pelaporan KTD / KNC / Sentinel event. Dapat menjadi sub-form rekam medis atau modul EHIS-Safety                            |
| **TBaK (Tulis Baca Konfirmasi)**                | SKP 2                      | 🟢 Rendah | Dokumentasi instruksi verbal dokter. Bisa diintegrasikan ke CPPT                                                                |
| **DNR / Advance Directive**                     | HPK 2.4                    | 🟢 Rendah | Form keputusan akhir hidup untuk pasien terminal                                                                                |

---

### Rawat Inap — Audit Kelengkapan

#### ✅ Sudah Ada

| Tab                                                | File                            | Standar          |
| -------------------------------------------------- | ------------------------------- | ---------------- |
| CPPT/SOAP date-grouped + DPJP verify               | `tabs/CPPTTab.tsx` → shared     | SNARS AP 2       |
| TTV multi-shift expandable                         | `tabs/TTVTab.tsx` → shared      | SNARS AP 1       |
| Diagnosa ICD-10 + ICD-9, INA-CBG, status kepastian | `tabs/DiagnosaTab.tsx` → shared | PMK 269 · PMK 76 |

#### ❌ Gap RI — Tab Direncanakan (7 Tab, Belum Dibuat)

| Tab                      | File Target                 | Standar                  | Prioritas |
| ------------------------ | --------------------------- | ------------------------ | --------- |
| ~~Asuhan Keperawatan~~   | `tabs/KeperawatanTab.tsx`   | PPNI SDKI/SLKI/SIKI      | ✅ Selesai |
| ~~Pemeriksaan Fisik~~    | `tabs/PemeriksaanTab.tsx`   | SNARS AP 1               | ✅ Selesai |
| **Intake / Output**      | `tabs/IntakeOutputTab.tsx`  | SNARS PP · fluid balance | 🔴        |
| **Resep & Obat (+ MAR)** | `tabs/ResepTab.tsx`         | SNARS PP 3.1 · PMK obat  | 🔴        |
| **Order Lab**            | `tabs/OrderLabTab.tsx`      | SNARS AP                 | 🟡        |
| **Order Radiologi**      | `tabs/OrderRadTab.tsx`      | SNARS AP                 | 🟡        |
| **Discharge Planning**   | `tabs/DischargePlanTab.tsx` | SNARS ARK 5              | 🔴        |

#### ❌ Gap RI — Tab Belum Direncanakan tapi Wajib Standar

| Tab                                                  | Standar                       | Prioritas   | Keterangan                                                                                                                                                      |
| ---------------------------------------------------- | ----------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asesmen Awal RI (MRS Assessment)**                 | SNARS AP 1 — wajib 24 jam     | 🔴 Kritis   | Anamnesis lengkap (RPS, RPD, RPK, sosek, spiritual), pemfis awal masuk, ADL Barthel, MST gizi, Morse jatuh, Braden decubitus. **Tab ini belum ada sama sekali** |
| **Konsultasi Antar SMF**                             | SNARS PP 1 · ARK              | 🔴 Tinggi   | Form permintaan + jawaban konsultasi + monitoring response time antar spesialis                                                                                 |
| **Resume Medis / Surat Pulang**                      | PMK 269/2008 — wajib          | 🔴 Tinggi   | Harus tersedia setiap discharge: diagnosa akhir, prosedur, kondisi pulang, obat pulang, instruksi follow-up                                                     |
| **Rencana Asuhan Terintegrasi**                      | SNARS PP 1                    | 🟡 Sedang   | Care plan bersama DPJP + Perawat + PPA lain, target outcome harian, clinical pathway                                                                            |
| **Monitoring Harian / Observasi**                    | SNARS AP 2                    | 🟡 Sedang   | TTV per shift sudah ada; perlu tambah monitoring nyeri per shift + NEWS2/MEWS score otomatis                                                                    |
| **Transfusi Darah**                                  | SNARS PP 4                    | 🟢 Opsional | Pre/intra/post-transfusi checklist. Relevan untuk pasien tertentu (anemia, perdarahan)                                                                          |
| **Hasil Lab / Rad — Link ke EHIS-Lab/EHIS-Rad**      | SNARS AP 5                    | 🟡 Sedang   | Arsitektur: hasil ada di modul terpisah. Rekam medis RI perlu menampilkan referensi/link ke hasil lab/rad dari EHIS-Lab/EHIS-Rad                                |
| **SBAR Serah Terima Antar Shift (Nursing Handover)** | SKP 2 · SNARS IPSG 2          | 🔴 Tinggi   | Dokumentasi handover perawat/dokter antar shift; dapat terintegrasi dengan CPPT atau tab tersendiri                                                             |
| **Informed Consent (IC) di Rawat Inap**              | PMK 290/2008 · HPK 2.1–2.2    | 🔴 Tinggi   | IC wajib untuk tindakan invasif selama RI. Belum direncanakan sama sekali untuk modul RI                                                                        |
| **Clinical Pathway (CP) Integration**                | PERMENKES 1438/2010 · INA-CBG | 🟡 Sedang   | Alur tatalaksana standar per diagnosis (CBG-aligned); audit kepatuhan + optimasi klaim BPJS                                                                     |
| **ICU/HCU Severity Scoring (APACHE II / SOFA)**      | SNARS PP · ICU international  | 🟡 Sedang   | Untuk pasien ICU/HCU: scoring APACHE II + SOFA harian + trending. Ada di standar tapi belum ada dalam plan                                                      |
| **Isolasi dan Precaution (PPI)**                     | SNARS PPI 1–7                 | 🟡 Sedang   | Dokumentasi jenis isolasi (Contact/Droplet/Airborne), bundle VAP/CAUTI/CLABSI. Wajib akreditasi SNARS                                                           |
| **Konsultasi Gizi / Monitoring Nutrisi**             | SNARS AP 1.4 · PMK gizi       | 🟡 Sedang   | Berbeda dari skrining gizi awal: form konsultasi dietitian + rencana diet + monitoring asupan, terintegrasi I/O                                                 |
| **Print / Export Rekam Medis (PDF)**                 | PMK 269/2008 — wajib          | 🟡 Sedang   | Rekam medis harus dapat dicetak/dieksport sebagai dokumen legal (CPPT, TTV, diagnosa, resume medis)                                                             |
| **Laporan Insiden Keselamatan Pasien (IKP)**         | PMK 11/2017 · SNARS SKP       | 🟡 Sedang   | Form pelaporan KTD/KNC/Sentinel. Dapat menjadi modul EHIS-Safety atau fitur dalam rekam medis                                                                   |

---

### Keputusan Scope Arsitektur

Keputusan yang sudah dan belum diambil terkait scope dan arsitektur modul EHIS.

| Modul                              | Standar                            | Keputusan                     | Keterangan                                                                                                                    |
| ---------------------------------- | ---------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Rawat Jalan (Poliklinik)**       | SNARS AP 1 · PMK 269/2008          | ✅ Masuk EHIS-Care            | Sub-modul `/ehis-care/rawat-jalan`. Mayoritas reuse shared components dari IGD. Lihat section Rawat Jalan di Component Status |
| **EHIS-Lab (Laboratorium)**        | SNARS AP 5                         | ✅ Modul Terpisah `/ehis-lab` | Rekam medis IGD/RI menampilkan referensi/link ke hasil, tidak embed. Modul Lab scaffold terpisah                              |
| **EHIS-Rad (Radiologi)**           | SNARS AP 5                         | ✅ Modul Terpisah `/ehis-rad` | Sama dengan EHIS-Lab. Rekam medis hanya referensi ke modul Rad                                                                |
| **IBS / Kamar Operasi**            | WHO Surgical Checklist · SNARS PAB | 🟡 Roadmap Jangka Panjang     | Pre-op, anestesi record, Sign-in/Time-out/Sign-out, PACU monitoring                                                           |
| **BPJS / P-Care Integration**      | PMK 76/2016 · BPJS IT              | ⏸ TBD                         | Keputusan belum diperlukan; fokus UI clinical dulu                                                                            |
| **Farmasi Klinis (EHIS-Pharmacy)** | PMK 72/2016 · PMK 4/2018           | 🟡 Roadmap                    | Dispensing, verifikasi apoteker, HAM, unit dose. Berbeda dari Resep & Obat di rekam medis                                     |
| **Laporan IKP (EHIS-Safety)**      | PMK 11/2017 · SNARS SKP            | 🟡 Roadmap                    | KTD/KNC/Sentinel → review → grading → tindak lanjut → dashboard                                                               |

---

## TODO Queue

Work items in priority order. Pick top item each session.

### 🔴 Now — Rawat Inap Tabs (Urutan Pengerjaan)

1. - [x] **Asuhan Keperawatan** (`tabs/KeperawatanTab.tsx`) — ✅ SDKI katalog 15 dx + auto-fill, evaluasi inline per shift, status luaran badge (Teratasi/Sebagian/Belum/Dipantau), SLKI kriteria hasil, verifikasi supervisor. Sub-components: `keperawatan/AsuhanForm.tsx` + `AsuhanCard.tsx`. Shared: `keperawatanShared.ts`
2. - [x] **Pemeriksaan Fisik** (`tabs/PemeriksaanTab.tsx`) — ✅ Status generalis (KU/Kesadaran/Gizi/Orientasi pills), 11 sistem head-to-toe accordion, quick-normal template per sistem + "Semua Normal" global, temuan abnormal checklist, body map penandaan area, riwayat harian collapsible. Sub-components: `pemeriksaan/StatusFisikPane.tsx` + `BodyMapPane.tsx` + `RiwayatPane.tsx`. Types: `KU`, `KesadaranPF`, `StatusGizi`, `PemeriksaanFisikEntry` di `data.ts`.
3. - [ ] **Intake / Output** (`tabs/IntakeOutputTab.tsx`) — cairan masuk (oral/IV/NGT) + keluar (urine/drain/IWL) per shift, balance cairan harian. RI-specific
4. - [ ] **Resep & Obat** (`tabs/ResepTab.tsx`) — MAR (Medication Administration Record), rekonsiliasi obat masuk, pemberian obat per shift. Reuse IGD `ResepPasienTab`
5. - [ ] **Order Lab** (`tabs/OrderLabTab.tsx`) — reuse IGD `OrderLabTab`
6. - [ ] **Order Radiologi** (`tabs/OrderRadTab.tsx`) — reuse IGD `OrderRadTab`
7. - [ ] **Discharge Planning** (`tabs/DischargePlanTab.tsx`) — edukasi, home care, obat pulang, follow-up, resume medis. RI-specific

### 🟠 Berikutnya — Gap Kritis (Post RI Tabs)

- [ ] **Asesmen Awal RI (MRS)** — Tab baru RI: anamnesis lengkap, pemfis masuk, ADL Barthel, MST gizi, Morse jatuh, Braden decubitus. Wajib per SNARS AP 1 (24 jam pertama). Perlu type baru di `data.ts`
- [ ] **Konsultasi Antar SMF** (`tabs/KonsultasiTab.tsx`) — request form + jawaban + response time tracker. RI-specific
- [ ] **Skala Nyeri di TTVTab** — tambahkan field `skalaNyeri` (0–10) ke form TTVTab shared (IGD + RI). Type sudah ada di `IGDVitalSigns`. Wajib SNARS AP 1.2
- [ ] **SBAR Transfer IGD→RI** — form transfer internal yang terintegrasi dengan tab Pasien Pulang IGD (pilih "Rawat Inap") + trigger ke penerimaan RI. Standar SKP 2
- [ ] **Link Hasil Lab/Rad ke EHIS-Lab/EHIS-Rad** — tambahkan referensi/link di rekam medis IGD dan RI ke hasil pemeriksaan di modul terpisah. Arsitektur: tidak embed, hanya reference link
- [ ] **SBAR Serah Terima Shift (Handover)** — dokumentasi handover pasien antar shift. Wajib SKP 2. Dapat terintegrasi dengan CPPT atau sub-tab tersendiri di RI

### 🟡 Backlog EHIS-Care (Gap Standar Sedang)

- [ ] **Informed Consent (IC)** — form IC tertulis untuk tindakan invasif. Modal atau tab khusus. PMK 290/2008
- [ ] **GCS + NEWS2 Auto-calculation** — hitung total GCS otomatis di TTVTab; hitung NEWS2/MEWS dari nilai TTV. Clinical decision support
- [ ] **Resume Medis / Surat Pulang RI** — dokumen ringkasan pulang: diagnosa akhir, prosedur, obat, follow-up. Bagian dari DischargePlan
- [ ] **Rencana Asuhan Terintegrasi (Care Plan)** — shared care plan DPJP + Perawat + PPA. Bisa jadi sub-tab di CPPT
- [ ] **Clinical Pathway Integration** — alur tatalaksana standar per diagnosis, CBG-aligned; audit kepatuhan + optimasi klaim BPJS
- [ ] **ICU/HCU Scoring (APACHE II / SOFA)** — daily severity scoring untuk pasien ICU/HCU di modul RI
- [ ] **Isolasi dan PPI Documentation** — jenis isolasi + bundle care per standar SNARS PPI
- [ ] **Print/Export Rekam Medis (PDF)** — resume medis, CPPT, TTV — kebutuhan legal PMK 269/2008
- [ ] **Laporan IKP (Insiden Keselamatan Pasien)** — form KTD/KNC/Sentinel; bisa standalone (EHIS-Safety) atau embed di patient record
- [ ] **Rawat Jalan (Poliklinik)** — ✅ dikonfirmasi masuk EHIS-Care. Sub-modul `/ehis-care/rawat-jalan`: antrian, skrining TTV, konsultasi, CPPT, resep, order lab/rad, disposisi. Mayoritas reuse shared components dari IGD. Mulai setelah RI core tabs selesai

### ✅ Selesai (EHIS-Registration)

- [x] **PatientDashboard redesign** — 2-column layout (info+penjamin+jadwal / profil+riwayat terkini+tagihan), compact penjamin card, new "Riwayat Pendaftaran Terkini" card, bottom CTA replaces table, modal renamed ke "Riwayat Pendaftaran", responsive multidevice

### ✅ Selesai (EHIS-Care)

- [x] **Diagnosa — shared + redesign** — `shared/medical-records/DiagnosaTab.tsx` (ICD-10 + ICD-9-CM, status kepastian Pasti/Dicurigai/Diferensial, alasan & analisa klinis inline collapsible, INA-CBG preview chip). `diagnosaShared.ts` (katalog, configs). IGD refactor ke thin wrapper. RI thin wrapper baru. `DiagnosaStatus` type + extend `IGDDiagnosa` di `data.ts`.
- [x] **CPPT — interaktif + SNARS compliance** — DPJP co-sign verification, Template SOAP (4 template), Search & Filter riwayat, Flag Tindak Lanjut. File split: `cpptShared.ts` + `CPPTEntryCard.tsx` + `CPPTTab.tsx` (<700 baris).
- [x] **Rawat Inap — fullpage detail (CPPT + TTV)** — route `/ehis-care/rawat-inap/[id]`, `RIPatientHeader` (status-based theme, vitals bar, ward/bed chips), `RIRecordTabs` (10 tabs, 2 aktif), shared `CPPTTab` (date-grouped, Framer Motion stagger) + shared `TTVTab` (multi-shift history expandable rows, kesadaran selector). `RawatInapPatientDetail` type + mock data ri-1/ri-3 di `data.ts`.
- [x] **IGD Triase Modal** — tombol "+ Triase" di page header IGD, modal fullscreen dengan primary survey (ABCDE), backdrop shake on outside-click, portal-based z-index, `IGDTriaseButton` client component, `TriaseModal` + `TriasePrimaryForm` components
- [x] **Rawat Inap — halaman utama** — `/ehis-care/rawat-inap`: header + BOR gauge + 6 stats card, `RIRuanganPanel` (7 kelas dengan occupancy ring + bed map modal), `RIBoard` (filter status/kelas/DPJP/search + patient cards), mock data di `data.ts` (`rawatInapPatients`, `rawatInapRuangan`, `rawatInapStats`)
- [x] **Redesign: IGD tabs/PenilaianTab** — multi-tab (Fisik, Jantung, Kanker, dll.), two-panel layout, auto-resize textarea
- [x] **Pasien → Detail Pendaftaran Kunjungan** — fullpage `/pasien/[id]/kunjungan/[kunjunganId]`, dokumen, aksi, cetak, modals

### 🟢 Backlog (Other Modules)

- [ ] `ehis-registration` — form pendaftaran pasien baru + kunjungan, search existing pasien
- [ ] `ehis-billing` — kasir: invoice generation, item tindakan + obat, print struk
- [ ] `ehis-dashboard` — stats cards, recent activity, bed occupancy chart
- [ ] `ehis-master` — CRUD: dokter, ruangan, tarif, obat/lab catalog
- [ ] `ehis-report` — tabel laporan per periode, export Excel/PDF
- [ ] `ehis-lab` — modul Laboratorium: order tracking, entry hasil, verifikasi, history lab per pasien
- [ ] `ehis-rad` — modul Radiologi: order tracking, upload/view hasil radiologi, verifikasi

### ⚙️ Tech Debt

- [ ] **Skala Nyeri (0–10)** — `skalaNyeri` ada di `IGDVitalSigns` tapi tidak muncul di form TTVTab. Tambahkan sebagai field wajib per SNARS AP 1.2
- [ ] Replace mock data (`src/lib/data.ts`) dengan Prisma queries bertahap, mulai dari `PatientMaster`
- [ ] `SidebarContext` — belum dipakai konsisten di semua modul
- [ ] Error boundary + loading skeleton untuk semua fullpage routes
- [ ] **PemeriksaanTab IGD — Upgrade ke Head-to-Toe Lengkap** — Saat ini hanya 6 sistem gabungan (Kepala & Leher, Kardiovaskuler, Respirasi, Abdomen, Ekstremitas, Neurologi). Belum head-to-toe SNARS AP 1: Mata, THT, Toraks/Paru, Jantung, Urogenital, Kulit/Integumen terpisah. Upgrade ke 11 sistem seperti RI (reuse pola `SISTEM_DEF` dari `StatusFisikPane.tsx`) — cukup expand `SISTEM_FIELDS` di `PemeriksaanTab.tsx` IGD + tambahkan quick-normal template
- [x] **Audit `PenilaianTab` IGD** — ✅ KONFIRMASI: Morse Fall Scale, Braden Scale, Barthel Index, NRS Skala Nyeri — semua sudah ada di `PenilaianTab.tsx`
- [x] **Audit `EdukasiPane` IGD** — ✅ KONFIRMASI: `TOPIK_EDUKASI` checklist, `METODE_EDUKASI`, evaluasi pemahaman (paham/perlu_ulang/tidak_paham) sudah ada, sesuai standar HPK 2

---

## Key Data Contracts

**Mock IDs** (jangan ubah tanpa update semua tab):

- IGD: `igd-1` (Joko Prasetyo, ♂ 55y, RM-2025-005) · `igd-2` (Siti Rahayu, ♀ 32y, RM-2025-012)
- PatientMaster keyed by noRM: `RM-2025-005`, `RM-2025-012`

**Core types** (semua di `src/lib/data.ts`):
`IGDPatientDetail` · `PatientMaster` · `KunjunganRecord` · `BillingRecord` · `KasirData`  
`RawatInapPatient` · `RIBed` · `RIRuangan` · `RawatInapStats`  
`TipePenjamin`: `BPJS_Non_PBI | BPJS_PBI | Umum | Asuransi | Jamkesda`  
`RIPenjamin`: `BPJS_PBI | BPJS_Non_PBI | Umum | Asuransi | Jamkesda`  
`RIKelas`: `VIP | Kelas_1 | Kelas_2 | Kelas_3 | ICU | HCU | Isolasi`  
`UnitKunjungan`: `IGD | Rawat Jalan | Rawat Inap | Laboratorium | Radiologi | Farmasi`  
`DiagnosaTipe`: `Utama | Sekunder | Komplikasi | Komorbid`  
`DiagnosaStatus`: `Pasti | Dicurigai | Diferensial`  
`IGDDiagnosa`: `id · kodeIcd10 · namaDiagnosis · tipe · status? · alasan? · analisa?`  
`CPPTEntry`: `id · waktu · tanggal? · profesi · penulis · SOAP fields · verified? · verifiedBy? · verifiedAt? · flagged?`

---
