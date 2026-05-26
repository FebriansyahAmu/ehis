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
> **Last updated:** 2026-05-26 (revisi: pivot ke iDRG sebagai primary grouper)
> **Status:** 📋 Planning — modul baru hasil scope-split dari `/ehis-billing` (lihat [TODO-BILLING.md § Scope Split](TODO-BILLING.md)). Belum ada implementasi.
> **Target effort:** ~3.5-4.5 minggu (frontend full) · paralel dengan B0/B1.9 backend.
> **Standar grouper:** **iDRG (Indonesian Diagnosis Related Groups) — primary** sejak 1 Okt 2025 (Pedoman Pengodean iDRG 2025 Kemenkes + Perpres 59/2024). INA-CBG = legacy adapter Phase later untuk klaim transisi pre-Okt 2025.

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

## 🆕 Standar Grouping iDRG (Oktober 2025+)

**iDRG (Indonesian Diagnosis Related Groups)** resmi gantikan INA-CBG sejak **1 Oktober 2025** sebagai standar grouping klaim BPJS. 2026 = expansion phase, RS wajib bridging real-time ke INA-Grouper iDRG.

| Dimensi              | INA-CBG (legacy pre-Okt 2025)        | **iDRG (primary post-Okt 2025)**                       |
| -------------------- | ------------------------------------ | ------------------------------------------------------ |
| Kode                 | 4-digit alphanumeric (`I-1-01-I`)    | **7-digit numerik**                                    |
| Klasifikasi ICD      | ICD-10 WHO + ICD-9-CM                | **ICD-10-IM + ICD-9-CM-IM** (Indonesian Modification)  |
| Standar koding       | Kaidah umum WHO                      | **Indonesian Coding Standard (ICS v1)**                |
| Variabel tarif       | Tipe RS (A/B/C/D) × Kelas pasien     | **Tingkat kompetensi RS × KRIS × severity klinis**     |
| Kelas RS             | Tipe A/B/C/D                         | **Dasar / Menengah / Utama / Komprehensif** (dihapus tipe A/B/C/D — Perpres 59/2024) |
| Kelas rawat pasien   | VIP / K1 / K2 / K3 (3 tier tarif)    | **KRIS** (Kelas Rawat Inap Standar tunggal — Juli 2025) |
| Severity             | I/II/III dari CC/MCC                 | Granular: primer + komplikasi + komorbid + tingkat keparahan |
| Grouper              | E-Klaim Kemenkes desktop (file XML)  | **INA-Grouper iDRG** (bridging real-time REST)         |
| Status di EHIS       | Legacy adapter Phase later           | **Primary** sejak EK0                                  |

**Coexistence period:** Klaim layanan **pre-Okt 2025** = INA-CBG legacy mode, klaim **post-Okt 2025** = iDRG. EHIS default iDRG (greenfield 2026), legacy adapter di-plug saat dibutuhkan.

---

## 🏛 Compliance & Standar Wajib

| Regulasi                          | Topik                          | Dampak ke modul                                      |
| --------------------------------- | ------------------------------ | ---------------------------------------------------- |
| **Pedoman Pengodean iDRG 2025**   | Koding iDRG (Kemenkes, 14 Apr 2025) | Wajib referensi koding · ICD-10-IM/ICD-9-CM-IM       |
| **Perpres 59/2024**               | Penghapusan kelas BPJS + KRIS  | Kelas pasien default KRIS · tipe RS → kompetensi     |
| **Perpres 82/2018**               | Jaminan Kesehatan              | Eligibility cek SEP                                  |
| **Permenkes 3/2023**              | Standar Tarif Pelayanan JKN    | Tarif legacy (transisi) · referensi nominal awal     |
| **Permenkes 76/2016**             | INA-CBG (legacy)               | Grouper legacy untuk klaim pre-Okt 2025              |
| **Permenkes 26/2021**             | Pedoman Verifikasi BPJS        | Berkas wajib + checklist verifikator                 |
| **PMK 269/2008**                  | Rekam Medis                    | Resume medis sebagai berkas klaim                    |
| **UU PDP 27/2022**                | Data Pribadi                   | Audit trail akses berkas pasien                      |
| **AAJI Standar Klaim**            | Asuransi Swasta                | Format berkas standar industri asuransi              |

---

## 🔁 Workflow Klaim BPJS (per kasus)

```
[Pasien selesai dilayani / discharge]
              │
              ▼
[Resume Medis difinalisasi DPJP]  ←──── EHIS-Care (RI/IGD/RJ)
              │
              ▼ (24-48 jam)
[Coder RM → koding ICD-10-IM (Dx) + ICD-9-CM-IM (procedure) sesuai ICS v1]
              │
              ▼
[Grouper iDRG → resolve kode 7-digit + tarif by tingkat kompetensi RS]
   (Legacy: Grouper INA-CBG untuk klaim layanan pre-Okt 2025)
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
| **Grouper result iDRG (kode 7-digit)**             | INA-Grouper iDRG         | `/ehis-eklaim/klaim/[id]/grouper` |
| **Grouper result INA-CBG (legacy pre-Okt 2025)**   | E-Klaim Kemenkes (legacy)| `/ehis-eklaim/klaim/[id]/grouper` |
| **Berkas khusus** (laporan anestesi/kemo/dialisis) | OK + Day Care            | `/ehis-care/ri`                   |

**Asuransi Swasta:** Format per asuransi (Mandiri Inhealth, Allianz, AXA, Prudential, dst.) — kebanyakan turunan AAJI + tambahan custom. Cashless vs Reimbursement workflow berbeda.

---

## 🔌 Integrasi Aplikasi Pihak Ketiga (wajib)

| Aplikasi                  | Owner          | Fungsi                         | Status                                  |
| ------------------------- | -------------- | ------------------------------ | --------------------------------------- |
| **INA-Grouper iDRG**      | Kemenkes       | Grouper iDRG real-time         | **Primary** — adapter EK0.4             |
| **E-Klaim INA-CBG**       | Kemenkes       | Grouper legacy (XML file-based)| **Legacy** — adapter Phase later (klaim pre-Okt 2025) |
| **V-Claim**               | BPJS Kesehatan | Eligibility + SEP + submission | Mandatory — adapter EK0.4               |
| **VEDIKA**                | BPJS           | Verifikasi digital + tracking  | Mandatory — adapter EK0.4               |
| **Apol** (Apotek Online)  | BPJS           | Klaim obat kronis FKTL         | Optional — adapter EK7                  |
| **SATU SEHAT**            | Kemenkes       | Pertukaran data klinis         | Cross-ref ke `/ehis-fhir`               |

**Strategi mock-first:** adapter `lib/eklaim/vClaimAdapter.ts` dst. return Promise dengan mock delay 1500ms; backend swap saat ready tanpa refactor UI.

---

## 🏗 Architecture Decisions (jangan diubah tanpa diskusi)

1. **Modul mandiri** — `/ehis-eklaim` punya sidebar nav, beranda, dan workspace sendiri. Bukan sub-section billing.
2. **`ClaimRecord` single source di-host di sini** — billing membaca via cached read (`getClaimStatusForInvoice(invoiceId)`), tidak mutate.
3. **Cross-link via deep-link** — invoice → tab Klaim status → "Buka di E-Klaim" → `router.push("/ehis-eklaim/klaim/[claimId]")`.
4. **BPJS + Asuransi Swasta + Jamkesda dalam 1 modul** — workflow inti sama (berkas + submit + tracking + reconciliation). Differensiasi via tab "Berkas" yang dinamis per-penjamin (BPJS = SEP + iDRG; Asuransi = form penjamin + plafon cek).
5. **Coder rekam medis sebagai role di `/ehis-eklaim`** — koding ICD-10-IM/ICD-9-CM-IM adalah pre-syarat klaim. Future: bisa di-split jadi modul `/ehis-rekam-medis` terpisah jika butuh full medical records management (audit, retention, KIUP).
6. **Batch-first UX** — operasi default = batch (pilih multiple → submit). Single-item action available tapi bukan primary.
7. **Print-friendly** — semua report + berkas + reconciliation harus pakai print stylesheet + KOP RS.
8. **Density tokens `m-*`** wajib untuk Klaim Board (banyak baris) + Reconciliation Detail.
9. **Accent module amber → sky** — bedakan dari billing (amber). Sky/teal/emerald palette · slate neutral. **No indigo/violet.**
10. **Audit trail granular** — setiap perubahan status, upload berkas, edit koding, submit batch — tercatat dengan timestamp+actor+IP.
11. **iDRG = primary grouper, INA-CBG = active secondary (bukan dead legacy)** — riset 2026-05-26: industri SIMRS (Trustmedis, SIMRS Cendana, KhanzaHIS, Aplicare) **semua dual support** karena transisi iDRG masih phased (no national go-live final). Kemenkes pun masih update INA-CBG v5.9. Implikasi: `inaCbgLegacyAdapter` tetap di-build di EK0 (bukan parked), karena: (a) klaim pre-Okt 2025 yang belum settle, (b) Comparator pattern educational + analytics (AD-19), (c) safety net selama transisi 1-2 tahun ke depan. Field `eraGrouper: "iDRG" | "INA_CBG_Legacy"` di `ClaimRecord` untuk routing logic.
12. **KRIS sebagai kelas default** — `KelasRawat` enum baru: `"KRIS" | "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3" | "ICU" | "HCU" | "Isolasi"`. KRIS untuk klaim post-Okt 2025, VIP/K1/K2/K3 hanya legacy. ICU/HCU/Isolasi tetap (intensive care, beda dimensi).
13. **ICD-10-IM & ICD-9-CM-IM (Indonesian Modification)** — bukan ICD WHO versi standar. Sumber: Pedoman Pengodean iDRG 2025 Kemenkes. Tidak boleh copy-paste dari WHO ICD repository.
14. **Tarif iDRG berdasarkan tingkat kompetensi RS** — `"dasar" | "menengah" | "utama" | "komprehensif"` (Perpres 59/2024). Tipe RS A/B/C/D **dihapus**. Master Penjamin perlu field `tingkatKompetensiRS` per RS.
15. **Adapter pattern strict** — `iDRGGrouperAdapter` (primary REST bridging) + `vClaimAdapter` (BPJS submission) interface match spek BPJS/Kemenkes resmi. Mock return data shape sama dengan real response — zero refactor saat backend ready.
16. **Money handling pakai `Rupiah = bigint`** (simpan dalam sen/koin) — semua nominal klaim (`tarifRS`, `paidAmount`, `nominalTransfer`, dst). Hindari floating point drift untuk klaim ratusan juta.
17. **State machine eksplisit** — `ALLOWED_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]>` + `canTransition(from, to, role)` helper. Status `"Susulan Required"` + `"Sengketa"` ditambahkan ke 11 status awal.
18. **Concurrency control: OCC + soft-lock** — `optimisticLock: { version, updatedBy, updatedAt }` di ClaimRecord + helper `acquireSoftLock(claimId, userId, ttl=15min)` untuk multi-coder edit safety.
19. **Dual-Calculation Comparator Pattern (BUKAN converter)** — iDRG ↔ INA-CBG tidak pakai mapping table (lossy + no official authority). Instead, jalankan **dua adapter paralel** dari source data sama (ICD-10-IM/ICD-9-CM-IM coder) → display side-by-side untuk analytics + edukasi + margin comparison. Reuse `iDRGGrouperAdapter` + `inaCbgLegacyAdapter`. Caveat: hasil INA-CBG di mode ini **selalu di-label "Estimasi · Reference Only · Bukan untuk Submission"** untuk hindari mis-use. Tidak boleh digunakan untuk submission ke BPJS post-Okt 2025. Apply di: EK3.4 Tab Grouper (opt-in toggle), EK4 Calculator (mode "Compare Both"), EK8 Dashboard (margin trend lintas era).

---

## 📂 File Structure (rencana)

```
src/lib/eklaim/
├── eklaimShared.ts             # types ClaimRecord, BerkasKlaim, iDRGRecord, BandingRecord, KodeICD10IM/ICD9CMIM, Rupiah, ClaimTimelineEntry, ALLOWED_TRANSITIONS
├── groupingResolver.ts         # resolveGrouping(ctx) → routes ke iDRG (primary) atau INA-CBG legacy berdasarkan ctx.eraGrouper
├── iDRGLookupMock.ts           # IDRG_LOOKUP_MOCK (~30 kode 7-digit numerik · sumber Pedoman iDRG 2025)
├── inaCbgLegacyMock.ts         # INA_CBG_LEGACY_MOCK (~10 CBG paling umum untuk klaim transisi pre-Okt 2025 · parked)
├── icdIMMock.ts                # ICD10_IM_MOCK + ICD9_CM_IM_MOCK (lookup dropdown koding versi Indonesian Modification)
├── berkasChecker.ts            # cek kelengkapan berkas per (penjamin × tipePelayanan × kelas) → checklist + missing
├── eligibilityChecker.ts       # cek SEP (noKartu, tglSEP, jnsPelayanan) → kelas dijamin, plafon, sisa hari rawat
├── reconciliationMatcher.ts    # multi-criteria match (penjamin + periode + count + nominal range) → confidence score
├── stateMachine.ts             # ALLOWED_TRANSITIONS + canTransition(from, to, role) helper
├── softLock.ts                 # acquireSoftLock/releaseSoftLock multi-coder safety (TTL 15min)
├── iDRGGrouperAdapter.ts       # PRIMARY — bridging real-time REST ke INA-Grouper iDRG (mock pakai IDRG_LOOKUP_MOCK)
├── inaCbgLegacyAdapter.ts      # LEGACY — file-based XML import/export E-Klaim Kemenkes (parked, Phase later)
├── vClaimAdapter.ts            # mock V-Claim REST + cons-id + signature timestamp (return Promise<Result<T, ClaimError>>)
├── vedikaAdapter.ts            # mock verifikasi digital BPJS (status pull pattern)
├── apolAdapter.ts              # stub PHASE later (klaim obat kronis FKTL)
├── money.ts                    # Rupiah = bigint helper (formatRupiah, parseRupiah, addRupiah, etc.)
├── claimStore.ts               # client store draft klaim + transaksi sementara (useSyncExternalStore pattern)
└── claimsMock.ts               # CLAIM_BOARD_MOCK (~25 klaim lintas status/penjamin) + CLAIM_EDGE_CASES_MOCK (10 edge cases)

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
│   ├── IDRGCalculatorPage.tsx  # primary (toggle iDRG | INA-CBG Legacy)
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

**Effort:** 5-6 hari (revisi dari 3-4 hari karena pivot ke iDRG + ICS v1 lookup + state machine + Rupiah type + concurrency control)
**ROI:** semua fase berikut bisa paralel, schema stabil & sesuai standar Kemenkes 2025+

### EK0.1 Types di [src/lib/eklaim/eklaimShared.ts](src/lib/eklaim/eklaimShared.ts)

- [x] **`Rupiah = bigint`** type alias (bulat rupiah, tanpa sen — sesuai akuntansi RS Indonesia) — hindari floating point drift:
  ```ts
  type Rupiah = bigint;  // 1 IDR = 100 Rupiah units (sen)
  // helpers di money.ts: formatRupiah(rp) → "Rp 1.250.000" · parseRupiah("Rp 1.250.000") → bigint
  ```

- [x] **`ClaimRecord`** — entity utama (iDRG primary):
  ```ts
  {
    id, noKlaim, invoiceId, kunjunganId, pasienId,
    penjamin: {
      tipe: "bpjs" | "asuransi" | "jamkesda",
      nama,
      sep?: SEPRecord,             // BPJS SEP rich struct (lihat below)
      noRujukan?: string,          // wajib non-emergency BPJS
    },
    eraGrouper: "iDRG" | "INA_CBG_Legacy",     // routing logic (default iDRG post-Okt 2025)
    tipePelayanan: "RI" | "RJ" | "SameDay",    // affect grouper severity
    caraPulang: "Sembuh" | "PulangAPS" | "Rujuk" | "Meninggal",  // affect grouper
    diagnosaPrimer: KodeICD10IM, diagnosaSekunder: KodeICD10IM[],
    tindakanProsedur: KodeICD9CMIM[],
    kelas: KelasRawat,             // KRIS default · VIP/K1/K2/K3 legacy · ICU/HCU/Isolasi tetap
    isKRIS: boolean,               // true = KRIS, false = legacy class
    los: number, age: number, gender: "L" | "P",
    iDRG?: iDRGResult,                  // primary (post-Okt 2025)
    inaCbgLegacy?: InaCbgLegacyResult,  // legacy (parked, pre-Okt 2025 only)
    tingkatKompetensiRS: "dasar" | "menengah" | "utama" | "komprehensif",
    tarifRS: Rupiah,               // sum dari invoice items (sen)
    selisih?: Rupiah,              // computed: tarifGrouper - tarifRS (signed)
    statusPenjamin: ClaimStatus,
    submittedAt?, submittedBy?, batchId?,
    verifierBpjs?, verifierComment?,
    approvedAmount?: Rupiah, paidAmount?: Rupiah, paidAt?,
    rejectionReason?, bandingCount?,
    berkas: BerkasKlaim[],
    timeline: ClaimTimelineEntry[],
    optimisticLock: { version: number, updatedBy: string, updatedAt: string },  // OCC
    softLock?: { lockedBy: string, lockedAt: string, expiresAt: string },        // multi-coder safety
    createdBy, createdAt, updatedAt,
  }
  ```

- [x] **`SEPRecord`** — V-Claim SEP rich struct (bukan string flat):
  ```ts
  {
    noSEP: string,
    noKartu: string,                // 13-digit BPJS card number
    tglTerbit: string,              // ISO date
    masaBerlaku: { from: string, to: string },
    kontrolKe?: number,
    faskesRujukan?: string,
    jenisRawat: "RI" | "RJ",
  }
  ```

- [x] **`ClaimStatus`** — granular state (13 status, naik dari 11) + `CLAIM_STATUS_LABEL` map terpisah (status code stable, label mutable):
  ```ts
  "Draft Coding" |
    "Belum Submit" |
    "Submitted" |
    "Pending Verifikasi" |
    "Susulan Required" |          // BARU: BPJS minta berkas tambahan (distinct dari rejection)
    "Approved" |
    "Rejected" |
    "Banding Submitted" |
    "Banding Approved" |
    "Banding Rejected" |
    "Sengketa" |                  // BARU: Approved nominal beda dari expected
    "Paid" |
    "Write-off";
  ```

- [ ] **`ALLOWED_TRANSITIONS`** di [src/lib/eklaim/stateMachine.ts](src/lib/eklaim/stateMachine.ts):
  ```ts
  const ALLOWED_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
    "Draft Coding": ["Belum Submit"],
    "Belum Submit": ["Submitted", "Draft Coding"],
    "Submitted": ["Pending Verifikasi"],
    "Pending Verifikasi": ["Approved", "Rejected", "Susulan Required"],
    "Susulan Required": ["Submitted"],
    "Rejected": ["Banding Submitted", "Write-off"],
    // ... dst
  };
  function canTransition(from: ClaimStatus, to: ClaimStatus, role: UserRole): boolean
  ```

- [x] **`BerkasKlaim`** — checklist item per berkas (+ `BerkasVersion`, `BerkasFile`, `BerkasSumber` discriminated, `BerkasKategori`, `BerkasStatus`):
  ```ts
  {
    id,
    kategori: "SEP" | "ResumeMedis" | "Tindakan" | "Lab" | "Rad" | "Identitas"
            | "Rujukan" | "Billing" | "Grouper" | "Khusus",
    nama, wajib: boolean,
    status: "Belum" | "Siap" | "Tidak Berlaku" | "Reject Verifikator",  // tambah Reject Verifikator
    file?: {
      url: string,
      mimeType: string,
      sizeBytes: number,
      hash: string,                // SHA-256 audit integrity
      versions: BerkasVersion[],   // append-only history file replacement
    },
    sumber: "auto-pull" | "upload-manual",  // audit asal berkas
    sumberRef?: { type: "discharge" | "lab-order" | "rad-order" | "billing", id: string },
    uploadedBy?, uploadedAt?, catatan?,
    rejectReason?: string,         // jika status Reject Verifikator
  }
  ```

- [x] **`iDRGResult`** — PRIMARY grouper result (post-Okt 2025) + `iDRGSeverity`, `TarifPerTingkat`, `TopUpCmg`:
  ```ts
  {
    code: string,                  // 7-digit numerik (e.g. "1234567")
    mdc: string,                   // Major Diagnostic Category
    group: string,                 // group label
    severity: {
      level: 1 | 2 | 3,
      label: "Ringan" | "Sedang" | "Berat",
      ccList: string[],            // Complication conditions detected
      mccList: string[],           // Major CC detected
    },
    tarifAktual: Rupiah,           // tarif berdasarkan tingkat kompetensi RS pasien
    tarifPerTingkat: {
      dasar: Rupiah, menengah: Rupiah, utama: Rupiah, komprehensif: Rupiah,
    },
    topUpCmg?: { eligible: boolean, alasan: string, nominal: Rupiah }[],
    versiGrouper: string,          // e.g. "iDRG_v1.0_2025"
    timestampGroup: string,        // ISO timestamp grouper response
    sumberRegulasi: "Pedoman_iDRG_2025_Kemenkes",
  }
  ```

- [x] **`InaCbgLegacyResult`** (active secondary — industri SIMRS dual support):
  ```ts
  {
    code: string,                  // e.g. "I-1-01-I" (4-digit alphanumeric)
    group: string,
    severity: 1 | 2 | 3,
    tarif: { kelas3: Rupiah, kelas2: Rupiah, kelas1: Rupiah, vip: Rupiah },
    versiGrouper: string,          // e.g. "INA-CBG_v6.2"
  }
  ```

- [x] **`iDRGLookupEntry`** — lookup table entry (master IDRG_LOOKUP_MOCK):
  ```ts
  {
    code: string,                  // 7-digit numerik
    mdc: string,
    group: string,
    severityLevels: {
      1: { label: "Ringan", tarifPerTingkat: TarifPerTingkat },
      2: { label: "Sedang", tarifPerTingkat: TarifPerTingkat },
      3: { label: "Berat", tarifPerTingkat: TarifPerTingkat },
    },
    icd10IMList: string[],         // primary Dx mappings (ICD-10-IM)
    icd9CMIMList: string[],        // procedure mappings (ICD-9-CM-IM)
    versiGrouper: string,
  }
  type TarifPerTingkat = { dasar: Rupiah, menengah: Rupiah, utama: Rupiah, komprehensif: Rupiah };
  ```

- [x] **`KodeICD10IM` / `KodeICD9CMIM`** — picker entry (Indonesian Modification):
  ```ts
  {
    kode, deskripsi, kategori, hint?,
    versiIM: string,               // e.g. "ICD-10-IM_2025"
    deprecated?: boolean,          // flag retired code
    hospitalAcquired?: boolean,    // CC/MCC PPI mandatory (PMK 27/2017)
  }
  ```

- [x] **`KelasRawat`** — enum baru (KRIS default + legacy compat) + `TingkatKompetensiRS`, `TipePelayanan`, `CaraPulang`, `Gender`, `EraGrouper`, `TipePenjamin`:
  ```ts
  type KelasRawat =
    | "KRIS"                                         // default post-Okt 2025 (iDRG)
    | "VIP" | "Kelas_1" | "Kelas_2" | "Kelas_3"     // legacy INA-CBG
    | "ICU" | "HCU" | "Isolasi";                    // intensive care (tetap)
  ```

- [x] **`BandingRecord`** — pengajuan banding (2 tingkat per PMK 26/2021) + `BandingStatus`:
  ```ts
  {
    id, claimId, tingkat: 1 | 2,   // tingkat 1 = verifikator cabang, tingkat 2 = kantor pusat
    alasanRejectionAsli, alasanBanding,
    dokumenPendukung: BerkasKlaim[],   // pakai BerkasKlaim type konsisten, bukan string[]
    submittedAt, submittedBy,
    status: "Submitted" | "Review" | "Approved" | "Rejected",
    reviewerBpjs?, reviewedAt?, hasilBanding?,
  }
  ```

- [x] **`ReconciliationRecord`** — match transfer ke klaim (multi-criteria + confidence) + `ReconciliationMatch`, `SelisihStatus`:
  ```ts
  {
    id, noTransfer, tanggalTransfer, nominalTransfer: Rupiah, bank,
    penjaminId, periodeKlaim,
    matchedClaims: {
      claimId, amount: Rupiah, autoMatched: boolean,
      matchingConfidence: number,    // 0-1 (1 = exact, lower = fuzzy)
      matchingReason: string,        // "nominal exact" | "periode + count" | "manual"
      matchedBy?: string, matchedAt?: string,
    }[],
    selisih?: Rupiah, statusSelisih?: "Write-off" | "Refund" | "Pending",
    completedAt?, completedBy?,
  }
  ```

- [x] **`ClaimTimelineEntry`** — discriminated union 10 event type (type-safe audit, bukan generic string):
  ```ts
  type ClaimTimelineEntry =
    | { type: "claim-created", by: string, at: string }
    | { type: "coding-changed", before: { primer, sekunder, prosedur }, after: { primer, sekunder, prosedur }, by, at }
    | { type: "berkas-uploaded", berkasId, kategori, sumber, by, at }
    | { type: "berkas-rejected", berkasId, alasan, by, at }
    | { type: "grouper-resolved", eraGrouper, result: iDRGResult | InaCbgLegacyResult, by, at }
    | { type: "status-transition", from: ClaimStatus, to: ClaimStatus, alasan?, by, at }
    | { type: "submitted-batch", batchId, vClaimResponse, by, at }
    | { type: "verifikator-comment", komentar, by, at }
    | { type: "banding-submitted", bandingId, tingkat: 1 | 2, by, at }
    | { type: "payment-received", nominal: Rupiah, reconciliationId, by, at };
  ```

- [x] **`ClaimError`** discriminated union 7 error type (untuk `Result<T, ClaimError>` di adapter) + `Result<T,E>` + `Ok()`/`Err()` constructors:
  ```ts
  type ClaimError =
    | { type: "NetworkError", message, retryable: boolean }
    | { type: "AuthError", message }
    | { type: "ValidationError", field, message }
    | { type: "EligibilityError", reason: "SEP_EXPIRED" | "KELAS_NOT_COVERED" | "PLAFON_HABIS" | "NIK_NOT_FOUND" }
    | { type: "DuplicateClaimError", existingClaimId }
    | { type: "GrouperError", message, raw }
    | { type: "ConcurrencyError", currentVersion: number };
  ```

- [x] **`CoderShift`** — scaffold type only (implementasi di EK8.4).

### EK0.2 Mock seed

- [x] **`CLAIM_BOARD_MOCK`** — 25 klaim happy path lintas (+ `claimMockFactory.ts` extracted untuk file size limit):
  - 3 penjamin (BPJS 60%, Asuransi 30%, Jamkesda 10%)
  - 13 status (distribusi realistis: 25% Belum Submit, 20% Pending Verifikasi, 5% Susulan Required, 15% Approved, 10% Rejected, 5% Sengketa, 10% Paid, 10% mixed banding/write-off)
  - Kelas: 80% KRIS (post-Okt 2025), 20% legacy VIP/K1/K2/K3 (pre-Okt 2025) + sprinkle ICU/HCU
  - `eraGrouper`: 80% iDRG, 20% INA_CBG_Legacy
  - `tingkatKompetensiRS`: 40% utama, 30% menengah, 20% komprehensif, 10% dasar
  - Periode bulan terakhir (Apr-Mei 2026)
- [ ] **`CLAIM_EDGE_CASES_MOCK`** — 10 edge case khusus (BARU, untuk uji robust) — **DEFERRED** ke point-of-use (saat unit test helper EK0.3 atau adapter EK0.4 butuh):
  - Klaim severity 3 (Berat) untuk test top-up CMG
  - Klaim ICU >3 hari (eligible CMG)
  - Klaim partial paid (untuk test reconciliation selisih)
  - Klaim multi-banding cycle (banding tingkat 1 rejected → banding tingkat 2)
  - Klaim 1 pasien 2 episode (test no duplicate)
  - Klaim SEP expired (test EligibilityError)
  - Klaim NIK tidak match (test eligibility check fail)
  - Klaim transisi pre-Okt 2025 (INA_CBG_Legacy mode)
  - Klaim Sengketa (Approved nominal beda dari expected)
  - Klaim concurrency (2 coder edit bersamaan — test softLock)
- [x] **`IDRG_LOOKUP_MOCK`** — 30 kode iDRG 7-digit numerik (sumber: **Pedoman Pengodean iDRG 2025 Kemenkes**, annotate `sumberRegulasi`) + helpers `findIDRG()` & `findIDRGByICD10IM()`:
  - Kasus jantung (3 severity × 5 kode = 15)
  - Kasus DM/endokrin (3 severity × 3 kode = 9)
  - Kasus bedah obstetri/sesar (3 severity × 2 kode = 6)
  - Kasus persalinan normal (3 kode)
  - Setiap entry punya `tarifPerTingkat` lengkap (4 tingkat kompetensi RS) untuk severity 1/2/3
  - Versi grouper field: `"iDRG_v1.0_2025"`
- [x] **`INA_CBG_LEGACY_MOCK`** — 10 CBG paling umum untuk active secondary (klaim transisi pre-Okt 2025 + Comparator AD-19) + helper `findInaCbgLegacy()` · `versiGrouper: "INA-CBG_v5.9"`:
  - I-1-01-I s/d III · I-4-10-I s/d III · U-1-02-I s/d III · K-1-31-I s/d III · J-1-30
  - Tarif per kelas {kelas3, kelas2, kelas1, vip}
  - Versi grouper: `"INA-CBG_v6.2"` (Permenkes 3/2023)
- [x] **`ICD10_IM_MOCK`** — 30 kode **ICD-10 Indonesian Modification** (sumber: **Pedoman Pengodean iDRG 2025**, BUKAN WHO ICD-10) + helper `findICD10IM()`:
  - Annotate `versiIM: "ICD-10-IM_2025"`
  - Flag `hospitalAcquired` untuk CC/MCC PPI (PMK 27/2017)
- [x] **`ICD9_CM_IM_MOCK`** — 20 kode **ICD-9-CM Indonesian Modification** procedure (kardio/obstetri/pencernaan/ginjal/ICU/imaging) + helper `findICD9CMIM()`
- [x] **`BERKAS_TEMPLATE_BPJS_RI`** — checklist 11 berkas wajib BPJS Rawat Inap (SEP + Identitas + Rujukan + Resume Medis + Tindakan + Lab + Rad + Billing + iDRG Grouper + Berkas khusus anestesi/kemo/dialisis)
- [x] **`BERKAS_TEMPLATE_BPJS_RJ`** — checklist 8 berkas BPJS Rawat Jalan (lebih ringan, tanpa lembar operasi/anestesi)
- [x] **`BERKAS_TEMPLATE_BPJS_IGD`** — checklist 9 berkas BPJS IGD (rujukan optional untuk emergency P1/P2)
- [x] **`BERKAS_TEMPLATE_ASURANSI`** — checklist 8 berkas standar AAJI + helpers `getBerkasTemplate()` & `instansiBerkasFromTemplate()`
- [x] **`RECONCILIATION_MOCK`** — 5 transfer batch (BPJS multi-klaim exact · Mandiri Inhealth cashless · Prudential reimbursement · BPJS partial paid Write-off · BPJS unmatched Pending) + helpers `findReconciliation()` & `findReconciliationsByPenjamin()`
- [ ] **Test fixtures terpisah** di `src/lib/eklaim/__fixtures__/claimsTestFixtures.ts` — **DEFERRED** ke EK0.3 (build saat helper `resolveGrouping`/`matchTransfer`/`canTransition` ditulis + butuh deterministic test).

### EK0.3 Helpers shared di [src/lib/eklaim/](src/lib/eklaim/)

- [x] **`groupingResolver.ts`** — dual-engine routing (`resolveGrouping(ctx)` route ke iDRG default atau INA-CBG Legacy berdasarkan `eraGrouper`) + `resolveComparator(ctx)` resolve KEDUA engine untuk EK4 dual preview (AD-19) + helpers `countIDRGCandidates()` & `hasIDRGMapping()`. Severity scorer heuristik (sekunder count + LOS + caraPulang + age extreme). Latency simulasi 500-1500ms match real grouper.

- [x] **`berkasChecker.ts`** — `checkBerkas(claim) → { ready, missing, optional, progressPercent, items }` resolve template via `getBerkasTemplate(penjamin, tipePelayanan)`. Helpers `isBerkasReady()` (fast predicate) + `missingBerkasCategories()` (banner ringkas).

- [x] **`eligibilityChecker.ts`** — V-Claim API parity `checkEligibility({noKartu, tanggalSEP, jnsPelayanan})` return `Result<EligibilityCheckResult, ClaimError>`. Validation order: shape (13-digit) → SEP lookup → masaBerlaku → jnsPelayanan consistency. Options: `transientFailRate` + `forceResult` test override.

- [x] **`reconciliationMatcher.ts`** — `matchTransfer(transfer, pool)` multi-criteria 3-strategy (exact nominal 1.0 conf · periode+count ±2% 0.9 conf · fuzzy ±5% 0.7 conf). `matchBatch()` untuk N transfer dengan exclude-after-match. `toReconciliationRecord()` bridge ke storage layer.

- [x] **`stateMachine.ts`** — `ALLOWED_TRANSITIONS` 13-status map + `REQUIRED_ROLE` per target status. `canTransition(from, to, role)` predicate · `allowedNextStatuses()` dropdown helper · `isTerminal()` · `transitionClaim(claim, input)` return updated ClaimRecord dengan timeline append + OCC bump. `ClaimActorRole`: Coder/TimKlaim/VerifikatorBPJS/Kasir/system. Status wajib alasan: Rejected/Susulan/Write-off/Sengketa/Banding Rejected.

- [x] **`softLock.ts`** — In-memory `Map<claimId, SoftLock>` registry. `acquireSoftLock(claimId, userId, opts)` (re-acquire by same user OK + perpanjang TTL) · `releaseSoftLock()` (no-op kalau bukan owner, idempotent) · `isLockedByOther()` (UI banner predicate) · `getLockInfo()` (remaining menit) · `purgeExpiredLocks()` (maintenance). TTL default 15 menit. Test helper `_resetSoftLockRegistry()`. Production swap → Redis SETNX TTL zero refactor.

- [x] **`money.ts`** — `formatRupiah()` (id-ID titik separator) + `formatRupiahShort()` (rb/jt/M) + `parseRupiah()` (accept "Rp 1.250.000" / "1,250,000" / raw) + `addRupiah/subtractRupiah/multiplyRupiah/applyPercent` (banker's rounding) + boundary `rupiahFromNumber/rupiahToDisplayNumber` + `eqRupiah/maxRupiah/minRupiah`. Catatan: Rupiah bulat tanpa sen — spek awal `parseRupiah → sen` di-revise sesuai EK0.1 decision.

- [x] **`claimCalc.ts`** — Pure aggregates: `totalApproved/totalPaid/totalTarifRS` + `approvalRate` (exclude in-progress) + `avgDaysToPaid` + `agingBucket` 4-bucket + `bucketByAging` (chart) + `cbgMarginPercent` (renamed dari marginCbg) + `avgMarginPercent` + `countByStatus` + filter predicates `isBelumSubmit/isPendingBPJS/isButuhBanding`.

- [ ] **`zodSchemas.ts`** — runtime validation untuk adapter response. **DEFERRED ke EK0.4** (depends on zod install + adapter shape finalization saat adapter ditulis). Sementara: TypeScript compile-time types + manual shape check di adapter mock.

### EK0.4 Adapter stubs (mock backend)

Best practice: **interface match spek resmi** (BPJS/Kemenkes), mock return data shape sama → zero refactor saat backend ready.

- [x] **`iDRGGrouperAdapter.ts`** (PRIMARY) — `groupiDRG(ctx, config) → Promise<Result<iDRGGrouperRawResponse, ClaimError>>` (transport layer, return raw envelope shape mimicking spec) + `toIDRGResult(raw, tingkat) → iDRGResult` mapper (raw → domain). Raw response shape: `{ status, metadata: { grouperVersion, requestId, timestamp, elapsedMs }, result, error }`. Severity scorer + tarif as bigint string (JSON precision). Latency 500-1500ms. `iDRGGrouperConfig`: `failRate` (default 5%) + `fixedLatencyMs`.

- [x] **`inaCbgLegacyAdapter.ts`** (LEGACY — parked Phase later) — `exportToEklaimXml(claim) → string` (minimal XML serialize dengan escape `<&>"` manual no-lib) + `importGrouperResult(xml) → Result<InaCbgRawResult, ClaimError>` (regex-based parse minimal) + `groupInaCbg(ctx, config)` convenience in-memory mock + `toInaCbgLegacyResult(raw) → InaCbgLegacyResult`. Raw shape: `{ cbgCode, groupDescription, severityRoman, tarifKelas3/2/1/VIP as string, versiGrouper, generatedAt }`. Status PARKED — hanya untuk klaim transisi + EK4 Comparator (AD-19).

- [x] **`vClaimAdapter.ts`** — `checkSEP(noSEP, config)` + `getEligibility(noKartu, tanggalSEP, jnsPelayanan, config)` + `submitClaim(claim, batchId, config)` semua return `Promise<Result<VClaimEnvelope<T>, ClaimError>>`. Envelope shape match spek BPJS: `{ metaData: { code, message }, response? }`. Mappers: `toSEPRecord/toEligibilityDomain/toClaimStatus`. Header pattern annotated di JSDoc (`X-cons-id` · `X-timestamp` · `X-signature` HMAC-SHA256 · `user_key`). LZ-String compression absent di mock — tambah saat backend ready, caller tidak berubah. Submit distribusi: 60% Pending · 25% Approved · 5% Rejected. `VClaimConfig`: `consId/userKey/failRate/fixedLatencyMs/forceResult`.

- [x] **`vedikaAdapter.ts`** — `pullVerifikatorStatus(batchId, config) → Promise<Result<VedikaBatchResponse, ClaimError>>`. Raw shape per klaim: `{ noKlaim, klaimId, statusVerifikator: "BELUM_DIPROSES"/"DALAM_PROSES"/"DISETUJUI"/"DITOLAK"/"PENDING_BERKAS", tarifDisetujui, alasanReject, daftarBerkasSusulan, verifierNama, verifiedAt }`. Distribusi default: 60% Approved · 25% Pending · 10% Susulan · 5% Rejected (overridable via `VedikaConfig.distribution` untuk deterministic test). `statusBatch` derived: QUEUED/PROCESSING/COMPLETED. Mapper `toClaimStatusFromVedika()`.

- [x] **`apolAdapter.ts`** — STUB (PHASE LATER). Interface `APOLResepRecord`, `APOLBatchSubmitInput`. Methods `submitAPOLBatch/pullAPOLStatus` return `Err({ type: "ValidationError", field: "apol", message: "PHASE_LATER" })` — eksplisit reject (no silent no-op). Diimplementasi saat EK7 reconciliation obat kronis FKTL aktif.

**Refactor wiring:**
- `groupingResolver.ts` — sekarang delegate ke `iDRGGrouperAdapter.groupiDRG()` + `inaCbgLegacyAdapter.groupInaCbg()`, lalu pakai mapper `toIDRGResult()`/`toInaCbgLegacyResult()`. Lookup logic move ke adapter; resolver tinggal orchestrate + map status ERROR envelope ke `ClaimError`. `resolveComparator()` paralel kedua engine + secondary failure attach (tidak block).
- `eligibilityChecker.ts` — sekarang delegate ke `vClaimAdapter.getEligibility()`, lalu pakai mapper `toEligibilityDomain()` + business rules tambahan (`mapMetaDataToEligibilityError`: pattern match message → typed reason · `resolveFallbackContext`: tingkatKompetensiRS dari klaim mock karena V-Claim tidak return field ini).

**Acceptance EK0:**
- ✅ Semua types compile clean (`npx tsc --noEmit`).
- ✅ Mock siap 25+ klaim happy path + 10 edge cases.
- ✅ Helpers `resolveGrouping`/`checkBerkas`/`checkEligibility`/`matchTransfer`/`canTransition` return value benar untuk berbagai kombinasi (test fixtures separate).
- ✅ Adapter return `Promise<Result<T, ClaimError>>` dengan shape match spek BPJS/Kemenkes resmi.
- ✅ `iDRGGrouperAdapter` resolve 10 sample iDRG case dengan severity scoring konsisten.
- ✅ `softLock` test concurrency: 2 user race acquire same claim, satu menang dengan TTL 15min.
- ✅ Zod schemas validate adapter response, throw structured `ValidationError` saat shape mismatch.

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

### EK3.3 Tab Coding (ICD-10-IM + ICD-9-CM-IM)

- [ ] **Diagnosa Primer** picker — searchable autocomplete dari `ICD10_IM_MOCK` (kode + deskripsi + kategori + versi IM). **Bukan WHO ICD-10**, harus Indonesian Modification.
- [ ] **Diagnosa Sekunder** multi-picker — boleh 0-10 diagnosa, dengan flag `hospitalAcquired` untuk CC/MCC PPI.
- [ ] **Tindakan/Prosedur** multi-picker — searchable autocomplete dari `ICD9_CM_IM_MOCK`.
- [ ] **Auto-suggest** dari kunjungan — kalau `DiagnosaTab` kunjungan sudah ada `kodeIcd10IM`, auto-fill diagnosa primer.
- [ ] **Validasi** — diagnosa primer wajib · sistem koding **sesuai ICS v1 (Indonesian Coding Standard)** — bukan free-form severity client-side; severity dihitung oleh grouper di EK3.4.
- [ ] **Tombol Re-Group iDRG** — trigger `iDRGGrouperAdapter.groupiDRG(ctx)` ulang setelah edit koding. Untuk legacy mode (klaim pre-Okt 2025): tombol berbeda "Re-Group INA-CBG (Legacy)".
- [ ] **Coder signature** — checkbox "Saya kode ini benar sesuai Pedoman iDRG 2025" + nama coder + timestamp (audit trail).
- [ ] **Soft-lock banner** — jika klaim sedang di-edit coder lain, tampil banner "Sedang di-edit oleh [nama] sejak [waktu] — tunggu atau ambil alih (force unlock)".

### EK3.4 Tab Grouper (iDRG Result · Legacy INA-CBG conditional)

**Mode display by `claim.eraGrouper`:**

#### Mode A: iDRG Result (primary, klaim post-Okt 2025)
- [ ] **iDRG Result Card** prominent:
  - **Kode 7-digit numerik** besar mono (e.g. "1234567")
  - MDC (Major Diagnostic Category) label
  - Group name
  - Severity badge (1-Ringan / 2-Sedang / 3-Berat) dengan list CC/MCC detected
  - **Tarif per tingkat kompetensi RS** (table 4 baris: dasar/menengah/utama/komprehensif)
  - **Tarif aktual** highlight emerald — berdasarkan tingkat kompetensi RS pasien dirawat
  - Versi grouper chip (e.g. "iDRG_v1.0_2025")
- [ ] **Breakdown card** — tarif RS vs tarif iDRG:
  - Subtotal items per kategori (Akomodasi/Tindakan/Lab/Rad/Obat/Jasa Dokter) dalam `Rupiah`
  - Compare vs tarif iDRG aktual
  - Selisih nominal + chart bar (emerald jika RS untung, rose jika RS rugi)
  - Highlight margin% — best practice display: "Margin iDRG: +12.5% (untung Rp 1.250.000)"
- [ ] **Top-Up CMG indicator** — `iDRGResult.topUpCmg[]`:
  - List eligible top-up (ICU >3 hari, obat mahal, prosthesis, dll)
  - Per item: alasan + nominal tambahan
  - Sum total top-up + highlight
- [ ] **Tombol Re-Group iDRG** — sama dengan Coding tab.

#### Mode B: Legacy INA-CBG Result (klaim pre-Okt 2025 — conditional render)
- [ ] **Banner kuning** "Mode Legacy INA-CBG — Klaim layanan sebelum 1 Oktober 2025" di atas card.
- [ ] **INA-CBG Result Card** — sama pattern lama tapi label "Legacy":
  - Kode 4-digit alphanumeric (e.g. "I-1-01-I")
  - Severity I/II/III
  - Tarif per kelas {VIP, Kelas_1, Kelas_2, Kelas_3}
- [ ] **Tombol Re-Group INA-CBG (Legacy)** — call `inaCbgLegacyAdapter`.

#### Mode C: Dual Comparator (opt-in toggle, AD-19)
- [ ] **Toggle "Show INA-CBG Comparison"** — default OFF (avoid clutter). Saat ON:
  - Trigger `inaCbgLegacyAdapter.groupCbg(ctx)` paralel dari source data koding yang sama (ICD-10-IM/ICD-9-CM-IM coder)
  - Tampil side-by-side card: **iDRG (PRIMARY · SUBMIT)** vs **INA-CBG (ESTIMASI · REFERENCE ONLY · BUKAN UNTUK SUBMISSION)**
- [ ] **Side-by-side card layout:**
  - Left: iDRG Result (kode 7-digit · tarif aktual · severity) — accent sky
  - Right: INA-CBG Estimasi (kode 4-digit · tarif per kelas asumsi · severity I/II/III) — accent slate muted dengan watermark "ESTIMASI"
  - Banner caveat di atas: "⚠️ INA-CBG hanya estimasi untuk perbandingan margin / edukasi coder. Tidak punya legal standing. iDRG yang akan di-submit ke BPJS."
- [ ] **Delta indicator** — chip emerald/rose: "iDRG +18% dari INA-CBG" atau "iDRG -7% dari INA-CBG" untuk konteks margin
- [ ] **Use case label** — radio pilih konteks tampilan:
  - "Margin Comparison" (highlight delta nominal)
  - "Educational Reference" (highlight code equivalence)
  - "Audit/Historical" (highlight versi grouper)
- [ ] **Tidak ada tombol "Submit INA-CBG"** — UI lock pure read-only untuk Mode C ini.

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

## Phase EK4 — iDRG Calculator Standalone (Legacy INA-CBG optional)

**Route:** `/ehis-eklaim/calculator` · **Effort:** 2 hari
**Pattern reference:** Standalone form page
**Catatan:** EK4 bisa di-demote ke Sprint 2 (low blocker) — fokus MVP di EK0-EK3 dulu.

### EK4.1 Form Input

- [ ] **Mode toggle** — 3 mode (radio):
  - **"iDRG"** (default post-Okt 2025) — hitung pakai iDRGGrouperAdapter
  - **"INA-CBG Legacy"** (pre-Okt 2025) — hitung pakai inaCbgLegacyAdapter
  - **"Compare Both"** (AD-19 Comparator) — jalankan dua adapter paralel, tampil side-by-side untuk margin comparison + edukasi
- [ ] **Form 2-col** (mode iDRG):
  - Left: Diagnosa Primer + Sekunder (multi-picker dari `ICD10_IM_MOCK`) + Tindakan/Prosedur (multi-picker dari `ICD9_CM_IM_MOCK`)
  - Right:
    - **Tingkat Kompetensi RS** (radio: dasar/menengah/utama/komprehensif) — bukan kelas RS A/B/C/D
    - Kelas pasien (KRIS default · disabled kalau mode iDRG)
    - Tipe pelayanan (RI/RJ/SameDay)
    - LOS (number) · Age · Sex
    - Cara pulang (Sembuh/PulangAPS/Rujuk/Meninggal)
- [ ] **Form 2-col** (mode legacy INA-CBG):
  - Sama dengan iDRG tapi: Kelas pasien aktif (VIP/K1/K2/K3) · tidak ada tingkat kompetensi RS
- [ ] **Tombol Hitung iDRG** primary sky (atau "Hitung INA-CBG" mode legacy).

### EK4.2 Result Card

- [ ] **iDRG Result** — kode 7-digit numerik + MDC + group + severity + tarif per tingkat kompetensi RS + breakdown grouper rationale (CC/MCC detected list).
- [ ] **Legacy INA-CBG Result** (mode legacy) — kode 4-digit alphanumeric + severity I/II/III + tarif per kelas pasien.
- [ ] **Compare Both Result** (mode comparator, AD-19) — side-by-side card:
  - Left: iDRG Result accent sky
  - Right: INA-CBG Estimasi accent slate muted watermark "ESTIMASI · REFERENCE ONLY"
  - Banner caveat: "iDRG yang akan di-submit ke BPJS. INA-CBG hanya estimasi untuk perbandingan."
  - Delta chip: "iDRG +X% dari INA-CBG"
- [ ] **Compare vs Actual Cost** — input nominal tarif RS manual (Rupiah) → tampil selisih chart + margin%.
- [ ] **Save as Draft Klaim** — tombol simpan hasil sebagai draft (link ke `/ehis-eklaim/klaim/new` dengan eraGrouper sesuai mode). **Disabled di mode "Compare Both"** (mode itu untuk analisis, bukan create klaim).
- [ ] **Print Result** — print stylesheet untuk dokumentasi.

**Acceptance EK4:** kalkulator standalone berfungsi untuk 10 kasus sample iDRG + 5 kasus legacy INA-CBG + 5 kasus mode Compare Both (hasil side-by-side match dengan kedua adapter independent).

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

### EK8.6 iDRG vs INA-CBG Margin Comparator (AD-19)

**Use case:** evaluasi dampak migrasi iDRG vs INA-CBG terhadap margin RS · tariff negotiation argumentation · trend lintas era pre/post Okt 2025.

- [ ] **Cumulative margin chart** — line chart 12 bulan rolling, 2 line series:
  - **iDRG actual** (untuk klaim post-Okt 2025 = pakai `claim.iDRG.tarifAktual`)
  - **INA-CBG estimasi** (untuk klaim post-Okt 2025 = call `inaCbgLegacyAdapter` paralel sebagai estimasi)
  - Klaim pre-Okt 2025 inverse (INA-CBG actual + iDRG estimasi sebagai forward-looking)
- [ ] **Delta nominal** per bulan + cumulative total ("Kalau pakai INA-CBG, RS akan kehilangan/dapat Rp X selama 12 bulan")
- [ ] **Per-MDC breakdown** — table top 10 MDC dengan delta margin terbesar (positif = iDRG lebih untung, negatif = INA-CBG lebih untung)
- [ ] **Per-penjamin filter** — chart per BPJS/Asuransi/Jamkesda
- [ ] **Banner caveat** wajib: "⚠️ Nilai INA-CBG di chart ini adalah estimasi non-official untuk perbandingan analitik. Bukan untuk negosiasi formal dengan BPJS."
- [ ] **Export PDF** dengan watermark "INTERNAL USE — REFERENCE ONLY"

**Acceptance EK8:** dashboard tampil data demo 30 hari, drill-down per penjamin/iDRG-MDC/coder berfungsi, Comparator chart EK8.6 menunjukkan delta nominal iDRG vs estimasi INA-CBG dengan caveat banner jelas.

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

| Phase                       | Tasks  | Done  | %      | Estimasi effort |
| --------------------------- | ------ | ----- | ------ | --------------- |
| EK0 — Foundation (iDRG)     | 4      | 4     | 100%   | 5-6 hari (EK0.1 ✅ types · EK0.2 ✅ mocks · EK0.3 ✅ helpers · EK0.4 ✅ adapters) |
| EK1 — Beranda               | 3      | 0     | 0%     | 2 hari          |
| EK2 — Klaim Board           | 3      | 0     | 0%     | 3-4 hari        |
| EK3 — Klaim Detail          | 7      | 0     | 0%     | 5-6 hari        |
| EK4 — iDRG Calculator       | 2      | 0     | 0%     | 2 hari          |
| EK5 — Berkas Generator      | 2      | 0     | 0%     | 2-3 hari        |
| EK6 — Banding               | 3      | 0     | 0%     | 2 hari          |
| EK7 — Reconciliation        | 4      | 0     | 0%     | 3 hari          |
| EK8 — Dashboard Analytics   | 6      | 0     | 0%     | 3-4 hari (+EK8.6 Comparator) |
| EK9 — UX Polish + Cross     | 5      | 0     | 0%     | 1-2 hari        |
| **Total**                   | **39** | **4** | **10%** | **~3.5-4.5 minggu** |

**Effort total:** ~3.5-4.5 minggu frontend full (revisi dari 3-4 minggu karena pivot ke iDRG + dual-era support + state machine + Rupiah type).
**Critical path MVP:** EK0 + EK2 + EK3 (3 tab inti: Berkas + Coding + Submission) = ~10-12 hari. Sisanya by business priority.
**INA-CBG Legacy adapter:** Parked sebagai Phase later — di-pickup saat ada kebutuhan klaim transisi pre-Okt 2025 muncul nyata.

---

## 🏗 Key Architecture Decisions (final — jangan diubah tanpa diskusi)

1. **Modul mandiri** — sidebar nav sendiri, beranda sendiri. Bukan sub-section billing.
2. **Single source ClaimRecord di sini** — billing read-only cache via helper.
3. **BPJS + Asuransi + Jamkesda dalam 1 modul** — workflow inti sama, differensiasi via tab Berkas dynamic per-penjamin.
4. **Coder rekam medis ada di sini** — koding ICD-10-IM/ICD-9-CM-IM pre-syarat klaim. Future split jadi `/ehis-rekam-medis` jika butuh full medical records management.
5. **Batch-first UX** — operasi default = batch. Single-item action available tapi bukan primary.
6. **Adapter pattern untuk integrasi** — interface match spek BPJS/Kemenkes resmi, mock-first, swap saat backend ready.
7. **Audit trail granular** — setiap perubahan koding/berkas/submit tercatat (ClaimTimelineEntry discriminated union).
8. **Accent module sky/teal** — bedakan dari billing amber. **No indigo/violet.**
9. **iDRG = primary, INA-CBG = active secondary** — `eraGrouper` field routing. INA-CBG bukan dead legacy — industri SIMRS (Trustmedis, Cendana, KhanzaHIS) dual support karena transisi iDRG masih phased.
10. **KRIS default · tingkat kompetensi RS · ICD-IM** — sesuai Perpres 59/2024 + Pedoman Pengodean iDRG 2025 Kemenkes.
11. **Rupiah = bigint (sen)** — hindari floating point drift untuk klaim ratusan juta.
12. **State machine + soft-lock** — ALLOWED_TRANSITIONS + OCC version + concurrency safety multi-coder.
13. **Dual-Calculation Comparator (BUKAN converter)** — iDRG ↔ INA-CBG tampil side-by-side dari source data sama, bukan mapping table lossy. Reuse 2 adapter, label "Estimasi · Reference Only · Bukan untuk Submission". Apply: EK3.4 Mode C · EK4 Compare Both · EK8.6 Margin Comparator.

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
- **Standar koding**: ICD-10-IM + ICD-9-CM-IM sesuai Pedoman Pengodean iDRG 2025 Kemenkes (bukan WHO ICD).
- **Rupiah handling**: pakai `Rupiah = bigint` (sen), helper di `money.ts`. Jangan pakai `number` untuk nominal.
- **State transition**: wajib via `canTransition()` helper, bukan langsung mutate `claim.statusPenjamin`.
