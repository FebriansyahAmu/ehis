# EHIS E-Klaim — Phase Roadmap

> **Source of truth untuk modul `/ehis-eklaim` (Klaim BPJS, Asuransi Swasta, Jamkesda).**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
>
> **Workflow docs:**
>
> - [CLAUDE.md](CLAUDE.md) — current state + module map
> - [TODO.md](TODO.md) — Master phase roadmap (Phase 0–3 ✅)
> - [TODO-BILLING.md](TODO-BILLING.md) — Billing Kasir roadmap (saudara modul)
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend roadmap (E-Klaim depend B0/B1.9/B-fhir)
> - [.claude/STANDARDS.md](.claude/STANDARDS.md) — clinical & finance standards
>
> **Last updated:** 2026-05-24
> **Status:** 📋 Planning — modul baru hasil scope-split dari `/ehis-billing` (lihat [TODO-BILLING.md § Scope Split](TODO-BILLING.md)). Belum ada implementasi.
> **Target effort:** ~3-4 minggu (frontend full) · paralel dengan B0/B1.9 backend.

---

## 📌 Konteks: Kenapa Modul Terpisah?

**Klaim adalah workflow batch cross-invoice dengan persona berbeda dari kasir.** Setelah riset:

1. **4 role hand-off** — Coder RM → Verifikator RS → Tim Klaim → Verifikator BPJS. Bukan 1 orang.
2. **Submit selalu batch bulanan** — max tgl 10 bulan berikutnya untuk BPJS (Permenkes 76/2016). Tab invoice tidak cocok.
3. **Reconciliation 1-to-N** — 1 transfer BPJS = puluhan klaim → matching engine sendiri.
4. **Integrasi eksternal berat** — V-Claim, E-Klaim Kemenkes, VEDIKA, Apol, SatuSehat — adapter layer dedicated.
5. **Dashboard analytics unik** — approval rate, aging klaim, INA-CBG margin (over/under), top rejected reasons, coder productivity.
6. **Banding/dispute workflow** — extension dari rejection, butuh upload supplementary docs + tracking.
7. **Persona Tim Klaim** — 1-3 spesialis di RS yang kerja sehari-hari fokus klaim (bukan kasir yang fokus terima bayar).

**Indikator kuat:** Aplikasi standar industri (V-Claim, VEDIKA dari BPJS · KhanzaHIS · Aplicare · Trustmedis) **semuanya pisah modul Klaim dari Kasir** — natural mental model.

---

## 🏛 Compliance & Standar Wajib

| Regulasi               | Topik                   | Dampak ke modul                         |
| ---------------------- | ----------------------- | --------------------------------------- |
| **Perpres 82/2018**    | Jaminan Kesehatan       | Eligibility cek SEP                     |
| **Permenkes 76/2016**  | INA-CBG                 | Grouper offline/online mandatory        |
| **Permenkes 26/2021**  | Pedoman Verifikasi BPJS | Berkas wajib + checklist verifikator    |
| **PMK 269/2008**       | Rekam Medis             | Resume medis sebagai berkas klaim       |
| **UU PDP 27/2022**     | Data Pribadi            | Audit trail akses berkas pasien         |
| **AAJI Standar Klaim** | Asuransi Swasta         | Format berkas standar industri asuransi |

---

## 🔁 Workflow Klaim BPJS (per kasus)

```
[Pasien selesai dilayani / discharge]
              │
              ▼
[Resume Medis difinalisasi DPJP]  ←──── EHIS-Care (RI/IGD/RJ)
              │
              ▼ (24-48 jam)
[Coder RM → koding ICD-10 (Dx) + ICD-9-CM (procedure)]
              │
              ▼
[Grouper INA-CBG → resolve kode CBG + tarif paket]
              │
              ▼
[Verifikator RS → cek kelengkapan berkas (5 hari batas)]
              │
              ▼ (max tgl 10 bulan berikut)
[Submit batch via V-Claim / VEDIKA]
              │
              ▼
[Verifikator BPJS review (15-30 hari)]
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
   [Layak] [Pending] [Tidak Layak]
       │      │            │
       │      ▼            ▼
       │  [Susulan]   [Banding atau Write-off]
       │      │            │
       │      └────┬───────┘
       │           │
       ▼           ▼
[Pembayaran transfer batch (15-30 hari setelah verifikasi)]
              │
              ▼
[Reconciliation: 1 transfer = N klaim → matching]
              │
              ▼
[Invoice billing status → "Klaim Disetujui" / "Paid"]
```

**Batas waktu kritikal:**

- Submit max **tanggal 10 bulan berikutnya** (BPJS) — late = klaim hangus
- Verifikasi BPJS **15-30 hari**
- Banding **30 hari** setelah notif rejection

---

## 📦 Berkas Klaim BPJS (wajib per kasus)

| Berkas                                             | Sumber                   | Modul EHIS                        |
| -------------------------------------------------- | ------------------------ | --------------------------------- |
| **SEP** (Surat Eligibilitas Pasien)                | V-Claim saat registrasi  | `/ehis-registration`              |
| **Resume Medis**                                   | DPJP via PasienPulangTab | `/ehis-care/{ri,igd,rj}`          |
| **Lembar tindakan/operasi**                        | OK + ICU                 | `/ehis-care/ri`                   |
| **Hasil penunjang Lab**                            | Modul Lab                | `/ehis-care/laboratorium`         |
| **Hasil penunjang Rad**                            | Modul Rad                | `/ehis-care/radiologi`            |
| **Bukti pelayanan** (TTV/CPPT/MAR)                 | Modul klinis             | `/ehis-care/*`                    |
| **Identitas pasien** (KTP + Kartu BPJS)            | Upload registrasi        | `/ehis-registration`              |
| **Surat rujukan FKTP**                             | Upload (non-emergency)   | `/ehis-eklaim/klaim/[id]/berkas`  |
| **Billing detail itemized**                        | Invoice                  | `/ehis-billing/tagihan/[id]`      |
| **Grouper result INA-CBG**                         | E-Klaim Kemenkes         | `/ehis-eklaim/klaim/[id]/grouper` |
| **Berkas khusus** (laporan anestesi/kemo/dialisis) | OK + Day Care            | `/ehis-care/ri`                   |

**Asuransi Swasta:** Format per asuransi (Mandiri Inhealth, Allianz, AXA, Prudential, dst.) — kebanyakan turunan AAJI + tambahan custom. Cashless vs Reimbursement workflow berbeda.

---

## 🔌 Integrasi Aplikasi Pihak Ketiga (wajib)

| Aplikasi                 | Owner          | Fungsi                         | Status                    |
| ------------------------ | -------------- | ------------------------------ | ------------------------- |
| **E-Klaim INA-CBG**      | Kemenkes       | Grouper offline/online         | Mandatory — adapter EK0.4 |
| **V-Claim**              | BPJS Kesehatan | Eligibility + SEP + submission | Mandatory — adapter EK0.4 |
| **VEDIKA**               | BPJS           | Verifikasi digital + tracking  | Mandatory — adapter EK0.4 |
| **Apol** (Apotek Online) | BPJS           | Klaim obat kronis FKTL         | Optional — adapter EK7    |
| **SATU SEHAT**           | Kemenkes       | Pertukaran data klinis         | Cross-ref ke `/ehis-fhir` |

**Strategi mock-first:** adapter `lib/eklaim/vClaimAdapter.ts` dst. return Promise dengan mock delay 1500ms; backend swap saat ready tanpa refactor UI.

---

## 🏗 Architecture Decisions (jangan diubah tanpa diskusi)

1. **Modul mandiri** — `/ehis-eklaim` punya sidebar nav, beranda, dan workspace sendiri. Bukan sub-section billing.
2. **`ClaimRecord` single source di-host di sini** — billing membaca via cached read (`getClaimStatusForInvoice(invoiceId)`), tidak mutate.
3. **Cross-link via deep-link** — invoice → tab Klaim status → "Buka di E-Klaim" → `router.push("/ehis-eklaim/klaim/[claimId]")`.
4. **BPJS + Asuransi Swasta + Jamkesda dalam 1 modul** — workflow inti sama (berkas + submit + tracking + reconciliation). Differensiasi via tab "Berkas" yang dinamis per-penjamin (BPJS = SEP+CBG; Asuransi = form penjamin + plafon cek).
5. **Coder rekam medis sebagai role di `/ehis-eklaim`** — koding ICD adalah pre-syarat klaim. Future: bisa di-split jadi modul `/ehis-rekam-medis` terpisah jika butuh full medical records management (audit, retention, KIUP).
6. **Batch-first UX** — operasi default = batch (pilih multiple → submit). Single-item action available tapi bukan primary.
7. **Print-friendly** — semua report + berkas + reconciliation harus pakai print stylesheet + KOP RS.
8. **Density tokens `m-*`** wajib untuk Klaim Board (banyak baris) + Reconciliation Detail.
9. **Accent module amber → sky** — bedakan dari billing (amber). Sky/teal/emerald palette · slate neutral. **No indigo/violet.**
10. **Audit trail granular** — setiap perubahan status, upload berkas, edit koding, submit batch — tercatat dengan timestamp+actor+IP.

---

## 📂 File Structure (rencana)

```
src/lib/eklaim/
├── eklaimShared.ts             # types ClaimRecord, BerkasKlaim, InaCbgRecord, BandingRecord, KodeICD10/ICD9
├── inaCbgResolver.ts           # resolveInaCbg(dx, proc, kelas, los, age, sex) → {code, tarif, group}
├── inaCbgMock.ts               # INA_CBG_LOOKUP_MOCK (~30 CBG paling umum)
├── icdMock.ts                  # ICD10_MOCK + ICD9_MOCK (lookup dropdown koding)
├── berkasChecker.ts            # cek kelengkapan berkas per penjamin (return checklist + missing)
├── eligibilityChecker.ts       # cek SEP, masa berlaku, kelas dijamin, plafon
├── reconciliationMatcher.ts    # auto-match transfer BPJS → klaim approval
├── vClaimAdapter.ts            # mock submission ke V-Claim (return Promise)
├── eKlaimKemenkesAdapter.ts    # mock grouper Kemenkes
├── vedikaAdapter.ts            # mock verifikasi digital BPJS
├── claimStore.ts               # client store draft klaim + transaksi sementara
└── claimsMock.ts               # CLAIM_BOARD_MOCK (~25 klaim lintas status/penjamin)

src/app/ehis-eklaim/
├── page.tsx                    # Beranda E-Klaim (EK1)
├── klaim/
│   ├── page.tsx                # Klaim Board (EK2)
│   └── [id]/page.tsx           # Klaim Detail (EK3)
├── calculator/page.tsx         # INA-CBG Calculator standalone (EK4)
├── banding/page.tsx            # Banding Board (EK6)
├── reconciliation/page.tsx     # Reconciliation BPJS (EK7)
└── report/page.tsx             # Dashboard analytics (EK8)

src/components/eklaim/
├── beranda/                    # EK1
│   ├── BerandaEklaimPage.tsx
│   ├── KPIStripEklaim.tsx
│   ├── QuickNavGridEklaim.tsx
│   ├── ButuhBandingPanel.tsx
│   ├── AkanExpiredPanel.tsx
│   └── RecentSubmissionPanel.tsx
├── klaim/                      # EK2 + EK3
│   ├── KlaimBoardPage.tsx
│   ├── KlaimHero.tsx
│   ├── KlaimKPIStrip.tsx
│   ├── KlaimFilterPanel.tsx
│   ├── KlaimWorkspaceShell.tsx
│   ├── KlaimBulkBar.tsx
│   ├── parts/
│   │   ├── KlaimTable.tsx
│   │   ├── KlaimRow.tsx
│   │   ├── KlaimRowActions.tsx
│   │   └── KlaimEmptyState.tsx
│   └── shared/
│       ├── ClaimStatusChip.tsx
│       ├── PenjaminBadge.tsx
│       └── CbgChip.tsx
├── detail/                     # EK3 Klaim Detail (6 tab)
│   ├── KlaimDetailPage.tsx
│   ├── ClaimBannerHeader.tsx
│   ├── ClaimTabs.tsx
│   ├── tabs/
│   │   ├── BerkasTab.tsx       # EK3.2 — checklist + upload + preview
│   │   ├── CodingTab.tsx       # EK3.3 — ICD-10 + ICD-9 picker
│   │   ├── GrouperTab.tsx      # EK3.4 — INA-CBG result + breakdown
│   │   ├── SubmissionTab.tsx   # EK3.5 — eligibility + push batch
│   │   └── AuditTab.tsx        # EK3.6 — timeline status
│   └── modals/
│       ├── UploadBerkasModal.tsx
│       ├── EditKodingModal.tsx
│       └── SubmitBatchModal.tsx
├── calculator/                 # EK4
│   ├── InaCbgCalculatorPage.tsx
│   ├── CalculatorInputForm.tsx
│   └── CalculatorResultCard.tsx
├── berkas/                     # EK5
│   ├── BerkasGeneratorModal.tsx
│   ├── ResumeMedisTemplate.tsx
│   ├── BerkasKlaimTemplate.tsx
│   └── SuratPengantarTemplate.tsx
├── banding/                    # EK6
│   ├── BandingBoardPage.tsx
│   ├── BandingDetailPage.tsx
│   └── BandingFormModal.tsx
├── reconciliation/             # EK7
│   ├── ReconciliationPage.tsx
│   ├── ImportTransferModal.tsx
│   ├── MatchingEngine.tsx
│   ├── ManualMatchForm.tsx
│   └── SelisihWriteOffModal.tsx
└── reports/                    # EK8
    ├── ApprovalRateChart.tsx
    ├── AgingKlaimReport.tsx
    ├── CbgMarginAnalysis.tsx
    ├── TopRejectedReasons.tsx
    └── CoderProductivity.tsx
```

**File limit ≤800 lines** — split ke sub-components jika lebih besar (pola sama dengan billing/master).

---

## Phase EK0 — Foundation & Data Contracts

**Effort:** 3-4 hari · **ROI:** semua fase berikut bisa paralel, schema stabil

### EK0.1 Types di [src/lib/eklaim/eklaimShared.ts](src/lib/eklaim/eklaimShared.ts)

- [ ] **`ClaimRecord`** — entity utama:
  ```ts
  {
    id, noKlaim, invoiceId, kunjunganId, pasienId,
    penjamin: { tipe: "bpjs" | "asuransi" | "jamkesda", nama, noSEP? },
    diagnosaPrimer: KodeICD10, diagnosaSekunder: KodeICD10[],
    tindakanProsedur: KodeICD9[],
    kelas: KelasRawat, los: number, age: number, gender: "L" | "P",
    inaCbg?: { code, group, tarif, severity: 1|2|3 },
    tarifRS: number,            // sum dari invoice items
    selisih?: number,           // tarifCBG - tarifRS (negatif = under, positif = over)
    statusPenjamin: ClaimStatus,
    submittedAt?, submittedBy?, batchId?,
    verifierBpjs?, verifierComment?,
    approvedAmount?, paidAmount?, paidAt?,
    rejectionReason?, bandingCount?,
    berkas: BerkasKlaim[],
    timeline: ClaimTimelineEntry[],
    createdBy, createdAt, updatedAt,
  }
  ```
- [ ] **`ClaimStatus`** — granular state:
  ```ts
  "Draft Coding" |
    "Belum Submit" |
    "Submitted" |
    "Pending Verifikasi" |
    "Approved" |
    "Rejected" |
    "Banding Submitted" |
    "Banding Approved" |
    "Banding Rejected" |
    "Paid" |
    "Write-off";
  ```
- [ ] **`BerkasKlaim`** — checklist item per berkas:
  ```ts
  {
    id, kategori: "SEP" | "ResumeMedis" | "Tindakan" | "Lab" | "Rad" | "Identitas"
                | "Rujukan" | "Billing" | "Grouper" | "Khusus",
    nama, wajib: boolean, status: "Belum" | "Siap" | "Tidak Berlaku",
    url?, uploadedBy?, uploadedAt?, catatan?,
  }
  ```
- [ ] **`InaCbgRecord`** — lookup table entry:
  ```ts
  {
    code: string,              // e.g. "I-1-01-I"
    group: string,             // e.g. "Infark Miokard Akut Ringan"
    severity: 1 | 2 | 3,       // I/II/III
    tarif: { kelas3, kelas2, kelas1, vip },  // per kelas
    icd10List: string[],       // primary Dx mappings
    icd9List: string[],        // procedure mappings (optional)
  }
  ```
- [ ] **`KodeICD10` / `KodeICD9`** — picker entry:
  ```ts
  { kode, deskripsi, kategori, hint? }
  ```
- [ ] **`BandingRecord`** — pengajuan banding:
  ```ts
  {
    id, claimId, alasanRejectionAsli, alasanBanding,
    dokumenPendukung: string[], submittedAt, submittedBy,
    status: "Submitted" | "Review" | "Approved" | "Rejected",
    reviewerBpjs?, reviewedAt?, hasilBanding?,
  }
  ```
- [ ] **`ReconciliationRecord`** — match transfer ke klaim:
  ```ts
  {
    id, noTransfer, tanggalTransfer, nominalTransfer, bank,
    penjaminId, periodeKlaim,
    matchedClaims: { claimId, amount, autoMatched: boolean }[],
    selisih?: number, statusSelisih?: "Write-off" | "Refund" | "Pending",
    completedAt?, completedBy?,
  }
  ```
- [ ] **`KasirShift`-like `CoderShift`?** — optional, tracking coder productivity (parked sampai EK8).

### EK0.2 Mock seed

- [ ] **`CLAIM_BOARD_MOCK`** — 25 klaim lintas:
  - 3 penjamin (BPJS 60%, Asuransi 30%, Jamkesda 10%)
  - 11 status (distribusi realistis: 30% Belum Submit, 20% Pending, 20% Approved, 10% Rejected, 10% Paid, 10% mixed)
  - 4 kelas (VIP/K1/K2/K3 + ICU)
  - Periode bulan terakhir
- [ ] **`INA_CBG_LOOKUP_MOCK`** — 30 CBG paling umum:
  - I-1-01-I s/d III (Infark Miokard Akut)
  - I-4-10-I s/d III (Gagal Jantung)
  - U-1-02-I s/d III (DM Type 2)
  - K-1-31-I s/d III (Bedah Sesar)
  - J-1-30 (Persalinan Normal)
  - dll.
- [ ] **`ICD10_MOCK`** — 50 ICD-10 paling umum di Indonesia (sumber: SKDI/SNARS)
- [ ] **`ICD9_MOCK`** — 30 ICD-9-CM procedure paling umum
- [ ] **`BERKAS_TEMPLATE_BPJS`** — checklist 10 berkas wajib BPJS
- [ ] **`BERKAS_TEMPLATE_ASURANSI`** — checklist 8 berkas standar AAJI
- [ ] **`RECONCILIATION_MOCK`** — 5 transfer batch BPJS bulan terakhir

### EK0.3 Helpers shared di [src/lib/eklaim/](src/lib/eklaim/)

- [ ] **`inaCbgResolver.ts`** — `resolveInaCbg(diagnosaList, tindakanList, kelas, los, age, sex) → InaCbgResult`. Mock pakai lookup `INA_CBG_LOOKUP_MOCK` dengan rule sederhana (match ICD primer + severity scoring).
- [ ] **`berkasChecker.ts`** — `checkBerkas(claim, template) → { ready, missing, optional }`. Return checklist + progress %.
- [ ] **`eligibilityChecker.ts`** — `checkEligibility(noSEP, tanggalLayanan) → { valid, kelasDijamin, plafon?, sisaHariRawat? }`. Mock dengan rule berdasarkan masa berlaku SEP.
- [ ] **`reconciliationMatcher.ts`** — `matchTransfer(transfer, approvedClaims) → { matched, unmatched, selisih }`. Auto-match by nominal + tanggal periode + penjamin.
- [ ] **`claimCalc.ts`** — pure: `totalApproved(claims)` · `approvalRate(claims)` · `avgDaysToPaid(claims)` · `agingBucket(claim)` · `marginCbg(claim)`.

### EK0.4 Adapter stubs (mock backend)

- [ ] **`vClaimAdapter.ts`** — `submitToVClaim(berkas[], batchId)` mock dengan delay 1.5s + return success/fail random 90/10%.
- [ ] **`eKlaimKemenkesAdapter.ts`** — `groupCbg(claim)` mock pakai `inaCbgResolver`. Return grouper response format Kemenkes.
- [ ] **`vedikaAdapter.ts`** — `getClaimStatus(noKlaim)` mock pakai `CLAIM_BOARD_MOCK`. Polling pattern.
- [ ] **`apolAdapter.ts`** — stub (untuk EK7 reconciliation obat kronis FKTL — optional).

**Acceptance EK0:** semua types compile clean, mock siap 25+ klaim, helpers `resolveInaCbg`/`checkBerkas`/`checkEligibility` return value benar untuk berbagai kombinasi, adapter return Promise dengan format konsisten.

---

## Phase EK1 — Beranda E-Klaim

**Route:** `/ehis-eklaim` · **Effort:** 2 hari
**Pattern reference:** Beranda Master + Beranda Billing

### EK1.1 Layout

- [ ] **Hero header** sky-accent (icon `ShieldCheck` + eyebrow + h1 "EHIS E-Klaim" + tanggal + timestamp pill).
- [ ] **KPI Strip** 5 hero card animated:
  - **Klaim Hari Ini** (count + Rp · trend %)
  - **Pending Verifikasi BPJS** (count menunggu verifier BPJS)
  - **Belum Submit Akhir Bulan** (count yang harus submit sebelum tgl 10 — countdown days)
  - **Approval Rate Bulan Ini** (% approved + nominal)
  - **Total Bayar Bulan Ini** (nominal transfer masuk)
- [ ] **Quick-Nav Grid** 4-card:
  - Klaim Board · INA-CBG Calculator · Banding · Reconciliation

### EK1.2 Sidebar Panel kanan

- [ ] **Butuh Banding** — list klaim Rejected yang belum ada banding (sort by hari rejection desc).
- [ ] **Akan Expired Submit** — list klaim Belum Submit dengan kunjungan >25 hari (mendekati batas tgl 10 next month).
- [ ] **Recent Submission** — 10 submission terakhir (action + actor + nominal).

### EK1.3 Components

- [ ] `BerandaEklaimPage.tsx` · `KPIStripEklaim.tsx` · `QuickNavGridEklaim.tsx` · `ButuhBandingPanel.tsx` · `AkanExpiredPanel.tsx` · `RecentSubmissionPanel.tsx`

**Acceptance EK1:** beranda load <500ms (skeleton 500ms), KPI angka match seed mock, klik quick-nav route ke sub-page.

---

## Phase EK2 — Klaim Board (Worklist Cross-Invoice)

**Route:** `/ehis-eklaim/klaim` · **Effort:** 3-4 hari
**Pattern reference:** Tagihan Board (BL1) + Farmasi Board

### EK2.1 Layout & Filter

- [ ] **Header strip** 4 KPI:
  - Klaim Hari Ini (count + Rp)
  - Pending Verifikasi (count menunggu)
  - Rejected Bulan Ini (count perlu banding)
  - Approval Rate (% + trend chip)
- [ ] **Filter Panel kiri 300px sticky** — sama pattern dengan Tagihan Board:
  - Pencarian (no klaim / no RM / nama pasien)
  - Periode kunjungan (5 preset + kustom)
  - Penjamin (BPJS/Asuransi/Jamkesda · multi-select)
  - Penjamin nama spesifik (dropdown native styled, max-w 260px)
  - Kelas (7 chip)
  - Status (11 chip multi-select dengan tone per status)
  - Unit asal kunjungan (IGD/RJ/RI · multi-select)
- [ ] **Quick Tabs** 5 pre-filter:
  - Semua · Belum Submit · Pending Verifikasi · Rejected (perlu banding) · Paid
  - Count dinamis after-filter aware (sama pattern Tagihan BL1.4)
- [ ] **Density toggle** Compact/Comfortable/Cozy.

### EK2.2 Tabel Worklist

- [ ] **Sticky-header table** 11 kolom:
  - Checkbox bulk
  - No Klaim + Tanggal kunjungan (mono)
  - Pasien (nama + noRM)
  - Unit + Kelas (chip)
  - Penjamin (badge per tipe)
  - INA-CBG (code mono + group truncate)
  - Tarif RS (mono right)
  - Tarif CBG (mono right · emerald jika over · rose jika under)
  - Selisih (chip · emerald/rose)
  - Status (chip per 11 status)
  - Kebab aksi
- [ ] **Sort 3-state** untuk 7 kolom sortable (No Klaim/Tanggal/Pasien/CBG code/Tarif RS/Selisih/Status).
- [ ] **Bulk-select + bulk-action bar** — saat selected >0 muncul sky action bar:
  - **Submit Batch ke BPJS** (eligibility: penjamin BPJS + status Belum Submit)
  - **Cek Eligibility** (call V-Claim untuk validasi SEP semua)
  - **Generate Berkas Batch** (zip per klaim)
  - **Export Excel** (sama pattern Tagihan)
- [ ] **Row interactivity** — click row → `/ehis-eklaim/klaim/[id]`. Kebab dengan disabledIf rule.
- [ ] **Empty state** sky-themed dengan CTA reset filter.
- [ ] **Footer summary** — count rows + density label + Total Tarif RS + Total Tarif CBG + Total Selisih.

### EK2.3 Logic terpisah

- [ ] **`klaimBoardLogic.ts`** — pure: `applyFilters`/`applySort`/`cycleSort`/`computeQuickTabCounts`/`exportKlaimCsv` (sama pattern tagihan).

**Acceptance EK2:** worklist tampil 25 klaim, filter real-time, bulk submit batch trigger mock V-Claim, count tab dinamis, click row navigate ke detail.

---

## Phase EK3 — Klaim Detail (6-Tab Workspace)

**Route:** `/ehis-eklaim/klaim/[id]` · **Effort:** 5-6 hari
**Pattern reference:** Invoice Detail (BL2) + Farmasi OrderDetail 5-tab

### EK3.1 Banner Header

- [ ] **`ClaimBannerHeader`** — sky-accent:
  - Breadcrumb "← Klaim Board" + noKlaim mono
  - Avatar + identity row (nama + verified + gender/age/noRM)
  - Chips strip: Penjamin · Kelas · SEP · noKunjungan · Unit asal
  - Meta line: tanggal layanan · LOS · DPJP · Coder
  - Status chip besar di kanan + claim timeline mini horizontal (Coding → Verif RS → Submit → Verif BPJS → Paid)
  - Quick actions: **Submit ke BPJS** (primary sky · disabled jika berkas belum lengkap) · **Generate Berkas** · **Print Resume Medis**
- [ ] **Progress berkas indicator** — bar progress global kelengkapan berkas (X/Y wajib) sebelum tabs.

### EK3.2 Tab Berkas

- [ ] **Berkas checklist** per kategori (SEP/ResumeMedis/Tindakan/Lab/Rad/Identitas/Rujukan/Billing/Grouper/Khusus):
  - Per row: kategori icon · nama berkas · status (Belum/Siap/N.A) · upload action · preview link · catatan
  - Per row: hide jika `wajib: false` & `status: "Tidak Berlaku"` (collapse)
- [ ] **Upload form per berkas** — stub file input + caption text (mock URL)
- [ ] **Auto-pull dari modul lain** (BL6-equivalent untuk klaim):
  - Resume Medis → fetch dari `/ehis-care/{ri,igd,rj}/[pasienId]/discharge`
  - Lab → fetch dari `/ehis-care/laboratorium` orders status `Tervalidasi`
  - Rad → fetch dari `/ehis-care/radiologi` orders status `Tervalidasi`
  - Billing → fetch dari `/ehis-billing/tagihan/[invoiceId]` items
- [ ] **Preview pane** — embed PDF/image viewer (mock placeholder image)
- [ ] **Notes per berkas** — textarea audit (sebagai catatan koder untuk verifikator)

### EK3.3 Tab Coding (ICD-10 + ICD-9)

- [ ] **Diagnosa Primer** picker — searchable autocomplete dari `ICD10_MOCK` (kode + deskripsi + kategori)
- [ ] **Diagnosa Sekunder** multi-picker — boleh 0-10 diagnosa
- [ ] **Tindakan/Prosedur** multi-picker — searchable autocomplete dari `ICD9_MOCK`
- [ ] **Auto-suggest** dari kunjungan — kalau `DiagnosaTab` kunjungan sudah ada `kodeIcd10`, auto-fill diagnosa primer
- [ ] **Validasi** — diagnosa primer wajib · severity scoring (Mild/Moderate/Severe berdasarkan jumlah komorbid)
- [ ] **Tombol Re-Group** — trigger grouper INA-CBG ulang setelah edit koding
- [ ] **Coder signature** — checkbox "Saya kode ini benar" + nama coder + timestamp (audit trail)

### EK3.4 Tab Grouper (INA-CBG Result)

- [ ] **CBG Result Card** prominent:
  - Kode CBG besar mono + group name
  - Severity badge (I/II/III)
  - Tarif CBG per kelas (table)
  - Tarif aktual berdasarkan kelas pasien
- [ ] **Breakdown card** — tarif RS vs tarif CBG:
  - Subtotal items per kategori (Akomodasi/Tindakan/Lab/Rad/Obat/Jasa Dokter)
  - Compare vs tarif CBG
  - Selisih nominal + chart bar
  - Highlight over/under
- [ ] **Top-Up CMG indicator** — jika kasus eligible (ICU >3 hari, obat mahal, dll) tampilkan suggestion + tarif tambahan
- [ ] **Tombol Re-Group** — sama dengan Coding tab

### EK3.5 Tab Submission

- [ ] **Eligibility check card** (call `vClaimAdapter.checkSEP`):
  - Status SEP (valid/expired/tidak ditemukan)
  - Kelas dijamin · plafon sisa · sisa hari rawat
  - Tombol "Refresh Status"
- [ ] **Pre-submit checklist** — semua wajib check (berkas lengkap + coding final + grouper resolved + eligibility valid)
- [ ] **Batch picker** — pilih batch yang sedang Open (atau buat batch baru)
- [ ] **Tombol Submit** primary sky — disabled jika checklist tidak lengkap
- [ ] **Result feedback** — toast + status timeline update (Submitted → Pending Verifikasi)

### EK3.6 Tab Audit/Timeline

- [ ] **Timeline vertikal** semua event: create/edit-coding/upload-berkas/regroup/submit/verifikasi/banding/payment
- [ ] **Per-entry**: timestamp + actor avatar + action chip + diff (before/after coding)
- [ ] **Filter by actor / action / date range**
- [ ] **Export CSV** audit trail per klaim

### EK3.7 Modals

- [ ] **`UploadBerkasModal`** — pilih kategori + file + catatan + submit
- [ ] **`EditKodingModal`** — picker ICD-10/9 dengan validasi
- [ ] **`SubmitBatchModal`** — confirm batch + ringkasan klaim yang akan disubmit

**Acceptance EK3:** buka klaim demo, 6 tab functional, coding ICD → grouper auto-resolve CBG, eligibility check OK, submit batch trigger mock V-Claim, status berubah ke Submitted.

---

## Phase EK4 — INA-CBG Calculator Standalone

**Route:** `/ehis-eklaim/calculator` · **Effort:** 2 hari
**Pattern reference:** Standalone form page

### EK4.1 Form Input

- [ ] **Form 2-col**:
  - Left: Diagnosa Primer + Sekunder (multi-picker) + Tindakan/Prosedur (multi-picker)
  - Right: Kelas · LOS (number) · Age · Sex · Jenis kunjungan (RI/RJ/Same Day)
- [ ] **Tombol Hitung CBG** primary sky.

### EK4.2 Result Card

- [ ] **CBG Result** — kode + group + severity + tarif per kelas + breakdown grouper rationale.
- [ ] **Compare vs Actual Cost** — input nominal tarif RS manual → tampil selisih chart.
- [ ] **Save as Draft Klaim** — tombol untuk simpan hasil sebagai draft (link ke `/ehis-eklaim/klaim/new`).
- [ ] **Print Result** — print stylesheet untuk dokumentasi.

**Acceptance EK4:** kalkulator standalone berfungsi untuk 10 kasus sample, hasil match dengan tabel resmi Kemenkes mock.

---

## Phase EK5 — Berkas Generator (PDF Templates)

**Effort:** 2-3 hari · **Dependency:** EK0 templates + EK3 berkas tab

### EK5.1 Templates

- [ ] **`ResumeMedisTemplate.tsx`** — A4 layout:
  - KOP RS (consume `RS_PROFIL.kop`)
  - Identitas pasien + no RM + tanggal
  - Diagnosa (primer + sekunder + ICD-10)
  - Riwayat penyakit ringkas
  - Tindakan/Prosedur (ICD-9)
  - Hasil penunjang ringkas (lab/rad)
  - Terapi pulang
  - Tanda tangan DPJP
- [ ] **`BerkasKlaimTemplate.tsx`** — A4 cover:
  - Header KOP + no klaim + tanggal
  - Pasien identitas + penjamin
  - Tabel berkas (kategori + nama + status)
  - INA-CBG result
  - Tanda tangan coder + verifikator RS
- [ ] **`SuratPengantarTemplate.tsx`** — A4:
  - Tujuan ke BPJS · perihal klaim batch
  - List klaim (batch summary)
  - Tanda tangan kepala tim klaim

### EK5.2 Print + Bundle

- [ ] **`window.print()` + print stylesheet** — A4 default
- [ ] **Mock ZIP bundle** — untuk batch submission (collect semua berkas + cover + pengantar)
- [ ] **`BerkasGeneratorModal`** — pilih template + preview + tombol Print/Download

**Acceptance EK5:** generate Resume Medis untuk demo klaim, tampil dengan KOP RS, signature DPJP, print preview clean.

---

## Phase EK6 — Banding / Dispute Workflow

**Route:** `/ehis-eklaim/banding` · **Effort:** 2 hari

### EK6.1 Banding Board

- [ ] **Worklist banding** — filter status (Submitted/Review/Approved/Rejected) + periode + penjamin
- [ ] **KPI**: Total Banding · Approval Rate Banding · Avg Days to Decision

### EK6.2 Banding Form

- [ ] **`BandingFormModal`** — dari Klaim Detail (status Rejected) tombol "Ajukan Banding":
  - Tampilkan alasan rejection asli (read-only)
  - Form alasan banding (textarea wajib + min 50 char)
  - Upload dokumen pendukung (multi-file stub)
  - Submit → buat `BandingRecord` + status klaim → "Banding Submitted"

### EK6.3 Banding Detail

- [ ] **Detail page** per banding:
  - Klaim context card (link ke klaim asli)
  - Alasan rejection asli vs alasan banding (side-by-side)
  - Dokumen pendukung list + preview
  - Status timeline (Submitted → Review → Approved/Rejected)
  - Mock review BPJS — tombol "Mark Approved/Rejected" untuk demo

**Acceptance EK6:** ajukan banding untuk klaim Rejected, status berubah, dokumen pendukung ter-upload, mock approval bekerja.

---

## Phase EK7 — Reconciliation Transfer BPJS

**Route:** `/ehis-eklaim/reconciliation` · **Effort:** 3 hari

### EK7.1 Import Transfer

- [ ] **`ImportTransferModal`** — upload CSV mock (kolom: tanggal/nominal/bank/keterangan):
  - Parse CSV → buat `ReconciliationRecord` draft
  - Auto-detect penjamin dari keterangan (regex "BPJS"/"Mandiri Inhealth"/dll)

### EK7.2 Matching Engine

- [ ] **`MatchingEngine`** — auto-match nominal transfer ke klaim Approved:
  - Group klaim by penjamin + periode submit
  - Match by nominal exact atau range ±5%
  - Tampilkan unmatched klaim + unmatched transfer
- [ ] **`ManualMatchForm`** — drag-drop atau pick manual untuk klaim yang tidak auto-match

### EK7.3 Selisih Resolution

- [ ] **`SelisihWriteOffModal`** — untuk klaim partial paid:
  - Tampilkan tarif diajukan vs disetujui
  - Pilihan: Write-off · Refund (kalau lebih bayar) · Pending (sengketa)
  - Wajib alasan + approver

### EK7.4 Reconciliation Report

- [ ] **Detail page per reconciliation** — list klaim matched + nominal + status + selisih
- [ ] **Export PDF/Excel** untuk akuntansi

**Acceptance EK7:** import transfer demo 1.5jt BPJS, auto-match 10 klaim, manual-match 2 sisa, selesai dengan selisih write-off 50rb.

---

## Phase EK8 — Dashboard Analytics

**Route:** `/ehis-eklaim/report` · **Effort:** 2-3 hari

### EK8.1 Approval Rate

- [ ] **Line chart** approval rate per penjamin × bulan (rolling 12 bulan)
- [ ] **Breakdown by tipe** (BPJS/Asuransi/Jamkesda)
- [ ] **Top 5 rejected reasons** — bar chart

### EK8.2 Aging Klaim

- [ ] **Aging buckets** 0-30/31-60/61-90/>90 hari per penjamin
- [ ] **Stuck claims report** — yang stuck di Pending Verifikasi >30 hari

### EK8.3 INA-CBG Margin Analysis

- [ ] **Margin per CBG group** — tampilkan over/under nominal + persen
- [ ] **Top 10 CBG most under** — kasus rugi terbesar (untuk evaluasi tarif RS)
- [ ] **Top 10 CBG most over** — kasus untung terbesar

### EK8.4 Coder Productivity

- [ ] **Klaim koded per coder × hari** — bar chart
- [ ] **Average days kunjungan-to-submit** per coder

### EK8.5 Export

- [ ] Excel + PDF print per report

**Acceptance EK8:** dashboard tampil data demo 30 hari, drill-down per penjamin/CBG/coder berfungsi.

---

## Phase EK9 — UX Polish & Cross-Modul

**Effort:** 1-2 hari

### EK9.1 Print Stylesheet

- [ ] `@media print` untuk ResumeMedis + BerkasKlaim + SuratPengantar + ReconciliationReport — pakai KOP RS

### EK9.2 Skeleton & Animasi

- [ ] `useSkeletonDelay(500)` semua route
- [ ] AnimatePresence fade swap antar tab/page
- [ ] Row stagger di tabel (clamp 0.3s)

### EK9.3 Density Toggle

- [ ] Density tokens `m-*` di Klaim Board + Reconciliation Detail

### EK9.4 Cross-Modul Integration

- [ ] **Billing Tab Klaim (BL2.4-lite)** wire ke `getClaimStatusForInvoice(invoiceId)` → tampil status + deep link "Buka di E-Klaim"
- [ ] **Master Penjamin** sub-tab "Lihat di E-Klaim" — cross-link ke Klaim Board difilter per penjamin
- [ ] **PasienPulang Tab RI/IGD** quick-action "Cek Klaim" — deep link ke Klaim Detail
- [ ] **PatientBanner cross-modul** quick-action "Lihat Klaim" jika ada `claimId`

### EK9.5 Update Workflow Docs

- [ ] **CLAUDE.md** — update Module Map row `ehis-eklaim` dari "Planned" → "✅" + ringkasan modul
- [ ] **TODO-EKLAIM.md progress tracker** update
- [ ] **TODO-BILLING.md BL2.4-lite** mark done
- [ ] **TECH_DEBT.md** — catat decision: source-of-truth ClaimRecord di-host di /ehis-eklaim, billing read-only cache

---

## 📊 Progress Tracker

| Phase                     | Tasks  | Done  | %      |
| ------------------------- | ------ | ----- | ------ |
| EK0 — Foundation          | 4      | 0     | 0%     |
| EK1 — Beranda             | 3      | 0     | 0%     |
| EK2 — Klaim Board         | 3      | 0     | 0%     |
| EK3 — Klaim Detail        | 7      | 0     | 0%     |
| EK4 — INA-CBG Calculator  | 2      | 0     | 0%     |
| EK5 — Berkas Generator    | 2      | 0     | 0%     |
| EK6 — Banding             | 3      | 0     | 0%     |
| EK7 — Reconciliation      | 4      | 0     | 0%     |
| EK8 — Dashboard Analytics | 5      | 0     | 0%     |
| EK9 — UX Polish + Cross   | 5      | 0     | 0%     |
| **Total**                 | **38** | **0** | **0%** |

**Effort total:** ~3-4 minggu frontend full · bisa dimulai paralel dengan EK0 selesai.

---

## 🏗 Key Architecture Decisions (final — jangan diubah tanpa diskusi)

1. **Modul mandiri** — sidebar nav sendiri, beranda sendiri. Bukan sub-section billing.
2. **Single source ClaimRecord di sini** — billing read-only cache via helper.
3. **BPJS + Asuransi + Jamkesda dalam 1 modul** — workflow inti sama, differensiasi via tab Berkas dynamic per-penjamin.
4. **Coder rekam medis ada di sini** — koding ICD pre-syarat klaim. Future split jadi `/ehis-rekam-medis` jika butuh full medical records management.
5. **Batch-first UX** — operasi default = batch. Single-item action available tapi bukan primary.
6. **Adapter pattern untuk integrasi** — `vClaimAdapter.ts`/`eKlaimKemenkesAdapter.ts` mock-first, swap saat backend ready.
7. **Audit trail granular** — setiap perubahan koding/berkas/submit tercatat dengan timestamp+actor.
8. **Accent module sky/teal** — bedakan dari billing amber. **No indigo/violet.**

---

## 🔗 Cross-Modul Dependencies

- **`/ehis-billing`** → read-only status chip + deep link (BL2.4-lite)
- **`/ehis-care/{ri,igd,rj}`** → auto-pull resume medis + tindakan untuk berkas
- **`/ehis-care/laboratorium`** → auto-pull hasil lab tervalidasi
- **`/ehis-care/radiologi`** → auto-pull hasil rad tervalidasi
- **`/ehis-master/penjamin`** → konfig BPJS/Asuransi (kelas dijamin, plafon)
- **`/ehis-master/tarif`** → tarif RS aktual untuk margin analysis
- **`/ehis-fhir`** (future) → SatuSehat sync resource (opsional)

---

## 🚦 Workflow Reminder

- **Saat menyelesaikan task**: (1) centang di file ini, (2) pindahkan deskripsi detail ke [.claude/DONE.md](.claude/DONE.md), (3) catat tech debt baru di [TECH_DEBT.md](TECH_DEBT.md).
- **Sebelum commit**: jalankan `npx tsc --noEmit` untuk verifikasi types clean.
- **File limit ≤800 lines** — split ke sub-components jika lebih besar.
- **Density tokens wajib** untuk Klaim Board + Reconciliation Detail.
- **No indigo/violet** — palette sky/teal/emerald sebagai accent, slate neutral.
