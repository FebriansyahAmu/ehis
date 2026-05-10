# EHIS — Electronic Hospital Information System

Sistem Informasi Manajemen Rumah Sakit berbasis web, dibangun di atas Next.js App Router dengan fokus pada dokumentasi klinis terstandar (SNARS, PMK, SDKI/SLKI/SIKI).

---

## Stack Teknologi

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16.2.3 (App Router) |
| UI Library | React 19.2.4 + TypeScript 5 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) |
| Animasi | Framer Motion 12 |
| Icons | Lucide React 1.8 |
| ORM | Prisma 7.7 (generated: `src/generated/prisma/`) |
| Linting | ESLint 9 |

**Utilities:** `cn()` · `src/lib/utils.ts` | Navigation: `src/lib/navigation.ts` | Mock data: `src/lib/data.ts`

---

## Struktur Modul

| Route | Modul | Status |
|---|---|---|
| `/ehis-dashboard` | Dashboard | 🔧 Scaffold |
| `/ehis-care` | Clinical Care (IGD · RI · RJ) | 🚧 Active |
| `/ehis-registration` | Pendaftaran Pasien | 🚧 Active |
| `/ehis-billing` | Billing / Kasir | 🔧 Scaffold |
| `/ehis-master` | Master Data | 🔧 Scaffold |
| `/ehis-report` | Laporan | 🔧 Scaffold |
| `/ehis-lab` | Laboratorium | 🔧 Scaffold |
| `/ehis-rad` | Radiologi | 🔧 Scaffold |

---

## Timeline Pengembangan

### Fase 1 — Fondasi & IGD (Selesai ✅)

**IGD Board & Navigation**
- Board pasien IGD dengan filter triase, status, ruangan
- `IGDBoard`, `PatientCard`, `IGDRuanganPanel`, `PatientHeader`
- Tab router `IGDRecordTabs` (17 tab aktif)

**IGD Triase & Asesmen**
- Triase ESI Level 1–5 + Primary Survey ABCDE
- Modal triase fullscreen dengan portal z-index
- Asesmen Medis Awal (Anamnesis, Riwayat, Alergi, Skrining Gizi, Edukasi HPK 2)

**IGD Rekam Medis — Shared Components**
- `CPPTTab` (shared) — SOAP, DPJP co-sign, template, search/filter, flag tindak lanjut
- `TTVTab` (shared) — multi-shift history, expandable rows
- `DiagnosaTab` (shared) — ICD-10 + ICD-9-CM, status kepastian, INA-CBG preview
- `OrderLabTab` (shared) — order tracking + riwayat hasil
- `OrderRadTab` (shared) — order tracking + hasil ekspertise

**IGD Tindakan & Disposisi**
- Tindakan/Prosedur, Rekonsiliasi Obat (SNARS PP 3.1)
- Asuhan Keperawatan SDKI-based
- Pemeriksaan Fisik (6 sistem), Penilaian/Scoring multi-tab
- Penandaan Gambar (body diagram)
- Resep Pasien, Order Lab, Order Rad
- Rujukan Keluar SBAR (PMK 47/2018 · SKP 2)
- Pasien Pulang (6 status disposisi)
- Morse Fall Scale, Braden Scale, Barthel Index, NRS Skala Nyeri

---

### Fase 2 — Rawat Inap Core (Selesai ✅)

**RI Board & Infrastructure** *(Maret 2025)*
- Halaman utama RI: header + BOR gauge + 6 stats card
- `RIRuanganPanel` — 7 kelas, occupancy ring, bed map modal
- `RIBoard` — filter status/kelas/DPJP/search + patient cards
- Fullpage route `/ehis-care/rawat-inap/[id]` + `RIPatientHeader` (status-based theme, vitals bar)

**RI Tab 1–4: Dokumentasi Klinis Harian** *(April 2025)*
- **CPPT/SOAP** — date-grouped, DPJP verify, template, search/filter, flag
- **TTV** — multi-shift (Pagi/Siang/Malam), expandable history
- **Diagnosa** — thin wrapper → shared (ICD-10 + ICD-9, INA-CBG, status kepastian)
- **Asuhan Keperawatan** — SDKI katalog 15 dx, evaluasi shift, SLKI outcome, verifikasi supervisor

**RI Tab 5–6: Pemeriksaan & Monitoring** *(April 2025)*
- **Pemeriksaan Fisik** — head-to-toe 11 sistem, quick-normal template, body map, riwayat harian
- **Intake/Output** — per shift, IWL auto-calc (BB×10+koreksi demam), balance color-coded, target DPJP + progress bar, riwayat multi-hari

**RI Tab 7: Resep & Obat** *(April 2025)*
- **Resep Aktif** — draft→confirm flow, ObatSearch autocomplete, HAM badge, kirim order, riwayat + salin
- **MAR Harian** — grid 7-hari × 3-shift, status per administrasi, dropdown fixed position
- **Rekonsiliasi** — SNARS PP 3.1, keputusan Lanjutkan/Hentikan/Ganti/Tunda per obat

**RI Tab 8–9: Order & Konsultasi** *(April–Mei 2025)*
- **Order Lab** — thin wrapper → shared, mock data RM-2025-003
- **Order Radiologi** — thin wrapper → shared, mock data RM-2025-003
- **Konsultasi Antar SMF** — SBAR 4-field, closed-loop (Terkirim→Diterima→Dijawab→Selesai), 22 SMF, response timer, auto-notif CPPT

**RI Tab 10: Discharge Planning** *(Mei 2025)*
- Stepper 5 langkah: Asesmen → Edukasi → Obat Pulang → Follow-up → Resume Medis
- **Asesmen Kepulangan** — 5 kartu (Kondisi Pulang, Risiko Re-admisi, Kebutuhan Pasca Pulang, Rencana Kontrol, Catatan DPJP), DPJP sign-off
- **Edukasi** — checklist topik SNARS HPK 2, metode + penerima + evaluasi pemahaman, progress donut chart per kategori
- **Obat Pulang** — auto-pull dari ResepTab, instruksi minum per obat, obat baru manual
- **Follow-up** — jadwal kontrol multi-dokter, rujukan ke FKTP (Puskesmas), catatan aktivitas & diet
- **Resume Medis** — PMK 24/2022 compliance, diagnosa akhir/masuk/sekunder, prosedur, kondisi saat pulang, TTD pasien/keluarga, print preview
- Direction-aware Framer Motion transitions antar step

---

### Fase 3 — Pendaftaran Pasien (Selesai ✅)

**PatientDashboard Redesign** *(Maret 2025)*
- 2-column layout (info + penjamin + jadwal / profil + riwayat + tagihan)
- Compact penjamin card, "Riwayat Pendaftaran Terkini" card, modal riwayat pendaftaran

**Kunjungan Detail Page** *(Maret 2025)*
- Fullpage `/pasien/[id]/kunjungan/[kunjunganId]`
- Dokumen kunjungan, aksi, cetak, modals

---

### Fase 4 — Gap Kritis (Direncanakan 🟠)

| Item | Standar | Prioritas |
|---|---|---|
| Asesmen Awal RI (MRS Assessment) | SNARS AP 1 — wajib 24 jam | 🔴 Kritis |
| Skala Nyeri di TTVTab | SNARS AP 1.2 | 🔴 Tinggi |
| SBAR Transfer IGD→RI | SKP 2 · PMK 11/2017 | 🔴 Tinggi |
| SBAR Serah Terima Shift (Handover) | SKP 2 · SNARS IPSG 2 | 🔴 Tinggi |
| Link Hasil Lab/Rad ke EHIS-Lab/Rad | SNARS AP 5 | 🟡 Sedang |

---

### Fase 5 — Rawat Jalan (Direncanakan 🔜)

Sub-modul `/ehis-care/rawat-jalan` — mayoritas reuse shared components dari IGD:

- Antrian / Board Poliklinik
- Skrining TTV + CPPT + Diagnosa (thin wrappers)
- Pemeriksaan Fisik, Penilaian/Scoring (reuse IGD)
- Resep, Order Lab, Order Rad (reuse shared)
- Informed Consent (prosedur minor poli)
- Disposisi / Surat Kontrol / Rujukan

---

## Standar Klinis

| Standar | Topik |
|---|---|
| PMK 269/2008 | Rekam Medis — ICD-10 wajib, resume medis, SOAP |
| PMK 24/2022 | Resume Medis — TTD pasien/keluarga, format baru |
| PMK 47/2018 | Kegawatdaruratan — Triase ESI, SBAR transfer |
| PMK 72/2016 | Kefarmasian — MAR, rekonsiliasi, formularium |
| PMK 76/2016 | INA-CBG — grouper diagnosa+prosedur untuk klaim BPJS |
| PMK 11/2017 | Keselamatan Pasien — 6 SKP / IPSG |
| SNARS Ed. 1.1 | Akreditasi — AP, ARK, PP, HPK, SKP, PPI |
| PPNI | SDKI · SLKI · SIKI — diagnosa, luaran, intervensi keperawatan |
| JCI IPSG 1–6 | Patient identification, SBAR, HAM, surgical safety |

---

## Cara Menjalankan

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

```bash
# Prisma (jika ada perubahan schema)
npx prisma generate
npx prisma db push
```

---

## Mock Data

| ID | Pasien | Modul | Catatan |
|---|---|---|---|
| `igd-1` | Joko Prasetyo ♂ 55th | IGD | noRM: `RM-2025-005` |
| `igd-2` | Siti Rahayu ♀ 32th | IGD | noRM: `RM-2025-012` |
| `ri-1` | GJK NYHA III | Rawat Inap | noRM: `RM-2025-003`, DPJP: dr. Budi Santoso Sp.JP |
| `ri-3` | Syok Sepsis | Rawat Inap | noRM: `RM-2025-007`, DPJP: dr. Hendra Wijaya Sp.EM |

---

*EHIS dikembangkan oleh Febriansyah · 2025*
