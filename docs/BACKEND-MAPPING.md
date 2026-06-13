# Backend — Mapping Hub (`/ehis-master/mapping`)

> **Progress tracker semua relasi N:N antar entitas master** yang di-host di hub tunggal
> `/ehis-master/mapping` (Opsi A — Mapping Hub Terpadu, CLAUDE.md §Architecture). Setiap sub-pane =
> satu jenis edge. Dokumen ini = satu-pintu status **backend** per sub-pane: tabel, endpoint, lapisan,
> RBAC, dan sisa pekerjaan.
>
> **Acuan kontrak:** [BACKEND-FLOWS.md](BACKEND-FLOWS.md) (layering/error/DoD) · [API-RULES.md](API-RULES.md)
> (resep endpoint + SSR-hybrid §6.1) · [BACKEND-MASTER-SUMBER-DAYA.md](BACKEND-MASTER-SUMBER-DAYA.md)
> (Pegawai/Ruangan/Dokter) · [BACKEND-MASTER-KATALOG-KLINIS.md](BACKEND-MASTER-KATALOG-KLINIS.md)
> (Tindakan/ICD/Lab). Federasi tarif/billable → [TODO-CHARGEMASTER.md](../TODO-CHARGEMASTER.md).

---

## 🧭 Konvensi arsitektur (berlaku semua edge)

- **Tabel join berdiri-sendiri** (BUKAN polymorphic). Tiap pasangan entitas punya tabel sendiri
  (`PenugasanRuangan`, `LayananUnit`, `LayananUnitLab`, …). Penyatuan ditunda sampai federasi
  chargemaster (TODO-CHARGEMASTER CM2/CM5). Lihat memori `project_lab_catalog_model`.
- **Join row** (FLOWS §9): uuid v7 · timestamptz · **HARD delete** (tak ada soft-delete/version) ·
  `@@unique([a, b])` → **grant idempoten** (POST ulang = no-op, 200 bukan 201) · FK `onDelete: Restrict`.
- **Edge DTO ramping**: id + pasangan id + **kode** entitas (dibaca via join, mis. `ruanganKode`) →
  FE matriks nge-key kolom by kode tanpa lookup id→kode terpisah.
- **Service `list` ACTOR-LESS** → dipanggil langsung Server Component (SSR-hybrid §6.1): first-paint
  via Service, CUD via `/api/v1` di client. `prefetched` flag → fallback client fetch (degradasi anggun).
- **RBAC**: mayoritas pane di-gate **`master.mapping`** (read/update). Pengecualian: SDM pakai
  `master.penugasan-ruangan` (granular). **Konsumen klinis** (mis. `tindakan-tersedia`) di-gate
  `clinical.*`, BUKAN `master.*` — perawat/dokter tak punya hak master.

---

## 📊 Status backend per sub-pane

| # | Sub-pane | Edge | Tabel | Endpoint | RBAC | Status |
|---|----------|------|-------|----------|------|--------|
| 1 | **SDM Assignment** | Pegawai ⇄ Location | `master.PenugasanRuangan` | `/master/penugasan-ruangan` (+`/:id`) | `master.penugasan-ruangan` | ✅ **DB** |
| 2 | **Layanan Unit** | Tindakan ⇄ Location · Lab ⇄ Location | `master.LayananUnit` · `master.LayananUnitLab` | `/master/layanan-unit` · `/master/layanan-unit-lab` (+`/:id`) · `/master/tindakan-tersedia` | `master.mapping` · klinis: `clinical.tindakan` | ✅ **DB** |
| 3 | **RBAC** | Role ⇄ Permission | `auth.role_permissions` | `/auth/rbac` · `/auth/rbac/:roleKey` | `master.mapping` | ✅ **DB** |
| 4 | **Kewenangan Klinis** | Dokter ⇄ Tindakan | — (roster dokter real; edge belum) | roster: `/master/dokter` · grant: **belum** | `master.mapping` | 🟡 **Partial** (roster DB, edge mock) |
| 5 | **Tarif Matrix** | Tindakan × Penjamin × Jenis Ruangan → Harga | `master.TarifTindakan` | `/master/tarif-tindakan` (+`/:id`) | `master.tarif` | ✅ **DB** |
| 6 | **Formularium** | Obat × Kelas Penjamin → boleh/tidak | — | — | — | 📋 **Mock** |
| 7 | **Distribusi Obat** | Obat ⇄ Depo Farmasi | — | — | — | 📋 **Mock** |
| 8 | **Penjamin × Ruangan** | Kode SMF/Ruangan BPJS ⇄ Ruangan RS | — | — | — | 📋 **Mock** |

Legenda: ✅ **DB** = persist nyata layered · 🟡 **Partial** = sebagian wired · 📋 **Mock** = FE `*Shared.ts` (skema 1:1 target, swap saat backend siap).

---

## 1. SDM Assignment — Pegawai ⇄ Location ✅

- **Tabel** `master.PenugasanRuangan` (join N:M Pegawai⇄Location, hard-delete, idempoten).
- **Endpoint** `GET/POST /master/penugasan-ruangan` + `DELETE /:id` — RBAC granular **`master.penugasan-ruangan`** (read/create/delete).
- **Lapisan** schemas/DAL/Service (`list` actor-less) + client `lib/api/penugasanRuangan.ts`.
- **FE** [Mapping Hub → SDM Assignment](../src/components/master/mapping/sdm/) — tree Unit→Ruangan, assign **per-ruangan**, optimistik POST/DELETE + toast, SSR-hybrid. Roster dokter+pegawai REAL dari API (mock dihapus).
- **Selesai** 2026-06-06 ([DONE.md](../.claude/DONE.md)).

## 2. Layanan Unit — Tindakan/Lab ⇄ Location ✅

Matriks **terpadu**: baris = Tindakan (Katalog Tindakan) **+** grup "Tindakan Laboratorium" (Katalog Lab);
kolom = Location (Ruangan) aktif. Dua tabel **paralel**, satu UI.

- **Tabel** `master.LayananUnit` (Tindakan⇄Location) · `master.LayananUnitLab` (LabTest⇄Location) — keduanya hard-delete join, `@@unique`, idempoten.
- **Endpoint** (gate **`master.mapping`** read/update):
  - `GET/POST /master/layanan-unit` + `DELETE /:id`
  - `GET/POST /master/layanan-unit-lab` + `DELETE /:id`
  - `GET /master/tindakan-tersedia` — **konsumen klinis** (gate `clinical.tindakan:read`), lihat §Konsumen Klinis.
- **Lapisan** schemas/DAL/Service (`list` actor-less) + client `lib/api/master/layananUnit.ts` · `layananUnitLab.ts` · `tindakanTersedia.ts`.
- **FE** [layanan/](../src/components/master/mapping/layanan/) — model unified `LayananRow` (kind tindakan|lab) + `LayananEdge`; Matrix/MobileView jenis-agnostik; `persistCell` rute grant/revoke per kind. **Bulk select-all tri-state 3 level**: per kolom/Location · per baris · per grup kategori (desktop + mobile drill-down), batched optimistik. Tree-filter kolom (LayananUnitTreePanel).
- **Selesai** 2026-06-12 (Tindakan + Lab + select-all + tindakan-tersedia).

## 3. RBAC — Role ⇄ Permission ✅

- **Tabel** `auth.role_permissions` (+ `auth.permissions` katalog; seed via migrasi `*_seed_rbac` dst).
- **Endpoint** `GET /auth/rbac` (snapshot semua role+permission) · `PATCH /auth/rbac/:roleKey` (set grant per role) — gate **`master.mapping`** (RBAC editor = bagian Mapping Hub).
- **FE** [rbac/](../src/components/master/mapping/rbac/) — pohon permission per modul (`rbacShared.ts` = sumber kebenaran katalog), tulis grant per role. Generator seed: [prisma/scripts/gen-rbac-seed.mjs](../prisma/scripts/gen-rbac-seed.mjs).
- **Catatan** RBAC modul + ABAC unit-scope ditegakkan (RBAC-MODUL Fase 4, [TODO-RBAC-MODUL.md](../TODO-RBAC-MODUL.md)). Sumber kebenaran runtime = tabel `role_permissions` (yang ditulis pane ini); seed migrasi hanya default awal.

## 4. Kewenangan Klinis — Dokter ⇄ Tindakan 🟡

- **Roster dokter REAL** dari `/master/dokter` (SSR-hybrid; [KewenanganPane](../src/components/master/mapping/kewenangan/KewenanganPane.tsx) `listDokter`). Mock dokter sudah dihapus.
- **Edge Dokter↔Tindakan masih MOCK** — [KewenanganMatrix](../src/components/master/mapping/kewenangan/KewenanganMatrix.tsx) baca `tindakanMock` (kolom tindakan) & belum ada tabel/endpoint grant persist.
- **Sisa**: tabel join `master.KewenanganKlinis` (Dokter⇄Tindakan, pola `LayananUnit`) + endpoint `master.mapping` + swap kolom ke Katalog Tindakan DB (seperti Layanan Unit). Seed default tersedia di `Tindakan.spesialisDefault`.

## 5. Tarif Matrix — Tindakan × Penjamin × Jenis Ruangan ✅

Matriks 3D di-flatten jadi baris edge `(tindakan, penjaminKode, jenisRuangan) → harga`.

- **Tabel** `master.TarifTindakan` (uuid v7, timestamptz, `@@unique(tindakanId, penjaminKode, jenisRuangan)` → **upsert by triple**; FK `tindakan` Restrict; `harga` Int rupiah). Migrasi `20260612060000_init_master_tarif_tindakan`.
- **Endpoint** (gate **`master.tarif`**): `GET /master/tarif-tindakan` (filter+cursor) · `POST` (upsert by triple, action `update`) · `DELETE /:id` (clear → "belum diisi").
- **Lapisan** schemas/DAL (`upsert`/keyset list)/Service (`list` actor-less · `upsert` guard tindakan · `remove`) + client `lib/api/master/tarifTindakan.ts` (`listAllTarif`/`upsertTarif`/`deleteTarif`).
- **FE** [tarif/](../src/components/master/mapping/tarif/) — **baris = Katalog Tindakan DB** (persis Layanan Unit, SSR-hybrid); **kolom = tier "Jenis Ruangan"** DI-DERIVE dari master Ruangan tree (`tiersFromTree`, key `locationType[:kelas]`) — BUKAN Location fisik (tarif per kelas, bukan per bed). Penjamin = sheet selector (daftar **khusus Tarif** `TARIF_PENJAMIN`, BUKAN `PENJAMIN_MOCK` global): **Umum** aktif (= Tarif PERDA, berlaku semua jaminan) · **BPJS** tab nonaktif/disabled (KRIS ditunda) · jaminan lain dihapus. `penjaminKode` tetap string stabil. Sel = harga, edit inline → upsert/delete optimistik + reconcile. **KRIS-aware**: `validTiersForPenjamin` collapse tier inap berkelas → 1 tier `RAWAT_INAP:KRIS` untuk BPJS; Umum/Asuransi tetap VIP/Kelas (Perpres 59/2024). **Flat-rate per tindakan**: tombol `=` per baris (popover input 1 harga) → samakan ke SEMUA tier sheet aktif (tindakan ber-harga seragam lintas ruangan, mis. pasang infus/EKG/akses IV) — batched upsert.
- **Keputusan model** (2026-06-12): derive tier dari tree · KRIS+klasik per penjamin · penjamin = kode string (master Penjamin backend menyusul Tier 3 — `penjaminKode` belum FK).
- **Sisa**: master **Penjamin** masih mock (kode stabil dipakai) · bulk-adjust = loop upsert (belum endpoint bulk) · federasi billable Tindakan+Lab+Rad → chargemaster (TODO-CHARGEMASTER CM2/CM5).

## 6–8. Formularium · Distribusi · Penjamin × Ruangan 📋

Masih **FE mock** (`*Shared.ts` per pane, skema 1:1 target → swap import saat backend siap):

| Pane | Mock file | Target edge | Catatan backend |
|------|-----------|-------------|-----------------|
| **Formularium** | [formularium/formulariumShared.ts](../src/components/master/mapping/formularium/formulariumShared.ts) | Obat × Kelas Penjamin → boleh/tidak | Baris **obat dari DB** (`fetchAllObat`, Katalog Obat ✅ — KATALOG-KLINIS §C.1); **edge coverage** masih mock (state-only) → persist N:N menyusul. |
| **Distribusi Obat** | [distribusi/distribusiShared.ts](../src/components/master/mapping/distribusi/distribusiShared.ts) | Obat ⇄ Depo Farmasi | Baris **obat dari DB** (`fetchAllObat`, Katalog Obat ✅); **stok per depo** masih mock + master Depo belum backend. |
| **Penjamin × Ruangan** | [penjamin-ruangan/PenjaminRuanganPane.tsx](../src/components/master/mapping/penjamin-ruangan/PenjaminRuanganPane.tsx) | Kode SMF/Ruangan BPJS ⇄ Ruangan RS | Untuk SEP/V-Claim (BPJS). Tergantung reference BPJS (sync cron) + master Ruangan (✅). |

---

## 🩺 Konsumen klinis (cross-modul)

Mapping di hub ini = **sumber kebenaran**; modul lain **mengonsumsi** (read-only), bukan menulis.

- **`GET /master/tindakan-tersedia`** (2026-06-12) — katalog tindakan ter-assign untuk tab **Tindakan IGD** (& RI/RJ nanti). Join `LayananUnit → Tindakan`, distinct + `ruanganKodes[]`, opsional `?ruanganKode=`. **+ HARGA** dari Tarif Matrix via `?penjaminKode=&jenisRuangan=` (left-join `TarifTindakan`, `harga: number|null`) — IGD pakai `UMUM`+`IGD`. Gate **`clinical.tindakan:read`** (Dokter/Perawat), `scopeKunjungan:false`. **Lab & Rad tidak termuat** (Lab = `LayananUnitLab`; Rad bukan entri LayananUnit → menu Order tersendiri). FE: [TindakanTab](../src/components/igd/tabs/TindakanTab.tsx) (harga per baris + subtotal live + hero **Estimasi Biaya** animasi) via [lib/api/master/tindakanTersedia.ts](../src/lib/api/master/tindakanTersedia.ts).
- **Persist recording ✅ (2026-06-12)** — domain rekam medis `medicalrecord.TindakanMedis` (per-kunjungan, snapshot nama/kode/kategori/harga + jumlah + pelaksana, soft-delete) + endpoint `GET/POST /kunjungan/:id/tindakan` (+`/:itemId` PATCH/DELETE), gate **`clinical.tindakan`** (Admin/Dokter/Perawat full CRUD). [TindakanTab](../src/components/igd/tabs/TindakanTab.tsx) persist saat `kunjunganId` UUID (pola `isPersisted` DiagnosaTab); pasien IGD mock = tetap lokal sampai detail page di-wire DB. Lihat [.claude/DONE.md].
- **Belum di-wire**: scoping per-ruangan pasien (endpoint sudah forward-ready `?ruanganKode=`; FE belum kirim karena ruangan pasien IGD masih mock).
- **Calon konsumen lain**: Billing (tarif dari chargemaster) · Kewenangan (validasi DPJP boleh tindakan) · E-Klaim.

---

## ✅ Definition of Done (per edge baru)

1. Schema Prisma join (uuid v7, timestamptz, hard-delete, `@@unique`, FK Restrict, back-relation 2 sisi) + migrasi additive (`migrate deploy`, **bukan** `migrate dev` — drift, lihat memori `project_migration_drift_pattern`).
2. Lapisan: Zod schema (`Grant*Input`/`*Query`/`*EdgeDTO`) · DAL (`create`/`findByPair`/`list` keyset/`deleteById`/guards) · Service (`list` actor-less · `grant` idempoten · `revoke`).
3. Route `GET/POST` + `DELETE /:id` (gate `master.mapping` atau granular) + client `lib/api/...`.
4. SSR-hybrid di [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) (`Promise.allSettled`) → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) → Pane (`initial*` props + fallback fetch).
5. `tsc --noEmit` + `eslint` clean. DB smoke (insert + unique-block + FK).
