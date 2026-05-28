# EHIS Dashboard — Phase Roadmap

> **Source of truth untuk modul `/ehis-dashboard` (Dashboard Operasional Eksekutif & Manajemen).**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
>
> **Workflow docs:**
> - [CLAUDE.md](CLAUDE.md) — current state + module map
> - [TODO.md](TODO.md) — Master phase roadmap (Phase 0–3 ✅)
> - [TODO-BILLING.md](TODO-BILLING.md) — Billing Kasir roadmap (saudara modul, accent amber)
> - [TODO-EKLAIM.md](TODO-EKLAIM.md) — E-Klaim BPJS/Asuransi roadmap (saudara modul, accent teal)
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend roadmap (Dashboard depend B0 + audit log + WebSocket)
> - [.claude/STANDARDS.md](.claude/STANDARDS.md) — clinical & operational standards
>
> **Last updated:** 2026-05-28
> **Status:** 📋 **Planning** — scope confirmed (Dashboard Operasional saja, bukan bundle). File structure + data contracts disusun di DB0, implementasi UI fase DB1–DB7.
> **Target effort:** ~2.5–3 hari (frontend full) · paralel dengan B0 backend foundation.
> **Accent module:** `slate` (neutral aggregator) + multi-tone per card sesuai modul sumbernya (rose=IGD · teal=RI · sky=RJ · emerald=Farmasi · amber=Billing · sky-teal=E-Klaim · violet=Master).

---

## 📌 Konteks: Kenapa Dashboard Operasional?

**Dashboard = aggregator semua modul** — bukan modul yang mutate data, tapi window read-only ke seluruh aktivitas RS untuk konsumsi direksi/manajer/admin. Setiap workflow yang sudah `Selesai` di modul klinis/operasional kontribusi ke metrik Dashboard.

### Persona Target (default: Direksi + Manajer Operasional)
| Persona | Kebutuhan Inti | Komponen Relevan |
|---|---|---|
| **Direksi** | Visibility tinggi-level (BOR, ALOS, revenue, INM compliance) | KPI Strip · BOR Panel · Indikator Mutu Mini · Recent Activity (read-only) |
| **Manajer Operasional** | Bottleneck antar unit, antrian, klaim pending | Antrian Realtime · BOR Panel · Recent Activity (audit) |
| **Admin Sistem** | Status integrasi, alert kritis | Status Sistem · Quick-Nav (jump to modules) |

### Status Sumber Data Hari Ini (frontend yang sudah siap)
| Source | File | Siap di-consume? |
|---|---|---|
| Pasien master + recent | [data.ts:64,853](src/lib/data.ts) `recentPatients` + `patientMasterData` | ✅ |
| IGD board + ruangan | [data.ts:84,612](src/lib/data.ts) `igdPatients` + `igdRuangan` | ✅ |
| RI board + ruangan | [data.ts:1285,1395](src/lib/data.ts) `rawatInapPatients` + `rawatInapRuangan` | ✅ |
| RJ board | [data.ts:2150](src/lib/data.ts) `rjPatients` | ✅ |
| Orders Lab/Rad/Farmasi | `ORDERS_MOCK` di [data.ts](src/lib/data.ts) | ✅ single source |
| Workflow store (status farmasi/lab/rad) | `workflowStore` client-side | ✅ (client read) |
| Billing tagihan | [tagihanBoardMock.ts](src/lib/billing/tagihanBoardMock.ts) `TAGIHAN_BOARD_MOCK` (25 invoice) | ✅ |
| Kasir shift + payments | [kasirShiftMock.ts](src/lib/billing/kasirShiftMock.ts) + [shiftPaymentsMock.ts](src/lib/billing/shiftPaymentsMock.ts) | ✅ |
| E-Klaim board | [claimsMock.ts](src/lib/eklaim/claimsMock.ts) `CLAIM_BOARD_MOCK` (25 klaim) | ✅ |
| Banding | [bandingMock.ts](src/lib/eklaim/bandingMock.ts) `BANDING_MOCK` (8 entries) | ✅ |
| Reconciliation | [reconciliationMock.ts](src/lib/eklaim/reconciliationMock.ts) `RECONCILIATION_MOCK` | ✅ |
| Penjamin + tarif | [penjaminMock.ts](src/lib/master/penjaminMock.ts) + [tarifMock.ts](src/lib/master/tarifMock.ts) | ✅ |
| Bundle HAI + isolasi | [operasionalKlinisMock.ts](src/lib/master/operasionalKlinisMock.ts) | ✅ (untuk INM PPI) |
| Profil RS (jam shift, KOP) | [rsProfilStore.ts](src/lib/master/rsProfilStore.ts) `RS_PROFIL_INITIAL` | ✅ |

**❌ Belum ada (gap untuk Dashboard):**
- Audit trail lintas modul (recent activity feed konsolidasi) — sebagian ada per modul (`AUDIT_EVENTS_MOCK` billing, `ClaimTimelineEntry` eklaim), tapi belum cross-modul.
- INM 13 indikator (PMK 30/2022) — angka mock akan dibuat di DB0.2.
- Bed status operasional realtime (Tersedia/Terisi) — saat ini di workflow store, perlu derive.

### Prinsip Arsitektur
1. **Read-only aggregator** — Dashboard tidak mutate state. Pure derive dari mock sumber yang ada.
2. **Mock-first → swap pattern** — helpers di `lib/dashboard/dashboardShared.ts` consume mock array; saat backend ready, ganti `import { X_MOCK } from "..."` → `await fetch('/api/dashboard/stats')`. Zero refactor UI.
3. **Compute on-render (no cache)** — semua KPI di-compute saat render (`useMemo`); backend ready akan pindah ke API endpoint dengan cache + WebSocket push.
4. **Pattern reference:** [BerandaMasterPage.tsx](src/components/master/beranda/BerandaMasterPage.tsx) (orchestrator + 5 panel) + Beranda Billing (KPI Strip + Quick Nav + 3 panel) + [BerandaEklaimPage](src/components/eklaim/beranda/BerandaEklaimPage.tsx) V2 (single-viewport interactive).
5. **No long-scroll** — fit dalam viewport 1080p (target ~900px konten tinggi tanpa scroll). Per-panel internal scroll jika overflow.
6. **Density tokens `m-*`** wajib untuk panel BOR (banyak baris ruangan) + Recent Activity (banyak entri).
7. **Accent: `slate` neutral base** + multi-tone semantic per card (rose IGD · teal RI · sky RJ · emerald Farmasi · amber Billing · sky-teal E-Klaim · violet Master). **No indigo · No purple primary.**
8. **Skeleton 500ms** via `useSkeletonDelay` + AnimatePresence fade.
9. **Refresh strategy:** static mock untuk Phase 1; polling 30s atau WebSocket di Phase backend (DB-future).
10. **Print-friendly** untuk laporan harian briefing — `@media print` stylesheet di DB7.
11. **Compliance audit-ready** — BOR/ALOS/BTO/TOI formula tepat (PMK 1171/2011), INM perhitungan sesuai PMK 30/2022.

---

## 🏛 Compliance & Standar Wajib

| Regulasi | Topik | Dampak ke Dashboard |
|---|---|---|
| **PMK 1171/2011** | SIRS — BOR/ALOS/BTO/TOI/NDR/GDR formula | BOR Panel wajib pakai formula resmi (tidak dibuat-buat) |
| **PMK 30/2022** | Indikator Nasional Mutu (INM) — 13 indikator | Indikator Mutu Mini preview 4 critical · full list di /ehis-report |
| **PMK 4/2018** | Kewajiban RS — transparansi antrian | Antrian Panel publik-readable, jumlah pasien menunggu visible |
| **Kepmenkes 1559/2022** | Wajib bridging SatuSehat | Status Sistem strip — indikator bridging FHIR active/not |
| **UU PDP 27/2022** | Data Pribadi | Dashboard tidak expose data identitas detail (cukup count + aggregate) |
| **PMK 11/2017** | Keselamatan Pasien — IKP | INM "Kepatuhan identifikasi pasien" + "Insiden keselamatan" preview |
| **PMK 27/2017** | PPI — HAI surveillance | BOR Panel highlight ruangan dengan bundle HAI compliance |
| **SNARS PP** | Pelayanan Pasien | ALOS per kelas + bed turnover |

---

## 📐 Formula Compliance (Implementasi di `dashboardShared.ts`)

### Indikator Bed Management (PMK 1171/2011)

```
BOR  = (jumlah hari rawat / (tempat tidur × hari periode)) × 100%
       target: 60–85%
ALOS = total lama rawat pasien keluar / jumlah pasien keluar
       target: 6–9 hari
BTO  = jumlah pasien keluar / jumlah tempat tidur
       target: 40–50 kali/tahun
TOI  = ((tempat tidur × hari periode) − hari rawat) / jumlah pasien keluar
       target: 1–3 hari
NDR  = (jumlah pasien meninggal ≥48 jam / jumlah pasien keluar) × 1000‰
       target: ≤25 ‰
GDR  = (jumlah seluruh pasien meninggal / jumlah pasien keluar) × 1000‰
       target: ≤45 ‰
```

### Indikator Nasional Mutu Preview (PMK 30/2022 — 13 indikator, Dashboard preview 4 critical)

1. **Kepatuhan identifikasi pasien** (target 100%) — IGD/RI/RJ
2. **Waktu tanggap operator IGD ≤5 menit** (target 100%)
3. **Waktu tunggu rawat jalan ≤60 menit** (target ≥80%)
4. **Kepuasan pasien** (target ≥76,61%)

Sisa 9 indikator (kepatuhan jam visite DPJP · waktu lapor hasil kritis · kepatuhan penggunaan formularium nasional · pelaporan IKP · kepatuhan PPI · cuci tangan · kejadian jatuh · kepatuhan upaya pencegahan risiko cedera · waktu tunggu Rad/Lab) → full di **`/ehis-report` later**.

---

## 🏗 Architecture Decisions (jangan diubah tanpa diskusi)

1. **Modul read-only** — Dashboard tidak punya CRUD, hanya derive dari mock/API. Tidak ada local state mutation.
2. **Aggregator helpers di `lib/dashboard/`** — semua compute KPI/BOR/INM pure functions, testable, framework-agnostic.
3. **Date range default "Hari Ini"** — tidak ada switcher di Phase 1 (cukup 1 perspective). Switcher (Kemarin/7h/30h/Bulan) ditunda ke DB6 deferred.
4. **Multi-unit context tunggal** — 1 dashboard semua unit (no per-unit filter di Phase 1). Filter per unit ditunda ke DB6 deferred.
5. **Refresh strategy:** static mock di Phase 1. Polling 30s/WebSocket integration di Phase backend.
6. **Density: Spacious default** — direksi-friendly (label besar, whitespace ample). Compact toggle ditunda ke DB7 polish.
7. **No real-time charts library** (recharts/chart.js) untuk Phase 1 — SVG inline pattern (mirip `BerandaEklaim V2` sparkline) cukup. Library eksternal di Phase 2 jika butuh.
8. **Reuse `MappingSourceBadge` pattern** — saat KPI klik → deep-link ke modul detail (bukan modal drill-down).
9. **Status Sistem Strip di bottom** — indikator bridging V-Claim/iDRG/SatuSehat (mock "Online" untuk Phase 1).
10. **Persona-mode** ditunda — saat ini all-in-one dashboard. Role-based hiding (Direksi only / Manajer only) di Phase backend (RBAC integration).

---

## 📂 File Structure (rencana)

```
src/lib/dashboard/
├── dashboardShared.ts            # types (KPIItem, BORItem, AntrianItem, INMItem, ActivityItem)
│                                 # + aggregator helpers (getKPIs, getBOR, getAntrian, getINM, getRecent, getQuickNav)
│                                 # + formula compliance (calcBOR, calcALOS, calcBTO, calcTOI)
│                                 # + tone palette per modul (CARD_TONE map)
└── inmMock.ts                    # INM 13 indikator mock (PMK 30/2022)
                                  # untuk Phase 1 preview 4 critical · Phase later (report) full 13

src/app/ehis-dashboard/
├── page.tsx                       # route entry (Suspense + import)
└── layout.tsx                     # ModuleLayout sudah ada

src/components/dashboard/
├── DashboardPage.tsx              # orchestrator (~140L) — skeleton + AnimatePresence + grid
├── DashboardHero.tsx              # header strip (~70L) — eyebrow + h1 + timestamp + status sistem pill
├── DashboardKPIStrip.tsx          # 5 KPI cards (~130L) — stagger animation
├── panels/
│   ├── BORPanel.tsx               # BOR per ruangan + ALOS/BTO/TOI mini (~220L)
│   ├── AntrianPanel.tsx           # Live queue per unit IGD/RI/RJ + Lab/Rad/Farmasi (~180L)
│   ├── IndikatorMutuPanel.tsx     # INM 4 critical preview (~150L)
│   └── RecentActivityPanel.tsx    # Timeline lintas modul (~170L)
└── QuickNavGrid.tsx               # 9 modul card grid (~120L)
```

**File limit ≤800 lines** — split ke sub-components jika lebih (pola sama dengan billing/eklaim/master).

---

## Phase DB0 — Foundation & Data Contracts

**Effort:** 1 hari · **ROI:** semua phase berikut bisa paralel, schema stabil

### DB0.1 Types di [src/lib/dashboard/dashboardShared.ts](src/lib/dashboard/dashboardShared.ts)

- [ ] **`DashboardKPI`** — KPI strip item:
  ```ts
  {
    key: "pasien-hari-ini" | "bor-live" | "antrian-penunjang" | "klaim-pending" | "revenue-hari-ini",
    label, value: number | string, sub?: string,
    tone: ModulTone,  // "rose"|"teal"|"sky"|"emerald"|"amber"|"sky-teal"|"violet"|"slate"
    trend?: { dir: "up" | "down" | "flat", deltaLabel: string },
    icon: LucideIconName,
    href?: string,  // deep-link saat klik
  }
  ```

- [ ] **`BORItem`** — bed occupancy per ruangan:
  ```ts
  {
    ruanganId, namaRuangan, kelas: KelasRawat,
    totalBed: number, terisi: number, kosong: number, dirawat: number,
    occupancyPct: number,  // (terisi / totalBed) * 100
    status: "Aman" | "Hampir Penuh" | "Overcapacity",  // green/amber/rose
  }
  ```

- [ ] **`BedStats`** — strip ALOS/BTO/TOI/NDR/GDR:
  ```ts
  { alos: number, bto: number, toi: number, ndr: number, gdr: number, periode: string }
  ```

- [ ] **`AntrianItem`** — per unit/loket:
  ```ts
  {
    unitKey: "igd" | "ri" | "rj" | "lab" | "rad" | "farmasi",
    label: string, menunggu: number, dilayani: number, selesai: number,
    avgWaitMin?: number,  // estimasi
    tone: ModulTone,
  }
  ```

- [ ] **`INMItem`** — Indikator Nasional Mutu:
  ```ts
  {
    kode: string,  // "INM-01" s/d "INM-13"
    nama: string, kategori: "Keselamatan" | "Kualitas" | "Pengalaman",
    nilai: number,  // %
    target: number,
    status: "Tercapai" | "Hampir" | "Belum",  // emerald/amber/rose
    periodeISO: string,
  }
  ```

- [ ] **`ActivityItem`** — feed lintas modul:
  ```ts
  {
    id, modul: "IGD" | "RI" | "RJ" | "Lab" | "Rad" | "Farmasi" | "Billing" | "E-Klaim" | "Master",
    aksi: string,  // "pasien masuk" / "hasil rilis" / "klaim disubmit" / "obat dispensed"
    deskripsi: string,
    waktuISO: string, agoSec: number,
    actor?: string,  // nama user (mock)
    href?: string,  // deep-link ke detail
    severity?: "info" | "success" | "warning" | "critical",
  }
  ```

- [ ] **`QuickNavCard`** — card link ke modul:
  ```ts
  {
    href: string, label: string, sublabel: string, count?: number,
    icon: LucideIconName, tone: ModulTone,
  }
  ```

- [ ] **`StatusSistemItem`** — bridging status:
  ```ts
  {
    nama: "V-Claim" | "iDRG Grouper" | "SatuSehat FHIR" | "Database",
    status: "Online" | "Degraded" | "Offline",
    lastSyncISO?: string,
  }
  ```

### DB0.2 Helpers + Mock seed

- [ ] **`calcBOR(items: BORItem[]): number`** — weighted average per total bed.
- [ ] **`calcALOS(rawatInapKeluar: Patient[]): number`** — pure formula PMK 1171/2011.
- [ ] **`calcBTO(rawatInapKeluar: Patient[], totalBed): number`**.
- [ ] **`calcTOI(rawatInapKeluar, totalBed, hariPeriode): number`**.
- [ ] **`calcNDR(meninggal48h, totalKeluar): number`** — per mille (‰).
- [ ] **`calcGDR(totalMeninggal, totalKeluar): number`** — per mille (‰).
- [ ] **`getKPIs(): DashboardKPI[]`** — aggregator dari `igdPatients` + `rawatInapPatients` + `rjPatients` + `ORDERS_MOCK` + `TAGIHAN_BOARD_MOCK` + `CLAIM_BOARD_MOCK` + `SHIFT_PAYMENTS_MOCK`.
- [ ] **`getBORPerRuangan(): BORItem[]`** — derive dari `rawatInapRuangan` + count `rawatInapPatients` per ruangan.
- [ ] **`getBedStats(): BedStats`** — agregat 5 indikator PMK 1171.
- [ ] **`getAntrianPerUnit(): AntrianItem[]`** — derive dari 6 unit (count pasien `Menunggu`/`Dalam Perawatan`/`Selesai`).
- [ ] **`getINMPreview(): INMItem[]`** — return 4 critical dari `INM_MOCK`.
- [ ] **`getRecentActivity(limit: number = 12): ActivityItem[]`** — konsolidasi dari `AUDIT_EVENTS_MOCK` (billing) + `ClaimTimelineEntry` (eklaim) + mock additional IGD/RI/RJ events, sort by `agoSec` asc.
- [ ] **`getQuickNavCards(): QuickNavCard[]`** — 9 card: IGD · RI · RJ · Lab · Rad · Farmasi · Billing · E-Klaim · Master.
- [ ] **`getStatusSistem(): StatusSistemItem[]`** — 4 mock (V-Claim Online · iDRG Online · SatuSehat Degraded · Database Online).
- [ ] **`CARD_TONE: Record<ModulTone, AccentClasses>`** — static palette map purge-safe (mirip `masterAccent.ts`).

- [ ] **`INM_MOCK` di `inmMock.ts`** — 13 indikator PMK 30/2022 dengan nilai mock realistis (mix Tercapai/Hampir/Belum):
  - INM-01 Kepatuhan identifikasi pasien (target 100%) — mock 98%
  - INM-02 Waktu tanggap operator IGD ≤5 mnt (target 100%) — mock 92%
  - INM-03 Waktu tunggu RJ ≤60 mnt (target ≥80%) — mock 78%
  - INM-04 Kepuasan pasien (target ≥76.61%) — mock 81%
  - INM-05 Kepatuhan jam visite DPJP (target ≥80%) — mock 75%
  - INM-06 Waktu lapor hasil kritis Lab ≤30 mnt (target 100%) — mock 94%
  - INM-07 Kepatuhan formularium nasional (target ≥80%) — mock 88%
  - INM-08 Kepatuhan kebersihan tangan (target ≥85%) — mock 82%
  - INM-09 Kepatuhan upaya pencegahan risiko jatuh (target 100%) — mock 96%
  - INM-10 Pelaporan IKP (target 100%) — mock 87%
  - INM-11 Kepatuhan PPI (target ≥85%) — mock 90%
  - INM-12 Waktu tunggu rawat jalan radiologi ≤3 jam (target ≥80%) — mock 73%
  - INM-13 Kecepatan respon komplain (target ≥80%) — mock 85%

**Acceptance DB0:** ✅ Semua types compile clean (`npx tsc --noEmit`). Mock siap di-consume. Formula BOR/ALOS/BTO/TOI return value benar (test fixture sederhana di in-file comment). Helper `getKPIs()` return 5 item dengan trend computed.

---

## Phase DB1 — Hero Header + KPI Strip

**Route:** `/ehis-dashboard` · **Effort:** 4 jam · **Pattern reference:** Beranda Billing KPI + Beranda Eklaim Hero

### DB1.1 Hero Header

- [ ] **`DashboardHero.tsx`** (~70L):
  - Eyebrow chip "EHIS Dashboard · Operasional" (slate icon `LayoutDashboard` + uppercase tracking-widest)
  - H1 "Pusat Operasional Rumah Sakit"
  - Description "Pantauan KPI · BOR · antrian · klaim · pendapatan harian"
  - Timestamp pill mono `HH:mm WIB · 28 Mei 2026` di kanan (live update setiap menit via `useState + setInterval`)
  - Status Sistem strip di bawah hero (4 dot status: V-Claim · iDRG · SatuSehat · DB) dengan `LastSync ago` mono. Hover → tooltip detail.
  - Hidden timestamp pill di mobile (`hidden sm:inline`)

### DB1.2 KPI Strip 5 Cards

- [ ] **`DashboardKPIStrip.tsx`** (~130L):
  - 5 hero card dengan tone per modul:
    1. **Pasien Hari Ini** (slate · count gabungan IGD/RI/RJ + trend chip vs kemarin) — icon `Users`
    2. **BOR Live** (teal · % + meter bar animated + status chip Aman/Hampir Penuh/Overcapacity) — icon `Bed`
    3. **Antrian Penunjang** (amber · count gabungan Lab/Rad/Farmasi menunggu + sub-line breakdown) — icon `Hourglass`
    4. **Klaim Pending Verifikasi** (sky · count BPJS + nominal menunggu format short) — icon `ShieldCheck`
    5. **Pendapatan Hari Ini** (emerald · total Rp format short + count transaksi + trend % vs avg minggu) — icon `Wallet`
  - Setiap card: accent bar gradient kiri 4px + icon ring 9×9 + value besar (22px bold tone-text mono tabular-nums) + sub-label (10.5px slate-500 uppercase) + trend chip (TrendingUp/Down/Flat)
  - Hover translate-y-[-2px] + shadow-md + ring-1 tone darker
  - Klik card → router.push(href) ke modul detail
  - Stagger animation 50ms/idx (mirip Beranda Billing KPI Strip)
  - Skeleton 500ms via `useSkeletonDelay`

**Acceptance DB1:** ✅ Hero header tampil dengan timestamp live + status sistem 4-dot · KPI strip 5 card animated stagger · semua angka derive dari `dashboardShared.ts` aggregator · click card navigate ke modul detail · responsive 2/3/5 cols breakpoint · TSC clean.

---

## Phase DB2 — BOR Panel (Bed Occupancy per Ruangan)

**Effort:** 6 jam · **Pattern reference:** Mapping Coverage Panel di Beranda Master + indikator visual semantik

### DB2.1 Panel Layout

- [ ] **`BORPanel.tsx`** (~220L):
  - Header card: icon `Bed` teal + label "Bed Occupancy Rate" + summary chip "Live · {tanggal}"
  - **BedStats Strip** (5 mini-stat di bawah header):
    - ALOS · BTO · TOI · NDR ‰ · GDR ‰ — masing-masing dengan label uppercase + value mono + indicator vs target (emerald jika OK, amber jika borderline, rose jika out-of-range)
  - **Body BOR per Ruangan** (sortable list):
    - Per row: nama ruangan + kelas chip + bar progress horizontal animated (width 0→%) + count `terisi/totalBed` mono + occupancyPct besar
    - Color semantik bar: emerald <60% · amber 60–85% · rose >85% (PMK 1171/2011 target)
    - Sort default: occupancyPct desc (ruangan paling penuh di atas)
    - Footer summary: Avg BOR Global + count ruangan overcapacity
  - **Hover row**: highlight + tooltip detail (jumlah pasien aktif, list bed kosong)
  - **Klik row**: deep-link ke `/ehis-care/rawat-inap?ruangan={id}` (filter board ke ruangan tsb)
  - Density `m-*` toggle di header (saat banyak ruangan)

### DB2.2 Formula Compliance Visual

- [ ] **Tooltip per BedStats card**: tampilkan formula PMK 1171/2011 dengan citation ("BOR = (hari rawat / (bed × hari)) × 100% · PMK 1171/2011")
- [ ] **Status chip per ruangan**: "Aman" (emerald · <60%) · "Hampir Penuh" (amber · 60–85%) · "Overcapacity" (rose · >85%)
- [ ] **Visual highlight overcapacity**: rose-50/40 bg + ring-1 rose-200 pada row dengan occupancyPct >85%

**Acceptance DB2:** ✅ Panel BOR tampil dengan strip 5 indikator + list ruangan sort-by-occupancy · bar animated 400ms ease-out · color semantik PMK 1171/2011 · tooltip formula citation · klik row → deep-link ke RI board · TSC clean.

---

## Phase DB3 — Antrian Realtime Panel

**Effort:** 4 jam · **Pattern reference:** PipelinePanel di Beranda Eklaim V2

### DB3.1 Panel Antrian

- [ ] **`AntrianPanel.tsx`** (~180L):
  - Header card: icon `Hourglass` amber + label "Antrian Realtime" + count total menunggu
  - **Grid 6 unit** (3-col sm · 6-col xl): IGD (rose) · RI Admisi (teal) · RJ (sky) · Lab (amber) · Rad (pink) · Farmasi (emerald)
  - Per unit card:
    - Icon modul + label + tone accent bar kiri
    - 3 angka stacked: **Menunggu** (besar bold) · **Sedang Dilayani** (medium) · **Selesai** (kecil muted)
    - Mini bar 3-segment proportional (waiting/serving/done) dengan color per state
    - Avg wait time mini-chip "~{N} mnt" jika tersedia
    - Hover translate + shadow + tone darker ring
    - Klik → router.push ke worklist modul (e.g. IGD → `/ehis-care/igd`)
  - **Bottleneck indicator footer**: top 1 unit dengan waiting tertinggi dengan badge "Perhatian" amber + delta vs avg.

### DB3.2 Data Derivation

- [ ] Helper `getAntrianPerUnit()` derive dari:
  - IGD: `igdPatients.filter(p => p.status === "Menunggu" || "Triase")`
  - RI: `rawatInapPatients.filter(p => p.statusKamar === "Belum Masuk")`
  - RJ: `rjPatients.filter(p => p.status === "Menunggu")`
  - Lab: `ORDERS_MOCK.filter(o => o.tipe === "Lab" && o.status === "Diterima")`
  - Rad: `ORDERS_MOCK.filter(o => o.tipe === "Rad" && o.status === "Diterima")`
  - Farmasi: `ORDERS_MOCK.filter(o => o.tipe === "Resep" && o.status === "Diterima")` + cross-check `workflowStore`

**Acceptance DB3:** ✅ Antrian panel 6 unit grid · count derive dari mock real · bottleneck indicator amber · klik unit → navigate ke worklist · responsive grid · TSC clean.

---

## Phase DB4 — Recent Activity Feed

**Effort:** 6 jam · **Pattern reference:** Recent Edits Panel di Beranda Master + ActivityTabPanel di Beranda Eklaim

### DB4.1 Activity Feed Panel

- [ ] **`RecentActivityPanel.tsx`** (~170L):
  - Header card: icon `Activity` slate + label "Aktivitas Terbaru Lintas Modul" + filter chip count
  - **Filter chip strip** (multi-select): Semua / IGD / RI / RJ / Penunjang / Billing / E-Klaim / Master — count per kategori
  - **Body timeline vertical**:
    - Rail vertical absolute span 100% (slate-200) di kiri
    - Per entri: dot timeline (per modul tone) + Lucide icon + body
    - Body: action chip + deskripsi (truncate 2 baris) + meta-line (actor + `agoSec` relative fmt)
    - Severity tone: success emerald · info slate · warning amber · critical rose ring
    - Klik entri → deep-link `href` ke modul detail
    - Sort by `agoSec` asc, limit 12 default
  - Empty state filter combination: `Inbox` icon + copy "Tidak ada aktivitas pada filter ini" + reset CTA
  - Footer: "Lihat audit trail lengkap →" (placeholder · audit modul akan dibangun nanti)

### DB4.2 Activity Aggregation

- [ ] Helper `getRecentActivity(limit)` konsolidasi dari:
  - **Billing**: `AUDIT_EVENTS_MOCK` (per invoice) → flatten → map ke ActivityItem
  - **E-Klaim**: `CLAIM_BOARD_MOCK[].timeline` → flatten 10 event type → map (status-transition · submitted-batch · banding-submitted · payment-received)
  - **IGD/RI/RJ**: mock additional event (saat ini belum ada audit trail formal; generate dari changes pada array — pasien masuk, pulang, status berubah) → mock helper `generateClinicalActivity()` di DB4.2
  - **Master**: re-use `RECENT_EDITS_MOCK` dari [berandaShared.ts](src/components/master/beranda/berandaShared.ts) jika applicable
- [ ] Sort merged array by waktuISO desc · slice limit · compute `agoSec` relative ke `Date.now()`

**Acceptance DB4:** ✅ Activity feed tampil 12 entri terbaru lintas modul · filter chip multi-select · timeline vertical rail dengan dot per modul tone · click entri → deep-link · empty state friendly · TSC clean.

---

## Phase DB5 — Indikator Mutu Mini (INM Preview)

**Effort:** 4 jam · **Pattern reference:** KPI Strip Beranda Eklaim mini KPIs 2×2

### DB5.1 INM Preview Panel

- [ ] **`IndikatorMutuPanel.tsx`** (~150L):
  - Header card: icon `BadgeCheck` violet + label "Indikator Nasional Mutu" + chip "PMK 30/2022 · 4 dari 13"
  - **Grid 2×2** (4 indikator critical):
    1. **Kepatuhan Identifikasi Pasien** (target 100%) — emerald saat tercapai
    2. **Waktu Tanggap IGD ≤5 mnt** (target 100%)
    3. **Waktu Tunggu RJ ≤60 mnt** (target ≥80%)
    4. **Kepuasan Pasien** (target ≥76.61%)
  - Per card:
    - Nama indikator + kode mono INM-XX
    - Value besar (mono tabular-nums 20px) + `%`
    - Bar progress animated (width 0→nilai) dengan target marker line
    - Status chip: Tercapai (emerald · `CheckCircle2`) · Hampir (amber · `AlertTriangle`) · Belum (rose · `XCircle`)
    - Target chip subtle "Target: {N}%"
  - Footer CTA: "Lihat 13 INM lengkap di Reports →" (deep-link ke `/ehis-report` — placeholder, build di module Reports later)

**Acceptance DB5:** ✅ Panel INM tampil 4 indikator critical · bar animated + target marker · status chip 3-tone · CTA ke Reports · TSC clean.

---

## Phase DB6 — Quick-Nav Grid

**Effort:** 3 jam · **Pattern reference:** Quick-Nav Grid Beranda Master (9 kelompok · 24 nav card)

### DB6.1 Quick-Nav 9 Modul

- [ ] **`QuickNavGrid.tsx`** (~120L):
  - Header card: icon `LayoutGrid` slate + label "Akses Modul Cepat" + sub "Klik untuk jump ke worklist"
  - **Grid 3-col md · 9 card** (1 card per modul):
    1. **IGD** (rose · `Heart`) — count pasien aktif + sub "{N} P1/P2 · {N} boarding"
    2. **Rawat Inap** (teal · `BedDouble`) — count pasien rawat + sub "{N} ruangan aktif"
    3. **Rawat Jalan** (sky · `Stethoscope`) — count antrian + sub "{N} poli buka"
    4. **Laboratorium** (amber · `Microscope`) — count order aktif + sub "{N} hasil pending verif"
    5. **Radiologi** (pink · `ScanLine`) — count order aktif + sub "{N} hasil pending dosis"
    6. **Farmasi** (emerald · `Pill`) — count resep aktif + sub "{N} HAM · {N} telaah"
    7. **Billing Kasir** (amber · `Receipt`) — count tagihan + sub "{N} draft · Rp {nominal} outstanding"
    8. **E-Klaim** (sky-teal · `ShieldCheck`) — count klaim + sub "{N} pending · {N} belum submit"
    9. **Master Data** (violet · `Database`) — sub "25 master + 8 mapping"
  - Per card:
    - Icon ring 10×10 tone + label bold + count badge mono (besar)
    - Sub-label muted slate-500 (10.5px)
    - ChevronRight muted · translate-x hover
    - Hover border tone + shadow-md
  - Klik → router.push ke route modul (`/ehis-care/igd`, `/ehis-billing`, dst)
  - Responsive: 1/2/3 cols breakpoint sm/md/lg

**Acceptance DB6:** ✅ Quick-nav grid 9 card · count derive dari aggregator + cross-modul mock · hover micro-animation · click navigate · responsive · TSC clean.

---

## Phase DB7 — Polish + Page Orchestrator

**Effort:** 4 jam

### DB7.1 Orchestrator + Layout

- [ ] **`DashboardPage.tsx`** (~140L):
  - `useSkeletonDelay(500)` + AnimatePresence fade
  - Layout:
    ```
    <DashboardHero />
    <DashboardKPIStrip />
    <div className="grid lg:grid-cols-12 gap-4">
      <section className="lg:col-span-8 space-y-4">
        <BORPanel />
        <AntrianPanel />
        <IndikatorMutuPanel />
      </section>
      <section className="lg:col-span-4">
        <RecentActivityPanel />
      </section>
    </div>
    <QuickNavGrid />
    ```
  - No long-scroll target: fit dalam viewport 1080p (~900px content height tanpa scroll, internal scroll per panel)
  - Responsive mobile-first: stack vertical pada `<lg`

### DB7.2 Polish Items

- [ ] **Print stylesheet** — `@media print`: hide nav/sidebar, show only Dashboard content, A4 portrait. CTA "Cetak Briefing Harian" di hero.
- [ ] **Refresh button manual** di hero — trigger re-render aggregator (placeholder · realtime di backend Phase later)
- [ ] **Loading state per panel** — skeleton individual jika data lambat (stagger 100ms)
- [ ] **Empty states friendly** untuk skenario 0-data (no patients · no claims · no transactions) — copy informatif + ilustrasi sederhana
- [ ] **Accessibility** — semua interactive element `aria-label`, focus-visible ring slate, keyboard nav (Enter/Space activate)
- [ ] **Font sizing** — label uppercase 10.5px tracking-wider · value mono tabular-nums 12.5px (default) sampai 22px (KPI value)

### DB7.3 Update Workflow Docs

- [ ] **Update [CLAUDE.md](CLAUDE.md)** — entry `/ehis-dashboard` dari "🔧 Scaffold" → "✅" dengan detail KPI strip + BOR panel + Antrian + INM + Recent Activity + Quick Nav.
- [ ] **Update navigation** — pastikan `/ehis-dashboard` di sidebar dengan icon `LayoutDashboard` (atau `Activity`).
- [ ] **Catat tech debt** ke [TECH_DEBT.md](TECH_DEBT.md): refresh strategy (WebSocket vs polling) · real audit trail cross-modul · INM full 13 di Reports · Persona-mode role-based hiding (depends RBAC backend) · per-unit filter · date range switcher · trend chart 7/30 hari · alert strip kritis (BOR overcapacity, stok obat habis, klaim akan expired).

**Acceptance DB7:** ✅ Orchestrator integrate semua panel · skeleton 500ms · print stylesheet A4 · refresh button manual · empty states · accessibility · CLAUDE.md updated · TECH_DEBT.md tercatat. TypeScript clean across all files.

---

## 🚫 Out of Scope (Phase 1) — Ditunda ke Phase Later

| Feature | Alasan Ditunda | Kandidat Phase |
|---|---|---|
| **Trend Chart 7/30 hari per KPI** | Phase 1 fokus snapshot hari ini. Trend butuh data historical aggregator yang depends backend audit log. | DB-future setelah backend ready |
| **Alert Strip Top** (BOR overcapacity, stok habis, klaim expired) | Butuh threshold config + notification center pattern. Phase 1 cukup status chip semantik di panel. | DB-future + notification module |
| **Bottleneck Heatmap Detail** | Phase 1 cukup top-1 indicator. Heatmap full ditunda. | DB-future |
| **Top Diagnosa ICD-10 Pie Chart** | Butuh aggregator dari `DiagnosaTab` lintas pasien. Belum ada audit trail diagnose. | DB-future setelah backend audit log |
| **DPJP/SMF Workload Bar** | Butuh count pasien per DPJP yang aktif hari ini. Belum critical untuk Phase 1. | DB-future |
| **Forecast BOR Besok / Pasien IGD Jam Berikut** | Butuh time-series + model prediksi. Out of scope frontend mock. | Backend Phase |
| **Compliance Status SIRS-RL Submitted** | Butuh `/ehis-report` ready. | Setelah `/ehis-report` selesai |
| **Floor Plan / Map Visualisasi Ruangan** | Butuh design custom + data koordinat bed. Effort tinggi, ROI rendah Phase 1. | DB-future Phase 3 polish |
| **Notification Center Bell** | Modul terpisah, cross-cutting. | Separate module |
| **Date Range Switcher** (Kemarin/7h/30h/Bulan) | Phase 1 cukup "Hari Ini". Switcher butuh recompute aggregator per range. | DB-future |
| **Per-Unit Filter** | Phase 1 all-units view. Filter butuh state machine. | DB-future |
| **Persona-Mode (Direksi/Manajer/Admin hiding)** | Depends RBAC backend integration. Phase 1 all-in-one. | Backend Phase |
| **Density Toggle Compact/Spacious** | Phase 1 default Spacious. Toggle ditunda. | DB-future polish |
| **Real-time WebSocket** | Phase 1 static mock. | Backend Phase |
| **Export PDF / Excel Briefing Harian** | Phase 1 cukup `@media print`. Library `xlsx`/`react-pdf` di Phase later. | Backend Phase |
| **Customizable Widget Layout (drag-drop)** | Out of scope MVP. | Far future |

---

## 📊 Progress Tracker

| Phase | Tasks | Done | % |
|---|---|---|---|
| DB0 — Foundation | 2 sections (Types + Helpers/Mock) | 0 | 0% |
| DB1 — Hero + KPI | 2 sections | 0 | 0% |
| DB2 — BOR Panel | 2 sections | 0 | 0% |
| DB3 — Antrian Panel | 2 sections | 0 | 0% |
| DB4 — Recent Activity | 2 sections | 0 | 0% |
| DB5 — Indikator Mutu Mini | 1 section | 0 | 0% |
| DB6 — Quick-Nav Grid | 1 section | 0 | 0% |
| DB7 — Polish + Orchestrator | 3 sections | 0 | 0% |
| **Total** | **15 sections** | **0** | **0%** |

---

## 🛠️ Convention & Standards

### File Structure
```
src/lib/dashboard/dashboardShared.ts     # types + aggregator helpers + formula
src/lib/dashboard/inmMock.ts             # INM 13 indikator mock
src/app/ehis-dashboard/page.tsx          # route entry (thin)
src/components/dashboard/
├── DashboardPage.tsx                    # orchestrator
├── DashboardHero.tsx                    # header
├── DashboardKPIStrip.tsx                # 5 KPI
├── QuickNavGrid.tsx                     # 9 modul card
└── panels/
    ├── BORPanel.tsx
    ├── AntrianPanel.tsx
    ├── IndikatorMutuPanel.tsx
    └── RecentActivityPanel.tsx
```

### Design Principles (apply setiap component)
1. **Invoke `frontend-design` skill** sebelum coding UI (memory-persisted preference)
2. **Skeleton 500ms** via `useSkeletonDelay` + Framer Motion AnimatePresence
3. **No long-scroll** — fit dalam 1080p viewport, internal scroll per panel
4. **Form/input dark text** (`text-slate-800`) — Dashboard hampir tidak ada input, tapi label uppercase `text-slate-500 text-[10.5px] tracking-wider`
5. **No indigo · No purple primary** — slate neutral + multi-tone per card
6. **Mono font + tabular-nums** untuk semua angka KPI/BOR/INM
7. **Density tokens `m-*`** untuk panel BOR + Recent Activity (banyak baris)
8. **File limit ≤800 lines** — split ke sub-components jika lebih
9. **Accent per panel:** slate base · rose IGD · teal RI · sky RJ · amber Lab/Billing · pink Rad · emerald Farmasi/Revenue · sky-teal E-Klaim · violet Master/INM
10. **Tooltip formula citation** untuk metrik regulated (BOR/ALOS PMK 1171, INM PMK 30/2022)

### Acceptance per Component
- [ ] Route accessible (`/ehis-dashboard`)
- [ ] Skeleton animasi smooth 500ms
- [ ] Aggregator derive dari mock real (no hardcoded angka)
- [ ] Click element → deep-link berfungsi
- [ ] Responsive mobile-first
- [ ] Empty state friendly
- [ ] TypeScript clean (no errors)
- [ ] File terbesar <800 lines

### Tracking Workflow
Setiap selesai task:
1. Centang `[x]` di TODO-DASHBOARD.md
2. Tambah catatan ringkas + tanggal (mis. `[x] DB1.1 Hero ✅ (2026-05-XX) — eyebrow + h1 + timestamp live + status sistem 4-dot`)
3. Update progress tracker di atas
4. Update [CLAUDE.md](CLAUDE.md) `/ehis-dashboard` status saat phase major selesai
5. Commit dengan format: `dashboard: phase DBX.Y — <singkat>`

---

## 🔗 Roadmap Berikutnya (After DB0–DB7)

### DB-Future (post-MVP)
- [ ] Trend Chart 7/30 hari per KPI (SVG sparkline atau library lightweight)
- [ ] Date Range Switcher (Hari Ini/Kemarin/7h/30h/Bulan)
- [ ] Per-Unit Filter (dropdown filter aggregator per unit)
- [ ] Alert Strip Top (BOR overcapacity · stok habis · klaim akan expired)
- [ ] Density Toggle Compact/Spacious
- [ ] Export PDF Briefing Harian (`@react-pdf/renderer`)
- [ ] Top Diagnosa ICD-10 mini chart (depends audit trail diagnosa)
- [ ] DPJP/SMF Workload bar (depends audit trail DPJP)

### Backend Integration (depends TODOS_BACKEND.md)
- [ ] Real audit trail cross-modul — endpoint `/api/audit/feed?limit=12` untuk Recent Activity
- [ ] WebSocket / SSE untuk realtime KPI refresh
- [ ] Caching layer (Redis) untuk aggregator (compute mahal)
- [ ] RBAC enforcement — Persona-Mode (Direksi/Manajer/Admin) sembunyikan panel non-relevant per role
- [ ] BOR formula validated by backend (atomic with `Bed` operational status table)
- [ ] INM aggregator backend — query lintas tabel audit + compute compliance per indicator
- [ ] Forecast model (BOR besok, pasien IGD jam berikut) — ML/statistical service

### Compliance & Integrasi
- [ ] SIRS-RL submission status indicator (depends `/ehis-report`)
- [ ] SatuSehat FHIR bridging health check (depends `/ehis-fhir`)
- [ ] Indikator Mutu full 13 detail di `/ehis-report` (Dashboard preview hanya 4 critical)

### Operasional Dashboard Layer
- [ ] Customizable Widget Layout (drag-drop) — opsional far future
- [ ] Multi-tenant view (untuk RS Group dengan beberapa cabang) — opsional
- [ ] Snapshot/Bookmark dashboard state (export config JSON) — opsional
- [ ] Dashboard scheduling (auto-email briefing harian 06:00 ke direksi) — opsional

---

## 📚 Catatan Implementasi

- **Pattern reference utama:** [BerandaMasterPage.tsx](src/components/master/beranda/BerandaMasterPage.tsx) untuk 2-panel layout · Beranda Billing untuk KPI + Quick Nav · [BerandaEklaimPage.tsx](src/components/eklaim/beranda/BerandaEklaimPage.tsx) V2 untuk interactive single-viewport.
- **Tone palette purge-safe:** static map `CARD_TONE` (mirip `masterAccent.ts` `EMPTY_GRADIENT`/`SEARCH_FOCUS_WITHIN`) untuk Tailwind tidak strip class dynamic.
- **Aggregator deterministic:** semua helper pure function (no side effect), test-able dengan fixture sederhana. `getKPIs()` return same value untuk same input.
- **Real-time future-proof:** schema sudah siap untuk WebSocket push — saat backend ready, swap `useMemo(() => getKPIs(), [])` → `useSWR('/api/dashboard/kpi', { refreshInterval: 30000 })`.
- **Cross-modul deep-link konsisten:** semua klik card/row navigate dengan `router.push` (Next App Router) ke route modul detail · breadcrumb dari Dashboard.
- **Print-friendly:** `@media print` hide nav/sidebar, A4 portrait. Useful untuk briefing harian direksi pagi.
