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
<<<<<<< HEAD
> **Last updated:** 2026-05-28 (EK7.3 SelisihWriteOffModal done — 2-step spring modal: Step 1 breakdown Review (3 summary cards Nominal/Dicocokkan/Selisih + direction hint underpaid/overpaid + per-klaim breakdown table Tarif Diajukan vs Disetujui) · Step 2 penanganan (3 option cards Write-off/Refund/Pending + animated hint on select + alasan min 20 char + approver input + validation summary + loading 800ms) · "Tangani Selisih" CTA amber di CompletedView MatchingPanel · state + handler di ReconciliationPage (statusSelisih + completedBy update) · TSC clean)
> **Status:** 🚧 In progress — EK0 Foundation ✅ · EK1 Beranda ✅ · EK2 Klaim Board ✅ · **EK3 Klaim Detail ✅ 100%** · **EK4 iDRG Calculator ✅ 100%** · **EK5 Berkas Generator ✅ 100%** · **EK6 Banding ✅ 100%** · **EK7 Reconciliation 🚧 EK7.1+EK7.2+EK7.3 ✅** · Next: EK7.4 Reconciliation Report
=======
> **Last updated:** 2026-05-28 (EK6.3 Banding Detail done — BandingDetailPage 2-panel + BandingDetailHeader + BandingDetailLeft (klaim context + rejection) + BandingDetailRight (alasan banding + dokumen + timeline + mock review) + BandingTimeline 3-stage vertical + BandingTable Detail→Link + route `/banding/[id]` · TSC clean)
> **Status:** 🚧 In progress — EK0 Foundation ✅ · EK1 Beranda ✅ · EK2 Klaim Board ✅ · **EK3 Klaim Detail ✅ 100%** · **EK4 iDRG Calculator ✅ 100%** · **EK5 Berkas Generator ✅ 100%** · **EK6 Banding ✅ 100% (EK6.1+EK6.2+EK6.3)** · Next: EK7 Reconciliation
>>>>>>> ee675f27a763c040d0a386ae755641f29f1833fb
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

- [x] **Hero header** teal-accent (icon `ShieldCheck` + eyebrow "EHIS E-Klaim · Beranda" + h1 "Pusat Klaim BPJS & Asuransi" + description + timestamp pill). Pivot accent dari sky → teal supaya distinct dari `/ehis-registration` (sky).
- [x] **KPI Strip** 5 hero card animated dengan tone palette per posisi:
  - **Klaim Hari Ini** (teal · count + tarif RS)
  - **Pending Verifikasi** (amber · count + nominal BPJS)
  - **Belum Submit** (rose · count + countdown hari ke deadline tgl 10 next month + meter sisa periode)
  - **Approval Rate** (emerald · % + nominal bulan ini + meter %)
  - **Total Pembayaran** (sky · nominal transfer + count trf bulan ini)
- [x] **Quick-Nav Grid** 4-card (2x2 lg layout): Klaim Board (aktif) · iDRG Calculator (disabled) · Banding (disabled · badge rejection count) · Reconciliation (disabled · badge trf count). Card disabled tampil opacity-70 + lock icon (tidak Link).

### EK1.2 Sidebar Panel kanan

- [x] **Butuh Banding** — list 5 klaim Rejected/Banding Rejected (sort hari menumpuk desc). Per row: pasienId + noKlaim + penjamin badge + hari + selisihMinus (estimasi rugi). Footer link ke `/ehis-eklaim/banding` (Soon badge).
- [x] **Akan Expired Submit** — list 5 klaim Belum Submit sort hari kunjungan desc. Per row: pasienId + noKlaim + penjamin + hari lalu (badge rose ≥20h) + sisa hari ke deadline + tarif. Urgency bar (% dari 30-hari window). Footer link ke `/ehis-eklaim/klaim?status=belum-submit`.
- [x] **Recent Submission** — list 8 submission terbaru sort agoSec asc. Per row: kind badge (Submitted/Approved/Paid/Rejected) + penjamin badge + pasienId + noKlaim + nominal (approvedAmount kalau ada) + agoSec compact. Footer link ke Klaim Board.

### EK1.3 Components — Redesign V2 (single-viewport interactive)

User feedback V1 ("layout tidak optimal · tidak interaktif · scroll panjang"): redesigned ke single-viewport layout dengan tabbed sidebar + interactive pipeline funnel + sparkline hero card.

- `BerandaEklaimPage.tsx` (144 ln) — Page shell baru 4-section: HeroBar slim · HeroSummaryCard · PipelinePanel · MainGrid (QuickNav + ActivityTabPanel). Target ~640px total height fit dalam 720p tanpa scroll.
- **`HeroSummaryCard.tsx` NEW** (290 ln) — Composite featured card 2-col: LEFT (col-7) featured stat besar + SVG sparkline 14-hari animated + trend chip (↑/↓ % vs periode lalu) + Period segmented control 3-opsi dengan `motion.layoutId` smooth indicator + CTA "Buka Klaim Board". RIGHT (col-5) 4 mini KPI tile compact 2x2 (Klaim Hari Ini · Pending Verif · Belum Submit · Approval Rate). Subtle radial accent + gradient bg.
- **`PipelinePanel.tsx` NEW** (143 ln) — Horizontal funnel 5-stage (Draft → Belum Submit → Pending → Approved → Paid) dengan count + nominal + bar fill proportional ke max count. Setiap stage clickable → deep-link `/ehis-eklaim/klaim?status=<key>`. Hover: translate-y + shadow boost + chevron animation. Empty stage tampil opacity-70.
- **`ActivityTabPanel.tsx` NEW** (239 ln) — Tabbed sidebar replacing 3 stacked panels (eliminates vertical scroll). 3 tab: Banding (rose) · Expired (amber) · Recent (teal) dengan count badge per tab. Active indicator via `motion.layoutId`. Content transition `AnimatePresence` slide-fade 0.18s. Footer link adaptif per tab. Single scrollable area di tab content (flex-1 min-h-0 overflow-y-auto).
- `QuickNavGridEklaim.tsx` REWRITE (137 ln) — Compact 4-col grid (sm:2 / lg:4) tanpa section header — header sudah di-handle level page. Per card: icon rotate+scale on hover, count badge, 1-line desc, bottom border animation. Lebih dense + interactive vs versi 1.
- `ButuhBandingPanel.tsx` REWRITE (86 ln) · `AkanExpiredPanel.tsx` REWRITE (107 ln) · `RecentSubmissionPanel.tsx` REWRITE (101 ln) — Strip outer card + header + footer (now handled by `ActivityTabPanel`). Return flat list saja. Empty state inline tetap.
- `berandaEklaimShared.ts` EXTEND (636 ln) — Tambah: `PipelineStage` type + `getPipelineStages()` 5-stage builder · `SparklineDatum` + `getSparkline14d()` last-14-day grouped + `buildSparklinePath()` SVG path constructor · `Period` type + `PERIOD_OPTIONS` + `calcTrend(period)` window comparator + `periodRanges()` helper · `MiniKpi` type + `getMiniKpis()` 4-tile builder.
- **DELETED:** `KPIStripEklaim.tsx` — superseded by HeroSummaryCard's mini KPIs 2x2 grid.

**Design innovations (frontend-design skill applied):**
- **Anti-scroll**: 3 panel stacked → 1 tabbed panel (single content area scroll dalam panel)
- **Interactivity**: Period segmented control · clickable pipeline stages · tab transitions · hover micro-animations (icon rotate, card translate, bar grow, chevron slide)
- **Modern data-viz**: SVG sparkline dengan path animation + gradient fill + peak marker · trend chip ↑/↓
- **Elegant typography**: Featured stat 3-4xl black tracking-tight tabular-nums · supporting text 10-11px slate-500 (no bright colors) · uppercase eyebrow text-teal-600 tracking-widest
- **Visual hierarchy**: Big featured stat → 4 supporting mini KPIs → pipeline funnel → quick nav + activity (clear F-pattern scan)
- **Subtle surfaces**: Gradient `from-white via-white to-teal-50/30` di hero card · radial blur accent · ring-1 borders konsisten

**Acceptance EK1 V2:** ✅ TSC clean · single-viewport layout (~640px target fit 720p) · 3 framer micro-interaction (period segmented · tab indicator · sparkline path-draw) · clickable pipeline stages → deep-link · file size 86-290 ln semua <800 limit · 9 file total ~1883 ln.

---

## Phase EK2 — Klaim Board (Worklist Cross-Invoice)

**Route:** `/ehis-eklaim/klaim` · **Effort:** 3-4 hari
**Pattern reference:** Tagihan Board (BL1) + Farmasi Board

### EK2.1 Layout & Filter

- [x] **Header strip** 4 KPI dinamis (compute against active sidebar filters · `computeKPIs`):
  - Klaim Hari Ini (teal · count + Tarif RS + trend Δ vs kemarin)
  - Pending Verifikasi (sky · count + nominal menunggu + susulan flag)
  - Rejected Bulan Ini (rose · count + selisih nominal hilang)
  - Approval Rate (emerald · % decisive + breakdown Approved/Paid + target chip)
- [x] **Filter Panel kiri 300px sticky** — `KlaimFilterPanel.tsx` (434 ln):
  - Pencarian (noKlaim / noRM / SEP / nama penjamin · debounce live)
  - Periode kunjungan (5 preset: Hari Ini / 7h / 30h / Bulan Ini / Kustom · default 30 hari)
  - Penjamin tipe (Semua / BPJS / Asuransi / Jamkesda · dropdown styled)
  - Penjamin nama spesifik (dropdown native max-w 260px · derived dari `CLAIM_BOARD_MOCK` per tipe · auto-reset saat tipe berubah)
  - Era grouper (segmented · Semua / iDRG / INA-CBG Legacy — bonus selaras AD-11)
  - Kelas (8 chip · KRIS + VIP + K1/K2/K3 + ICU/HCU/Isolasi · 8 vs 7 di spec karena KRIS dipisah eksplisit)
  - Status (13 chip multi-select sesuai 13 status enum · tone per status `STATUS_CFG`)
  - Unit pelayanan (RI / RJ / SameDay multi-select · catatan: ClaimRecord punya `tipePelayanan` bukan `unit` IGD/RJ/RI — IGD diserap ke `SameDay` saat ER P3 non-rawat-inap)
  - Hidden scrollbar di internal body supaya estetika tidak ada bar
  - Footer reset · ActiveBadge count terpadu
- [x] **Quick Tabs** 5 pre-filter dengan count dinamis after-filter aware (`computeQuickTabCounts`):
  - Semua (slate) · Belum Submit (amber) · Pending Verifikasi (sky) · Perlu Banding (rose) · Dibayar (emerald)
  - `motion.layoutId="klaim-quick-tab-underline"` spring indicator
- [x] **Density toggle** Compact/Comfortable/Cozy (radiogroup · ikon AlignJustify/Rows3/Rows2 · active state teal).
- [x] **`KlaimHero.tsx`** slim teal-accent header (76px desktop) — eyebrow + h1 + timestamp pill + CTA `Buat Klaim`.
- [x] **`KlaimResultsPlaceholder.tsx`** preview ringan (6 row max) sebelum EK2.2 — banner amber "preview EK2.2 segera" + row hover teal + footer summary count/Tarif RS/Selisih.
- [x] **Skeleton 500ms** via `useSkeletonDelay` + fade-in motion 0.2s · semua kartu KPI stagger-up 0.05s/idx.

### EK2.2 Tabel Worklist

- [x] **Sticky-header table** 11 kolom (`KlaimTable.tsx` 272 ln + `KlaimRow.tsx` 293 ln + `tableTokens.ts` 112 ln):
  - Checkbox bulk (select-all + indeterminate state via `el.indeterminate` ref)
  - No Klaim + Tanggal kunjungan (mono + format short id-ID)
  - Pasien (RM-ID + age/gender/LOS sub-line)
  - Unit + Kelas (chip mini via `UnitKelasChip` shared)
  - Penjamin (`PenjaminBadge` shared · BPJS emerald/Asuransi sky/Jamkesda amber)
  - iDRG/CBG (kode mono via `GrouperChip` shared · "L" superscript untuk legacy + group truncate)
  - Tarif RS (mono right · tooltip nominal full)
  - Tarif Grouper (mono right · emerald jika RS untung · rose jika RS rugi)
  - Selisih (chip emerald/rose/slate dengan TrendingUp/Down icon)
  - Status (chip 13-status via `ClaimStatusChip` shared)
  - Kebab ⋮ aksi (`KlaimRowKebab` 134 ln · 9 aksi dengan disabledIf)
- [x] **Sort 3-state** untuk 7 kolom sortable (No Klaim/Pasien/Grouper code/Tarif RS/Selisih/Status — Tanggal masuk sort by `createdAt` via SortKey "createdAt"). Header button cycle asc → desc → null. `aria-sort` semantic. `motion.layoutId="klaim-sort-indicator"` spring dot.
- [x] **Bulk-select + bulk-action bar** — `KlaimBulkBar.tsx` 176 ln sky-accent slide-up (`AnimatePresence` spring stiffness 380/damping 32):
  - **Submit Batch ke BPJS** (disabled if !BPJS / !Belum Submit / iDRG only — alasan tooltip)
  - **Cek Eligibility** (disabled jika tidak ada BPJS dengan SEP)
  - **Generate Berkas Batch** (always enabled · mock)
  - **Export CSV** (RFC 4180 escape + BOM UTF-8 · auto-download via `downloadKlaimCsv`)
  - Header: count + Tarif RS total · Close X deselect semua
- [x] **Row interactivity** — `click` anywhere (except checkbox/kebab) → `router.push("/ehis-eklaim/klaim/[id]")`. Keyboard Enter/Space sama behavior. Hover: `bg-teal-50/30`. Selected: `bg-teal-50/60`. Focus-visible ring teal/40.
- [x] **Kebab 9-aksi dengan disabledIf**: Buka detail · Edit koding (Draft/Belum Submit) · Cek eligibility (BPJS+SEP) · Submit (BPJS+Belum Submit) · Generate berkas · Lihat timeline · Ajukan banding (Rejected) · Write-off (Rejected/Sengketa) · Hapus draft (Draft Coding). Outside-click + ESC close. Danger tone (rose) untuk Write-off/Hapus.
- [x] **Empty state** (`KlaimEmptyState.tsx` 43 ln) teal-themed (selaras modul aksen — bukan sky karena teal sudah primary) + CTA reset filter.
- [x] **Footer summary** (`KlaimTableFooter.tsx` 98 ln) — count rows + density label + Total Tarif RS + Total Tarif Grouper (teal tone) + Total Selisih (emerald/rose/slate tone dengan +/- prefix).
- [x] **Selection auto-reset** saat filter sidebar berubah (kecuali quickTab/density) — pakai `filterStampRef` JSON comparison di useEffect supaya selection terhadap rows yang hilang tidak misleading.

### EK2.3 Logic terpisah

- [x] **`klaimBoardLogic.ts`** (565 ln) — pure helpers (semua deterministic, no side effect kecuali `downloadKlaimCsv` browser-only):
  - `applyFilters(claims, state)` — sidebar filters (search · periode · units · kelas · penjamin tipe+nama · status · era)
  - `applyQuickTab(claims, tab)` + `applyAllFilters` (sidebar + quickTab compose)
  - `computeQuickTabCounts(claims, state)` — count per 5 tab aware ke filter sidebar
  - `computeKPIs(claims, filters)` — derive 4 KPI dengan trend hints
  - `listPenjaminNama(claims, tipe)` — unique nama per tipe untuk dropdown sekunder
  - `statusCountsForChips(claims, filters)` — count per status saat filter sidebar aktif (chip badge)
  - `applySort(claims, sort)` + `cycleSort(current, key)` + `defaultSort` 3-state cycle (key: noKlaim/pasienId/createdAt/tarifRS/selisih/status/iDRGCode)
  - `canBulkSubmit(selected)` + `canBulkCekEligibility(selected)` predicate dengan typed reason string untuk bulk bar disable tooltip
  - `kebabActionsFor(claim)` — 9-aksi dengan `disabledReason` per row + 3 tone (default/primary/danger)
  - `exportKlaimCsv(claims)` — RFC 4180 escape (`"`, `,`, `\r\n`) + `downloadKlaimCsv(claims, filename?)` browser auto-download dengan BOM UTF-8
  - `KLAIM_BOARD_MOCK` re-export sebagai single source untuk konsumer

**Acceptance EK2.1:** ✅ 2-panel layout (300px filter + workspace) fit dalam viewport tanpa page-scroll · TSC clean · skeleton 500ms · 4 KPI animate stagger · 5 quick tab count dinamis · 13 status chip + 8 kelas chip + era segmented · search live filter terhadap 25 klaim mock · No indigo · font ≥ 11.5px / 12.5px.

**Acceptance EK2.2:** ✅ Sticky-header table 11 kolom · sort 3-state 7 kolom dengan `aria-sort` semantic · selection state + indeterminate select-all · bulk bar slide-up sky-accent 4 aksi dengan disabledIf typed reason · row click navigate ke detail (placeholder `/ehis-eklaim/klaim/[id]` untuk EK3) · kebab 9-aksi disabledIf · footer summary 3 total (Tarif RS / Tarif Grouper / Selisih) · empty state teal · 18 file 43–565 ln (max 565, well under 800 cap · total 3356 ln).

**Acceptance EK2.3:** ✅ All pure helpers implemented + tested via runtime (TSC clean + KPI compute via filter aware) · CSV export RFC 4180 valid.

**Acceptance EK2 (full):** ✅ worklist tampil 25 klaim · filter real-time · bulk submit batch trigger mock V-Claim (handler stub log via console.info · adapter EK0.4 ready · integration formal di EK3.5) · count tab dinamis · click row navigate ke detail.

---

## Phase EK3 — Klaim Detail (6-Tab Workspace)

**Route:** `/ehis-eklaim/klaim/[id]` · **Effort:** 5-6 hari
**Pattern reference:** Invoice Detail (BL2) + Farmasi OrderDetail 5-tab

### EK3.1 Banner Header + Tab Scaffold + Page Shell

- [x] **`claimDetailShared.ts`** (290 ln) — types & helpers: `ClaimDetailTab` (6 tab: ringkasan/berkas/koding/grouper/submission/audit) + `CLAIM_DETAIL_TABS` config dengan icon + hint per tab · `TIMELINE_STAGES` (5-stage pipeline: Koding → Verif RS → Submit → Verif BPJS → Selesai) + `resolveStageStates()` (13-status → done/active/idle/error per stage) · `computeBerkasProgress()` (readyWajib/totalWajib/percent/missingKategori) · `computeQuickActionState()` (showSubmit BPJS-only · canSubmit gated on Belum Submit + berkas complete + grouper resolved · submitDisabledReason typed string) · `statusToneForBanner()` (semantic tone mapper) · `fmtDateShort/fmtDateTimeShort/avatarInitials/findTab` helpers.
- [x] **`ClaimTimelineMini.tsx`** (parts/ · 156 ln) — horizontal 5-stage pipeline dengan node states: done (solid teal + check), active (sky pulse animasi 1.8s loop), idle (slate outline), error (rose + alert). Connector line per pair node berubah warna sesuai transition (gradient teal→sky saat menuju active). Spring layoutId hub di idx active.
- [x] **`ClaimBannerHeader.tsx`** (488 ln) — sticky banner dengan 5-row layout teal/sky-accent:
  - Row 1: Breadcrumb ← Klaim Board · noKlaim mono · invoice deep-link · kunjungan deep-link · status chip besar (semantic tone)
  - Row 2: Avatar 11×11 dengan initials + linear-gradient teal/sky · identity (nama + Verified badge · pasienId mono + age + gender label) · chips strip (PenjaminBadge + KelasChip + SEP mono emerald + UnitChip + KompetensiChip dengan tooltip Perpres 59/2024) · TarifMiniCard 3-col (Tarif RS + Tarif Grouper teal + Selisih emerald/rose/slate dengan +/- prefix)
  - Row 3: Meta line (tanggal + LOS hari + DPJP stub + Coder stub) dengan icons subtle
  - Row 4: ClaimTimelineMini horizontal embed di card slate-50 padding
  - Row 5: Berkas progress bar animated dengan tone emerald/amber sesuai isComplete · Quick action buttons (Submit BPJS primary sky disabled-reason tooltip · Generate Berkas · Print Resume — hidden untuk RJ)
- [x] **`ClaimTabs.tsx`** (90 ln) — 6-tab sticky nav horizontal dengan motion.layoutId="klaim-detail-tab-underline" spring stiffness 380/damping 30 indicator. Icon 6×6 chip + label + hint subtitle (text-[10px] uppercase). Lock icon pada tab not-yet-implemented (5 tab). Hidden scrollbar untuk mobile (overflow-x-auto + scrollbar:none).
- [x] **`TabPlaceholder.tsx`** (tabs/ · 96 ln) — reusable placeholder: icon header + judul + phase chip (amber EK3.x) + effort estimate + description prose + bullet list acceptance criteria yang akan dibangun (stagger entrance 0.03s/idx) + footer hint. Konten per tab di-define di `KlaimDetailPage.renderTab()` (6 entry — 1 untuk Ringkasan + 5 untuk EK3.2-3.6).
- [x] **`ClaimNotFound.tsx`** (parts/ · 36 ln) — 404 state graceful dengan icon FileSearch rose + ID mono + tombol kembali ke Klaim Board.
- [x] **`KlaimDetailPage.tsx`** (267 ln) — page shell entry: useSkeletonDelay(500) → SkeletonShell (banner + tabs + content placeholder all animated) → AnimatePresence transition ke ClaimBannerHeader + ClaimTabs + tab content area (scroll independent · max-w-3xl auto centered). `renderTab(tab)` switch route ke TabPlaceholder per tab dengan acceptance bullets terperinci. Quick action handlers stub `console.info` (Submit/GenerateBerkas/PrintResume — wired di EK3.5/EK5).
- [x] **Route `/ehis-eklaim/klaim/[id]/page.tsx`** (18 ln) — server component pakai async params Next.js 16 + searchParams?.tab passthrough. Lookup di-handle di client (ClaimNotFound graceful 404 dengan breadcrumb intact, bukan global not-found.tsx).

**Acceptance EK3.1:** ✅ TSC clean (`npx tsc --noEmit` exit 0) · banner sticky dengan 5 row info densitas tinggi · 6-tab nav dengan motion.layoutId smooth indicator + lock icon untuk pending tab · timeline mini animasi pulse spring per stage · skeleton 500ms · 404 graceful · file size 36-488 ln semua well <800 cap · 8 file total (1 shared + 2 parts + 1 tabs + 4 components incl. route) · no indigo · font ≥ 11.5px label / 12.5px value.

### EK3.2 Tab Berkas

- [x] **`berkasShared.ts`** (tabs/berkas/ · 268 ln) — config & helpers: `BERKAS_GROUPS` (4 group: identitas/klinis/finansial/khusus dengan tone palette + description + order) · `KATEGORI_CFG` (10 kategori dengan icon Lucide + group mapping + tone + autoPull source `{label, href(claim), estimatedCount}` — Resume Medis routes ke `/ehis-care/{ri,igd,rj}` sesuai tipePelayanan) · `STATUS_CFG` (4 status: Belum/Siap/Tidak Berlaku/Reject Verifikator dengan icon + tone) · `cycleStatus()` (Belum → Siap → Tidak Berlaku → Belum) · `buildGroupSummaries()` (per-group progress: readyWajib/totalWajib/percent + collapsibleDefault saat all optional N.A) · `makeMockFile()` (generator file metadata dengan deterministic hash + mime sesuai kategori — PDF untuk dokumen, JPG untuk Identitas/Rad) · `AUTO_PULL_KATEGORI` (4 kategori: Resume/Lab/Rad/Billing) · `formatFileSize/fileTypeFromMime/fileTypeIcon` helpers.

- [x] **`BerkasRow.tsx`** (tabs/berkas/ · 281 ln) — single berkas row:
  - Header: kategori icon 7×7 tone palette + nama (truncate) + Wajib/Opsional micro-badge + status chip clickable cycle (active:scale-95 transition)
  - Catatan template hint dari `getBerkasTemplate()` (PMK 26/2021 spec)
  - File info row (jika ada file): file icon + nama mono truncate + size + version count badge v{n} + uploader chip
  - Actions: Auto-pull button (sky · jika kategori punya source dan status ≠ Siap) · Upload (Replace jika sudah ada file) · Preview shortcut · Catatan toggle (amber jika sudah ada note)
  - Notes textarea (collapsed default · expand on Catatan click · `framer-motion` height auto · stopPropagation supaya click textarea tidak select row)
  - Keyboard: Enter/Space toggle select · focus-visible ring teal

- [x] **`BerkasGroupList.tsx`** (tabs/berkas/ · 200 ln) — grouped list dengan 4 section:
  - Header per section: dot tone + label bold + description sub + ProgressBadge (ready/total + percent · auto-tone emerald saat complete) + chevron collapse
  - Show optional N.A toggle global (eye/EyeOff icon · saat off filter wajib=false && status=Tidak Berlaku)
  - Auto-collapse groups dengan `collapsibleDefault` (all optional N.A) — start collapsed dengan opsi reveal
  - Empty group skip render · empty section setelah filter tampil pesan "Toggle untuk tampilkan"
  - `framer-motion` AnimatePresence untuk section expand/collapse (height auto · duration 0.2s)

- [x] **`BerkasPreviewPane.tsx`** (tabs/berkas/ · 333 ln) — sticky preview pane kanan:
  - 3 mode display: empty state (Inbox icon teal + guide message) · NoFileState (Upload icon amber + dual CTA Upload/Auto-pull jika source available) · FileViewer (full preview dengan metadata strip 4-col + mock preview area + footer actions + versions list)
  - PreviewHeader shared: kategori icon 8×8 tone + nama + status chip semantic
  - Metadata strip (4 col responsive): Nama File mono truncate · Ukuran · Tipe · Versi
  - Mock preview renderers: `MockPdfPreview` (FileText 48 rose + 8 line skeletons) · `MockImagePreview` (FileImage placeholder dalam frame slate-200) · `MockOtherPreview` (file icon generic)
  - Footer actions: Download (mock disabled) · Buka (external) · Replace · uploadedAt+uploadedBy chip emerald · Versions list mono badges · Coder note amber jika ada catatan

- [x] **`AutoPullBar.tsx`** (tabs/berkas/ · 230 ln) — top bar dengan 4 source cards:
  - Header: sky icon + title + summary count chip (X/Y ter-pull · auto-emerald saat semua complete) + Pull Semua button (disabled saat semua pulled)
  - 4 PullCard (grid 2-col sm / 4-col md): kategori icon + label + source desc + ready/total chip + Pull button (disabled jika tidak ada items atau sudah pulled — auto-emerald ring) + ExternalLink anchor ke source modul
  - Stagger pull via setTimeout (100ms + 150ms/item) supaya feedback berasa async

- [x] **`BerkasTab.tsx`** (tabs/ · 280 ln) — main orchestrator:
  - State: `berkas` (mutable mirror dari `claim.berkas` ReadonlyArray · backend swap pattern) + `selectedId` + `fileInputRef` + `pendingUploadIdRef`
  - Template notes lookup via `getBerkasTemplate(penjamin.tipe, tipePelayanan)` match by (kategori, nama)
  - Handlers: `handleSelect/handleStatusCycle/handleNoteChange/handleAutoPull` (350ms latency simulasi · attach mock file + sumber discriminated `auto-pull` dengan sumberType per kategori) · `handlePullKategori` (stagger via setTimeout 150ms/item) · `handlePullAll` (4 kategori 200ms apart) · `handleUpload` (trigger hidden file input via ref) · `handleFileInputChange` (read file.name+size+type, attach as new BerkasVersion append-only · sumber upload-manual)
  - Layout: AutoPullBar atas · ProgressBanner global (emerald/amber sesuai isComplete dengan progress bar 32px animated) · 2-pane grid (5/12 list + 7/12 preview · stack di sm · max-h calc(100vh-400px) supaya scroll independent tidak page-level)
  - Hidden file input (accept .pdf,.jpg,.jpeg,.png) trigger via ref · onChange handle replace dengan VersionNumber+1 append

- [x] **Wire ke `KlaimDetailPage.renderTab()`** — replace `TabPlaceholder berkas` dengan `<BerkasTab claim={claim} />` · flip `implemented: true` di CLAIM_DETAIL_TABS · pass `claim` arg ke renderTab.

**Acceptance EK3.2:** ✅ TSC clean (`npx tsc --noEmit` exit 0) · 4-group section (Identitas/Klinis/Finansial/Khusus) dengan progress per group · auto-collapse N.A · status cycle clickable · auto-pull 4 source dengan stagger feedback · upload via hidden file input + version append · preview pane 3 mode (empty/no-file/file-viewer) · mock PDF/image preview · notes inline textarea · file size 200-333 ln (max <800 cap · 6 file baru + 1 KlaimDetailPage edit · ~1592 ln total) · no indigo · font ≥ 11.5px label / 12.5px value.

### EK3.3 Tab Coding (ICD-10-IM + ICD-9-CM-IM)

- [x] **Diagnosa Primer** picker — searchable autocomplete dari `ICD10_IM_MOCK` (kode + deskripsi + kategori + versi IM). **Bukan WHO ICD-10**, harus Indonesian Modification.
- [x] **Diagnosa Sekunder** multi-picker — boleh 0-10 diagnosa, dengan flag `hospitalAcquired` untuk CC/MCC PPI.
- [x] **Tindakan/Prosedur** multi-picker — searchable autocomplete dari `ICD9_CM_IM_MOCK`.
- [x] **Auto-suggest** dari kunjungan — kalau `DiagnosaTab` kunjungan sudah ada `kodeIcd10IM`, auto-fill diagnosa primer.
- [x] **Validasi** — diagnosa primer wajib · sistem koding **sesuai ICS v1 (Indonesian Coding Standard)** — bukan free-form severity client-side; severity dihitung oleh grouper di EK3.4.
- [x] **Tombol Re-Group iDRG** — trigger `iDRGGrouperAdapter.groupiDRG(ctx)` ulang setelah edit koding. Untuk legacy mode (klaim pre-Okt 2025): tombol berbeda "Re-Group INA-CBG (Legacy)".
- [x] **Coder signature** — checkbox "Saya kode ini benar sesuai Pedoman iDRG 2025" + nama coder + timestamp (audit trail).
- [x] **Soft-lock banner** — jika klaim sedang di-edit coder lain, tampil banner "Sedang di-edit oleh [nama] sejak [waktu] — tunggu atau ambil alih (force unlock)".

### EK3.4 Tab Grouper (iDRG Result · Legacy INA-CBG conditional)

**Mode display by `claim.eraGrouper`:**

#### Mode A: iDRG Result (primary, klaim post-Okt 2025) ✅
- [x] **iDRG Result Card** prominent:
  - **Kode 7-digit numerik** besar mono (e.g. "1234567")
  - MDC (Major Diagnostic Category) label
  - Group name
  - Severity badge (1-Ringan / 2-Sedang / 3-Berat) dengan list CC/MCC detected
  - **Tarif per tingkat kompetensi RS** (table 4 baris: dasar/menengah/utama/komprehensif)
  - **Tarif aktual** highlight emerald — berdasarkan tingkat kompetensi RS pasien dirawat
  - Versi grouper chip (e.g. "iDRG_v1.0_2025")
- [x] **Breakdown card** — tarif RS vs tarif iDRG:
  - Subtotal items per kategori (Akomodasi/Tindakan/Lab/Rad/Obat/Jasa Dokter) dalam `Rupiah`
  - Compare vs tarif iDRG aktual
  - Selisih nominal + animated bar chart (emerald jika RS untung, rose jika RS rugi)
  - Highlight margin% — "Margin iDRG: +12.5% (untung Rp 1.250.000)"
- [x] **Top-Up CMG indicator** — `iDRGResult.topUpCmg[]`:
  - List eligible top-up (ICU >3 hari, obat mahal, prosthesis, dll)
  - Per item: alasan + nominal tambahan · empty state jika tidak ada
  - Sum total top-up + highlight footer
- [x] **Tombol Re-Group iDRG** — ActionBar dengan last-grouped timestamp + error dismiss.

#### Mode B: Legacy INA-CBG Result (klaim pre-Okt 2025 — conditional render)
- [x] **Banner kuning** "Mode Legacy INA-CBG — Klaim layanan sebelum 1 Oktober 2025" di atas card.
- [x] **INA-CBG Result Card** — sama pattern lama tapi label "Legacy":
  - Kode 4-digit alphanumeric (e.g. "I-1-01-I")
  - Severity I/II/III
  - Tarif per kelas {VIP, Kelas_1, Kelas_2, Kelas_3}
- [x] **Tombol Re-Group INA-CBG (Legacy)** — call `inaCbgLegacyAdapter` via ActionBar.

#### Mode C: Dual Comparator (opt-in toggle, AD-19)
- [x] **Toggle "Show INA-CBG Comparison"** — chip "Komparator" di ActionBar. Saat ON: auto-fetch secondary via `resolveComparator()`.
- [x] **Side-by-side card layout:**
  - Left: iDRG Result — accent sky, label "PRIMER · ERA AKTIF" atau "ESTIMASI · iDRG"
  - Right: INA-CBG Result — accent amber, label "REFERENCE ONLY · LEGACY" atau "PRIMER · ERA AKTIF"
  - Info banner caveat: "REFERENCE ONLY — tidak untuk submission"
- [x] **Delta indicator** — DeltaCard emerald/rose: selisih nominal + persentase iDRG vs INA-CBG
- [x] **Tidak ada tombol "Submit INA-CBG"** — UI read-only untuk panel sekunder Mode C.

### EK3.5 Tab Submission ✅ 2026-05-27

- [x] **Eligibility check card** — `vClaimAdapter.getEligibility` · noKartu + tglSEP + jnsPelayanan · SEP info 4-col grid · result: kelasDijamin + plafon + sisa hari rawat + tingkatKompetensiRS · error retry inline · loading state
- [x] **Pre-submit checklist** — 4 item stagger: berkas wajib (via computeBerkasProgress) · koding diagnosa primer · grouper resolved · eligibility valid · counter chip allDone emerald / amber
- [x] **Batch picker** — 3 mock batch (Mei A · Mei B · Buat Baru) · sky ring saat selected · grid sm:cols-3
- [x] **Submit button** — sky primary disabled jika disabledReason tersedia · disabled state reason explanation amber · loading Loader2
- [x] **Result feedback inline** — AnimatePresence scale-in · emerald (berhasil) / rose (gagal) · noKlaim + statusBPJS display · "Coba Lagi" retry untuk error · DuplicateClaimError + NetworkError handled
- [x] **Non-BPJS card** — amber panel panduan submission manual 4-langkah

### EK3.6 Tab Audit/Timeline ✅ 2026-05-27

- [x] **Timeline vertikal** — 10 event type discriminated union (claim-created · coding-changed · berkas-uploaded/rejected · grouper-resolved · status-transition · submitted-batch · verifikator-comment · banding-submitted · payment-received) · stagger 0.05s · reverse chronological
- [x] **Per-entry** — dot icon (LucideIcon per type · colored bg) · timestamp fmtDateTimeShort · actor avatar (avatarInitials 2char) · detail by type
- [x] **Detail per type** — coding-changed: DiffRow before/after ICD primer+sekunder+prosedur · status-transition: from→to chips · berkas: kategori + sumber · grouper: eraGrouper + kode · payment: formatRupiah + reconciliationId · banding: tingkat
- [x] **Filter by type** — 9 chip (Semua/Status/Berkas/Koding/Grouper/Submit/Bayar/Komentar/Dibuat) · teal-600 active
- [x] **Filter by actor** — select dropdown (muncul jika >2 unique actors)
- [x] **Export CSV** — RFC 4180 + BOM UTF-8 · download blob `audit_{noKlaim}_{date}.csv`
- [x] **Empty state** — History icon + pesan jika filter kosong

### EK3.7 Modals ✅ 2026-05-27

- [x] **`UploadBerkasModal`** — 2-panel (kategori grid 10-item 2-col · dropzone drag+drop · catatan textarea · upload sky CTA · stagger Framer Motion) — `modals/UploadBerkasModal.tsx` 250 ln
- [x] **`EditKodingModal`** — 2-panel max-w-3xl (ICD-10-IM primer+sekunder inline search · mode toggle Primer/Sekunder · ICD-9-CM-IM tindakan inline search · ICDSelectedList reuse · ICS v1 validation · coder signature) — `modals/EditKodingModal.tsx` 340 ln
- [x] **`SubmitBatchModal`** — compact max-w-md (klaim card · 4-item animated checklist · 3 batch radio-card · V-Claim submit dengan inline result · sky accent) — `modals/SubmitBatchModal.tsx` 300 ln
- [x] **`modalShared.ts`** — shared: BACKDROP_V · PANEL_V · ITEM_V · useEscapeKey · useScrollLock · INPUT_CLS · TEXTAREA_CLS · SEARCH_CLS — 85 ln
- [x] **`ClaimBannerHeader`** — +2 props (onEditKoding · onUploadBerkas) + 2 quick-action buttons (Edit Koding teal · Upload emerald) di Row 3
- [x] **`KlaimDetailPage`** — wired 3 modal state + handlers (handleUpload · handleSaveKoding · handleSubmitSuccess) · handleSubmit → SubmitBatchModal (replace stub)

**Acceptance EK3.7:** ✅ TSC clean · UploadBerkasModal kategori + dropzone + catatan functional · EditKodingModal ICD search + sekunder list + validation + signature · SubmitBatchModal checklist + batch picker + V-Claim submit mock · modal spring animation 380/32 · backdrop blur · escape key + scroll lock · no indigo · slate-700 text in form fields · 4 file < 350 ln each.

**Acceptance EK3 (full):** ✅ buka klaim demo, 6 tab functional, coding ICD → grouper auto-resolve CBG, eligibility check OK, submit batch trigger mock V-Claim, status berubah ke Submitted. Modals tersedia dari banner quick actions.

---

## Phase EK4 — iDRG Calculator Standalone (Legacy INA-CBG optional) ✅ 2026-05-27

**Route:** `/ehis-eklaim/calculator` · **Effort:** 2 hari

### EK4.1 Form Input ✅

- [x] **Mode toggle** — 3 mode (chip segmented + layoutId spring transition):
  - **"iDRG"** teal (default post-Okt 2025) — `resolveGrouping()` iDRG engine
  - **"INA-CBG Legacy"** amber (pre-Okt 2025) — `resolveGrouping()` INA-CBG engine
  - **"Compare Both"** sky (AD-19 Comparator) — `resolveComparator()` dual engine paralel
- [x] **Form 2-col** (left: ICD input · right: params):
  - Left `CalculatorInputPanel` (272 ln): Diagnosa Primer chip (ICD-10-IM, wajib, single, removable) + Diagnosa Sekunder (multi-picker max 10 + toggle hospitalAcquired) + Tindakan/Prosedur (ICD-9-CM-IM multi) — section header count badges + sticky z-10 labels + internal scroll
  - Right `CalculatorParamsPanel` (230 ln): **Tingkat Kompetensi RS** (4 colorful animated tiles: Dasar emerald/Menengah teal/Utama sky/Komprehensif amber) · Kelas Pasien 4-tile (INA-CBG mode only) · Tipe Pelayanan 3-tab segmented · LOS/Age number inputs · Gender L/P toggle · Cara Pulang select · Tarif RS Manual (optional, Rp formatter inline) · Hitung button (mode-aware accent + validation feedback)

### EK4.2 Result Card ✅

- [x] **iDRG Result** (`CalculatorResultCard` IDRGBlock) — kode 7-digit mono 28px black + MDC label + group + Severity badge (1-3 · emerald/amber/rose) + CC/MCC chip list + Tarif per tingkat 4-col grid (aktif highlighted ring) + Tarif Aktual highlight emerald
- [x] **Legacy INA-CBG Result** (INACBGBlock) — kode 4-digit mono + severity Roman I/II/III + tarif 4 kelas grid (VIP amber/K1 teal/K2 sky/K3 slate)
- [x] **Compare Both** side-by-side grid (xl:grid-cols-2): iDRG card teal "PRIMER · ERA AKTIF" · INA-CBG amber "ESTIMASI · REFERENCE ONLY" + watermark badge + caveat banner + DeltaChip (+/- nominal + %)
- [x] **Compare vs Actual Cost** — Tarif RS input optional → MarginBar: animated horizontal bar chart per kategori (Akomodasi/Tindakan/Lab/Rad/Obat/Jasa) + Selisih chip emerald/rose + persen margin
- [x] **Save as Draft Klaim** — button (disabled di mode "Compare Both" dengan tooltip alasan)
- [x] **Print Result** — `window.print()` trigger
- [x] **AnimatePresence** result slide-in y:12→0 setelah hitung selesai · loading skeleton + error state rose panel
- [x] **Skeleton 300ms** via `useSkeletonDelay` · animated gradient accent bar header

**Acceptance EK4:** ✅ TSC clean (`npx tsc --noEmit` exit 0) · 3 mode toggle (iDRG/Legacy/Compare) · 2-col layout no page scroll · 4 colorful Tingkat RS tiles · ICD picker reuse dari EK3.3 · `resolveGrouping` + `resolveComparator` wired · iDRG result 7-digit mono + severity badge + tarif 4-tingkat · INA-CBG legacy result + tarif kelas · Compare side-by-side + DeltaChip · MarginBar breakdown chart animated · QuickNavGrid Calculator card enabled · 6 file 7–272 ln (max 272 << 800 cap) · no indigo · font ≥ 12px · colorful widget tiles.

---

## Phase EK5 — Berkas Generator (PDF Templates) ✅ 2026-05-27

**Effort:** 2-3 hari · **Dependency:** EK0 templates + EK3 berkas tab

### EK5.1 Templates ✅

- [x] **`ResumeMedisTemplate.tsx`** (189 ln) — A4 layout: KOP RS · I. Identitas & Kunjungan (2-col grid) · II. Diagnosa ICD-10-IM (primer mono teal + sekunder list + HAI badge) · III. Tindakan ICD-9-CM-IM (conditional) · IV. Hasil Grouper (iDRG code highlight + severity + tarif aktual) · V. Anamnesis & Terapi (mock narrative) · Signature Row (DPJP + Coder + Verifikator) · Footer branding
- [x] **`BerkasKlaimTemplate.tsx`** (196 ln) — A4 cover: KOP RS · Header no klaim + penjamin + tanggal · I. Informasi Klaim (2-col) · II. Grouper Result (3-card: kode + severity + tarif aktual, conditional iDRG/CBG) · III. Daftar Kelengkapan Berkas (HTML table: kategori + nama + wajib + status symbol + progress summary) · Signature Row (Coder + Verifikator) · Footer
- [x] **`SuratPengantarTemplate.tsx`** (182 ln) — A4 formal letter: KOP RS · Nomor/Lampiran/Perihal · Alamat tujuan BPJS · Badan surat formal (rujukan regulasi Permenkes 76/2016 + Perpres 82/2018 + Pedoman iDRG 2025) · Tabel klaim batch (noKlaim + diagnosa primer + jenis + grouper + tarif) · Total row + Penutup · Signature kanan (Kepala Tim Klaim) · Footer
- [x] **`KopSuratEklaim.tsx`** (62 ln) — Shared KOP RS component (variant="full"/"compact") reuse RS_PROFIL_INITIAL · logo placeholder · identity center · double-border bawah klasik
- [x] **`berkasGeneratorShared.ts`** (161 ln) — Template config (3 TemplateCfg) · display helpers (fmtGender/TipePelayanan/CaraPulang/DateLong/DateShort/todayLong/currentMonthYear) · `printElementById()` (visibility CSS trick + afterprint cleanup) · `downloadBerkasBundle()` (JSON manifest mock)

### EK5.2 Print + Bundle ✅

- [x] **`printElementById(elementId)`** — CSS visibility override @media print · `@page { size: A4 portrait }` · `position:fixed left:0 top:0 width:210mm` untuk template aktif · cleanup afterprint event listener
- [x] **Mock bundle download** — `downloadBerkasBundle(claim)` → JSON manifest (berkas list + template names + metadata) → blob URL download → filename `bundle-{noKlaim}-{tanggal}.json`
- [x] **`BerkasGeneratorModal.tsx`** (310 ln) — Framer Motion AnimatePresence (backdrop + panel spring) · 2-col layout: left 3-card template selector (icon + label + sublabel + description expand on active + check badge) · right scrollable preview area (zoom:0.52 A4 preview · label bar "Pratinjau A4 · Zoom 52%") · print area `position:fixed left:-99999px` off-screen · footer: "Unduh Bundle" + "Tutup" + "Cetak Template" (teal primary) · loading spinner on download
- [x] **Wiring** — `KlaimDetailPage.tsx` + `BerkasGeneratorModal` state (`berkasGenOpen`) + `handleGenerateBerkas` → `setBerkasGenOpen(true)` · tombol "Generate" di `ClaimBannerHeader` Row 3 sudah ada (onGenerateBerkas prop)

**Acceptance EK5:** ✅ TSC clean (`npx tsc --noEmit` exit 0) · 3 template A4 fungsional · KOP RS RS_PROFIL_INITIAL · preview zoom:0.52 dalam modal · print via CSS visibility trick (printElementById) · bundle download JSON manifest · BerkasGeneratorModal AnimatePresence spring + 3-card selector + AnimatePresence template switch · wired ke ClaimBannerHeader "Generate" button · 6 file 62–310 ln (max 310 << 800 cap) · no indigo · teal/sky/emerald accent.

---

## Phase EK6 — Banding / Dispute Workflow ✅ 2026-05-28

**Route:** `/ehis-eklaim/banding` · **Effort:** 2.5 hari

### EK6.1 Banding Board ✅

- [x] **Worklist banding** — `BandingBoardPage` (2-panel: filter 260px kiri + table fluid kanan) · `BandingTable` quick-tabs (Semua/Diajukan/Review/Disetujui/Ditolak) + AnimatePresence row stagger · `BandingFilterPanel` (pencarian / periode 4 preset+custom / penjamin select / tingkat segmented / status full-width chips) · `BandingHero` (breadcrumb + stat chips) · skeleton 500ms `useSkeletonDelay`
- [x] **KPI**: `BandingKPIStrip` 3 cards: Total Banding (teal) · Approval Rate (emerald/amber/rose adaptive) · Avg Hari Keputusan (emerald/amber/slate adaptive) · stagger-up animation · left accent bar
- [x] **Mock data**: `bandingMock.ts` (8 `BandingRecord` entries: Submitted×2 · Review×2 · Approved×3 · Rejected×1) · cross-link ke `CLAIM_BOARD_MOCK` via claimId · `bandingShared.ts` (view join `buildViewItems` + `filterViewItems` + `computeBandingKPIs` + tone tokens + filter helpers)

### EK6.2 Banding Form ✅

- [x] **`BandingFormModal`** — dari Klaim Detail (status Rejected/Banding Rejected) tombol "Ajukan Banding T1/T2" (rose chip · Scale icon):
  - 2-panel (max-w-4xl): LEFT read-only (info klaim 2-col + grouper chip + tarif vs RS + rejection reason rose card) · RIGHT form (tingkat toggle 1/2 · textarea alasan min 50 char + live char counter + validation feedback + border warna adaptive · upload dokumen multi-file stub drag-area + file list remove · ringkasan pengajuan card on valid)
  - Submit → loading 900ms → success screen (CheckCircle2 + pesan feedback) → auto-close 1.4s
  - `computeQuickActionState` updated: `showBanding` + `defaultBandingTingkat` (1 for Rejected, 2 for Banding Rejected)
  - Wired di `KlaimDetailPage` + `ClaimBannerHeader` (onAjukanBanding prop)

### EK6.3 Banding Detail ✅

- [x] **Detail page** per banding (`/ehis-eklaim/banding/[id]`):
  - `BandingDetailPage` shell — skeleton 500ms + not-found state + 2-panel ready layout
  - `BandingDetailHeader` sticky — breadcrumb (← Banding Board / Scale icon / Banding ID) · status chip (tone-adaptive) · tingkat badge (sky T1 / amber T2) · link ke klaim asli · submit meta (timestamp · oleh · reviewer BPJS)
  - Left (360px sticky): `BandingDetailLeft` — Klaim Context card (ID link, pasienId, penjamin, pelayanan, LOS, status klaim, diagnosa primer+sekunder, grouper iDRG/INA-CBG, tarif RS+iDRG+selisih) + Alasan Rejection Asli card (rose-50)
  - Right (fluid scroll): `BandingDetailRight` — Alasan Banding card (teal-50 · full text) · Dokumen Pendukung list (empty state graceful) · `BandingTimeline` 3-stage · Mock Review BPJS section
  - `BandingTimeline` — 3-stage vertical (Diajukan → Dalam Review → Selesai) · icon per state (active/done/idle/error) · teal connector done stages · stage meta (timestamp · actor · reviewer · hasil) · status badge header (Proses/Dikabulkan/Ditolak)
  - Mock Review BPJS — tombol "Tandai Approved" (emerald) + "Tandai Rejected" (rose) · AnimatePresence switch ke hasil card · local state (`mockStatus`/`mockHasil`/`mockReviewedAt`) · note "Demo — tidak tersimpan"
  - `BandingTable` Detail button → `Link href="/ehis-eklaim/banding/[id]"` (wired navigasi)
  - Route: `src/app/ehis-eklaim/banding/[id]/page.tsx` async params + metadata

**Acceptance EK6.1+EK6.2+EK6.3:** ✅ TSC clean · Banding Board 2-panel (filter+table) · skeleton loading · 3 KPI adaptive · 8 mock entries · filter: search/periode/penjamin/tingkat/status · BandingFormModal 2-panel · alasan min 50 char · tingkat 1/2 toggle · file upload stub · wired ke ClaimBannerHeader "Ajukan Banding" button (Rejected claims only) · EK6.3 Detail page: 2-panel (360px kiri sticky + fluid kanan) · BandingTimeline 3-stage vertical · Mock Review BPJS demo · `BandingTable` Detail → navigasi ke detail · 5 file baru EK6.3 ≤ 300 ln ea · no indigo · teal/sky/emerald/amber/rose palette · font ≥ text-sm · total EK6 = 14 file.

---

## Phase EK7 — Reconciliation Transfer BPJS

**Route:** `/ehis-eklaim/reconciliation` · **Effort:** 3 hari

### EK7.1 Import Transfer ✅ 2026-05-28

- [x] **`ImportTransferModal`** — upload CSV mock (kolom: tanggal/nominal/bank/keterangan):
  - Parse CSV → buat `ReconciliationRecord` draft
  - Auto-detect penjamin dari keterangan (regex "BPJS"/"Mandiri Inhealth"/dll)
  - **Impl:** `ImportTransferModal.tsx` (2-step: DropzoneStep drag-drop + PreviewStep table) · `parseCSVContent()` helper di `reconciliationShared.ts` · template CSV download · penjamin auto-detect `detectPenjaminId()` · `generateReconId()`/`generateTransferNo()` ID generators · AnimatePresence step slide · spring modal animation.

### EK7.2 Matching Engine ✅ 2026-05-28

- [x] **`MatchingPanel`** — auto-match nominal transfer ke klaim Approved:
  - 3-strategy matching via `reconciliationMatcher.matchTransfer()`: Exact (1.0) → Periode+Count (0.9) → Fuzzy ±5% (0.7) → Unmatched
  - Tampilkan matched claims table (ConfidenceBadge + klaim detail)
  - Tampilkan unmatched klaim collapsible + manual match CTA placeholder
  - **View states:** Empty / CompletedView (stored matchedClaims) / PendingRun (engine CTA) / HasResult (engine output + Simpan)
  - Simpan hasil → update `localRecords` state → clear matchResult cache → switch ke CompletedView
- [x] **`ManualMatchForm`** — unmatched section collapsible di dalam MatchingPanel dengan per-claim "Tambah" action
- [x] **`ReconciliationPage`** — shell 2-panel (380px TransferList kiri + fluid MatchingPanel kanan) · skeleton 500ms `useSkeletonDelay` · `handleRunMatch` async 1.5s latency · `handleSaveMatch` update state + clear cache
- [x] **`TransferList`** — left panel: KPI strip 2×2 (Total/Selesai/Perlu Review/Belum Dicocokkan) + scrollable transfer items dengan status chips + Import button
- [x] **`reconciliationShared.ts`** — types (`ReconViewStatus`, `CSVTransferRow`, `ReconKPI`) · `computeReconKPIs()` · `getReconViewStatus()` · `getConfidenceCfg()` · `getPenjaminDisplay()` · `getApprovedClaimPool()` · `findClaimById()` · `fmtDateShort/fmtDatetime` · re-export BANDING_TONE
- [x] **Route** `src/app/ehis-eklaim/reconciliation/page.tsx`

### EK7.3 Selisih Resolution

- [x] **`SelisihWriteOffModal`** — 2-step spring modal (2026-05-28):
  - Step 1 Review: 3 summary cards (Nominal Transfer/Total Dicocokkan/Selisih) · direction hint (underpaid→Write-off, overpaid→Refund) · per-klaim breakdown table (Tarif Diajukan vs Disetujui vs Selisih per baris)
  - Step 2 Penanganan: 3 option cards Write-off/Refund/Pending (animated hint on select) · alasan textarea (min 20 char + counter) · approver input · validation summary chips · loading 800ms · onSave callback
  - "Tangani Selisih" CTA amber di CompletedView MatchingPanel (visible hanya saat statusSelisih = Pending)
  - ReconciliationPage: `handleWriteOff` update `statusSelisih + completedBy` · `writeOffOpen` state · AnimatePresence mount · TSC clean

### EK7.4 Reconciliation Report

- [ ] **Detail page per reconciliation** — list klaim matched + nominal + status + selisih
- [ ] **Export PDF/Excel** untuk akuntansi

**Acceptance EK7.1+EK7.2:** ✅ TSC clean · ImportTransferModal 2-step drag-drop CSV + preview table + penjamin auto-detect · MatchingPanel 3-strategy engine CTA (Exact/Periode+Count/Fuzzy) + confidence badge + matched claims table + unmatched collapsible · Simpan flow (update state + clear cache + switch view) · ReconciliationPage 2-panel layout + skeleton 500ms + 4 KPI strip · 6 file baru (route + 5 components) semua ≤800 ln · no indigo · teal/sky/emerald/amber/rose palette · font ≥ text-sm.

**Acceptance EK7 (full):** import transfer demo BPJS, auto-match klaim, manual-match sisa, selesai dengan selisih write-off (EK7.3+EK7.4 pending).

---

## Phase EK8 — Dashboard Analytics

**Route:** `/ehis-eklaim/report` · **Effort:** 2-3 hari

### EK8.1 Approval Rate ✅ 2026-05-28

- [x] **Line chart** approval rate per penjamin × bulan (rolling 3/6/12 bulan period selector)
- [x] **Breakdown by tipe** (BPJS teal / Asuransi sky / Jamkesda amber) — SVG animated path + dot markers + delta chip vs bulan lalu
- [x] **Top 5 rejected reasons** — animated horizontal bar chart (rose) + count

### EK8.2 Aging Klaim ✅ 2026-05-28

- [x] **Aging buckets** 0-30/31-60/61-90/>90 hari per penjamin — stacked bar chart dengan tone adaptive (emerald/amber/rose)
- [x] **Stuck claims report** — table klaim Pending Verifikasi >30 hari · sort daysPending desc · urgency chip rose/amber

### EK8.3 iDRG Margin Analysis ✅ 2026-05-28

- [x] **Margin per MDC group** — diverging bar chart (kanan=untung emerald · kiri=rugi rose) · 8 MDC group
- [x] **Summary cards** 3 tile (Surplus/Defisit/Net Margin)
- [x] **Caveat banner** amber — data iDRG mock, real saat INA-Grouper aktif

**Impl detail (EK8.1+EK8.2+EK8.3):**
- `dashboardShared.ts` (200 ln) — pure data builders: `buildApprovalRateData()` 12-month synthetic rates · `buildRejectedReasons()` top 5 · `buildAgingData()` dari CLAIM_BOARD_MOCK + synthetic · `buildStuckClaims()` · `buildMarginGroups()` 8 MDC · `buildDashboardKPIs()` 4 KPI
- `DashboardPage.tsx` (260 ln) — hero slim teal · KPI strip 4 cards stagger (Approval Rate/Klaim Bulan Ini/Avg Hari Pending/Stuck >30h) · left nav 3 tab (TrendingUp/Clock/BarChart2) · right AnimatePresence panel switch · skeleton 500ms
- `ApprovalRatePanel.tsx` (210 ln) — SVG line chart (520×200 viewBox, Y range 62-100%, animated path pathLength 0→1) · period filter 3M/6M/12M · 3 series dots · rejected reasons bar
- `AgingKlaimPanel.tsx` (230 ln) — stacked bar per bucket (4 row) · proportion bar relative to max · stuck claims table 8 rows max + urgency chip
- `MarginAnalysisPanel.tsx` (235 ln) — diverging horizontal bar (center pivot) · 3 summary cards · caveat banner
- Route `src/app/ehis-eklaim/report/page.tsx` (6 ln)
- TSC clean · no indigo · teal/sky/emerald/amber/rose · font ≥ text-sm · 6 file total · no page-level scroll (left nav 52 + right overflow-y-auto)

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
| EK1 — Beranda               | 3      | 3     | 100%   | 2 hari (done · V2 redesign · 9 file · ~1883 ln) |
| EK2 — Klaim Board           | 3      | 0     | 0%     | 3-4 hari        |
| EK3 — Klaim Detail          | 7      | 7     | 100%   | 5-6 hari (EK3.1 ✅ Banner · EK3.2 ✅ Berkas · EK3.3 ✅ Coding · EK3.4 ✅ Grouper Mode A/B/C · EK3.5 ✅ Submission · EK3.6 ✅ Audit · EK3.7 ✅ Modals) |
| EK4 — iDRG Calculator       | 2      | 0     | 0%     | 2 hari          |
| EK5 — Berkas Generator      | 2      | 0     | 0%     | 2-3 hari        |
| EK6 — Banding               | 3      | 0     | 0%     | 2 hari          |
| EK7 — Reconciliation        | 4      | 3     | 75%    | 3 hari (EK7.1 ✅ ImportTransferModal · EK7.2 ✅ MatchingPanel · EK7.3 ✅ SelisihWriteOffModal · EK7.4 pending) |
| EK8 — Dashboard Analytics   | 6      | 3     | 50%    | EK8.1 ✅ Approval Rate · EK8.2 ✅ Aging · EK8.3 ✅ Margin iDRG · EK8.4/5/6 pending |
| EK9 — UX Polish + Cross     | 5      | 0     | 0%     | 1-2 hari        |
| **Total**                   | **39** | **17** | **44%** | **~3.5-4.5 minggu** |

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
