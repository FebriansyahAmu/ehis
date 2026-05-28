# DFD — Modul `/ehis-registration`

> **Data Flow Diagram, Use Case Inventory & Business Process Document untuk modul Registrasi Pasien.**
> Dokumen ini adalah **single source of truth** untuk perilaku, alur data, dan aturan bisnis modul registrasi. Wajib dibaca sebelum modifikasi atau integrasi backend.
>
> **Workflow docs:**
> - [CLAUDE.md](CLAUDE.md) — current state + module map
> - [TODO.md](TODO.md) — Master phase roadmap
> - [TODO-BPJS.md](TODO-BPJS.md) — BPJS integration roadmap (consumer utama V-Claim adapter)
> - [TODO-EKLAIM.md](TODO-EKLAIM.md) — E-Klaim roadmap (downstream dari SEP yang dibuat di sini)
> - [TODO-BILLING.md](TODO-BILLING.md) — Billing roadmap (consume billing record per kunjungan)
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend roadmap
>
> **Last analyzed:** 2026-05-28
> **Status implementasi:** ✅ Beranda · ✅ Daftar Pasien · ✅ Pasien Baru Modal · ✅ Patient Dashboard · ✅ Kunjungan Detail (8 tab) · ❌ Antrian Harian (placeholder route)
> **Accent module:** `sky` (registrasi · onboarding tone) + multi-tone per unit kunjungan

---

## 📑 Daftar Isi

1. [Konteks Modul](#1-konteks-modul)
2. [Persona / Actor Map](#2-persona--actor-map)
3. [Module Topology](#3-module-topology)
4. [DFD Level 0 — Context Diagram](#4-dfd-level-0--context-diagram)
5. [DFD Level 1 — Major Processes](#5-dfd-level-1--major-processes)
6. [Data Stores Inventory](#6-data-stores-inventory)
7. [Use Case Inventory](#7-use-case-inventory)
8. [Use Case Detail per Halaman](#8-use-case-detail-per-halaman)
9. [State Diagrams](#9-state-diagrams)
10. [Business Rules Catalog](#10-business-rules-catalog)
11. [External Integrations](#11-external-integrations)
12. [Cross-Module Dependencies](#12-cross-module-dependencies)
13. [Compliance References](#13-compliance-references)
14. [Gap Analysis & Tech Debt](#14-gap-analysis--tech-debt)

---

## 1. Konteks Modul

### 1.1 Tujuan Modul
**`/ehis-registration`** = **gerbang masuk pasien** ke seluruh ekosistem EHIS. Semua workflow klinis (IGD/RI/RJ) **WAJIB** memiliki KunjunganRecord aktif sebagai pre-syarat. Modul ini bertanggung jawab atas:

1. **Pendaftaran pasien baru** (registrasi identitas + demografi + alamat + kontak + penjamin)
2. **Manajemen master pasien existing** (search, edit, multi-tab view)
3. **Inisiasi kunjungan** (admisi IGD/RJ/RI dengan unit-specific fields)
4. **Manajemen SEP BPJS** (bridging via V-Claim, suplesi, jaminan kecelakaan)
5. **Surat Rujukan** (FKTP masuk, Kontrol Pasca Ranap, Rujukan IGD)
6. **Data Kecelakaan** (KLL Jasa Raharja, KK BPJS Naker, lainnya)
7. **Cetak Dokumen Pendaftaran** (bukti, gelang, antrean, SEP, rujukan, struk)
8. **Manajemen Kunjungan** (ubah penjamin/paket, update SEP, hapus admin-only)

### 1.2 Scope Boundary

| In Scope `/ehis-registration` | Out of Scope (di modul lain) |
|---|---|
| Identitas pasien (PatientMaster CRUD) | EMR Klinis (CPPT, TTV, Asesmen → `/ehis-care`) |
| Penjamin + SEP creation | Klaim BPJS submission (→ `/ehis-eklaim`) |
| KunjunganRecord (admisi · cara masuk · DPJP · keluhan) | Order Lab/Rad/Resep (→ `/ehis-care/<unit>` via DaftarOrderTab) |
| Jadwal Kontrol (planning future visit) | Tindakan klinis & diagnosa final (→ `/ehis-care`) |
| Data Kecelakaan (klaim Jasa Raharja/BPJS Naker) | Billing transactional (→ `/ehis-billing`) |
| Cetak dokumen pendaftaran | Pembayaran kasir (→ `/ehis-billing/tagihan`) |
| BPJS Cek Peserta (mock V-Claim) | Master Penjamin / Master Dokter (→ `/ehis-master`) |
| Multi-tab patient view | Antrian Online Mobile JKN (out of scope semua modul) |

### 1.3 Stack Teknis Modul
- **Routing:** Next.js 16 App Router · route group `(main)` + `(fullpage)`
- **State:** React useState lokal · `patientMasterData` (mock) sebagai single source
- **Animations:** Framer Motion (AnimatePresence transitions, stagger entry)
- **Mocks:** `BPJS_MOCK` (V-Claim lookup) · `MOCK_RUJUKAN` (rujukan list) · `MOCK_SEP_RANAP` (SEP referensi) · `KELAS_RAWAT` (paket kelas)
- **Accent:** `sky` primary · `rose` IGD · `emerald` Rawat Inap · `amber` warning · `slate` neutral

---

## 2. Persona / Actor Map

| Aktor | Tanggung Jawab | Akses Use Case | Frequency |
|---|---|---|---|
| **Petugas Pendaftaran** (Front Office) | Daftar pasien baru · Buat kunjungan · Edit data dasar · Cetak bukti | UC-REG-01 s/d UC-REG-37, UC-REG-71 s/d UC-REG-76 | Sehari penuh |
| **Operator BPJS** (Petugas Bridging) | Cek kepesertaan · Bridging SEP · Update SEP · Suplesi Jasa Raharja · Cari Rujukan | UC-REG-43 s/d UC-REG-70 | Hampir setiap kunjungan BPJS |
| **Admin Registrasi** (Supervisor) | Hapus kunjungan (irreversible) · Audit trail · Resolve konflik data | UC-REG-77 + audit access | Insidentil |
| **Kasir** (read-only dari Registrasi) | View billing summary patient dashboard | UC-REG-29, UC-REG-30 (read-only) | Per pembayaran |
| **DPJP / Dokter** (read-only dari Registrasi) | View kunjungan untuk konteks pasien sebelum klinis | UC-REG-38 s/d UC-REG-42 (read-only) | Setiap pemeriksaan |
| **Pasien / Keluarga** (eksternal) | Memberikan data identitas, KTP, BPJS, rujukan saat onboarding | Input source untuk UC-REG-06 s/d UC-REG-10 | Sekali per registrasi |

### Persona Capability Matrix

| Use Case Group | Pendaftaran | Op BPJS | Admin | Kasir | DPJP |
|---|:-:|:-:|:-:|:-:|:-:|
| Akses Beranda Registrasi | ✅ | ✅ | ✅ | 👁 | 👁 |
| Daftar Pasien Baru | ✅ | — | ✅ | — | — |
| Cari Pasien Existing | ✅ | ✅ | ✅ | 👁 | 👁 |
| Edit Data Pasien | ✅ | — | ✅ | — | — |
| Daftar Kunjungan Baru | ✅ | — | ✅ | — | — |
| Ubah Penjamin Kunjungan | ✅ | ✅ | ✅ | — | — |
| Ubah Paket / Kelas Rawat | ✅ | — | ✅ | — | — |
| Surat Rujukan BPJS | — | ✅ | ✅ | — | — |
| Data Kecelakaan | ✅ | ✅ | ✅ | — | — |
| Update SEP (Bridging V-Claim) | — | ✅ | ✅ | — | — |
| Cetak Dokumen | ✅ | ✅ | ✅ | — | — |
| **Hapus Kunjungan** | — | — | ✅ | — | — |

Legend: ✅ Full · 👁 View only · — Tidak boleh

---

## 3. Module Topology

### 3.1 Route Map

```
/ehis-registration
├── (main) — layout dengan sidebar registrasi
│   ├── page.tsx                    → RegistrationBerandaPage (Beranda)
│   └── pasien/
│       └── page.tsx                → PasienListPage (Daftar Semua Pasien)
└── (fullpage) — layout fullscreen tanpa sidebar
    └── pasien/[id]/
        ├── page.tsx                → PatientDashboard (Patient Detail Multi-tab)
        └── kunjungan/[kunjunganId]/
            └── page.tsx            → KunjunganDetailPage (Kunjungan Multi-tab Workspace)

❌ /ehis-registration/antrian — placeholder route, belum dibangun (referenced di QuickActions Beranda)
❌ /ehis-registration/pasien/baru — TIDAK ADA route. Pasien baru via modal di Beranda.
```

### 3.2 Component Tree

```
src/components/registration/
├── beranda/
│   └── RegistrationBerandaPage.tsx     # 4 stat card + Penjamin Dist chart + Recent visits + Quick Actions
├── pasien-list/
│   ├── PasienListPage.tsx              # Orchestrator search/filter/paginate
│   ├── PasienListControls.tsx          # Stats summary + filter chips
│   └── PasienListTable.tsx             # Table 8/page paginated
├── pasien-baru/
│   ├── PasienBaruModal.tsx             # 3-step wizard shell (Identitas / Alamat / Kontak)
│   ├── PasienBaruSteps.tsx             # StepContent render Step1/Step2/Step3
│   ├── pasienBaruShared.tsx            # FField/TInput/SInput/SCard primitives
│   └── pasienBaruTypes.ts              # FormState · INITIAL_FORM · validateStep · GOL_DARAH/AGAMA_OPT/STATUS_NIKAH/PENDIDIKAN/HUBUNGAN/PROVINSI enums
├── PatientDashboard.tsx                # Multi-tab orchestrator (1-N patients open)
├── patient/
│   ├── PatientLeftPanel.tsx            # Profile card + Penjamin info + Billing summary + 2 CTA
│   ├── PatientRightPanel.tsx           # 3-tab: Riwayat / Jaminan / Jadwal
│   ├── primitives.tsx                  # ModalShell, EditSmallBtn shared
│   ├── config.ts                       # UNIT_CFG, PENJAMIN_CFG, KUNJUNGAN_STATUS, TAGIHAN_STATUS, calcKasir, fmtRp
│   └── modals/
│       ├── EditDataModal.tsx           # Edit data pribadi (nama, NIK, TTL, gender, gol darah, demografi)
│       ├── EditKontakModal.tsx         # Edit kontak (HP, email, alamat, kontak darurat)
│       ├── UbahPenjaminModal.tsx       # Patient-level penjamin change (vs Kunjungan-level di Tab)
│       ├── BillingDetailModal.tsx      # View billing record full detail
│       ├── RiwayatKunjunganModal.tsx   # Full list kunjungan history
│       ├── TambahJadwalModal.tsx       # Add jadwal kontrol (poli, dokter, tanggal)
│       ├── DaftarKunjunganModal.tsx    # CREATE new kunjungan (unit + cara masuk + DPJP + keluhan)
│       └── InfoDetailModal.tsx         # 2-tab read-only: Data Pribadi + Kontak (with edit triggers)
├── KunjunganDetailPage.tsx             # Orchestrator header + tabs
└── kunjungan/
    ├── KunjunganDetailHeader.tsx       # Patient + kunjungan banner
    ├── KunjunganTabs.tsx               # 8-tab left sidebar (Info/Aksi/Manajemen groups)
    ├── shared.tsx                      # UNIT_CFG, StatusBadge, inputCls, FormField, BtnPrimary
    └── Tabs/
        ├── OverviewTab.tsx             # RingkasanCard + PenjaminCard + DiagnosaCard + DokumenCard
        ├── ActionForms.tsx             # PenjaminForm + UpdateSEPForm (wizard) + CetakTab + HapusForm + re-export
        ├── PaketForm.tsx               # 2 sub-tab: Pindah Kelas / Paket Layanan
        ├── paket/
        │   ├── PindahKelas.tsx         # KelasCard grid + SUMBER_BAYAR + tarif compare
        │   ├── PaketLayanan.tsx        # MCU / Persalinan / Bedah package selector
        │   └── paketTypes.ts           # KELAS_RAWAT array, SUMBER_BAYAR, fmtRp
        ├── RujukanForm.tsx             # BPJS-only gate + 3 sub-menu (Masuk/Kontrol/IGD)
        ├── rujukan/
        │   ├── RujukanMasukPanel.tsx   # Search rujukan FKTP + RujukanCard detail
        │   ├── KontrolPascaRanapForm.tsx # Buat rujukan kontrol pasca rawat inap
        │   ├── RujukanIGDPanel.tsx     # Pengelolaan rujukan gawat darurat
        │   ├── RujukanCard.tsx         # Detail card display
        │   ├── DiagnosaCombobox.tsx    # ICD-10 picker
        │   └── rujukanTypes.ts         # BpjsRujukanItem, MOCK_RUJUKAN, MOCK_SEP_RANAP, KODE_RS, NAMA_RS, SMF_LIST, getIcdName
        ├── KecelakaanForm.tsx          # JenisSelector + LainnyaPanel + DetailKejadian + StatusKlaim + SuratJRModal
        ├── kecelakaan/
        │   ├── KKPanel.tsx             # BPJS Naker detail (KPJ, perusahaan, jabatan)
        │   ├── KLLPanel.tsx            # Jasa Raharja detail (No LP, jenis kendaraan)
        │   ├── SuratJRModal.tsx        # Print preview Laporan Polisi Jasa Raharja
        │   └── kecelakaanTypes.ts      # KecelakaanDraft, BLANK_DRAFT, JENIS_OPTIONS, PROVINSI_LIST, STATUS_CONFIG
        ├── sep/                        # SEP wizard sub-components
        │   ├── BpjsSearch.tsx          # BpjsPanel (cek peserta) + SepStep1 + SEPCardStep1
        │   ├── SepSteps.tsx            # SepStep2/3/4 (Kunjungan/Jaminan/Review)
        │   ├── SepShared.tsx           # SepField, Chips, StepIndicator, SEPProgressBar, SEPStepper, RvItem, RvSection2
        │   ├── InlineSEPCard.tsx       # Inline SEP card untuk PenjaminForm BPJS flow
        │   └── sepTypes.ts             # SepDraft, BLANK_DRAFT, SEP_STEPS, SLIDE_VARIANTS, BPJS_MOCK, BpjsData, R_JNS, R_LAKA, R_KLS
        └── ...
```

### 3.3 File Size Health
Semua file di bawah ≤800 lines. File terbesar: `DaftarKunjunganModal.tsx` (~400L), `KecelakaanForm.tsx` (~410L), `KunjunganTabs.tsx` (~175L). Pattern: orchestrator thin + sub-component per section.

---

## 4. DFD Level 0 — Context Diagram

Diagram konteks modul `/ehis-registration` dengan **entitas eksternal** yang berinteraksi:

```
                ┌──────────────┐
                │   PASIEN /    │
                │   KELUARGA    │ ─── KTP, KK, BPJS, Rujukan ──┐
                └──────────────┘                               │
                                                               ▼
┌─────────────────┐                              ┌─────────────────────────────┐
│ PETUGAS         │ ── search, daftar, ubah ─────│                             │
│ PENDAFTARAN     │                              │                             │
└─────────────────┘                              │                             │
                                                 │                             │
┌─────────────────┐                              │                             │
│ OPERATOR BPJS   │ ── cek peserta, bridge SEP ──│                             │
└─────────────────┘                              │                             │      ┌──────────────┐
                                                 │                             │ ←──→ │ BPJS V-Claim │
┌─────────────────┐                              │  /ehis-registration         │      │  (mock now)  │
│ ADMIN REGISTRASI│ ── hapus kunjungan ──────────│  (Process)                  │      └──────────────┘
└─────────────────┘                              │                             │
                                                 │                             │      ┌──────────────┐
┌─────────────────┐                              │                             │ ←──→ │ Jasa Raharja │
│ KASIR           │ ── view billing summary ─────│                             │      │  (planned)   │
└─────────────────┘                              │                             │      └──────────────┘
                                                 │                             │
┌─────────────────┐                              │                             │      ┌──────────────┐
│ DPJP / DOKTER   │ ── view kunjungan info ──────│                             │ ←──→ │ BPJS Naker   │
└─────────────────┘                              │                             │      │  (planned)   │
                                                 └──────┬──────────────────────┘      └──────────────┘
                                                        │
                          ┌─────────────────────────────┼─────────────────────────────────┐
                          │                             │                                 │
                          ▼                             ▼                                 ▼
                ┌──────────────────┐         ┌──────────────────┐              ┌──────────────────┐
                │  /ehis-care      │         │  /ehis-billing   │              │  /ehis-eklaim    │
                │  (IGD/RI/RJ)     │         │  (Tagihan)        │              │  (Klaim BPJS)    │
                │  konsumsi:       │         │  konsumsi:        │              │  konsumsi:       │
                │  - KunjunganId   │         │  - BillingRecord  │              │  - SEPRecord     │
                │  - PatientMaster │         │  - KasirData       │              │  - kunjungan id  │
                └──────────────────┘         └──────────────────┘              └──────────────────┘
                                                                                          │
                                                                                          ▼
                                                                                ┌──────────────────┐
                                                                                │  /ehis-bpjs      │
                                                                                │  (Integration    │
                                                                                │   Hub planned)   │
                                                                                │  - V-Claim host  │
                                                                                │  - SEP CRUD      │
                                                                                │  - Rujukan API   │
                                                                                └──────────────────┘
```

### Entitas Eksternal & Data Flow

| Eksternal | Data Masuk (input ke modul) | Data Keluar (output dari modul) |
|---|---|---|
| Pasien/Keluarga | KTP NIK · Kartu BPJS · Surat Rujukan · KK · Identitas demografi | Bukti pendaftaran · Gelang identitas · Kartu antrean |
| Petugas Pendaftaran | Form inputs (identitas, alamat, kontak, penjamin) | View dashboard, tabel pasien |
| Operator BPJS | No Kartu/NIK · Tanggal SEP · Diagnosa awal · Data laka | SEP printout · Konfirmasi bridging |
| Admin Registrasi | Alasan hapus + "HAPUS" confirmation | Audit log entry |
| BPJS V-Claim API | Response peserta · Response insert SEP · Response rujukan | Request cek peserta · Request insert/update SEP |
| Jasa Raharja (planned) | Konfirmasi pendaftaran laporan | Form Lap Polisi · Data kecelakaan |
| BPJS Naker (planned) | Konfirmasi Form 3 KK | Data kecelakaan kerja |
| `/ehis-care` (downstream) | — | KunjunganRecord · PatientMaster |
| `/ehis-billing` (downstream) | BillingRecord update post-kunjungan | KunjunganRecord (untuk header invoice) |
| `/ehis-eklaim` (downstream) | ClaimRecord status sync | SEPRecord (penjamin + noSEP) |
| `/ehis-bpjs` (planned hub) | — | All BPJS API calls akan delegate ke `/ehis-bpjs` adapter |

---

## 5. DFD Level 1 — Major Processes

```
                          ┌─────────────────────────────────┐
                          │   /ehis-registration            │
                          │   (decomposed)                  │
                          └─────────────────────────────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
┌───────▼────────┐          ┌──────────▼─────────┐         ┌──────────▼──────────┐
│ P1: Beranda &   │          │ P2: Pasien Master  │         │ P3: Kunjungan       │
│     Discovery   │          │     CRUD           │         │     Workspace       │
│                 │          │                    │         │                     │
│ - View stats    │          │ - Daftar pasien    │         │ - Buat kunjungan    │
│ - Recent visits │          │   baru (3-step)    │         │ - 8-tab management  │
│ - Quick action  │          │ - Search existing  │         │ - SEP bridging      │
│                 │          │ - Multi-tab view   │         │ - Rujukan & Laka    │
│                 │          │ - Edit identitas   │         │ - Cetak dokumen     │
│                 │          │ - Ubah penjamin    │         │ - Hapus kunjungan   │
│                 │          │ - Tambah jadwal    │         │                     │
└─────────────────┘          └────────────────────┘         └─────────────────────┘
        │                              │                              │
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                       D1: patientMasterData                                    │
│                       (Record<noRM, PatientMaster>)                            │
│                                                                                │
│   PatientMaster {                                                              │
│     id, noRM, nik, name, age, gender, golDarah,                               │
│     tempatLahir, tanggalLahir, statusPerkawinan, agama,                       │
│     pekerjaan, pendidikan, suku, kewarganegaraan,                             │
│     alamat, kelurahan, kecamatan, kota, provinsi, kodePos,                    │
│     noHp, email, idSatusehat?,                                                │
│     alergi[], penjamin{ tipe, noPenjamin, ... },                              │
│     kontakDarurat{ nama, hubungan, noHp, alamat },                            │
│     riwayatKunjungan: KunjunganRecord[],                                       │
│     billing: BillingRecord[],                                                  │
│     kasir?: KasirData,                                                         │
│     terdaftar                                                                  │
│   }                                                                            │
└───────────────────────────────────────────────────────────────────────────────┘
                                       ▲
                                       │ (read/mutate)
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                ┌─────────▼─────────┐    ┌──────────▼─────────┐
                │ D2: BPJS_MOCK     │    │ D3: MOCK_RUJUKAN   │
                │ V-Claim peserta   │    │ Rujukan FKTP list  │
                │ Record<keys, …>   │    │ BpjsRujukanItem[]  │
                └───────────────────┘    └────────────────────┘
                          ▲
                          │
                ┌─────────┴─────────┐
                │ External:         │
                │ BPJS V-Claim API  │
                │ (production swap) │
                └───────────────────┘
```

### Process Breakdown

#### P1 — Beranda & Discovery
**Purpose:** entry point modul · view stats lintas pasien · navigasi ke action utama
**Input:** none (page load)
**Process:** aggregate `patientMasterData` Object.values() → derive stats (total/aktif/bpjs/umum) + recent visits list dari `recentPatients` denormalized
**Output:** dashboard view + quick-action menu

#### P2 — Pasien Master CRUD
**Purpose:** create / read / update PatientMaster record
**Sub-processes:**
- **P2.1** Pasien Baru — 3-step wizard creates new PatientMaster entry
- **P2.2** Search & List — filter `patientMasterData` by query/penjamin/status
- **P2.3** Multi-tab View — 1-N PatientMaster open concurrent dengan tab navigation
- **P2.4** Edit Identitas — EditDataModal / EditKontakModal mutate PatientMaster
- **P2.5** Ubah Penjamin (patient-level) — UbahPenjaminModal change `penjamin` object
- **P2.6** Tambah Jadwal Kontrol — TambahJadwalModal append `jadwalKontrol` ke kunjungan parent
- **P2.7** View Billing Summary — read-only `billing[]` + `kasir`

#### P3 — Kunjungan Workspace
**Purpose:** lifecycle kunjungan dari admisi → aktif → selesai/dibatalkan/dihapus
**Sub-processes:**
- **P3.1** Buat Kunjungan — DaftarKunjunganModal create new KunjunganRecord, route ke detail
- **P3.2** Overview — read-only display 4 card section
- **P3.3** Ubah Penjamin (kunjungan-level) — PenjaminForm 4-type toggle + BPJS bridging
- **P3.4** Ubah Paket — PindahKelas (BPJS naik kelas / RS internal) + PaketLayanan (MCU/Persalinan/Bedah)
- **P3.5** Surat Rujukan — 3 sub-menu BPJS only (Masuk/Kontrol/IGD)
- **P3.6** Data Kecelakaan — KLL/KK/Lainnya + Detail Kejadian + Status Klaim
- **P3.7** Update SEP — 4-step wizard bridge ke V-Claim
- **P3.8** Cetak Dokumen — 6 jenis print (conditional)
- **P3.9** Hapus Kunjungan — admin-only irreversible delete

---

## 6. Data Stores Inventory

| ID | Store | Type | Lokasi | Mutation |
|---|---|---|---|---|
| **D1** | `patientMasterData` | `Record<noRM, PatientMaster>` | [data.ts:853](src/lib/data.ts#L853) | mutate via setPatient di PatientDashboard (client-side, ephemeral) |
| **D2** | `BPJS_MOCK` | `Record<noKartu\|NIK, BpjsData>` | [sepTypes.ts](src/components/registration/kunjungan/Tabs/sep/sepTypes.ts) | read-only |
| **D3** | `MOCK_RUJUKAN` | `BpjsRujukanItem[]` | [rujukanTypes.ts](src/components/registration/kunjungan/Tabs/rujukan/rujukanTypes.ts) | read-only |
| **D4** | `MOCK_SEP_RANAP` | `SEPRanapMock` | [rujukanTypes.ts](src/components/registration/kunjungan/Tabs/rujukan/rujukanTypes.ts) | read-only — referensi SEP rawat inap terakhir untuk Kontrol Pasca Ranap |
| **D5** | `KELAS_RAWAT` | `KelasOption[]` | [paketTypes.ts](src/components/registration/kunjungan/Tabs/paket/paketTypes.ts) | read-only — VIP / Kelas 1-3 / dst dengan tarif & amenities |
| **D6** | `SUMBER_BAYAR` | `string[]` | [paketTypes.ts](src/components/registration/kunjungan/Tabs/paket/paketTypes.ts) | read-only — Pribadi / Pemberi Kerja / Asuransi |
| **D7** | `recentPatients` | `Patient[]` | [data.ts:64](src/lib/data.ts#L64) | read-only — denormalized untuk Beranda recent visits |
| **D8** | `SEP_STEPS` | `Step[]` (4 step config) | [sepTypes.ts](src/components/registration/kunjungan/Tabs/sep/sepTypes.ts) | static |
| **D9** | `PROVINSI` | `string[]` (34 prov) | [pasienBaruTypes.ts](src/components/registration/pasien-baru/pasienBaruTypes.ts) | static |
| **D10** | `GOL_DARAH / AGAMA_OPT / STATUS_NIKAH / PENDIDIKAN / HUBUNGAN` | enum arrays | [pasienBaruTypes.ts](src/components/registration/pasien-baru/pasienBaruTypes.ts) | static |
| **D11** | `KODE_RS` + `NAMA_RS` | string constants | [rujukanTypes.ts](src/components/registration/kunjungan/Tabs/rujukan/rujukanTypes.ts) | static — identifier RS dari `RS_PROFIL` |
| **D12** | `SMF_LIST` | `string[]` | [rujukanTypes.ts](src/components/registration/kunjungan/Tabs/rujukan/rujukanTypes.ts) | static — daftar SMF untuk Kontrol Pasca Ranap |
| **D13** | `PENJAMIN_CFG` | `Record<TipePenjamin, StyleCfg>` | [config.ts:48](src/components/registration/patient/config.ts#L48) | static — UI tone per tipe |
| **D14** | `STATUS_CONFIG` (kecelakaan) | `Record<StatusKlaim, ChipCfg>` | [kecelakaanTypes.ts](src/components/registration/kunjungan/Tabs/kecelakaan/kecelakaanTypes.ts) | static |

### Nested Data Schemas

**`PatientMaster.penjamin: PenjaminData`:**
```ts
{
  tipe: TipePenjamin,    // "BPJS_Non_PBI" | "BPJS_PBI" | "Umum" | "Asuransi" | "Jamkesda"
  noPenjamin?: string,   // No Kartu BPJS / No Polis
  namaAsuransi?: string,
  kelasPenjamin?: string // "1" | "2" | "3" untuk BPJS
}
```

**`KunjunganRecord`** (penuh):
```ts
{
  id, noPendaftaran, noKunjungan, tanggal,
  unit: "IGD" | "Rawat Jalan" | "Rawat Inap" | "Laboratorium" | "Radiologi" | "Farmasi",
  dokter, keluhan, diagnosa,
  penjamin?, noPenjamin?, noSEP?, kodeICD?, caraMasuk?,
  klinisPath?,                          // route ke /ehis-care/<unit>/<id>
  orderedServices?: { unit, selesai }[], // tracking order ke unit penunjang
  dokumen?: {
    generalConsent?: "Ditandatangani" | "Belum Ditandatangani" | "Digital",
    rujukan?: "Ada" | "Tidak Ada",
    pengantarPasien?: "Ada" | "Tidak Ada",
  },
  status: "Selesai" | "Aktif" | "Dibatalkan",
  detailPath?,
  jadwalKontrol?: {
    tanggal, jam?, dokter, unit, poli?, keterangan?,
    status: "Dijadwalkan" | "Selesai" | "Tidak Hadir" | "Batal",
  }
}
```

**`KontakDarurat`:**
```ts
{ nama, hubungan, noHp, alamat? }
```

**`KasirData`** (untuk billing summary di left panel):
```ts
{
  noTagihan, noKunjungan, tanggal,
  items: ItemTagihan[],      // { id, kategori, nama, qty, satuan, harga, tanggal }
  deposits: DepositRecord[], // { id, tanggal, waktu, jumlah, metode, kasir }
  penjamin, statusPembayaran
}
```

---

## 7. Use Case Inventory

77 use case teridentifikasi, dikelompokkan per halaman:

### Beranda (UC-REG-01 s/d UC-REG-05) — 5 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-01 | Akses Beranda Registrasi | Pendaftaran/BPJS/Admin | Page load `/ehis-registration` |
| UC-REG-02 | Inisiasi Pendaftaran Pasien Baru | Pendaftaran/Admin | Click "Daftar Pasien Baru" button |
| UC-REG-03 | Navigasi ke Antrian Harian | Pendaftaran | Click "Lihat Antrian" (placeholder route) |
| UC-REG-04 | Navigasi ke Daftar Semua Pasien | Pendaftaran/BPJS/Admin | Click "Daftar Semua Pasien" |
| UC-REG-05 | Buka Patient Dashboard via Recent Visit | All | Click recent visit row di Beranda |

### Pasien Baru Wizard (UC-REG-06 s/d UC-REG-10) — 5 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-06 | Input Step 1 — Identitas Diri | Pendaftaran/Admin | Open PasienBaruModal step 1 |
| UC-REG-07 | Input Step 2 — Alamat KTP + Domisili | Pendaftaran/Admin | Lanjut dari step 1 valid |
| UC-REG-08 | Input Step 3 — Kontak + Darurat | Pendaftaran/Admin | Lanjut dari step 2 valid |
| UC-REG-09 | Validasi & Navigasi Step | system + Pendaftaran | Click "Lanjut" or "Kembali" |
| UC-REG-10 | Submit Pasien Baru → Terbit noRM | Pendaftaran/Admin | Click "Simpan & Daftarkan" di step 3 |

### Pasien List (UC-REG-11 s/d UC-REG-15) — 5 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-11 | Cari Pasien Existing | All | Type di search bar (nama/noRM/NIK) |
| UC-REG-12 | Filter Penjamin | All | Click chip filter penjamin |
| UC-REG-13 | Filter Status (Aktif/Selesai) | All | Click chip filter status |
| UC-REG-14 | Paginasi Daftar | All | Click pagination button |
| UC-REG-15 | Buka Patient Dashboard dari List | All | Click row di table |

### Patient Dashboard — Profil (UC-REG-16 s/d UC-REG-22) — 7 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-16 | View Patient Profile | All | Page load `/pasien/[id]` |
| UC-REG-17 | Upload Foto Pasien | Pendaftaran/Admin | Click camera icon di avatar |
| UC-REG-18 | View Info Lengkap | All | Click "Info Lengkap" button |
| UC-REG-19 | Edit Data Pribadi | Pendaftaran/Admin | Click "Edit" di InfoDetailModal tab Data Pribadi |
| UC-REG-20 | Edit Kontak | Pendaftaran/Admin | Click "Edit" di InfoDetailModal tab Kontak |
| UC-REG-21 | Multi-tab Patient View | All | Click "+ Tambah Pasien" → search + select |
| UC-REG-22 | Close Patient Tab | All | Click X di tab (jika >1 tab) |

### Patient Dashboard — Right Panel (UC-REG-23 s/d UC-REG-28) — 6 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-23 | Tab Riwayat — List Kunjungan | All | Click tab "Riwayat" |
| UC-REG-24 | Lihat Semua Riwayat Modal | All | Click "Semua →" di tab Riwayat |
| UC-REG-25 | Tab Jaminan — View Current Penjamin | All | Click tab "Jaminan" |
| UC-REG-26 | Ubah Penjamin (Patient-level) | Pendaftaran/BPJS/Admin | Click "Ubah" di tab Jaminan |
| UC-REG-27 | Tab Jadwal — View Upcoming Kontrol | All | Click tab "Jadwal" |
| UC-REG-28 | Tambah Jadwal Kontrol | Pendaftaran/BPJS/Admin | Click "Tambah" di tab Jadwal |

### Patient Dashboard — Billing (UC-REG-29 s/d UC-REG-30) — 2 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-29 | View Billing Summary | All | Otomatis tampil jika `patient.kasir` exists |
| UC-REG-30 | View Billing Record Detail | Kasir/Admin | Click billing record card |

### Daftar Kunjungan (UC-REG-31 s/d UC-REG-37) — 7 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-31 | Pilih Unit Kunjungan | Pendaftaran/Admin | Click unit di sidebar modal (IGD/RJ/RI) |
| UC-REG-32 | Set Waktu + Cara Masuk | Pendaftaran/Admin | Input tanggal/jam/caraMasuk |
| UC-REG-33 | Input No. Surat Rujukan (conditional) | Pendaftaran/Admin | caraMasuk = "Rujukan Puskesmas" or "Rujukan RS" |
| UC-REG-34 | Unit-Specific Fields | Pendaftaran/Admin | Per unit selected: Triase IGD / Poli RJ / Kelas RI |
| UC-REG-35 | Pilih DPJP | Pendaftaran/Admin | Input nama dokter |
| UC-REG-36 | Input Keluhan Utama | Pendaftaran/Admin | Textarea keluhan |
| UC-REG-37 | Submit Kunjungan → Buka Detail | Pendaftaran/Admin | Click "Daftarkan Kunjungan" |

### Kunjungan Detail — Overview Tab (UC-REG-38 s/d UC-REG-42) — 5 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-38 | View Ringkasan Kunjungan | All | Tab default saat masuk detail |
| UC-REG-39 | View Penjamin & SEP Status | All | View PenjaminCard di overview |
| UC-REG-40 | View Diagnosa ICD | All | View DiagnosaCard di overview |
| UC-REG-41 | View Dokumen Status (GC + Rujukan + Pengantar) | All | View DokumenCard di overview |
| UC-REG-42 | Copy No. Pendaftaran | All | Click "Salin" button di noPendaftaran strip |

### Kunjungan Detail — Ubah Penjamin Tab (UC-REG-43 s/d UC-REG-49) — 7 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-43 | Toggle Jenis Penjamin (4 jenis) | Pendaftaran/BPJS | Click 4 cards (BPJS-JKN/Umum/BPJS-Naker/Asuransi) |
| UC-REG-44 | BPJS Cek Peserta (Kartu/NIK) | Operator BPJS | Input + click "Cari Kepesertaan" |
| UC-REG-45 | Gunakan Data Peserta BPJS → InlineSEPCard | Operator BPJS | Click "Gunakan Data Ini" pada result Aktif |
| UC-REG-46 | Umum — Pilih Cara Pembayaran | Pendaftaran | Click chip Tunai/Transfer/Debit/Kredit |
| UC-REG-47 | BPJS Naker — Input KPJ & Perusahaan | Pendaftaran | Fill form KPJ + nama perusahaan |
| UC-REG-48 | Asuransi — Input Polis | Pendaftaran | Fill nama asuransi + no polis + tertanggung |
| UC-REG-49 | Simpan Perubahan Penjamin | Pendaftaran/BPJS | Click "Simpan Perubahan" |

### Kunjungan Detail — Ubah Paket Tab (UC-REG-50 s/d UC-REG-52) — 3 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-50 | Pindah Kelas Rawat | Pendaftaran/Admin | Click sub-tab "Pindah Kelas" + select kelas card |
| UC-REG-51 | Pilih Sumber Pembayaran Selisih | Pendaftaran | Select SUMBER_BAYAR (Pribadi/Pemberi Kerja/Asuransi) |
| UC-REG-52 | Paket Layanan (MCU/Persalinan/Bedah) | Pendaftaran | Click sub-tab "Paket Layanan" + select paket |

### Kunjungan Detail — Surat Rujukan Tab (UC-REG-53 s/d UC-REG-56) — 4 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-53 | BPJS-only Gate Check | system | Auto: NonBpjsBanner jika `!isBpjs(penjamin)` |
| UC-REG-54 | Rujukan Masuk — Cari + Pilih FKTP | Operator BPJS | Search rujukan + select dari list |
| UC-REG-55 | Kontrol Pasca Ranap | Operator BPJS | Click sub-tab "Kontrol" + isi form (poli, dokter, diagnosa, SEP referensi) |
| UC-REG-56 | Rujukan IGD | Operator BPJS | Click sub-tab "IGD" + manage rujukan gawat darurat |

### Kunjungan Detail — Data Kecelakaan Tab (UC-REG-57 s/d UC-REG-65) — 9 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-57 | Pilih Jenis Kecelakaan (KLL/KK/Lainnya) | Pendaftaran/BPJS | Click 3-card selector |
| UC-REG-58 | Input Detail KLL (Lalu Lintas) | BPJS | KLLPanel: no LP + jenis kendaraan + plat + posisi |
| UC-REG-59 | Input Detail KK (Kerja) | BPJS | KKPanel: KPJ + perusahaan + jabatan + saksi |
| UC-REG-60 | Input Detail Lainnya | Pendaftaran | LainnyaPanel: kategori (jatuh/luka bakar/dll) + penjamin |
| UC-REG-61 | Input Detail Kejadian (universal) | Pendaftaran/BPJS | Tgl/Waktu/Provinsi/Lokasi/Kronologi |
| UC-REG-62 | Set Status Klaim (Belum/Proses/Selesai/Ditolak) | BPJS | Click chip status + input nomor klaim (conditional) |
| UC-REG-63 | Buat Laporan Jasa Raharja (Modal) | BPJS | Click "Buat Laporan Jasa Raharja" (jenis=kll) |
| UC-REG-64 | Buat Laporan BPJS Naker Form 3 KK | BPJS | Click "Buat Laporan BPJS Naker" (jenis=kerja) |
| UC-REG-65 | Simpan Data Kecelakaan | Pendaftaran/BPJS | Click "Simpan Data Kecelakaan" |

### Kunjungan Detail — Update SEP Tab (UC-REG-66 s/d UC-REG-70) — 5 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-66 | Step 1 — Cari Kepesertaan BPJS | Operator BPJS | Default wizard step 1 |
| UC-REG-67 | Step 2 — Info Kunjungan (Tgl SEP, Jenis Yan, Kelas) | Operator BPJS | Click "Lanjut" dari step 1 |
| UC-REG-68 | Step 3 — Jaminan & Kecelakaan | Operator BPJS | Click "Lanjut" dari step 2 |
| UC-REG-69 | Step 4 — Review Semua Data | Operator BPJS | Click "Lanjut" dari step 3 |
| UC-REG-70 | Kirim SEP ke BPJS (mock V-Claim) | Operator BPJS | Click "Kirim SEP ke BPJS" → success state |

### Kunjungan Detail — Cetak Dokumen Tab (UC-REG-71 s/d UC-REG-76) — 6 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-71 | Cetak Bukti Pendaftaran | Pendaftaran | Click "Bukti Pendaftaran" |
| UC-REG-72 | Cetak Kartu Antrean | Pendaftaran | Click "Kartu Antrean" |
| UC-REG-73 | Cetak Gelang Identitas | Pendaftaran | Click "Gelang Identitas" |
| UC-REG-74 | Cetak No. SEP (conditional `hasSEP`) | BPJS | Click "No. SEP" (disabled jika tidak ada SEP) |
| UC-REG-75 | Cetak Surat Rujukan (conditional `hasRujukan`) | BPJS | Click "Surat Rujukan" (disabled jika tidak ada) |
| UC-REG-76 | Cetak Struk Pembayaran (conditional `Selesai`) | Kasir | Click "Struk Pembayaran" (disabled jika belum selesai) |

### Kunjungan Detail — Hapus Kunjungan Tab (UC-REG-77) — 1 UC
| ID | Use Case | Aktor | Trigger |
|---|---|---|---|
| UC-REG-77 | Hapus Kunjungan (admin-only irreversible) | Admin Registrasi | Input alasan + type "HAPUS" + click button |

**Total: 77 Use Cases.**

---

## 8. Use Case Detail per Halaman

### 8.1 Beranda Registrasi (`/ehis-registration`)

#### UC-REG-01: Akses Beranda Registrasi
- **Aktor:** All persona
- **Pre-condition:** User authenticated, role include access registrasi
- **Trigger:** Navigate to `/ehis-registration`
- **Main Flow:**
  1. System load `patientMasterData` ke memory
  2. Calculate stats: total = Object.keys length, aktif = filter kunjungan.status="Aktif", bpjs = penjamin.tipe startsWith "BPJS", umum = total - bpjs
  3. Render 4 StatCard (animate stagger 80ms/idx)
  4. Render PenjaminDist segmented bar (BPJS sky + Umum slate, animate width 0→100% over 800ms)
  5. Render recent visits list (recentPatients up to N entries dengan VisitRow component)
  6. Render QuickActions sidebar (3 button)
  7. Skeleton 650ms via `setLoaded(true)` after `setTimeout`
- **Post-condition:** Dashboard rendered, all stats accurate
- **Data In:** D1 patientMasterData, D7 recentPatients
- **Data Out:** Visual dashboard

#### UC-REG-02: Inisiasi Pendaftaran Pasien Baru
- **Aktor:** Pendaftaran, Admin
- **Trigger:** Click "Daftar Pasien Baru" CTA
- **Main Flow:**
  1. `setModalOpen(true)` → PasienBaruModal mount
  2. Modal slide-in animation
- **Lanjut ke:** UC-REG-06 (Step 1)

#### UC-REG-03: Navigasi ke Antrian Harian
- **Aktor:** Pendaftaran
- **Trigger:** Click "Lihat Antrian" CTA
- **Main Flow:**
  1. Navigate ke `/ehis-registration/antrian`
- **Alternative Flow:** ❌ Route **belum dibangun** — 404 atau placeholder. Gap di UC.
- **Tech Debt:** Bangun route + halaman antrian harian.

#### UC-REG-04: Navigasi ke Daftar Semua Pasien
- **Aktor:** All
- **Trigger:** Click "Daftar Semua Pasien" CTA
- **Main Flow:** Navigate ke `/ehis-registration/pasien` → UC-REG-11 group

#### UC-REG-05: Buka Patient Dashboard via Recent Visit
- **Aktor:** All
- **Trigger:** Click VisitRow di recent visits list
- **Main Flow:** Link `/ehis-registration/pasien/<encodeURIComponent(noRM)>` → UC-REG-16

---

### 8.2 Pasien Baru Wizard (Modal di Beranda)

#### UC-REG-06: Input Step 1 — Identitas Diri
- **Aktor:** Pendaftaran, Admin
- **Pre-condition:** UC-REG-02 (modal open)
- **Main Flow:**
  1. Render Step1Identitas dengan 2 SCard:
     - **Data Pribadi:** Nama Lengkap* · NIK* (16-digit validation real-time, counter `length/16`) · Tempat Lahir* · Tanggal Lahir* (date input) · Jenis Kelamin* (2-button L/P toggle sky/pink) · Golongan Darah (optional GOL_DARAH select)
     - **Demografi & Status:** Status Perkawinan* (STATUS_NIKAH select) · Agama* (AGAMA_OPT select) · Pekerjaan · Pendidikan (PENDIDIKAN select) · Suku Bangsa · Kewarganegaraan
  2. Validation real-time per field:
     - NIK: exactly 16 digit numerik
     - Required fields: tidak boleh kosong
  3. Click "Lanjut" → `validateStep(1, formData)` → jika valid set step=2, jika tidak tampilkan error inline
- **Data In:** form inputs
- **Data Out:** FormState fields step 1 valid
- **Business Rules:**
  - BR-REG-001: NIK harus 16 digit
  - BR-REG-002: Nama Lengkap, NIK, Tempat Lahir, Tgl Lahir, Gender, Status Perkawinan, Agama wajib diisi

#### UC-REG-07: Input Step 2 — Alamat KTP + Domisili
- **Aktor:** Pendaftaran, Admin
- **Main Flow:**
  1. Render Step2Alamat dengan 2 SCard:
     - **Alamat Sesuai KTP:** RT/RW (optional) · Alamat Lengkap* (textarea 2 rows) · Kelurahan/Desa · Kecamatan · Kota/Kabupaten* · Provinsi* (PROVINSI select 34 prov) · Kode Pos (5 digit)
     - **Alamat Domisili:** Toggle button "Sama dengan KTP" / "Berbeda". Saat berbeda → expand field set yang sama untuk domisili.
  2. Click "Lanjut" → validateStep(2)
- **Business Rules:**
  - BR-REG-003: Alamat KTP wajib (Alamat Lengkap, Kota, Provinsi)
  - BR-REG-004: Kode Pos jika diisi harus 5 digit
  - BR-REG-005: Kewarganegaraan = "WNI" default; "WNA" expand field nomor passport (optional ke depan)

#### UC-REG-08: Input Step 3 — Kontak + Darurat
- **Aktor:** Pendaftaran, Admin
- **Main Flow:**
  1. Render Step3Kontak dengan SCard:
     - **Kontak Pasien:** No HP* · Email (optional)
     - **Kontak Darurat:** Nama* · Hubungan* (HUBUNGAN select: Suami/Istri/Anak/Ortu/Saudara/Wali/Lainnya) · No HP Darurat* · Alamat (optional)
  2. Click "Lanjut" → validateStep(3) → jika valid show submit button
- **Business Rules:**
  - BR-REG-006: No HP minimal 10 digit
  - BR-REG-007: Kontak Darurat wajib (Nama, Hubungan, No HP)
  - BR-REG-008: Hubungan dari HUBUNGAN enum

#### UC-REG-09: Validasi & Navigasi Step
- **Trigger:** Click "Lanjut" atau "Kembali"
- **Main Flow:**
  1. Click "Lanjut": call `validateStep(currentStep, formData)` → return `Errors` object
  2. Jika `Object.keys(errors).length === 0` → setStep(current+1)
  3. Jika ada error → setErrors(errors) → tampilkan ErrMsg di bawah setiap field invalid
  4. Click "Kembali" → setStep(current-1), preserve formData
  5. Click step indicator: hanya bisa jump ke step yang sudah `done` (n < currentStep)
- **Validation rules:** lihat per-step business rules di atas

#### UC-REG-10: Submit Pasien Baru → Terbit noRM
- **Aktor:** Pendaftaran, Admin
- **Pre-condition:** All 3 steps valid
- **Main Flow:**
  1. Click "Simpan & Daftarkan"
  2. Generate noRM (mock: `RM-YYYY-NNN` autoincrement)
  3. Create new `PatientMaster` object dengan empty `riwayatKunjungan = []`, `billing = []`
  4. Insert ke `patientMasterData[noRM] = patient`
  5. Close modal
  6. Optionally: navigate ke `/ehis-registration/pasien/{noRM}` → UC-REG-16
- **Post-condition:** PatientMaster created, accessible via search
- **Data Out:** New PatientMaster entry di D1
- **Business Rules:**
  - BR-REG-009: noRM autoincrement per tahun (`RM-{YYYY}-{NNN}`)
  - BR-REG-010: NIK harus unik global — duplicate check sebelum insert (gap: belum diimplementasikan, perlu di backend)
  - BR-REG-011: Default penjamin = "Umum" jika tidak diisi (gap: form belum punya step penjamin — saat ini default Umum, edit via UC-REG-26)

**Catatan implementasi penting:** Wizard saat ini **HANYA 3 step** (Identitas, Alamat, Kontak). Step Penjamin **tidak ada di wizard pasien baru**. Penjamin di-set default "Umum" + diubah via UC-REG-26 (UbahPenjaminModal di patient dashboard). Ini design choice — onboarding minimal, penjamin di-set saat kunjungan pertama dibuat.

---

### 8.3 Pasien List (`/ehis-registration/pasien`)

#### UC-REG-11: Cari Pasien Existing
- **Aktor:** All
- **Main Flow:**
  1. Type di SearchInput → setQuery(value), setPage(1)
  2. Filter `patientMasterData` by:
     - `p.name.toLowerCase().includes(q)` OR
     - `p.noRM.toLowerCase().includes(q)` OR
     - `p.nik.includes(q)`
  3. Re-render PasienListTable dengan filtered + sliced
- **Business Rules:**
  - BR-REG-012: Search match nama (case insensitive) ATAU noRM ATAU NIK (substring)
  - BR-REG-013: Saat search aktif, page reset ke 1

#### UC-REG-12: Filter Penjamin
- **Aktor:** All
- **Main Flow:**
  1. Click filter chip (Semua / BPJS_Non_PBI / BPJS_PBI / Umum / Asuransi / Jamkesda)
  2. setFilterPenjamin(value), setPage(1)
  3. Filter: `p.penjamin.tipe === filterPenjamin` (jika !== "Semua")
- **Business Rules:** BR-REG-014: filter penjamin exact match TipePenjamin enum

#### UC-REG-13: Filter Status (Aktif/Selesai)
- **Aktor:** All
- **Main Flow:**
  1. Click chip (Semua / Aktif / Selesai)
  2. `hasActive = p.riwayatKunjungan.some(k => k.status === "Aktif")`
  3. Filter: "Aktif" → hasActive; "Selesai" → !hasActive
- **Business Rules:**
  - BR-REG-015: "Aktif" = pasien punya ≥1 kunjungan status="Aktif"
  - BR-REG-016: "Selesai" = pasien tanpa kunjungan aktif (semua selesai/dibatalkan)

#### UC-REG-14: Paginasi Daftar
- **Aktor:** All
- **Main Flow:**
  1. `PAGE_SIZE = 8`, `totalPages = Math.ceil(filtered.length / PAGE_SIZE)`
  2. Click pagination button → setPage(n)
  3. `paginated = filtered.slice((page-1)*8, page*8)`
- **Business Rules:**
  - BR-REG-017: Default sort = latest visit date desc (atau terdaftar date jika no visit)
  - BR-REG-018: safePage = Math.min(page, totalPages) — handle out-of-range

#### UC-REG-15: Buka Patient Dashboard dari List
- **Aktor:** All
- **Trigger:** Click row di PasienListTable
- **Main Flow:** Navigate `/ehis-registration/pasien/{noRM}` → UC-REG-16

---

### 8.4 Patient Dashboard — Profil & Multi-tab

#### UC-REG-16: View Patient Profile
- **Aktor:** All
- **Trigger:** Navigate to `/ehis-registration/pasien/[id]`
- **Main Flow:**
  1. Server component lookup `patientMasterData[id]`
  2. Jika tidak ada → return notFound() (404)
  3. Pass ke PatientDashboard client component with initial patient
  4. State `tabs = [initialPatient]` + `activeId = initialPatient.id`
  5. Render header (breadcrumb + tab bar) + body 2-panel (Left + Right)
  6. Left panel: PatientLeftPanel (profile + penjamin + actions + billing summary)
  7. Right panel: PatientRightPanel (3-tab: Riwayat/Jaminan/Jadwal)
- **Data In:** D1 patient by id
- **Data Out:** Dashboard fully rendered

#### UC-REG-17: Upload Foto Pasien
- **Aktor:** Pendaftaran, Admin
- **Trigger:** Click camera icon overlay di avatar
- **Main Flow:**
  1. Trigger hidden file input via `photoRef.current?.click()`
  2. User select image (accept=image/*)
  3. Handler: `setPhotoPreview(URL.createObjectURL(file))`
  4. Avatar display preview image
- **Post-condition:** Photo preview displayed (client-side, ephemeral — belum persist)
- **Tech Debt:** Persist foto pasien butuh storage backend (S3/local)

#### UC-REG-18: View Info Lengkap
- **Aktor:** All
- **Trigger:** Click "Info Lengkap" button
- **Main Flow:**
  1. setInfoLengkap(true) → InfoDetailModal mount
  2. Modal 2-tab: "Data Pribadi" (NIK, TTL, gender, gol darah, demografi, alamat, alergi, SatuSehat ID) + "Kontak" (HP, email, kontak darurat)
  3. Setiap tab punya tombol "Edit" → trigger UC-REG-19 atau UC-REG-20

#### UC-REG-19: Edit Data Pribadi
- **Aktor:** Pendaftaran, Admin
- **Trigger:** Click "Edit" di InfoDetailModal tab Data Pribadi
- **Main Flow:**
  1. Close InfoDetailModal
  2. Open EditDataModal dengan prefilled data
  3. User edit field
  4. Click "Simpan" → `setPatient(updated)` → mutate patientMasterData[activeId]
- **Business Rules:**
  - BR-REG-019: NIK edit memerlukan konfirmasi tambahan (gap: belum implemented)
  - BR-REG-020: Audit trail untuk perubahan identitas (gap: belum implemented, perlu backend)

#### UC-REG-20: Edit Kontak
- **Aktor:** Pendaftaran, Admin
- **Trigger:** Click "Edit" di InfoDetailModal tab Kontak
- **Main Flow:**
  1. Open EditKontakModal
  2. Edit HP, email, alamat, kontak darurat
  3. Click "Simpan" → setPatient(updated)

#### UC-REG-21: Multi-tab Patient View
- **Aktor:** All
- **Trigger:** Click "+ Tambah Pasien" button → search popup
- **Main Flow:**
  1. setShowSearch(true) → dropdown popup
  2. Input query → filter `allPatients` by name/noRM/NIK (max 6 results)
  3. Click search result → `openPatient(p)`:
     - Jika `!tabs.some(t => t.id === p.id)` → setTabs([...tabs, p])
     - switchTab(p.id) → setActiveId(p.id) + reset all modal states
  4. Tab bar render multiple patients dengan close X (jika tabs.length > 1)
- **Business Rules:**
  - BR-REG-021: Max no limit untuk concurrent tab (saat ini tidak ada limit eksplisit)
  - BR-REG-022: Close tab `closeTab` — jika activeId === id-being-closed, switch ke previous tab

#### UC-REG-22: Close Patient Tab
- **Trigger:** Click X di tab (jika tabs.length > 1)
- **Main Flow:** `closeTab(id, e)` → e.stopPropagation, find idx, filter tabs, switch ke remaining[max(0, idx-1)]
- **Business Rules:** BR-REG-023: Tidak boleh close tab terakhir (tabs.length <= 1 → no-op)

---

### 8.5 Patient Dashboard — Right Panel Tabs

#### UC-REG-23: Tab Riwayat — List Kunjungan
- **Aktor:** All
- **Trigger:** Click tab "Riwayat" (default active)
- **Main Flow:**
  1. Display list `patient.riwayatKunjungan` (already sorted by tanggal desc)
  2. Per item: noPendaftaran + tanggal + unit chip + StatusBadge + chevron expand
  3. Click row → toggle expanded state → display detail (DPJP, keluhan, diagnosa, ICD codes, dokumen)
  4. Click "Lihat Detail" → navigate ke `/ehis-registration/pasien/[id]/kunjungan/[noKunjungan]`
- **Business Rules:**
  - BR-REG-024: Badge count = total kunjungan
  - BR-REG-025: Status order: Aktif (sky) → Selesai (emerald) → Dibatalkan (slate)

#### UC-REG-24: Lihat Semua Riwayat Modal
- **Trigger:** Click "Semua →" link di header tab Riwayat
- **Main Flow:** RiwayatKunjunganModal display full list dengan filter periode

#### UC-REG-25: Tab Jaminan — View Current Penjamin
- **Aktor:** All
- **Trigger:** Click tab "Jaminan"
- **Main Flow:**
  1. Display PENJAMIN_CFG[patient.penjamin.tipe] dengan badge tone
  2. Display no kartu BPJS / no polis (jika ada)
  3. Display kelas penjamin (1/2/3 untuk BPJS)
  4. Tombol "Ubah" → UC-REG-26

#### UC-REG-26: Ubah Penjamin (Patient-level)
- **Aktor:** Pendaftaran, BPJS, Admin
- **Trigger:** Click "Ubah" di tab Jaminan
- **Main Flow:**
  1. Open UbahPenjaminModal
  2. Display current penjamin
  3. Select new tipe + isi field sesuai
  4. Click "Simpan" → setPatient((p) => ({ ...p, penjamin: pj }))
- **Catatan:** Ini patient-level (default penjamin untuk kunjungan berikutnya). Kunjungan-level penjamin diubah di UC-REG-43.

#### UC-REG-27: Tab Jadwal — View Upcoming Kontrol
- **Trigger:** Click tab "Jadwal"
- **Main Flow:**
  1. Derive `jadwalList` dari `patient.riwayatKunjungan.filter(k => k.jadwalKontrol)`
  2. Sort: upcoming first (tanggal >= today), then past desc
  3. `upcomingCount = filter(j => status=="Dijadwalkan" && tanggal >= today).length`
  4. Per item: tanggal+jam · dokter · unit chip · poli · keterangan · status chip (JADWAL_CFG)
  5. Show all toggle (jadwalAll)
- **Business Rules:**
  - BR-REG-026: Status "Dijadwalkan" hanya untuk tanggal >= today
  - BR-REG-027: Past jadwal status: "Selesai" / "Tidak Hadir" / "Batal"

#### UC-REG-28: Tambah Jadwal Kontrol
- **Aktor:** Pendaftaran, BPJS, Admin
- **Trigger:** Click "Tambah" di tab Jadwal
- **Main Flow:**
  1. Open TambahJadwalModal
  2. Pilih kunjungan parent (yang akan punya jadwalKontrol)
  3. Input tanggal, jam (optional), dokter, unit, poli (optional), keterangan (optional)
  4. Click "Simpan" → mutate parent kunjungan dengan `jadwalKontrol: { ...input, status: "Dijadwalkan" }`
- **Business Rules:**
  - BR-REG-028: 1 kunjungan max 1 jadwal kontrol (replace jika sudah ada)
  - BR-REG-029: Tanggal jadwal harus future (>= today + 1)
  - BR-REG-030: Reschedule = update field, bukan create baru

---

### 8.6 Patient Dashboard — Billing Summary

#### UC-REG-29: View Billing Summary
- **Aktor:** All (kasir & admin lebih relevan)
- **Pre-condition:** `patient.kasir` exists (current invoice ada)
- **Main Flow:**
  1. Display KasirData summary di left panel:
     - Total tagihan (sum items.harga * qty)
     - Total deposit (sum deposits.jumlah)
     - Sisa = total - deposit
     - Status pembayaran chip (Lunas/Belum Lunas/Proses Klaim/Ditanggung) via TAGIHAN_STATUS
  2. Display patient.billing[] daftar (max 3 recent)
  3. Click invoice card → UC-REG-30

#### UC-REG-30: View Billing Record Detail
- **Aktor:** Kasir, Admin, Pendaftaran
- **Trigger:** Click billing card
- **Main Flow:**
  1. setOpenBillingId(id) → BillingDetailModal mount
  2. Display rincian items (kategori grouped, total per kategori, total grand)
  3. Display status pembayaran + dibayar + sisa
- **Cross-link:** Tombol "Buka di Billing" → navigate `/ehis-billing/tagihan/[id]`

---

### 8.7 Daftar Kunjungan (Create New Kunjungan)

#### UC-REG-31: Pilih Unit Kunjungan
- **Aktor:** Pendaftaran, Admin
- **Trigger:** Click "Daftar Kunjungan" CTA di left panel
- **Main Flow:**
  1. Open DaftarKunjunganModal
  2. Sidebar 3 unit card: IGD (rose, AlertCircle), Rawat Jalan (sky, Stethoscope), Rawat Inap (emerald, BedDouble)
  3. Default: Rawat Jalan
  4. Click unit → setUnit(unitId) → form berubah sesuai
- **Business Rules:**
  - BR-REG-031: 3 unit yang bisa dibuat kunjungan dari registrasi: IGD/RJ/RI
  - BR-REG-032: **Lab/Rad/Farmasi BUKAN kunjungan baru** — di-create sebagai order dari kunjungan aktif (info note kuning di modal)

#### UC-REG-32: Set Waktu + Cara Masuk
- **Main Flow:**
  1. Tanggal: default today, date input
  2. Jam: default now (HH:MM), time input
  3. Cara Masuk: 4 chip (Datang Sendiri / Rujukan Puskesmas / Rujukan RS / Transfer Internal)
- **Business Rules:**
  - BR-REG-033: Tanggal default today, max today (tidak boleh future)
  - BR-REG-034: Jam default current time
  - BR-REG-035: Cara Masuk default "Datang Sendiri"

#### UC-REG-33: Input No. Surat Rujukan (Conditional)
- **Trigger:** caraMasuk === "Rujukan Puskesmas" || "Rujukan RS"
- **Main Flow:**
  1. Animated expand field "No. Surat Rujukan"
  2. Input nomor rujukan (free-text saat ini, future: lookup ke V-Claim Rujukan API)
- **Business Rules:**
  - BR-REG-036: No Rujukan wajib jika caraMasuk = rujukan
  - BR-REG-037 (future): Format rujukan BPJS: 19 digit alphanumeric

#### UC-REG-34: Unit-Specific Fields
- **Main Flow per unit:**
  
  **IGD:**
  - Triase Level (5-button: I Resusitasi rose / II Emergent orange / III Urgent yellow / IV Semi-Urgent green / V Non-Urgent slate)
  - Cara Datang (Jalan Kaki / Kursi Roda / Brankar / Diantar)
  - Default triase = 3 (Urgent)
  
  **Rawat Jalan:**
  - Poli (POLI_OPTS select dari config.ts)
  - Jenis Kunjungan (Baru / Lanjutan toggle)
  - Asal Masuk (Dari Poli / Dari IGD / Direct)
  
  **Rawat Inap:**
  - Kelas Rawat (1/2/3/VIP/ICU/HCU/Isolasi)
  - Asal Masuk (Dari IGD / Dari RJ / Transfer Internal / Langsung)
  - Default kelas = 2 (sesuai hak BPJS umum)

- **Business Rules:**
  - BR-REG-038: Triase IGD wajib (5 level ESI standard)
  - BR-REG-039: Poli RJ wajib pilih dari master Poli
  - BR-REG-040: Kelas RI wajib + harus match hak penjamin (gap: validasi belum diimplementasikan)

#### UC-REG-35: Pilih DPJP
- **Main Flow:**
  - Input nama dokter (free-text saat ini, future: autocomplete dari DOKTER_MOCK)
- **Business Rules:**
  - BR-REG-041: DPJP wajib diisi
  - BR-REG-042 (future): DPJP harus aktif di unit yang dipilih (cross-check Mapping Hub SDM × Unit)

#### UC-REG-36: Input Keluhan Utama
- **Main Flow:**
  - Textarea keluhan utama (free-text)
- **Business Rules:**
  - BR-REG-043: Keluhan wajib minimal 5 karakter
  - BR-REG-044: Keluhan akan dipakai di EHIS-Care `AsesmenMedisTab` sebagai anamnesis awal

#### UC-REG-37: Submit Kunjungan → Buka Detail
- **Aktor:** Pendaftaran, Admin
- **Pre-condition:** All required fields filled
- **Main Flow:**
  1. Click "Daftarkan Kunjungan"
  2. Generate noPendaftaran (`PND-YYYY-MMDD-NNN` autoincrement)
  3. Generate noKunjungan (`KJ-YYYY-NNN` autoincrement)
  4. Create new KunjunganRecord:
     ```ts
     {
       id, noPendaftaran, noKunjungan, tanggal, unit,
       dokter, keluhan,
       penjamin: patient.penjamin.tipe,
       noPenjamin: patient.penjamin.noPenjamin,
       caraMasuk, status: "Aktif",
       dokumen: { generalConsent: "Belum Ditandatangani", rujukan: hasRujukan ? "Ada" : "Tidak Ada", pengantarPasien: "Tidak Ada" },
       // unit-specific: triase, klinisPath, dst
     }
     ```
  5. Push ke `patient.riwayatKunjungan` (prepend)
  6. Close modal
  7. Navigate ke `/ehis-registration/pasien/[id]/kunjungan/[noKunjungan]` → UC-REG-38
- **Post-condition:** KunjunganRecord created status="Aktif", routed ke detail
- **Cross-module trigger:**
  - **EHIS-Care** akan recognize kunjungan baru di sidebar/board IGD/RI/RJ
  - **Billing** akan create draft BillingRecord linked ke noKunjungan
  - **BPJS** flow: jika penjamin BPJS, prompt operator buat SEP via tab "Update SEP" (UC-REG-66)

---

### 8.8 Kunjungan Detail — Overview Tab

#### UC-REG-38: View Ringkasan Kunjungan
- **Aktor:** All
- **Pre-condition:** Route `/pasien/[id]/kunjungan/[kunjunganId]` valid
- **Main Flow:**
  1. KunjunganDetailHeader: patient identity + kunjungan banner
  2. KunjunganTabs left sidebar (8 tab dengan 3 group: Informasi / Aksi kunjungan / Manajemen)
  3. Default tab = "overview"
  4. RingkasanCard:
     - noPendaftaran strip sky-600 + Copy button + unit chip
     - Meta grid 3-col: noKunjungan, tanggal, caraMasuk
     - DPJP card sky highlighted (Stethoscope icon + nama dokter)
     - Keluhan utama card amber (text leluhan)

#### UC-REG-39: View Penjamin & SEP Status
- **Main Flow:**
  1. PenjaminCard display:
     - Jenis Penjamin (tipe label + tone)
     - No Kepesertaan mono (atau italic "belum diisi")
     - SEP status: jika `noSEP` ada → teal "SEP Aktif" + noSEP mono; jika tidak → dashed border "Belum ada SEP" + hint "Buat melalui tab Update SEP"
- **Business Rules:**
  - BR-REG-045: SEP wajib untuk pasien BPJS dengan jnsPelayanan = "1" (Rawat Inap) atau "2" (Rawat Jalan)
  - BR-REG-046: SEP non-wajib untuk pasien Umum/Asuransi/Jamkesda

#### UC-REG-40: View Diagnosa ICD
- **Main Flow:**
  1. DiagnosaCard split kodeICD (comma-separated) → icdCodes array
  2. Per kode: chip rotate 4-color palette (indigo/teal/sky/emerald) + #N prefix + kode mono
  3. Deskripsi diagnosa (free-text)
  4. Empty state jika tidak ada
- **Business Rules:**
  - BR-REG-047: ICD codes dipisah dengan comma "I50.9, R06.0"
  - BR-REG-048: Diagnosa diisi oleh DPJP via EHIS-Care DiagnosaTab, di-sync ke kunjungan
  - BR-REG-049: ICD10 untuk diagnosis utama, ICD9-CM untuk procedure

#### UC-REG-41: View Dokumen Status
- **Main Flow:**
  1. DokumenCard list 3 dokumen:
     - General Consent (status: "Ditandatangani" / "Belum Ditandatangani" / "Digital")
     - Surat Rujukan (status: "Ada" / "Tidak Ada")
     - Pengantar Pasien (status: "Ada" / "Tidak Ada")
  2. Badge "completed/total lengkap" di header
  3. Per row: icon, label, status text, button "Lihat" jika OK
- **Business Rules:**
  - BR-REG-050: General Consent wajib ditandatangani sebelum tindakan invasif (HPK 2.1)

#### UC-REG-42: Copy No. Pendaftaran
- **Trigger:** Click "Salin" button di CopyBtn
- **Main Flow:** `navigator.clipboard.writeText(noPendaftaran)` + setCopied(true) 1500ms feedback

---

### 8.9 Kunjungan Detail — Ubah Penjamin Tab

#### UC-REG-43: Toggle Jenis Penjamin (4 Jenis)
- **Aktor:** Pendaftaran, BPJS
- **Main Flow:**
  1. 4-card selector grid 2x2:
     - **BPJS / JKN** (sky, HeartPulse, "Kartu Indonesia Sehat")
     - **Umum / Mandiri** (slate, Wallet, "Bayar sendiri / tunai")
     - **BPJS Ketenagakerjaan** (emerald, HardHat, "Jaminan kecelakaan kerja")
     - **Asuransi Lainnya** (amber, ShieldCheck, "Swasta / perusahaan")
  2. Click card → setSelected(type) + reset state
  3. Initial type derived dari `getInitialType(kunjungan.penjamin)`
- **Business Rules:**
  - BR-REG-051: Hanya 1 tipe penjamin per kunjungan
  - BR-REG-052: Switch tipe reset noPenjamin

#### UC-REG-44: BPJS Cek Peserta (Kartu/NIK)
- **Aktor:** Operator BPJS
- **Pre-condition:** selected = "bpjs-jkn"
- **Main Flow:**
  1. BpjsPanel render 2-column (left: search form, right: result)
  2. Toggle mode "No. Kartu" (13 digit) / "NIK" (16 digit)
  3. Input dengan validation digit count + counter `X/maxLen`
  4. Click "Cari Kepesertaan" (disabled jika !isValid)
  5. setPhase("searching") → setTimeout 1200ms mock latency
  6. Lookup `BPJS_MOCK[key]` → found/notfound
  7. Phase "searching" → skeleton loader
  8. Phase "notfound" → rose XCircle banner "Data tidak ditemukan"
  9. Phase "found" → emerald/rose header (Aktif/Tidak Aktif) + nama + 4 InfoItem (Jenis · Kelas · FKTP · Berlaku s/d) + button "Gunakan Data Ini"
- **Business Rules:**
  - BR-REG-053: No Kartu 13 digit numerik
  - BR-REG-054: NIK 16 digit numerik
  - BR-REG-055: Hasil "Aktif" emerald, "Tidak Aktif" rose
  - BR-REG-056: Status Tidak Aktif → warning "SEP mungkin tidak dapat diterbitkan"
- **External:** `BPJS_MOCK` lookup (mock); future: V-Claim adapter `getPesertaByKartu` / `getPesertaByNik`

#### UC-REG-45: Gunakan Data Peserta BPJS → InlineSEPCard
- **Trigger:** Click "Gunakan Data Ini" pada result
- **Main Flow:**
  1. `onSelect(result)` → setBpjsSelected(data)
  2. Animated mount InlineSEPCard di bawah BpjsPanel
  3. InlineSEPCard render full info peserta + 4-step SEP wizard embedded (SEPCardStep1 → SepStep2/3/4 → submit)
  4. Saat user submit → SEP terbit, kunjungan.noSEP dan kunjungan.noPenjamin updated
- **Business Rules:**
  - BR-REG-057: Hanya peserta status Aktif yang bisa lanjut ke SEP issuance
  - BR-REG-058: noMR (No Medical Record) wajib diisi sebelum bisa lanjut

#### UC-REG-46: Umum — Pilih Cara Pembayaran
- **Aktor:** Pendaftaran
- **Pre-condition:** selected = "umum"
- **Main Flow:**
  1. Info banner sky "Pasien dikenakan tarif umum RS"
  2. ToggleChip 4 metode (Tunai/Transfer/Kartu Debit/Kartu Kredit)
  3. Click "Simpan Perubahan"
- **Business Rules:**
  - BR-REG-059: Pembayaran Umum harus konfirmasi tarif RS di muka
  - BR-REG-060: Tipe Umum → tidak ada SEP/Rujukan workflow

#### UC-REG-47: BPJS Naker — Input KPJ & Perusahaan
- **Pre-condition:** selected = "bpjs-naker"
- **Main Flow:**
  1. Info banner emerald "Untuk kecelakaan kerja / PAK"
  2. Form: No. KPJ + Nama Perusahaan
  3. Save
- **Cross-link:** Trigger Data Kecelakaan tab UC-REG-59 (KK Panel)

#### UC-REG-48: Asuransi — Input Polis
- **Pre-condition:** selected = "asuransi"
- **Main Flow:**
  1. Form: Nama Asuransi + No Polis + Tertanggung + Berlaku s/d (date)
- **Business Rules:**
  - BR-REG-061: Asuransi swasta tidak butuh SEP (BPJS only)
  - BR-REG-062 (future): Validasi polis via insurance bridging adapter

#### UC-REG-49: Simpan Perubahan Penjamin
- **Main Flow:**
  1. Click "Simpan Perubahan" (untuk non-BPJS) atau via SEP wizard submit (BPJS)
  2. Mutate kunjungan.penjamin + kunjungan.noPenjamin (+ noSEP jika BPJS)
- **Audit:** Tercatat perubahan penjamin (future: audit log)

---

### 8.10 Kunjungan Detail — Ubah Paket Tab

#### UC-REG-50: Pindah Kelas Rawat
- **Aktor:** Pendaftaran, Admin
- **Pre-condition:** kunjungan.unit = "Rawat Inap"
- **Main Flow:**
  1. Sub-tab "Pindah Kelas" active
  2. CurrentKelasCard display kelas saat ini + tarif + bpjsEntitlement
  3. KELAS_RAWAT scrollable grid (7 kelas: VIP/Kelas_1/Kelas_2/Kelas_3/ICU/HCU/Isolasi)
  4. Per KelasCard: label + kapasitas + tarif/malam + amenities (max 3 chip + "+N more") + BPJS badge
  5. Click kelas → setSelected → highlight ring sky
  6. Compare tarif lama vs baru → display selisih (+/- nominal)
  7. Pilih SUMBER_BAYAR untuk selisih (Pribadi / Pemberi Kerja / Asuransi)
  8. Click "Konfirmasi Pindah Kelas" → mutate kunjungan
- **Business Rules:**
  - BR-REG-063: BPJS hak Kelas N → naik ke kelas lebih tinggi = bayar selisih (Permenkes 51/2018)
  - BR-REG-064: Tidak boleh turun kelas dari hak (denied)
  - BR-REG-065: ICU/HCU/Isolasi kelas khusus, tarif beda dari kelas standar

#### UC-REG-51: Pilih Sumber Pembayaran Selisih
- **Pre-condition:** Naik kelas dipilih
- **Main Flow:**
  1. Display selisih nominal
  2. Select SUMBER_BAYAR: Pribadi / Pemberi Kerja / Asuransi Swasta
  3. Conditional: jika Asuransi → input nama asuransi + no polis

#### UC-REG-52: Paket Layanan (MCU/Persalinan/Bedah)
- **Aktor:** Pendaftaran
- **Main Flow:**
  1. Sub-tab "Paket Layanan" active
  2. Pilih kategori paket (MCU / Persalinan / Bedah / Lainnya)
  3. Pilih paket spesifik (mis. MCU Standard, MCU Eksekutif, Persalinan Normal, Sectio Caesarea)
  4. Display rincian + tarif
  5. Konfirmasi paket
- **Business Rules:**
  - BR-REG-066: Paket layanan terikat ke unit (MCU = RJ + Lab, Persalinan = RI Obgyn)
  - BR-REG-067 (future): Paket harus di-validate dengan ketersediaan dokter spesialis + ruang

---

### 8.11 Kunjungan Detail — Surat Rujukan Tab

#### UC-REG-53: BPJS-only Gate Check
- **Main Flow:**
  1. Helper `isBpjs(penjamin)` = `(penjamin ?? "").toLowerCase().includes("bpjs")`
  2. Jika tidak BPJS → render NonBpjsBanner (slate ShieldOff icon + pesan "Fitur rujukan BPJS hanya tersedia untuk peserta BPJS Kesehatan")
  3. Jika BPJS → render 3 sub-menu tabs
- **Business Rules:**
  - BR-REG-068: Surat Rujukan = fitur eksklusif BPJS (Perpres 82/2018 Pasal 47)

#### UC-REG-54: Rujukan Masuk — Cari + Pilih FKTP
- **Aktor:** Operator BPJS
- **Pre-condition:** Penjamin BPJS, jnsPelayanan = "2" (Rawat Jalan)
- **Main Flow:**
  1. Sub-tab "Rujukan Masuk" active
  2. Search input: nomor rujukan atau no kartu BPJS
  3. Result list: RujukanListItem per BpjsRujukanItem (norujukan + diagnosa ICD + masa berlaku + status dot)
  4. Click item → display RujukanCard detail (FKTP asal + PPK rujukan + diagnosa + tujuan poli)
  5. Action: "Gunakan untuk SEP" → cross-link ke Update SEP wizard dengan pre-fill data rujukan
- **Business Rules:**
  - BR-REG-069: Rujukan status "Aktif" (tgl_awal <= today <= tgl_berakhir)
  - BR-REG-070: Rujukan "Kadaluarsa" → tidak bisa dipakai
  - BR-REG-071: Rujukan dari FKTP berlaku 30 hari (BPJS standard)
- **External:** `MOCK_RUJUKAN` lookup; future: V-Claim adapter `listRujukan(noKartu, "FKTP")`

#### UC-REG-55: Kontrol Pasca Ranap
- **Aktor:** Operator BPJS
- **Pre-condition:** Pasien baru pulang RI, butuh kontrol RJ
- **Main Flow:**
  1. Sub-tab "Kontrol" active
  2. PPPKInfoBar display KODE_RS + NAMA_RS + dokter aktif
  3. LastSEPCard display SEP rawat inap terakhir (`MOCK_SEP_RANAP`)
  4. Click "Gunakan SEP Terakhir" → pre-fill data
  5. Form:
     - SMF (Staf Medis Fungsional) tujuan kontrol (SMF_LIST)
     - Diagnosa (DiagnosaCombobox ICD-10 search)
     - Tanggal rencana kontrol
     - Dokter target
     - Keterangan
  6. Submit → create RencanaKontrol/SPRI record
- **Business Rules:**
  - BR-REG-072: Kontrol pasca ranap wajib ada SEP induk (no SEP RI terakhir)
  - BR-REG-073: Kontrol 1x post-discharge default (BPJS standard)
  - BR-REG-074: Diagnosa kontrol harus relevan dengan diagnosa RI

#### UC-REG-56: Rujukan IGD
- **Aktor:** Operator BPJS
- **Pre-condition:** Pasien IGD perlu rujuk ke RS lain
- **Main Flow:**
  1. Sub-tab "IGD" active
  2. Pengelolaan rujukan keluar gawat darurat
  3. Form: PPK Tujuan + SMF + diagnosa awal + alasan rujuk + keterangan
  4. Submit → create rujukan keluar
- **Business Rules:**
  - BR-REG-075: Rujukan IGD wajib disertai stabilisasi (Perpres 82/2018 Pasal 47)
  - BR-REG-076: Status pasien IGD harus stabil sebelum rujuk
- **Cross-link:** Trigger update kunjungan.dokumen.rujukan = "Ada"

---

### 8.12 Kunjungan Detail — Data Kecelakaan Tab

#### UC-REG-57: Pilih Jenis Kecelakaan (KLL/KK/Lainnya)
- **Aktor:** Pendaftaran, BPJS
- **Main Flow:**
  1. 3-card selector (Lalu Lintas amber Car / Kecelakaan Kerja emerald HardHat / Lainnya slate AlertTriangle)
  2. Per card: label + sub + chip regulasi (UU 34/1964 / PP 44/2015 / BPJS Kesehatan)
  3. Click → setDraft({ ...draft, jenis })
- **Business Rules:**
  - BR-REG-077: KLL = Jasa Raharja UU 34/1964
  - BR-REG-078: KK = BPJS Naker JKK PP 44/2015
  - BR-REG-079: Lainnya = jatuh, luka bakar non-kerja, KDRT, olahraga, dll

#### UC-REG-58: Input Detail KLL
- **Pre-condition:** jenis = "kll"
- **Main Flow:**
  1. KLLPanel form:
     - No Laporan Polisi (LP)
     - Jenis kendaraan (Mobil/Motor/Pejalan Kaki/Sepeda/dst)
     - Plat nomor
     - Posisi korban (Pengemudi/Penumpang/Pejalan Kaki)
- **Business Rules:**
  - BR-REG-080: No LP wajib (untuk klaim Jasa Raharja)
  - BR-REG-081: Tanpa LP → status klaim default "Belum"

#### UC-REG-59: Input Detail KK
- **Pre-condition:** jenis = "kerja"
- **Main Flow:**
  1. KKPanel form:
     - No KPJ (Kartu Peserta Jamsostek/BPJS Naker)
     - Nama Perusahaan
     - Jabatan
     - Saksi (nama, hubungan, kontak)
- **Business Rules:**
  - BR-REG-082: KPJ wajib (cross-check BPJS Naker)
  - BR-REG-083: Saksi minimum 1 orang

#### UC-REG-60: Input Detail Lainnya
- **Pre-condition:** jenis = "lainnya"
- **Main Flow:**
  1. LainnyaPanel:
     - Jenis/Kategori (Jatuh/Luka Bakar/Kekerasan/Olahraga/Rumah Tangga/Tersedak/Tenggelam/Listrik/Gigitan Hewan/Lainnya)
     - Penjamin (BPJS Kesehatan / Umum / Asuransi Swasta)

#### UC-REG-61: Input Detail Kejadian (Universal)
- **Main Flow:**
  1. DetailKejadian section:
     - Tanggal Kejadian (date input)
     - Waktu Kejadian (time input)
     - Provinsi Kejadian (PROVINSI_LIST select)
     - Lokasi Lengkap (alamat/jalan/km)
     - Kronologi Singkat (textarea 72px)
- **Business Rules:**
  - BR-REG-084: Tanggal kejadian wajib, harus past atau today
  - BR-REG-085: Kronologi wajib min 20 karakter

#### UC-REG-62: Set Status Klaim
- **Main Flow:**
  1. StatusKlaimSection 4 chip (Belum/Proses/Selesai/Ditolak) dengan STATUS_CONFIG tone
  2. Conditional: status "Proses" atau "Selesai" → expand input "Nomor Klaim"
- **Business Rules:**
  - BR-REG-086: Status default "Belum"
  - BR-REG-087: Nomor klaim wajib jika status >= Proses
  - BR-REG-088: Status flow: Belum → Proses → Selesai/Ditolak (no skip)

#### UC-REG-63: Buat Laporan Jasa Raharja
- **Aktor:** Operator BPJS
- **Pre-condition:** jenis = "kll"
- **Trigger:** Click "Buat Laporan Jasa Raharja" amber button
- **Main Flow:**
  1. SuratJRModal mount
  2. Print preview surat Lapor Polisi / Form Pengantar Jasa Raharja
  3. Pre-fill data dari draft (LP, kronologi, korban, kendaraan)
  4. Print via `window.print()`
- **External:** Jasa Raharja (UU 34/1964) — future bridging adapter

#### UC-REG-64: Buat Laporan BPJS Naker Form 3 KK
- **Aktor:** Operator BPJS
- **Pre-condition:** jenis = "kerja"
- **Main Flow:** Form 3 KK template + print preview (KPJ, perusahaan, kronologi, saksi)
- **External:** BPJS Naker (PP 44/2015 · Permenaker 5/2021)

#### UC-REG-65: Simpan Data Kecelakaan
- **Trigger:** Click "Simpan Data Kecelakaan"
- **Main Flow:**
  1. setSubmitted(true) → success state spring animation
  2. Mutate kunjungan dengan data kecelakaan
  3. Cross-link: Trigger UpdateSEP step 3 untuk attach LakaLantas info

---

### 8.13 Kunjungan Detail — Update SEP Tab (4-Step Wizard)

#### UC-REG-66: Step 1 — Cari Kepesertaan BPJS
- **Aktor:** Operator BPJS
- **Main Flow:**
  1. StepIndicator render 4-step progress
  2. SepStep1 = BpjsSearch (same as UC-REG-44)
  3. Toggle mode Kartu/NIK
  4. Search → mock V-Claim 1000ms
  5. Click "Gunakan Data Ini →" → setDraft pre-fill (noKartu, namaPeserta, klsRawatHak, jenisPeserta) + onNext()
- **Business Rules:** BR-REG-053 s/d BR-REG-056

#### UC-REG-67: Step 2 — Info Kunjungan
- **Main Flow:**
  1. SepStep2 form:
     - Tanggal SEP (date)
     - Jenis Pelayanan (2-chip: 1=Rawat Inap / 2=Rawat Jalan)
     - Kode PPK Pelayanan (auto-fill dari RS Profil)
     - No MR (medical record)
     - Kelas Rawat Hak (display readonly dari hasil cek peserta)
     - Naik Kelas (2-chip: Tidak / Ya)
     - Conditional saat Naik Kelas = Ya → expand:
       - Kelas Naik (select: VVIP/VIP/Kelas I-III/ICCU/ICU/Di atas Kelas I)
       - Pembiayaan (select: Pribadi/Pemberi Kerja/Asuransi Tambahan)
       - Penanggung Jawab (text input)
- **Business Rules:**
  - BR-REG-089: jnsPelayanan = "1" untuk RI, "2" untuk RJ
  - BR-REG-090: kelasRawatHak inherit dari peserta master BPJS (tidak boleh diedit)
  - BR-REG-091: Naik kelas wajib penanggung jawab jika pembiayaan ≠ Asuransi

#### UC-REG-68: Step 3 — Jaminan & Kecelakaan
- **Main Flow:**
  1. SepStep3 form 3 section:
     - **Jaminan Kecelakaan:**
       - Laka Lantas (4-chip: BKLL / KLL+BKK / KLL+KK / KK) — 4 kombinasi penjamin laka
       - Conditional saat isLaka:
         - No LP, Tgl Kejadian, Keterangan kejadian
         - Suplesi (2-chip Tidak/Ya)
         - Conditional Suplesi = Ya:
           - No SEP Suplesi
           - Kode Propinsi, Kabupaten, Kecamatan (untuk lokasi laka)
     - **COB, Katarak, SKDP, Operator:**
       - COB (Coordination of Benefit, 2-chip Tidak/Ya)
       - Katarak (2-chip Tidak/Ya)
       - No Surat SKDP (Surat Kontrol Dokter Pelayanan)
       - Kode DPJP SKDP
       - No Telepon, User/Operator, Catatan
- **Business Rules:**
  - BR-REG-092: lakaLantas = "0" (BKLL) default → bukan kasus laka
  - BR-REG-093: Suplesi = SEP lanjutan dari SEP induk (laka berlanjut)
  - BR-REG-094: COB = ada asuransi tambahan (private insurance + BPJS)
  - BR-REG-095: Katarak = klaim katarak punya logic khusus BPJS

#### UC-REG-69: Step 4 — Review Semua Data
- **Main Flow:**
  1. SepStep4 review 3 RvSection2:
     - Identitas Peserta (Nama · No Kartu · Hak Kelas)
     - Info Kunjungan (Tgl SEP · Jenis Yan · Kode PPK · No MR)
     - Jaminan & Kecelakaan (Laka Lantas · No LP · Tgl Kejadian · No SEP Suplesi · COB · Operator)
  2. Banner emerald "Semua data siap dikirim"
  3. Click "Kembali" → step 3 atau "Kirim SEP ke BPJS" → step submit
- **Business Rules:** BR-REG-096: Review wajib sebelum submit

#### UC-REG-70: Kirim SEP ke BPJS
- **Aktor:** Operator BPJS
- **Pre-condition:** All 4 steps valid
- **Trigger:** Click "Kirim SEP ke BPJS"
- **Main Flow:**
  1. setSubmitted(true) → success state
  2. Mock V-Claim `insertSEP(payload)` → assume success
  3. Generate noSEP (`PPK-YYYY-NNNNN`)
  4. Mutate kunjungan: `noSEP`, `noPenjamin`, `penjamin`, `kelasRawatHak`
  5. CheckCircle2 emerald animated + "SEP Berhasil Dikirim" + "Data SEP telah dikirimkan ke sistem BPJS"
  6. Tombol "Buat SEP Baru" → reset wizard
- **Post-condition:** KunjunganRecord.noSEP populated
- **Cross-module:** EHIS-Eklaim akan recognize SEP via `claim.penjamin.sep.noSEP`
- **External:** V-Claim adapter `submitClaim` / `insertSEP`
- **Business Rules:** BR-REG-097: 1 kunjungan = 1 SEP (kecuali SEP Internal untuk transfer SMF)

---

### 8.14 Kunjungan Detail — Cetak Dokumen Tab

#### UC-REG-71 s/d UC-REG-76: Cetak 6 Jenis Dokumen
- **Aktor:** Pendaftaran (UC-71/72/73) · Operator BPJS (UC-74/75) · Kasir (UC-76)
- **Main Flow:**
  1. CetakTab render 6 PrintRow:
     - **UC-REG-71** Bukti Pendaftaran (always enabled)
     - **UC-REG-72** Kartu Antrean (always enabled)
     - **UC-REG-73** Gelang Identitas (always enabled, SKP 1)
     - **UC-REG-74** No SEP (disabled jika `!hasSEP`)
     - **UC-REG-75** Surat Rujukan (disabled jika `!hasRujukan`)
     - **UC-REG-76** Struk Pembayaran (disabled jika `!isDone`)
  2. Click row → template render + `window.print()` A4 KOP RS
- **Business Rules:**
  - BR-REG-098: Cetak menggunakan KOP RS dari `RS_PROFIL_INITIAL`
  - BR-REG-099: Gelang Identitas wajib 2 identifier (Nama + Tgl Lahir) — SKP 1
  - BR-REG-100: Bukti Pendaftaran wajib include noPendaftaran + tanggal + DPJP + unit

---

### 8.15 Kunjungan Detail — Hapus Kunjungan Tab

#### UC-REG-77: Hapus Kunjungan
- **Aktor:** Admin Registrasi (only)
- **Pre-condition:** kunjungan.status !== "Aktif" (must be Selesai/Dibatalkan)
- **Main Flow:**
  1. HapusForm warning amber "Tindakan tidak dapat dibatalkan"
  2. Jika status = "Aktif" → block dengan info rose "Batalkan dulu sebelum hapus"
  3. Textarea Alasan
  4. Konfirmasi: ketik "HAPUS" exactly untuk enable button
  5. Click "Hapus Kunjungan" rose primary → delete kunjungan dari riwayatKunjungan
  6. Cross-delete: SEP, order, diagnosa, billing draft terkait
- **Post-condition:** KunjunganRecord removed, audit log entry
- **Business Rules:**
  - BR-REG-101: Hanya admin role boleh hapus
  - BR-REG-102: Kunjungan Aktif harus dibatalkan dulu (status → "Dibatalkan")
  - BR-REG-103: Hapus = soft delete (audit retained) atau hard delete (gap: belum diputuskan)
  - BR-REG-104: Audit trail wajib (siapa hapus, kapan, alasan) — UU PDP 27/2022

---

## 9. State Diagrams

### 9.1 KunjunganRecord Lifecycle

```
        ┌─────────────────┐
        │  (no record)    │
        └────────┬────────┘
                 │ UC-REG-37 (Create)
                 ▼
         ┌──────────────┐
         │    Aktif     │ ←─── default state setelah create
         └──────┬───────┘
                │
   ┌────────────┼─────────────────────┐
   │            │                     │
   ▼            ▼                     ▼
 [EHIS-Care   [Status manual         [Cancel by admin]
  workflow    change to Selesai          ↓
  selesai]    via Pasien Pulang]    ┌──────────────┐
   ↓               ↓                │  Dibatalkan  │
   ↓               ↓                └──────┬───────┘
   └───────┬───────┘                       │
           │                               │
           ▼                               │
    ┌──────────────┐                       │
    │   Selesai    │                       │
    └──────┬───────┘                       │
           │                               │
           │   UC-REG-77 (admin hapus)     │
           └───────────────┬───────────────┘
                           ▼
                    ┌──────────────┐
                    │  (deleted)   │
                    └──────────────┘
```

### 9.2 SEP Lifecycle

```
   ┌──────────────────┐
   │ (no SEP)         │ kunjungan dengan noSEP undefined
   └────────┬─────────┘
            │ UC-REG-70 (submit wizard)
            ▼
   ┌──────────────────┐
   │  Issued / Aktif  │ kunjungan.noSEP populated
   └────────┬─────────┘
            │
    ┌───────┼────────┬─────────────┬────────────┐
    │       │        │             │            │
    ▼       ▼        ▼             ▼            ▼
[Suplesi  [Updated] [Used by      [Closed     [Deleted
 via       (tgl     EHIS-Eklaim    via update  via /ehis-bpjs
 KLL]      pulang   submit         tgl pulang  delete SEP]
           update]  klaim]         post-       (admin only)
                                   discharge]
```

### 9.3 Jadwal Kontrol Lifecycle

```
   ┌─────────────────┐
   │  Dijadwalkan    │ ─── default saat UC-REG-28 buat jadwal
   └────────┬────────┘
            │
    ┌───────┼──────────────────┐
    │       │                  │
    ▼       ▼                  ▼
  [Pasien  [Pasien tidak     [Pasien batalkan
   hadir   datang pada       sebelum tanggal]
   pada    tanggal +1 hari    │
   jadwal] window]            │
    ↓        ↓                ↓
 ┌────────┐ ┌──────────────┐ ┌────────┐
 │Selesai │ │Tidak Hadir   │ │ Batal  │
 └────────┘ └──────────────┘ └────────┘
```

### 9.4 Kecelakaan Klaim Lifecycle

```
   ┌──────────┐
   │  Belum   │ ← default UC-REG-62
   └────┬─────┘
        │ (input nomor klaim)
        ▼
   ┌──────────┐
   │  Proses  │ ← dikirim ke Jasa Raharja / BPJS Naker
   └────┬─────┘
        │
   ┌────┼─────┐
   ▼         ▼
[Disetujui] [Ditolak]
    ↓         ↓
┌──────────┐ ┌──────────┐
│ Selesai  │ │ Ditolak  │
└──────────┘ └──────────┘
```

---

## 10. Business Rules Catalog

Total **104 business rules** terinventarisasi. Critical highlights:

### Identitas & Demografi
- **BR-REG-001 s/d 008** — Format validation NIK 16 digit, telepon 10+ digit, kode pos 5 digit
- **BR-REG-009 s/d 011** — noRM autoincrement, NIK unik global, default penjamin Umum

### Search & Filter
- **BR-REG-012 s/d 018** — Filter logic (penjamin, status, sort by latest visit), pagination 8/page

### Kunjungan Lifecycle
- **BR-REG-031 s/d 044** — Unit boundary (Lab/Rad bukan kunjungan), triase wajib IGD, DPJP wajib, keluhan min 5 char
- **BR-REG-045 s/d 050** — SEP wajib BPJS, ICD format, dokumen status

### Penjamin & SEP
- **BR-REG-051 s/d 062** — 1 tipe penjamin per kunjungan, BPJS 4-jenis flow, validasi 13/16 digit, SEP wizard 4-step
- **BR-REG-089 s/d 097** — Jenis pelayanan, kelas naik logic, laka lantas, suplesi, COB

### Rujukan
- **BR-REG-068 s/d 076** — BPJS-only gate, masa berlaku 30 hari FKTP, kontrol pasca ranap aturan, rujukan IGD stabilisasi

### Kecelakaan
- **BR-REG-077 s/d 088** — KLL Jasa Raharja, KK BPJS Naker, status klaim flow, LP wajib, saksi min 1

### Cetak
- **BR-REG-098 s/d 100** — KOP RS, gelang identitas 2-identifier SKP 1, bukti pendaftaran wajib field

### Hapus Admin
- **BR-REG-101 s/d 104** — Admin only, batal dulu sebelum hapus, audit wajib UU PDP

---

## 11. External Integrations

### Existing (Mock)

| Integration | Existing | Implementation | Future Production |
|---|---|---|---|
| **BPJS V-Claim — Cek Peserta** | ✅ Mock | `BPJS_MOCK[noKartu\|NIK]` lookup di [sepTypes.ts](src/components/registration/kunjungan/Tabs/sep/sepTypes.ts) | `vClaimAdapter.getPesertaByKartu/Nik` di [/ehis-bpjs](TODO-BPJS.md) BP2 |
| **BPJS V-Claim — Insert SEP** | ✅ Mock | UC-REG-70 simulated success setTimeout | `vClaimAdapter.insertSEP` di TODO-BPJS BP3 |
| **BPJS V-Claim — Rujukan List** | ✅ Mock | `MOCK_RUJUKAN` array di [rujukanTypes.ts](src/components/registration/kunjungan/Tabs/rujukan/rujukanTypes.ts) | `vClaimAdapter.listRujukan` di TODO-BPJS BP4 |
| **BPJS V-Claim — SEP Ranap Reference** | ✅ Mock | `MOCK_SEP_RANAP` static object | `vClaimAdapter.checkSEP(lastNoSEP)` |

### Planned (Future)

| Integration | Standard | Use Case Trigger | Implementation Path |
|---|---|---|---|
| **Jasa Raharja Form Polisi** | UU 34/1964 + PP 18/1965 | UC-REG-63 (klaim KLL) | Mock SuratJRModal print preview; future API bridging |
| **BPJS Naker Form 3 KK** | PP 44/2015 + Permenaker 5/2021 | UC-REG-64 (klaim KK) | Print template + API bridging via TODO-BPJS Phase 2 |
| **SatuSehat NIK Lookup** | Kepmenkes 1559/2022 | UC-REG-10 (pasien baru), UC-REG-19 (edit data) | `/ehis-fhir` module (planned) |
| **Kemendagri Wilayah API** | Permendagri 137/2017 | UC-REG-07 (alamat KTP), UC-REG-08 (alamat darurat) | Cascading dropdown propinsi/kabupaten/kecamatan (saat ini PROVINSI static array) |
| **BPJS Antrol (Antrian Online)** | Permenkes 4/2018 | UC-REG-03 (antrian harian) — placeholder route | Separate module `/ehis-antrol` |

### Adapter Contract (target post-BP0)

Semua external call WAJIB via adapter di `src/lib/bpjs/` (lihat [TODO-BPJS.md](TODO-BPJS.md) BP0.4):

```ts
// Pattern wajib
async function vClaimGetPeserta(noKartu, tgl, config): Promise<Result<PesertaRecord, BPJSError>>;
async function vClaimInsertSEP(payload, config): Promise<Result<SEPRecord, BPJSError>>;
async function vClaimListRujukan(noKartu, jenis, config): Promise<Result<RujukanRecord[], BPJSError>>;
// All with audit trail wrapping (auditStore log per call)
```

---

## 12. Cross-Module Dependencies

### Upstream Dependencies (modul lain yang dipakai `/ehis-registration`)

| Modul | Yang Dipakai | Lokasi |
|---|---|---|
| `/ehis-master/penjamin` | `PENJAMIN_MOCK` reference untuk dropdown penjamin | [penjaminMock.ts](src/lib/master/penjaminMock.ts) |
| `/ehis-master/dokter` | `DOKTER_MOCK` untuk dropdown DPJP (future, saat ini free-text) | [dokterMock.ts](src/lib/master/dokterMock.ts) |
| `/ehis-master/ruangan` | `RUANGAN_MOCK` untuk dropdown poli + kelas RI (future) | [ruanganShared.ts](src/components/master/ruangan/ruanganShared.ts) |
| `/ehis-master/profil-rs` | `RS_PROFIL_INITIAL` untuk KOP cetak + KODE_RS reference | [rsProfilStore.ts](src/lib/master/rsProfilStore.ts) |
| `/ehis-master/ppk` | `PPK_INITIAL` untuk dropdown faskes asal/tujuan rujukan | [ppkStore.ts](src/lib/master/ppkStore.ts) |
| `/ehis-master/icd` | `ICD_MOCK` untuk DiagnosaCombobox di kontrol pasca ranap | [icdMock.ts](src/lib/master/icdMock.ts) |
| `bpjsRuanganCatalog.ts` | Kode SMF BPJS standar untuk SEP poli code | [bpjsRuanganCatalog.ts](src/lib/master/bpjsRuanganCatalog.ts) |

### Downstream Dependencies (modul yang konsumsi data dari `/ehis-registration`)

| Modul | Yang Dikonsumsi | Trigger |
|---|---|---|
| **`/ehis-care/igd`** | KunjunganRecord (status="Aktif", unit="IGD") + PatientMaster | Kunjungan IGD created via UC-REG-37 → IGDBoard menampilkan |
| **`/ehis-care/rawat-inap`** | KunjunganRecord (unit="Rawat Inap") + PatientMaster + kelas | Admisi RI via UC-REG-37 → RIBoard menampilkan |
| **`/ehis-care/rawat-jalan`** | KunjunganRecord (unit="Rawat Jalan") + poli | Kunjungan RJ via UC-REG-37 → RJBoard |
| **`/ehis-care/laboratorium`** | Tidak langsung — order dari kunjungan aktif | DaftarOrderTab di EHIS-Care create order ber-reference ke kunjungan |
| **`/ehis-care/radiologi`** | Sama dengan Lab | DaftarOrderTab |
| **`/ehis-care/farmasi`** | Sama (resep dari EHIS-Care) | Resep di-create di EHIS-Care |
| **`/ehis-billing/tagihan`** | BillingRecord per kunjungan + KasirData | Saat kunjungan create, BillingDraft auto-created |
| **`/ehis-eklaim`** | SEPRecord + diagnosa ICD + cross-link kunjungan | Saat SEP issued via UC-REG-70, Klaim board akan show pending entry |
| **`/ehis-bpjs`** | Semua call V-Claim via adapter | Future relocation — registrasi consume adapter dari `/ehis-bpjs` |
| **`/ehis-dashboard`** | Aggregate count pasien hari ini per unit | KPI strip "Pasien Hari Ini" derive dari kunjungan tanggal=today |

### Data Sharing Pattern

```
                 patientMasterData (single source)
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        Registration   EHIS-Care   Billing
        (CRUD)         (read +     (read +
                       create      create
                       clinical    invoice)
                       records)
                          │
                          ▼
                       E-Klaim (read SEP + diagnosa)
                          │
                          ▼
                       /ehis-bpjs (manage SEP/Rujukan)
```

**Key invariant:** `patientMasterData[noRM]` adalah **single source of truth**. Setiap modul read by id, mutation hanya di `/ehis-registration`. Untuk `riwayatKunjungan[]`, mutation bisa terjadi dari modul lain (mis. EHIS-Care selesai diagnosa update kunjungan.diagnosa) via shared mutation API (saat backend ready).

---

## 13. Compliance References

| Regulasi | Topik | Use Case Affected |
|---|---|---|
| **UU PDP 27/2022** | Data Pribadi · audit trail · retention | UC-REG-10, UC-REG-77 (hapus), semua mutation |
| **Permenkes 26/2021** | Pedoman Verifikasi BPJS | UC-REG-66 s/d UC-REG-70 (SEP wizard) |
| **Perpres 82/2018** | Jaminan Kesehatan · eligibility | UC-REG-44 (cek peserta), UC-REG-70 (insert SEP) |
| **Perpres 82/2018 Pasal 47** | Rujukan IGD darurat | UC-REG-56 (rujukan IGD) |
| **Permenkes 71/2013** | Pelayanan JKN · SEP issuance | UC-REG-70 |
| **Permenkes 4/2018** | Kewajiban RS · transparansi antrian · gelang identitas | UC-REG-73 (gelang), UC-REG-03 (antrian) |
| **Permenkes 51/2018** | Naik kelas rawat (BPJS) | UC-REG-50, UC-REG-67 |
| **PMK 269/2008** | Rekam Medis · identitas pasien | UC-REG-06 s/d 10 (pasien baru), UC-REG-19, UC-REG-20 |
| **PMK 24/2022** | Rekam Medis Elektronik · format identitas | Semua data PatientMaster |
| **PMK 290/2008** | Persetujuan Tindakan · informed consent | UC-REG-41 (General Consent status) |
| **SKP 1 (SNARS · JCI IPSG 1)** | Identifikasi Pasien · 2 identifier wajib | UC-REG-73 (gelang nama + tgl lahir) |
| **UU 34/1964 + PP 18/1965** | Jasa Raharja · klaim KLL | UC-REG-58, UC-REG-63 |
| **PP 44/2015** | BPJS Naker · JKK | UC-REG-59, UC-REG-64 |
| **Permenaker 5/2021** | Form 3 KK laporan kecelakaan kerja | UC-REG-64 |
| **PMK 76/2016** | INA-CBG · kode SEP poli | UC-REG-67 (Kode PPK Pelayanan) |
| **Permendagri 137/2017** | Kode wilayah · administrasi penduduk | UC-REG-07 (alamat), UC-REG-68 (kode propinsi laka) |

---

## 14. Gap Analysis & Tech Debt

### 14.1 Functional Gaps (Belum Dibangun)

| Gap | Use Case Impact | Priority | Solution |
|---|---|---|---|
| **Antrian Harian Live Board** | UC-REG-03 placeholder | 🔴 High | Bangun `/ehis-registration/antrian` page (panggil-nomor + status loket + queue Per poli/IGD) |
| **NIK Lookup SatuSehat saat Pasien Baru** | UC-REG-06 manual entry | 🟡 Medium | Integrasi `/ehis-fhir` module saat ready |
| **DPJP Autocomplete dari Master** | UC-REG-35 free-text saat ini | 🟡 Medium | Wire DOKTER_MOCK autocomplete; cek Mapping Hub SDM × Unit |
| **Poli RJ Dropdown dari Master** | UC-REG-34 free-text saat ini | 🟡 Medium | Wire ke `BPJS_RUANGAN_CATALOG` + Mapping Hub poli |
| **Cascading Wilayah Kemendagri** | UC-REG-07 PROVINSI static | 🟢 Low | Embed Kemendagri JSON (~500KB) atau lookup API |
| **Duplicate NIK Check saat Submit** | UC-REG-10 belum validate | 🟡 Medium | Backend validation `unique(nik)` |
| **Audit Trail Persistent** | UC-REG-19, UC-REG-20, UC-REG-77 mutation tidak tercatat | 🔴 High | Backend AuditLog table (UU PDP) |
| **Foto Pasien Persistent** | UC-REG-17 client-side only | 🟢 Low | S3/storage backend |
| **Rujukan FKTP Live API** | UC-REG-54 mock saat ini | 🟡 Medium | `vClaimAdapter.listRujukan` post-TODO-BPJS BP4 |
| **Antrol BPJS Mobile JKN Bridging** | Belum ada | 🟢 Low | Far future — separate module |
| **Soft Delete vs Hard Delete Decision** | UC-REG-77 belum diputuskan | 🔴 High | Backend decision + audit retention 5 tahun (UU PDP) |
| **General Consent Digital Signature** | UC-REG-41 status only | 🟡 Medium | Integrasi e-sign + display PDF signed |
| **PaketLayanan Dataset** | UC-REG-52 belum lengkap | 🟢 Low | Master Paket di `/ehis-master/tarif` extend |
| **Pasien Baru Modal — Step Penjamin** | Wizard saat ini 3-step, penjamin default Umum | 🟡 Medium | Tambah Step 4 Penjamin atau biarkan (current pattern works) |

### 14.2 UX Polish Gaps

| Polish Gap | Use Case | Priority |
|---|---|---|
| Skeleton 500ms standardize | Beranda (650ms saat ini) | 🟢 Low |
| Empty state per filter combination | UC-REG-11, UC-REG-12, UC-REG-13 | 🟢 Low |
| Multi-tab unsaved changes warning | UC-REG-22 close tab | 🟡 Medium |
| Form unsaved warning saat navigasi | UC-REG-19, UC-REG-20, UC-REG-26 | 🟡 Medium |
| Keyboard shortcut (Esc close modal, Enter submit) | All modals | 🟢 Low |
| Print preview sebelum window.print | UC-REG-71 s/d UC-REG-76 | 🟡 Medium |
| ICD-10 search dengan typeahead | UC-REG-40 manual saat ini | 🟢 Low |

### 14.3 Integration Tech Debt (catat di TECH_DEBT.md)

- vClaimAdapter relocation ke `/ehis-bpjs` (TODO-BPJS BP0.1) — registrasi akan import dari sana
- SEP wizard share component dengan `/ehis-bpjs/sep` (DRY) — saat ini duplikasi
- BillingRecord auto-create saat kunjungan create — belum wired
- Pasien baru perlu trigger create kunjungan langsung? — current flow modal close, manual ke "Daftar Kunjungan"
- Cross-modal flow (Ubah Penjamin patient-level vs kunjungan-level) — duplikasi UI logic, perlu refactor shared

### 14.4 Compliance Gaps

| Gap | Regulation | Impact |
|---|---|---|
| Audit log per akses data pribadi | UU PDP 27/2022 | High — wajib backend |
| Retention policy 5 tahun | UU PDP 27/2022 | High — backup strategy |
| Consent management saat upload foto | UU PDP 27/2022 | Medium — disclaimer + opt-in |
| Encryption at rest (NIK, no kartu BPJS) | UU PDP 27/2022 | Medium — field-level encryption backend |
| RBAC granular per UC | All RBAC | High — backend enforcement + UI hiding |

---

## 📊 Summary

- **77 Use Cases** terinventarisasi lintas 4 halaman (Beranda · List · Patient Dashboard · Kunjungan Detail)
- **8 tab di Kunjungan Detail** (Overview · Penjamin · Paket · Rujukan · Kecelakaan · Update SEP · Cetak · Hapus)
- **104 Business Rules** terdokumentasi
- **14 Data Stores** (D1-D14)
- **6 Persona** (Pendaftaran · BPJS · Admin · Kasir · DPJP · Pasien eksternal)
- **8 External Integration** (4 existing mock + 4 planned)
- **15 Compliance Regulations** referenced
- **30+ Gap Items** untuk roadmap berikutnya

**Status:** Modul `/ehis-registration` adalah salah satu modul **paling matang** secara UI (8-tab kunjungan workspace lengkap dengan SEP wizard 4-step). Gap utama di **backend persistence**, **audit trail**, **antrian harian live**, dan **integrasi V-Claim real** (saat ini full mock).

**Cross-link untuk roadmap:** Modul ini akan **consume** services dari [TODO-BPJS.md](TODO-BPJS.md) saat BP0 selesai (vClaimAdapter relocation). Modul akan **provide** data ke [TODO-DASHBOARD.md](TODO-DASHBOARD.md) (KPI strip pasien hari ini) dan [TODO-EKLAIM.md](TODO-EKLAIM.md) (SEP yang terbit di sini jadi input klaim).
