@AGENTS.md
@.claude/skills/frontend-design/SKILL.md

---

## Project: EHIS (Electronic Hospital Information System)

### Tech Stack
- **Framework**: Next.js App Router (read `node_modules/next/dist/docs/` before writing Next.js code)
- **Language**: TypeScript, `"use client"` for all interactive components
- **Styling**: Tailwind v4 — uses `shadow-xs`, `bg-linear-to-br`, `ring-1`, `rounded-xl/lg`
- **Animation**: Framer Motion (`motion`, `AnimatePresence`) in IGD tabs
- **Icons**: Lucide React only (no emoji icons)
- **Utilities**: `cn()` from `@/lib/utils`

### Color palette conventions
- **Indigo**: primary action buttons, active nav, branded headers
- **Emerald**: success states, IGD active nav, BPJS badge, active kunjungan
- **Slate**: text hierarchy (900/700/500/400), borders, backgrounds
- **Rose**: danger/critical/cancel actions
- **Amber**: warnings, CITO priority
- **Teal**: IGD male profile gradient (`from-slate-600 to-teal-800`)
- **Pink-rose**: IGD female profile gradient (`from-slate-600 to-rose-800`)
- **Avoid**: purple/violet as primary — only use for Farmasi unit chips

### Key patterns
- `ring-1 ring-{color}-200` on chips/badges (not just `border`)
- `text-xs` body, `text-[11px]` secondary, `text-[10px]` labels/uppercase tracking
- `shadow-xs` on cards, `shadow-sm` on panels
- `rounded-xl` cards, `rounded-lg` chips/inputs/buttons
- `border-l-4` accent stripe on `CardSection`
- IIFE `{condition && (() => { ... })()}` for conditional modal rendering

---

## Route Structure

```
src/app/ehis-care/
  (main)/
    layout.tsx          ← sidebar layout
    page.tsx            ← dashboard home
    igd/page.tsx        ← IGD board (list of patients)
  (fullpage)/           ← no sidebar, full viewport
    igd/[id]/
      layout.tsx
      page.tsx          ← IGD patient detail — uses PatientHeader + IGDRecordTabs
    pasien/[id]/
      layout.tsx
      page.tsx          ← Patient master dashboard — uses PatientDashboard
```

### Route IDs
- IGD patients: `igd-1`, `igd-2` → `igdPatientDetails[id]` in `src/lib/data.ts`
- Master patients: `RM-2025-005`, `RM-2025-012` → `patientMasterData[id]` in `src/lib/data.ts`

---

## Data Layer: `src/lib/data.ts`

### Key exported types
| Type | Purpose |
|---|---|
| `IGDPatient` | IGD board list item |
| `IGDPatientDetail` | Full patient for IGD record tabs (has `noRM`, `name`, `age`, `gender`, `doctor`, `tglKunjungan`, etc.) |
| `PatientMaster` | Full patient for patient dashboard (has `noRM`, `nik`, `idSatusehat`, `alergi[]`, `riwayatKunjungan[]`, `billing[]`, `penjamin`, `kontakDarurat`) |
| `KunjunganRecord` | Single visit row — has `detailPath?` for navigation |
| `BillingRecord` | Past billing record (read-only, for BillingDetailModal) |
| `KasirData` | Active billing session (for AccountingModal) |
| `TipePenjamin` | `"BPJS_Non_PBI" \| "BPJS_PBI" \| "Umum" \| "Asuransi" \| "Jamkesda"` |
| `UnitKunjungan` | `"IGD" \| "Rawat Jalan" \| "Rawat Inap" \| "Laboratorium" \| "Radiologi" \| "Farmasi"` |

### Key exported data
| Export | Description |
|---|---|
| `igdPatients` | IGD board list |
| `igdPatientDetails` | Record<id, IGDPatientDetail> — `igd-1`, `igd-2` |
| `patientMasterData` | Record<noRM, PatientMaster> — `RM-2025-005`, `RM-2025-012` |

### Mock patients
- **RM-2025-005** — Joko Prasetyo, male, 55y, `idSatusehat: "P02029S00001234"`, alergi: Penisilin, Aspirin. IGD kunjungan has `detailPath: "/ehis-care/igd/igd-1"`
- **RM-2025-012** — Siti Rahayu, female, 32y, `idSatusehat: "P02029S00001235"`, alergi: Sulfonamida. IGD kunjungan has `detailPath: "/ehis-care/igd/igd-2"`

---

## Component Map

### Patient Master Dashboard
**File**: `src/components/pasien/PatientDashboard.tsx`
**Route**: `/ehis-care/pasien/[noRM]`
**Status**: ✅ Complete

**Features built:**
- **Multi-patient browser tabs** in header: open multiple patients simultaneously, close tabs, gender-colored strips, active visit indicator (emerald dot)
- **Patient search dropdown**: search by name, No. RM, NIK — live filter from `patientMasterData`
- **3-column + full-width layout** (`grid-cols-12`):
  - Left (col-3): Profile card (teal/pink gradient), Billing card grouped by kunjungan
  - Center (col-6): Penjamin/BPJS card (large mono No. Peserta, SEP chip), Riwayat Kunjungan button
  - Right (col-3): Stats grid, Kontak darurat, Alergi, Quick actions
  - Bottom (col-12): Riwayat Kunjungan table with filter chips, clickable status → navigate to room
- **Modals**: EditDataModal, EditKontakModal, UbahPenjaminModal, AccountingModal (active billing), BillingDetailModal (past billing), RiwayatKunjunganModal

**State pattern** (multi-tab):
```tsx
const [tabs, setTabs] = useState<PatientMaster[]>([init]);
const [activeId, setActiveId] = useState(init.id);
// patient = tabs.find(t => t.id === activeId)
// setPatient = updater that maps over tabs matching activeId
```

---

### IGD Patient Detail
**File**: `src/components/igd/IGDRecordTabs.tsx` (tab router)
**File**: `src/components/igd/PatientHeader.tsx` (header)
**Route**: `/ehis-care/igd/[id]`
**Status**: ✅ Router + header complete

**Tab groups:**

| Tab ID | Component | Status |
|---|---|---|
| `triase` | `TriaseTab` | ✅ Built |
| `ttv` | `TTVTab` | ✅ Built |
| `asesmen` | `AsesmenMedisTab` | ✅ Built |
| `diagnosa` | `DiagnosaTab` | ✅ Built |
| `cppt` | `CPPTTab` | ✅ Built |
| `tindakan` | `TindakanTab` | ✅ Built |
| `disposisi` | `DisposisiTab` | ✅ Built |
| `rekonsiliasi` | `RekonsiliasTab` | ✅ Built |
| `keperawatan` | `KeperawatanTab` | ✅ Built |
| `pemeriksaan` | `PemeriksaanTab` | ✅ Built |
| `penilaian` | `PenilaianTab` | ✅ Built |
| `resep` | `ResepPasienTab` | ✅ Built |
| `order-lab` | `OrderLabTab` | ✅ Built |
| `order-rad` | `OrderRadTab` | ✅ Built |
| `pulang` | `PasienPulangTab` | ✅ Built |
| `rujukan` | — | ⚠️ Stub (ComingSoon) |

**Nav style**: Left sidebar, emerald active state, framer-motion fade transitions between tabs.

---

### OrderLabTab — `src/components/igd/tabs/OrderLabTab.tsx`
**Status**: ✅ Complete (built in previous session)

**Layout**: Single column with header info bar, then 2-column grid (left: search/form, right: order list + active orders), then riwayat section, sticky footer.

**Features:**
- `LabSearch` — live search 44-item lab catalog by name or kode, min 2 chars
- **Quick-add packages**: DL+Elektrolit, Panel Jantung, Fungsi Ginjal, Fungsi Hati, Panel DM, Koagulasi Lengkap
- Priority toggle: Rutin / CITO
- Catatan klinis textarea
- `ActiveOrderCard` — cancel button only when `status === "Menunggu"`, shows items as category chips
- `RiwayatLabSection` — expandable accordion of past orders; "Lihat Hasil" → `HasilModal` (printable table with Normal/Abnormal/Kritis color coding)
- `HasilModal` — full results table, Escape to close, print button
- Submit → success screen → "Buat Order Baru" to reset
- Mock data keyed by `patient.noRM`: `ACTIVE_ORDERS_MOCK`, `RIWAYAT_LAB_MOCK`

---

## Current Task / Next Steps

The following tabs are stubs and should be built next (in priority order based on clinical workflow):

1. **`rujukan`** — Rujukan Keluar (referral form: facility, specialist, reason, letter generation)

### Upcoming pages (not yet started)
- `src/app/ehis-care/(fullpage)/pasien/` — directory created but only `[id]` exists
- No rawat-inap, rawat-jalan, or farmasi patient pages yet

---

## Design System Reference

### IGD tab content pattern
```tsx
// Wrap content in a flex-col gap-4 container
// Use rounded-xl border border-slate-200 bg-white shadow-sm for cards
// Section headers: text-xs font-semibold text-slate-700
// Labels: text-[10px] font-bold uppercase tracking-wider text-slate-400
// Values: text-xs font-medium text-slate-700
```

### Chip / badge pattern
```tsx
<span className="rounded-md px-2 py-0.5 text-[10px] font-medium bg-{color}-50 text-{color}-700 ring-1 ring-{color}-200">
  label
</span>
```

### Modal pattern (IGD tabs use inline, PatientDashboard uses ModalShell)
```tsx
// IGD tabs: build inline with fixed inset-0 z-50 + backdrop + panel
// PatientDashboard: import/use ModalShell component
```

### Empty state pattern
```tsx
<div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-300">
    <Icon size={18} />
  </span>
  <p className="text-xs text-slate-400">Primary empty message</p>
</div>
```
