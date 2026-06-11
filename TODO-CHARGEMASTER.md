# EHIS — Chargemaster / Billable-Service Federation (Opsi A)

> **Konteks.** Saat ini ada **3 representasi tarif terfragmentasi**: (1) Mapping Hub Tarif derive sintetis dari `TINDAKAN_MOCK` × multiplier, (2) `TARIF_MOCK` chargemaster terpisah yang dibaca billing, (3) `priceResolver` fuzzy-match nama. Mapping Hub & billing **tak nyambung**.
>
> **Opsi A (dipilih 2026-06-12).** Pisahkan **layer klinis** (3 katalog berdiri sendiri: Tindakan/Lab/Rad — field domain kaya, JANGAN digabung) dari **layer billable (chargemaster tunggal)**. Federasi katalog → `BillableService` via adapter; chargemaster jadi satu-satunya sumber Mapping Hub **Tarif** + **Layanan Unit** + billing.
>
> **Scope guard:** **Kewenangan Klinis tetap Tindakan-only** (kredensial dokter PMK 755 tak berlaku ke lab/rad). Hanya **Tarif** (universal) & **Layanan Unit** (default home-unit) yang federasi.

---

## Prinsip

- **Katalog klinis = sumber kebenaran data domain** (Tindakan: kompleksitas/KPTL/ICD-9 · Lab: nilai rujukan/delta · Rad: template/persiapan). Tetap 3 master terpisah.
- **Chargemaster = satu-satunya layer billable.** Tiap baris menunjuk balik ke item katalog via `(sourceType, sourceId)` mis. `tindakan:tnd-001`, `lab:lab-010`, `rad:rad-005`. Baris non-klinis (jasa dokter, kamar, ambulans) → `sourceType: "manual"`.
- **Satu federasi (`getBillableServices`) menyalakan dua matrix** (Tarif + Layanan Unit) → satu pola, mudah dirawat.

---

## Fase

### CM0 — Foundation (federasi tipe + adapter)
- [ ] `BillableService` interface — `{ serviceId, sumber: "tindakan"|"lab"|"rad"|"manual", kode, nama, kategori }` (+ `kompleksitas?` opsional khusus tindakan).
- [ ] Adapter per katalog: `tindakanToService()` · `labToService()` · `radToService()` (map record katalog → `BillableService`, `serviceId = "${sumber}:${id}"`).
- [ ] `getBillableServices(filter?: { sumber? })` — agregasi 3 katalog, key komposit anti-collision lintas sumber.

### CM1 — Tarif Matrix konsumsi chargemaster
- [ ] `mapping/tarif/tarifShared.ts`: `getTindakanList()` → `getBillableServices()`. Key map = `serviceId` (bukan `tindakanId`).
- [ ] `TarifPane`: filter sumber (Tindakan/Lab/Rad/Semua) di header.
- [ ] Hapus tarif sintetis (`KOMPLEKSITAS_BASE` multiplier) → tarif **nyata** dari chargemaster (`tarifUmum/BPJS/Asuransi`).

### CM2 — Layanan Unit federasi + default home-unit
> **Groundwork ✅ (2026-06-12):** Layanan Unit kini SSR-hybrid — **baris = tindakan DB** (`/master/tindakan`), **kolom = Location aktif** dari master Unit & Ruangan (`unitsFromTree`). Seed default di-scope ke kode unit valid. Sisa CM2 di bawah = federasi billable-service + `unitTerkait` chargemaster + filter sumber + **selaraskan kode `unitDefault`↔Location**.
- [ ] `mapping/layanan/layananShared.ts`: `getTindakanList()` → `getBillableServices()` (federasi Tindakan+Lab+Rad).
- [ ] Seed default `unitTerkait`: tindakan→`unitDefault` · lab→`["LAB"]` · rad→`["RAD"]` (admin toggle pengecualian POCT/portabel).
- [ ] `LayananUnitPane`: filter sumber. Matrix edit `TarifRecord.unitTerkait` (bukan `unitDefault` katalog tindakan).
- [ ] **Catatan:** tab "Relasi Default" TIDAK ditambahkan ke katalog Lab/Rad (separuh tab — `spesialisDefault` — tak relevan). Default unit hidup di chargemaster.

### CM3 — Chargemaster sebagai source-of-truth
- [ ] `TarifRecord` + `sourceType: "tindakan"|"lab"|"rad"|"manual"` + `sourceId?: string`.
- [ ] Aksi "Tambah ke Tarif" di tiap katalog (Tindakan/Lab/Rad): pilih item → buat baris chargemaster terhubung.
- [ ] Seed chargemaster awal dari katalog (one-off) bila perlu.

### CM4 — Konvergensi billing
- [ ] `priceResolver`: ganti fuzzy-name → lookup pasti `(sourceType, sourceId, penjamin, kelas)`.
- [ ] Hapus ketergantungan fuzzy `findTarifByName` (sisakan sebagai fallback legacy bila perlu).

### CM5 — Backend (saat swap mock→DB)
- [ ] Tabel `master.Tarif` dengan FK polimorfik `(source_type, source_id)` → katalog. (Lihat pola layered di [docs/API-RULES.md](docs/API-RULES.md).)
- [ ] Mapping Hub Tarif (tulis) + `priceResolver` (baca) berbagi tabel + cache-aside (API-RULES §6.1).
- [ ] Layanan Unit menulis `Tarif.unitTerkait`.

---

## Keputusan & batas

- **JANGAN merge 3 katalog jadi 1 tabel** — field domain terlalu beda; merge = jelek. Federasi via adapter/chargemaster.
- **Kewenangan Klinis = Tindakan-only** (tak ikut federasi).
- **Granularity Layanan Unit = UNIT/departemen** (IGD/ICU/OK/Poli/LAB/RAD), bukan kamar/bed.
- Nilai utama Lab/Rad di Layanan Unit = **POCT** (lab bedside) & **portabel/mobile** (rad bedside); kalau RS tak lakukan keduanya, lab/rad cukup home-unit (tetap masuk, default 1 kolom).

---

## Status: 📋 Planned (0/6 fase) — dibuat 2026-06-12.
