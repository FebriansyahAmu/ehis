# EHIS — Completed Work History

> Archive semua item yang sudah selesai. Jangan hapus — berguna untuk audit dan referensi arsitektur.
>
> **Workflow docs**:
> - [CLAUDE.md](../CLAUDE.md) — current state + active work
> - [TODO.md](../TODO.md) — Master phase roadmap (Phase 0–3 ✅)
> - [TECH_DEBT.md](../TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](../TODOS_BACKEND.md) — backend implementation roadmap
> - [GAP_ANALYSIS.md](GAP_ANALYSIS.md) — clinical gap audit
> - [STANDARDS.md](STANDARDS.md) — clinical standards reference

---

## ✅ Selesai — Order Lab contracts table + endpoints (persist order ke Laboratorium) (2026-06-21)

Setelah katalog Order Lab DB-driven, sekarang **order-nya tersimpan** — mirror penuh alur "order resep ke Farmasi", tabel + API layered per [API-RULES](../docs/API-RULES.md).

- **Contracts table** — `medicalrecord.LabOrder` (header) + `medicalrecord.LabOrderItem` (baris tes), mirror `ResepOrder`/`ResepItem`. Order append-only (soft-delete); `status`/`prioritas` mutable (workflow Lab Menunggu→Diterima→…→Selesai/Ditolak); lab tujuan = snapshot kode+nama Location Laboratorium; item snapshot katalog `master.LabTest` (labTestId soft-ref + kode/nama/kategori/TAT + **harga** Tarif Matrix). Migrasi drift-safe `20260621160000_init_medicalrecord_lab_order` (db execute → resolve → generate). Back-relation `Kunjungan.labOrder`.
- **API layered (pola API-RULES)** — schema [lab/labOrder.ts](../src/lib/schemas/lab/labOrder.ts) (Zod input + DTO mirror FE) → DAL [lab/labOrderDal.ts](../src/lib/dal/lab/labOrderDal.ts) (create/list/findByIdWithKunjungan/listForLab/transition/receive/cancel, guard `deletedAt`) → Service [lab/labOrderService.ts](../src/lib/services/lab/labOrderService.ts) (penulis dari actor, statusAwal RJ=Diterima · IGD/RI=Menunggu, guard atomik) → routes:
  - **Klinis** (gate `clinical.tindakan` + ABAC careUnit via params.id): `GET/POST /kunjungan/:id/lab` · `POST /kunjungan/:id/lab/:labId/cancel`.
  - **Worklist Lab** (gate `ancillary.lab.worklist`, lintas-kunjungan `scopeKunjungan:false`): `GET /lab/orders` (filter labKode/status/noRM) · `GET /lab/orders/:id` · `POST /lab/orders/:id/receive`.
  - FE client [api/lab/labOrder.ts](../src/lib/api/lab/labOrder.ts).
- **Producer wiring (sesuaikan)** — `OrderLabPatient.kunjunganId` ditambah; wrapper IGD/RI/RJ kirim `patient.id`. [OrderLabTab](../src/components/shared/medical-records/OrderLabTab.tsx) submit: kunjunganId UUID → `createLabOrder` (map item → snapshot, prioritas Cito→CITO) + toast + state submitting; pasien demo (non-UUID) tetap lokal.
- **Follow-up** — LabBoard worklist masih mock (endpoint `/lab/orders` siap dikonsumsi, mirror FarmasiBoard) · persist hasil/sampel/validasi (workflow lab) · billing ingest dari LabOrder.

---

## ✅ Selesai — Order Lab klinis (IGD/RI/RJ) DB-driven + Paket Cepat dari master (2026-06-21)

Tab **Order Lab** shared ([OrderLabTab](../src/components/shared/medical-records/OrderLabTab.tsx)) berhenti pakai mock katalog — kini menarik tes lab **ter-assign ke ruangan Laboratorium** dari master, lengkap harga, dengan Paket Cepat yang nyata.

- **Endpoint klinis baru** — `GET /api/v1/master/lab-test-tersedia` (gate **`clinical.tindakan:read`** = "Tindakan / Order" Dokter/Perawat, BUKAN master.katalog; `scopeKunjungan:false`). Layered: schema [labTestTersedia.ts](../src/lib/schemas/master/labTestTersedia.ts) → DAL `listAssignedLabTest` (join `LayananUnitLab` → `LabTest` aktif, **location_type=Laboratorium**, harga via relasi `tarif` match `penjaminKode`+`jenisRuangan`) → Service `listLabTestTersedia` (distinct per tes + `ruanganKodes[]`) → [route](../src/app/api/v1/master/lab-test-tersedia/route.ts) + browser client [labTestTersedia.ts](../src/lib/api/master/labTestTersedia.ts). Pola identik `tindakan-tersedia`.
- **(1) Panduan Order Lab dihapus** — box rule statis dibuang; ruang dipakai search + paket.
- **(2) Pencarian dari katalog ter-assign** — `LabSearch` prop-driven (catalog dari DB, loading state, dedup by catalog id), tampilkan kode + kategori + **harga** + TAT. Kategori diperluas ke 10 nilai master (tambah Feses/Imunologi/Toksikologi + ikon/warna). Empty/error state seperti TindakanTab.
- **(3) Paket Cepat dari master + harga** — `PAKET_DEFS` kurasi by **kode master** (DR/ELE/KOL/HDL/TG/UR/CR/UA/SGOT/…); di-resolve terhadap katalog saat render (anggota tak tersedia disembunyikan, paket kosong disembunyikan), tombol tampilkan **jumlah anggota + total harga** dari Tarif Matrix. Estimasi biaya live di header daftar order + footer (+ peringatan "belum bertarif"). Validasi DB: 38 tes ter-assign semua berharga, 10/10 paket resolve penuh.
- **Tarif context** — `tarifTierForUnit(unitPengirim)` (IGD→IGD · *inap*→RAWAT_INAP:Kelas_3 · ICU→ICU · fallback IGD); lab di-tagih flat lintas tier (penjamin UMUM) → harga standar tetap ter-resolve untuk semua unit.
- **File split (≤800 baris)** — file lama 1038 baris dipecah: [orderLab/orderLabShared.tsx](../src/components/shared/medical-records/orderLab/orderLabShared.tsx) (tipe+config+helper+PAKET_DEFS) · [orderLab/orderLabMock.ts](../src/components/shared/medical-records/orderLab/orderLabMock.ts) (riwayat/aktif display-only) · [orderLab/OrderLabHistory.tsx](../src/components/shared/medical-records/orderLab/OrderLabHistory.tsx) (RiwayatLabSection + HasilModal). Main tab ramping.

Follow-up: submit order lab belum persist (masih state lokal → DB order lab = Phase later, sejajar resep); endpoint klinis `rad-catalog-tersedia` untuk OrderRadTab (paralel).

---

## ✅ Selesai — Farmasi Klinis: Detail wiring + Telaah/Dispensing persist + CPPT Apoteker + Register N/P (2026-06-20 → 06-21)

Pematangan modul Farmasi klinis (`/ehis-care/farmasi`): halaman detail benar-benar DB-driven, telaah & dispensing tersimpan sebagai snapshot FHIR-ready, dokumen cetak nyata, worklist dirapikan, CPPT Apoteker terintegrasi, dan Register N/P di-reframe jadi laporan kepatuhan.

- **Detail page DB-only** — [FarmasiOrderDetail](../src/components/farmasi/FarmasiOrderDetail.tsx) fetch `getFarmasiResep(id)` → `mapDbResepOrder`; [FarmasiOrderTabs](../src/components/farmasi/FarmasiOrderTabs.tsx) persist per-aksi + `onOrderChange`. SessionProvider ditambah di layout fullpage farmasi.
- **Telaah persist (PMK 72/2016)** — `medicalrecord.ResepTelaah` (append-only, migrasi `20260620150000`) = QuestionnaireResponse-ready 3-aspek administratif/farmasetik/klinis (`answers` JSONB linkId→bool); `POST /farmasi/resep/:id/telaah` (gate `ancillary.farmasi.telaah`), transisi `Diterima→Ditelaah|Dikembalikan` atomik. [TelaahPane](../src/components/farmasi/tabs/layananFarmasi/TelaahPane.tsx) di-realign ke checklist PMK 72; BB + justifikasi formularium dihapus. Lihat [[project_telaah_resep_fhir]].
- **Dispensing & Serah persist** — `medicalrecord.ResepDispensing` (append-only, migrasi `20260620160000`, MedicationDispense-ready) + `POST /farmasi/resep/:id/dispensing` (gate `ancillary.farmasi.serah`), transisi `Ditelaah→Selesai`. [DispensingSerahPane](../src/components/farmasi/tabs/layananFarmasi/DispensingSerahPane.tsx): LOT/ED dihapus, Telaah Akhir oleh user login (`useSession`), nama penerima/catatan dihapus, edukasi "centang semua", double-witness narkotika dipertahankan.
- **Dokumen cetak nyata** — [DokumenPane](../src/components/farmasi/tabs/layananFarmasi/DokumenPane.tsx) tombol Cetak per dokumen (Resep via `ResepCetakModal`; Label & Etiket via [labelEtiketCetak](../src/components/farmasi/tabs/layananFarmasi/labelEtiketCetak.tsx)). **Kertas thermal**: pemilih ukuran 58/80mm/A4 + `@page` dinamis + layout 1-kolom stack + garis gunting; Kwitansi disabled.
- **Riwayat Resep (DB, lintas-kunjungan)** — filter `noRM` end-to-end (`FarmasiResepQuery`/`listForFarmasi`/`listFarmasiResep`); [RiwayatResepPane](../src/components/farmasi/tabs/layananFarmasi/RiwayatResepPane.tsx) menampilkan SEMUA resep pasien. Status `Dibatalkan` jadi kelas-satu (`FarmasiStatus`+`STATUS_CFG`) — kartu background soft-merah + badge "Order Dibatalkan" + tanpa tombol Detail (fix bug `coerceStatus` yang dulu kolaps ke `Menunggu`).
- **Penamaan depo** — `DEPO_LABEL` (asal order = nama unit IGD/Rawat Inap/Rawat Jalan, bukan "Depo IGD") di worklist/header/riwayat; field "Depo:" sebenarnya pakai `depoNama` nyata (Depo Farmasi) di Dispensing/Cetak. Plumb `depoNama` ke `FarmasiOrder`.
- **Worklist status dropdown** — `<select>` polos → [FarmasiBoard](../src/components/farmasi/FarmasiBoard.tsx) `StatusFilter` kustom (dot warna + jumlah per status + animasi + klik-luar/Esc).
- **CPPT Apoteker terintegrasi** — apoteker menulis ke thread CPPT pasien yang sama (`medicalrecord.Cppt`) via shared [CPPTTab](../src/components/shared/medical-records/CPPTTab.tsx) (`kunjunganId`+`defaultProfesi="Apoteker"`). RBAC: grant Apoteker `clinical.cppt:[read,create,delete]` (migrasi `20260621120000`, mirror Perawat — tanpa update). Cross-unit: `isAncillaryActor` di [careUnit.ts](../src/lib/auth/careUnit.ts) bypass careUnit ABAC untuk aktor penunjang (RBAC tetap menggate resource). Lihat [[project_rbac_penunjang_standalone]].
- **Rekonsiliasi Obat (tab Farmasi, shared)** — tab baru "Rekonsiliasi Obat" di [FarmasiOrderTabs](../src/components/farmasi/FarmasiOrderTabs.tsx) pakai shared [RekonsiliasTab](../src/components/shared/medical-records/RekonsiliasTab.tsx) (persist `medicalrecord.Rekonsiliasi` via `clinical.rekonsiliasi`). **Konteks dari unit asal order** (`rekonContextFor`: IGD→`igd`, lain→`ri`) — fase + label menyesuaikan lokasi yang meng-order. Apoteker = penanggung jawab (PMK 72/2016); efektif berkat grant `clinical.rekonsiliasi:[read,create]` + bypass careUnit `isAncillaryActor`. Katalog obat dari `obat-tersedia` (gate `clinical.resep:read`).
- **Register N/P read-only** — [RegisterNarPsiPane](../src/components/farmasi/narPsi/RegisterNarPsiPane.tsx) di-reframe jadi **lapisan kepatuhan/laporan**: katalog dari `master.Obat` (golongan N/P), saldo+mutasi dari ledger Inventory (`getInvItemDetail`). Modal Tambah Pengeluaran + Stok Opname dihapus (hentikan ledger tandingan); banner sumber data; accent purple→pink. Mock katalog/register/opname di [narPsiShared](../src/components/farmasi/narPsi/narPsiShared.ts) dibuang.

Follow-up → TECH_DEBT §Farmasi (dispensing→OUT Inventory + identitas Register N/P, laporan SIPNAP, CPPT Apoteker edit/flag gating, RI/RJ ResepPane wiring CPPT/TTE).

## ✅ Selesai — Resep Pasien: TTE + Doctor-gate + Cetak (preview/print) (2026-06-19)

Lanjutan slice Resep (IGD). 3 permintaan: (1) hanya dokter yang bisa order; (2) resep wajib TTE — mock always-success + barcode di resep; (3) cetak setelah TTE + preview interaktif, layout proper & modern.

- **Doctor-gate** — order di-gate `useSession().can("clinical.resep","create")` (hanya Dokter/Admin; Perawat/Apoteker read). Tombol → **"Tanda Tangani & Order Resep"**; non-dokter: tombol disable + catatan. Server tetap penjaga (RBAC `route()`).
- **TTE (mock always-success)** — kolom baru `medicalrecord.ResepOrder.{tteToken,tteSignedBy,tteSignedAt}` (migrasi `20260619140000_resep_tte`, drift-safe + generate). [resepService](../src/lib/services/resep/resepService.ts) **auto-tanda-tangani saat create** (serial `TTE-YYMMDD-xxxxxxxx` via clock+randomUUID; penanda tangan = penulis/DPJP). DTO/DAL bawa field TTE. Pasien demo (non-UUID) → TTE mock lokal.
- **Barcode + Cetak** — [TteBarcode](../src/components/shared/resep/TteBarcode.tsx) (SVG deterministik dari serial) · [ResepCetakTemplate](../src/components/shared/resep/ResepCetakTemplate.tsx) (A4 modern: header RS · pasien/DPJP · ℞ daftar obat · chip kondisi klinis · blok TTE barcode + pernyataan sah UU ITE) · [ResepCetakModal](../src/components/shared/resep/ResepCetakModal.tsx) (preview + `window.print()`, infra `.print-area`/`.no-print`). Layar sukses [ResepPasienTab](../src/components/igd/tabs/ResepPasienTab.tsx) → kartu TTE + barcode + "Preview & Cetak Resep". tsc bersih, eslint 0 error. Follow-up: TTE+cetak belum di RI/RJ ResepPane (komponen sudah shared).

## ✅ Selesai — Resep Pasien: Cari Obat → DB obat-tersedia (2026-06-19)

Bug: pencarian obat tak menampilkan obat dari DB. Akar: `ObatSearch` membaca `OBAT_CATALOG` mock (21 item hardcode), bukan DB (IGD bahkan punya `ObatSearch` lokal sendiri yang ikut hardcode).

- Mapper `obatTersediaToCatalog` (ObatTersediaDTO→ObatCatalog; kategori dari golongan, stok 0) di [resepShared](../src/components/shared/resep/resepShared.ts).
- IGD `ObatSearch` lokal + shared [ObatSearch](../src/components/shared/resep/ObatSearch.tsx) di-feed `catalog` dari `GET /master/obat-tersedia` (gate clinical.resep:read), `showStock` off saat pakai DB. Wired IGD [ResepPasienTab](../src/components/igd/tabs/ResepPasienTab.tsx) + shared [ResepPane](../src/components/shared/medical-records/resep/ResepPane.tsx). Fallback mock bila formularium kosong/unauth.
- Catatan: `obat-tersedia` hanya kembalikan obat **Aktif & ter-formularium** (Mapping Hub → Formularium) — by-design.

## ✅ Selesai — Master Pengguna: perbaikan Edit Akun (2026-06-19)

3 bug/penambahan saat edit pengguna:
- **Tambah role tidak tersimpan (flicker lalu hilang)** — jalur Edit hanya update state optimistic, tak panggil API. Fix: [PenggunaPage.handleSubmit](../src/components/master/pengguna/PenggunaPage.tsx) `await assignRoles(...)`; form [PenggunaEditForm](../src/components/master/pengguna/PenggunaEditForm.tsx) **await** sebelum tutup → `refreshUsers()` baca data baru (tanpa revert) + state `saving` + `toast.error`.
- **Endpoint update kredensial** — `PATCH /api/v1/auth/users/:id` (username + reset password, gate `master.pengguna:update`): `UpdateUserInput` (Zod) + `userDal.updateCredentials` + `userService.updateUser` (username unik citext, hash password) + client `updateUser`. Form Edit kini persist username/password (di-await sebelum assignRoles).
- **Kolom Unit kosong** — Unit terikat `unitAssignment` yang di-hardcode `[]`; `unitKerja` pegawai tak di-fetch. Fix: `unitKerja` ditambah ke `UserListItemDTO` + DAL select + service; `userDtoToRecord` map `unitKerja` (nama→kode via helper `unitKerjaToKodes`) → kolom Unit tampil unit kerja pegawai (sumber sementara sampai UserUnitScope dibangun).

## ✅ Selesai — Resep Pasien: Order BE + Worklist Farmasi (2026-06-19)

Backend slice tab Resep Pasien (#15 TODO-CLINICAL → BE 🟢 / Wiring 🟢). 4 permintaan user: (1) hapus panel **Panduan Aturan Resep**; (2) buat contracts berdasarkan FE; (3) dropdown depo = fetch lokasi kategori Farmasi; (4) endpoints layered (API-RULES) → order muncul di halaman Farmasi.

- **Panduan Aturan Resep dihapus** — panel amber di IGD [ResepPasienTab](../src/components/igd/tabs/ResepPasienTab.tsx) + shared [ResepPane](../src/components/shared/medical-records/resep/ResepPane.tsx) (state `showGuide` dibuang); konstanta `ATURAN_PANDUAN` dihapus dari [resepShared.ts](../src/components/shared/resep/resepShared.ts).
- **DB** — `medicalrecord.ResepOrder` (header: depo snapshot + kondisi klinis + penulis + status/prioritas) + `ResepItem` (baris obat), append-only, FK→encounter.kunjungan cascade. **Tabel SENDIRI, bukan domain Order generik** (Daftar/Lab/Rad masih `ORDERS_MOCK`). Migrasi `20260619120000_init_medicalrecord_resep_order` via skrip drift-safe [apply-resep-order.mjs](../prisma/scripts/apply-resep-order.mjs) + `migrate resolve --applied` + generate.
- **Contracts** — [lib/schemas/resep/resep.ts](../src/lib/schemas/resep/resep.ts): `ResepOrderInput`/`ResepItemInput` (Zod, mirror form) + `ResepOrderBody` (z.input untuk pemanggil) + DTO `ResepOrderDTO`/`ResepItemDTO`/`ResepOrderFarmasiDTO` + `FarmasiResepQuery`.
- **Layering** — [resepDal](../src/lib/dal/resep/resepDal.ts) (nested-create items, join kunjungan→pasien utk worklist) → [resepService](../src/lib/services/resep/resepService.ts) (penulis = input/override atau actor; map DTO; unit enum→FE) → routes [kunjungan/:id/resep](../src/app/api/v1/kunjungan/[id]/resep/route.ts) (GET/POST, gate `clinical.resep`) + [farmasi/resep](../src/app/api/v1/farmasi/resep/route.ts) worklist (GET, gate `ancillary.farmasi.telaah`, scopeKunjungan:false). Pola persis `tindakanMedis`.
- **Depo dropdown** — [master/lokasi-farmasi](../src/app/api/v1/master/lokasi-farmasi/route.ts) (gate `clinical.resep:read`, reuse `ruanganService.listRuanganByType("Farmasi")` aktif saja) + client [lokasiFarmasi.ts](../src/lib/api/master/lokasiFarmasi.ts). Kedua form fetch depo dari master (fallback `DEPO_OPTIONS`).
- **Submit + Worklist** — `submitOrder`/`handleSend` POST saat `kunjunganId` UUID (pasien demo non-UUID tetap lokal); tombol "Mengirim…". Order DB muncul di [FarmasiBoard](../src/components/farmasi/FarmasiBoard.tsx) via `listFarmasiResep()` + mapper `mapDbResepOrder` ([farmasiShared.ts](../src/components/farmasi/farmasiShared.ts)) digabung di depan order mock.
- Follow-up → TECH_DEBT (§Farmasi): status workflow Farmasi belum persist utk order DB (board read-only); `bzaKode` belum dibawa dari item IGD; keputusan lebur/pisah vs domain Order generik. tsc bersih (`src/`), eslint 0 error.

## ✅ Selesai — Resep Pasien FE Decision-Support (shared IGD+RI+RJ) (2026-06-18)

Revisi form Resep (FE only — domain Order BE belum dibangun, status #15 TODO-CLINICAL tetap BE/Wiring ⬜). Resep **belum benar-benar 1 komponen**: IGD pakai [ResepPasienTab](../src/components/igd/tabs/ResepPasienTab.tsx) sendiri, RI/RJ pakai shared [ResepPane](../src/components/shared/medical-records/resep/ResepPane.tsx)+[ResepItemRow](../src/components/shared/resep/ResepItemRow.tsx) → enhancement diterapkan ke **kedua** jalur, logika/konstanta dibagi di lapisan shared.

- **Dropdown global** — Depo Farmasi + Signa/Waktu/Rute (edit inline) + Rute (form) pindah dari `<select>` native ke komponen [Select](../src/components/shared/inputs/Select.tsx) (portal popover, keyboard nav).
- **Dosis sekali minum** — field baru di form + edit inline; tampil di daftar/riwayat (`…/minum`). Field opsional `dosisSekali?` ditambah ke `ResepRIItem` ([data.ts](../src/lib/data.ts)) + `ResepItem` IGD.
- **Peringatan alergi obat dari anamnesis** — helper baru di [resepShared.ts](../src/components/shared/resep/resepShared.ts): `getAlergiObat(noRM, riwayatAlergiText?)` baca `ALLERGY_MOCK` (kategori "Obat", dari asesmenShared) + teks bebas `riwayatAlergi` (skip "tidak ada/diketahui"); `matchAlergiObat(namaObat, allergens)` cocok dua-arah + **sadar-golongan** via `FAMILY_SYNONYMS` (Penisilin→Amoxicillin/Ampicillin, NSAID, Sulfa, Aspirin). UI: banner "Alergi Obat Tercatat" di form + warning merah saat obat terpilih/ditambah cocok + badge "⚠ Alergi" persisten per-baris.
- **3 dropdown kondisi klinis** — Fungsi Ginjal (LFG, selalu) + Status Kehamilan + Status Menyusui (khusus ♀ / gender tak diketahui), konstanta `GINJAL/MENYUSUI/KEHAMILAN_OPTIONS` + `KondisiKlinis` di resepShared, panel [KondisiKlinisPanel](../src/components/shared/resep/ResepKlinisPanel.tsx) (highlight + catatan keamanan saat berisiko).
- **No. kontak DPJP** di bawah nama penulis resep — default **"-"** bila tak ada (`ResepPatient.dpjpKontak?`; detail klinis belum bawa nomor DPJP → "-").
- `ResepPatient` +`gender?`/`dpjpKontak?`; RI/RJ record tabs teruskan `gender`. tsc bersih (`src/`), eslint 0 error (warning sisa pre-existing).

## ✅ Selesai — Keperawatan: Evaluasi Shift → contracts table sendiri (Domain 9 Fase C) (2026-06-14)

> Fitur **Tambah Evaluasi Shift** (Riwayat Asuhan Keperawatan, tab Keperawatan IGD): dari blok JSONB di `AsuhanKeperawatan` (di-append via PATCH) → **tabel anak `medicalrecord.AsuhanEvaluasi`** dengan endpoint sendiri. 4 permintaan user: (1) dropdown shift + DatePicker → komponen global; (2) perawat = user login; (3) bangun contracts table + endpoints (API-RULES); (4) wiring FE↔BE. Detail → [TODO-CLINICAL.md](../TODO-CLINICAL.md) Domain 9 Fase C.

1. **Kontrak** — [medicalrecord.prisma](../prisma/schema/medicalrecord.prisma) model **`AsuhanEvaluasi`** (FK `asuhan_id`→`AsuhanKeperawatan` cascade · shift/subjektif?/objektif/statusLuaran · `waktu` timestamptz · perawat+author · **append-only** tanpa updatedAt/soft-delete · index `(asuhan_id, waktu)`). Relasi `AsuhanKeperawatan.evaluasiShift[]` **gantikan kolom JSONB `evaluasi`**. Migrasi `20260614150000_init_medicalrecord_asuhan_evaluasi` (CREATE + FK + **DROP COLUMN evaluasi**).
2. **Lapisan** — [Zod](../src/lib/schemas/keperawatan/asuhanKeperawatan.ts) `EvaluasiInput` (waktu? ISO · shift? · subjektif? · objektif wajib · statusLuaran · perawat?); DTO `EvaluasiShiftDTO` derive tanggal/jam dari `waktu` (TZ Asia/Jakarta) — `evaluasi` dibuang dari Input/Update asuhan. [DAL](../src/lib/dal/keperawatan/asuhanKeperawatanDal.ts) `createEvaluasi`/`listEvaluasi` + `include evaluasiShift` (urut waktu). [Service](../src/lib/services/keperawatan/asuhanKeperawatanService.ts) `addEvaluasi` (perawat=actor · shift derive bila kosong · sinkron `statusLuaran` parent → DTO ter-refresh) + `listEvaluasi`.
3. **Endpoint** — `/kunjungan/:id/asuhan-keperawatan/:itemId/evaluasi` GET (list) + POST 201 — gate **`clinical.keperawatan`** (read/create) + ABAC careUnit (route choke-point via `ItemParam`). [route](../src/app/api/v1/kunjungan/[id]/asuhan-keperawatan/[itemId]/evaluasi/route.ts) + client `addEvaluasiShift`/`getEvaluasiShift`.
4. **FE** — [AsuhanCard](../src/components/shared/medical-records/keperawatan/AsuhanCard.tsx) `EvaluasiForm`: **Tanggal & Waktu = `DateTimePicker`** (ganti `<input date>`+`<input time>`) · **Shift = `Select`** global (ganti `<select>`) · **Perawat = chip read-only sesi login** (no free-text). Callback `onAddEval(EvalDraft{waktu,...})`. [KeperawatanTab IGD](../src/components/igd/tabs/KeperawatanTab.tsx) `handleAddEval` → `addEvaluasiShift` (persisted) / lokal (mock igd-1) + `petugasLogin={session.namaTampil}`. RI copy ([rawat-inap/tabs/KeperawatanTab](../src/components/rawat-inap/tabs/KeperawatanTab.tsx), pakai shared AsuhanCard) ikut disesuaikan ke `EvalDraft` (build EvaluasiShift display lokal — tetap mock).
5. **Verifikasi** — `tsc` bersih (sisa error seed-script `.ts`-ext expected) · `eslint` 0 error (warning `_actor` precedent) · `migrate deploy`+`generate` · DB smoke (kolom benar · JSONB `evaluasi` ter-drop · index timeline · insert + FK-bogus 23503). **Sisa:** wiring RI/RJ penuh (punya copy AsuhanForm/Card sendiri) · verifikasi in-browser (AUTH_ENFORCE).

---

## ✅ Selesai — Rekam Medis Keperawatan (Domain 9: AsuhanKeperawatan persist + template DB) (2026-06-14)

> Tab **Keperawatan IGD** (`ehis-care/igd/{}`): dari state lokal → **persist ke DB** + template asuhan dari **DB `master.sdki`** (bukan mock hardcoded). 5 permintaan user: (1) tanggal→DateTimePicker global + perawat→user login; (2) rename "Katalog SDKI Cepat"→"Katalog Keperawatan (Template)"; (3) fetch katalog keperawatan utk template (SSR jika perlu); (4) auto-fill form saat pilih katalog; (6) contracts endpoint API-RULES; (7) wiring FE↔BE. Detail → [TODO-CLINICAL.md](../TODO-CLINICAL.md) Domain 9.

1. **Kontrak** — [medicalrecord.prisma](../prisma/schema/medicalrecord.prisma) model `AsuhanKeperawatan` (CRUD + soft-delete; blok dataMayor/dataMinor/intervensi/evaluasi = **JSONB**; kriteriaHasil text[]; verify co-sign; kodeSdki soft-ref `master.sdki`; tanggalInput timestamptz; perawat+author) + backref `Kunjungan.asuhanKeperawatan`. Migrasi `20260614130000_init_medicalrecord_asuhan_keperawatan`.
2. **RBAC resource BARU `clinical.keperawatan`** — [rbacShared.ts](../src/components/master/mapping/rbac/rbacShared.ts) leaf + grant Admin/Dokter/**Perawat (penulis utama)** r/c/u/d + migrasi `20260614140000_rbac_clinical_keperawatan`. Dipisah agar Perawat punya CREATE penuh tanpa membuka `clinical.rekammedis` shared. DB smoke: 4 perm · 3 role ×4.
3. **Lapisan** (per-tab) — [Zod](../src/lib/schemas/keperawatan/asuhanKeperawatan.ts) (Input/Update OPTIONAL murni → partial PATCH rapi; normalisasi di Service) · [DAL](../src/lib/dal/keperawatan/asuhanKeperawatanDal.ts) · [Service](../src/lib/services/keperawatan/asuhanKeperawatanService.ts) (assertKunjungan/assertMilik · perawat=resolveActorNama · clean list/data/intervensi/evaluasi · verifiedAt saat verified→true) · Routes `/kunjungan/:id/asuhan-keperawatan` GET/POST + `/:itemId` PATCH/DELETE (gate `clinical.keperawatan`, ABAC careUnit) · [client](../src/lib/api/keperawatan/asuhanKeperawatan.ts).
4. **Template konsumen klinis** — `GET /master/sdki-template` (gate `clinical.keperawatan:read`, `scopeKunjungan:false`) → `sdkiService.listTemplate()` (diagnosa Aktif, bentuk `SdkiCatalogItem`). [route](../src/app/api/v1/master/sdki-template/route.ts) + [client](../src/lib/api/master/sdkiTemplate.ts). Pola identik tindakan-tersedia/obat-tersedia.
5. **FE wiring** — [KeperawatanTab IGD](../src/components/igd/tabs/KeperawatanTab.tsx): UUID-guard `isPersisted`; mount load asuhan DB + catalog; persist create/update/verify/evaluasi/delete via API (mock igd-1 → lokal demo). [AsuhanForm shared](../src/components/shared/medical-records/keperawatan/AsuhanForm.tsx) (IGD-only): rename panel · `catalog` prop (DB) fallback `SDKI_CATALOG` · **DateTimePicker** tanggal · **perawat chip sesi login** (di-inject saat simpan, tanpa setState-in-effect) · auto-fill via `applyTemplate`. [AsuhanCard](../src/components/shared/medical-records/keperawatan/AsuhanCard.tsx): `fmtTanggal`. **SSR tak diperlukan** (tab lazy nested → client-fetch, mirror Rekonsiliasi).
6. **Verifikasi** — `tsc` bersih (sisa error seed-script `.ts`-ext expected) · `eslint` 0 error (warning `_actor` precedent) · `migrate deploy`+`generate` · DB smoke (JSONB+text[] parse · default verified/aktif · FK 23503 · RBAC grants). **Sisa:** wiring RI/RJ (punya copy AsuhanForm/Card sendiri) · import penuh dataset PPNI · verifikasi in-browser (AUTH_ENFORCE).

## ✅ Selesai — Master Katalog Keperawatan (SDKI/SLKI/SIKI) Backend + rename + auto-kode + SSR (2026-06-14)

> Sub-master **SDKI / SIKI / SLKI** dari mock → backend-backed (SSR-hybrid). 4 permintaan user: (1) **rename** tab+url "SDKI / SIKI / SLKI" (`/ehis-master/sdki`) → **"Katalog Keperawatan"** (`/ehis-master/katalog-keperawatan`); (2) **form Kode dihapus** → auto-gen `D.NNNN` + **DiscardDialog**; (3) contracts endpoint (API-RULES) + seed mock → DB + hapus mock; (4) hybrid SSR. Detail backend → [docs/BACKEND-MASTER-KATALOG-KLINIS.md §C.3](../docs/BACKEND-MASTER-KATALOG-KLINIS.md).

1. **Kontrak** — [sdki.prisma](../prisma/schema/sdki.prisma) `master.Sdki` (**katalog leaf** soft-delete; enum kategori/jenis/status TEXT pass-through; blok `data_mayor`/`data_minor`/`intervensi` = **JSONB**; `kriteria_hasil` = `text[]`; **kode `D.NNNN` auto** via `master.SdkiCounter` scope="D") + unique partial index `kode WHERE deleted_at IS NULL`. Migrasi `20260614120000_init_master_sdki`.
2. **Lapisan** — [schema](../src/lib/schemas/master/sdki.ts) (`CreateSdkiInput`/`Update`/`SdkiQuery`/`SdkiDTO`; kode TIDAK di input) · [DAL](../src/lib/dal/master/sdkiDal.ts) (CRUD + keyset list + `nextSdkiSeq` counter) · [Service](../src/lib/services/master/sdkiService.ts) (`list` actor-less SSR · kode auto `D.NNNN` dalam `transaction` · JSONB⇄DTO defensif) · Routes `GET/POST /master/sdki` + `PATCH/DELETE /:id` (gate **`master.katalog`**) · [client](../src/lib/api/master/sdki.ts).
3. **Seed + hapus mock** — [sdkiSeed.ts](../src/lib/master/sdkiSeed.ts) (data pindah dari mock; 27 diagnosa, kode resmi PPNI apa adanya) + [seed-sdki.mts](../prisma/scripts/seed-sdki.mts) (counter[D]=148 → entri baru D.0149). `SDKI_MOCK` **dihapus** dari [sdkiMock.ts](../src/lib/master/sdkiMock.ts) (tipe+helper tetap; `isSdkiValid` di-relax — kode server-owned). Konsumen Beranda → `SDKI_COUNT` indikatif (presedan `OBAT_COUNT`).
4. **FE rewrite SSR-hybrid** — [katalog-keperawatan/page.tsx](../src/app/ehis-master/katalog-keperawatan/page.tsx) (server, `sdkiService.list`) → [SdkiPage](../src/components/master/sdki/SdkiPage.tsx) (client `initial`/`prefetched` + CUD `/api` + `guardDirty` + [DiscardDialog](../src/components/master/sdki/DiscardDialog.tsx)). [IdentitasTab](../src/components/master/sdki/tabs/IdentitasTab.tsx): field Kode → **display read-only "Auto"** (D.NNNN saat simpan). Nav + Beranda quick-nav di-rename. Route lama `app/ehis-master/sdki/` dihapus.
5. **Verifikasi** — `tsc` clean (hanya error seed-script `.ts`-ext expected) · `eslint` 0 error (3 warning `_actor` = ABAC-seam, sama obat/tindakan) · `migrate deploy`+`generate`+seed · DB smoke (27 rows · JSONB resolve D.0077 · `nextSdkiSeq`→149→D.0149 · unique 23505). **Follow-up:** konsumen klinis KeperawatanTab masih `SDKI_CATALOG` mock (migrasi DB = task terpisah, analog obat-tersedia) · import penuh dataset PPNI · verifikasi in-browser (AUTH_ENFORCE).

## ✅ Selesai — Mapping Hub Formularium Backend (grant Obat ⇄ Ruangan) (2026-06-13)

> Sub-pane **Formularium** ([formularium/](../src/components/master/mapping/formularium/)) dari mock → backend-backed (SSR-hybrid), **di-redesign** jadi grant N:N **Obat ⇄ Ruangan (Location)** persis Layanan Unit (matriks baris Obat × kolom Ruangan). **Universal lintas penjamin** — tab penjamin & dimensi kelas dihapus (keputusan user: "semua bisa digunakan mau BPJS atau Umum"). Status di [docs/BACKEND-MAPPING.md](../docs/BACKEND-MAPPING.md) §6. Lihat memori [[project_mapping_hub_backend]].

1. **Iterasi-1 (override-on-default, lalu di-superseded)** — sempat dibangun sbg edge `(obat × penjaminKode × kelas) → allowed/alasan` upsert-by-triple (migrasi `20260613160000_init_master_formularium`). Atas arahan user diganti ke model per-UNIT.
2. **Kontrak FormulariumObat (grant)** — [formularium.prisma](../prisma/schema/formularium.prisma) `master.FormulariumObat` (`obatId` FK Restrict + `locationId` FK Restrict; `@@unique(obatId, locationId)` → **grant idempoten**; HARD delete; back-relation `Obat.formularium` + `Location.formularium @relation("FormulariumLokasi")`). Migrasi `20260613170000_formularium_to_unit` (DROP tabel bentuk lama yg masih kosong → CREATE grant). `prisma generate`.
3. **Lapisan (mirror LayananUnit)** — [schema](../src/lib/schemas/master/formularium.ts) (`GrantFormulariumInput`/`FormulariumQuery`/`FormulariumEdgeDTO {id,obatId,locationId,ruanganKode}`) · [DAL](../src/lib/dal/master/formulariumDal.ts) (`create`/`findByPair`/keyset list/`findObat`+`findLocation` guard, include `location.kode`) · [Service](../src/lib/services/master/formulariumService.ts) (`list` actor-less · `grant` idempoten guard obat+location · `revoke` hard-delete) · Route `GET/POST /master/formularium` + `DELETE /:id` (gate **`master.mapping`**, DELETE pakai action `update` — resource hanya punya read/update) · [client](../src/lib/api/master/formularium.ts) (`listAllFormularium`/`grantFormularium`/`revokeFormularium`).
4. **FE rewrite SSR-hybrid** — [formulariumShared.ts](../src/components/master/mapping/formularium/formulariumShared.ts) **reuse** helper grant-map + kolom-unit dari `layananShared` (`LayananMap`/`setPresence`/`hasLayanan`/`unitsFromTree`/`UNIT_CATEGORY_CFG`) + edge-cache per-sesi **TERPISAH** (anti-clobber dgn Layanan Unit). [FormulariumMatrix](../src/components/master/mapping/formularium/FormulariumMatrix.tsx) = baris Obat per-kategori × kolom Ruangan, sel grant, tri-state kolom/grup (violet). [FormulariumPane](../src/components/master/mapping/formularium/FormulariumPane.tsx) **reuse `LayananUnitTreePanel`** (filter show/hide kolom), grant/revoke optimistik + reconcile-on-mount + bulk kolom/baris/grup. SSR: [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) `obatService.list`+`formulariumService.list` → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) (`initialObat`/`initialFormularium`+`initialTree`) → Pane.
5. **Verifikasi** — `tsc`/`eslint` clean (2 warning `_actor` = ABAC-seam, sama layananUnitService) · `migrate deploy` (2 migrasi) · DB smoke (ROLLBACK): grant + unique-block 23505 + FK obat/location 23503 ✓. **Sisa**: mobile drill-down view (Layanan Unit punya `LayananUnitMobileView`; Formularium tabel scroll horizontal di mobile) · verifikasi in-browser (AUTH_ENFORCE).

## ✅ Selesai — Rekam Medis Tindakan Medis (persist recording per-kunjungan) (2026-06-12)

> Domain klinis BARU `medicalrecord.TindakanMedis` — pencatatan tindakan yang DILAKUKAN per kunjungan (jumlah + biaya snapshot) → hilir Billing. Melengkapi tab Tindakan IGD: recording yang tadinya state lokal kini **persist ke DB** saat kunjunganId UUID (pola `isPersisted` DiagnosaTab). BEDA dari `DiagnosaProsedur` (koding ICD-9 utk klaim) — ini operasional + harga.

1. **Kontrak** — [medicalrecord.prisma](../prisma/schema/medicalrecord.prisma) model `TindakanMedis` (kunjunganId FK Cascade · `tindakanId?` ref master · snapshot kode/nama/kategori · jumlah · **harga/penjaminKode/jenisRuangan beku saat dicatat** · pelaksana + authorUserId/PegawaiId · soft-delete) + back-relation `Kunjungan.tindakanMedis`. Migrasi `20260612070000_init_medicalrecord_tindakan_medis` (FK cross-schema → encounter.kunjungan).
2. **Lapisan** (per-tab, [[feedback_lib_folder_per_feature]]) — [schema](../src/lib/schemas/tindakanMedis/tindakanMedis.ts) (`TindakanMedisInput`/`Update`/`ItemParam`/`DTO`) · [DAL](../src/lib/dal/tindakanMedis/tindakanMedisDal.ts) (list/findById/create/update/softDelete) · [Service](../src/lib/services/tindakanMedis/tindakanMedisService.ts) (assertKunjungan + assertMilik · pelaksana = input override ATAU `resolveActorNama`) · Routes `GET/POST /kunjungan/:id/tindakan` + `PATCH/DELETE /:itemId` · [client](../src/lib/api/tindakanMedis/tindakanMedis.ts).
3. **RBAC** — `clinical.tindakan` di-grant **full CRUD** ke Admin/Dokter/Perawat (sebelumnya Dokter [r,c,u] · Perawat [r,u]) — klinisi pelaksana boleh tambah/ubah-jumlah/hapus(soft) di encounter aktif. Migrasi `20260612080000_rbac_clinical_tindakan_grants` + snapshot [rbacShared.ts](../src/components/master/mapping/rbac/rbacShared.ts). ABAC careUnit tetap men-scope per-kunjungan (route() choke-point clinical.*).
4. **FE wiring** — [TindakanTab](../src/components/igd/tabs/TindakanTab.tsx): `isPersisted = UUID_RE.test(patient.id)` → mount load `getTindakanMedis`; add → `addTindakanMedis` (snapshot tindakanId/kategori master/harga + penjamin UMUM/IGD); changeJumlah → `updateTindakanMedis` optimistik; remove → `deleteTindakanMedis` optimistik + reconcile (`reload`); indikator "Menyimpan…". Pasien IGD mock (igd-1, bukan UUID) tetap lokal — zero regresi.
5. **Verifikasi** — `tsc`/`eslint` clean · `prisma generate` · `migrate deploy` (2 migrasi) · DB smoke: struktur + FK Cascade + FK-bogus 23503 + insert/update-jumlah/soft-delete/list-filter + RBAC 4 aksi Admin/Dokter/Perawat semua ✓.

## ✅ Selesai — Mapping Hub Tarif Matrix Backend + Jenis Ruangan (2026-06-12)

> Sub-pane **Tarif Matrix** ([tarif/](../src/components/master/mapping/tarif/)) dari mock → backend-backed (SSR-hybrid), dengan dimensi kolom **"Jenis Ruangan"** (tier tarif) menggantikan kelas flat. Status & rasional di [docs/BACKEND-MAPPING.md](../docs/BACKEND-MAPPING.md) §5. **Migrasi `20260612060000` belum `migrate deploy`** (DB lokal mati saat dibuat — perlu deploy saat DB up).

1. **Kontrak TarifTindakan** — [tarifTindakan.prisma](../prisma/schema/tarifTindakan.prisma) `master.TarifTindakan` (`tindakanId` FK Restrict + `penjaminKode` string + `jenisRuangan` tier-string + `harga` Int rupiah; `@@unique(tindakanId, penjaminKode, jenisRuangan)` → **upsert by triple**; leaf tanpa version) + [schema](../src/lib/schemas/master/tarifTindakan.ts) (`UpsertTarifInput`/`TarifQuery`/`TarifTindakanDTO`) + [DAL](../src/lib/dal/master/tarifTindakanDal.ts) (`upsert` by triple, keyset list) + [Service](../src/lib/services/master/tarifTindakanService.ts) (`list` actor-less · `upsert` guard tindakan · `remove`) + Route `GET/POST /master/tarif-tindakan` + `DELETE /:id` (gate **`master.tarif`**, action update utk upsert) + [client](../src/lib/api/master/tarifTindakan.ts) (`listAllTarif`/`upsertTarif`/`deleteTarif`). Migrasi `20260612060000_init_master_tarif_tindakan` (additive). `prisma generate` (model baru).
2. **Dimensi "Jenis Ruangan" (derive dari tree)** — [tarifShared.ts](../src/components/master/mapping/tarif/tarifShared.ts) ditulis ulang: `JenisRuanganTier` (key `locationType[:kelas]`, mis. `IGD`·`RAWAT_INAP:KELAS_3`·`RAWAT_INAP:VIP`·`ICU`·`OK`) + `tiersFromTree(tree)` (analog `unitsFromTree` Layanan Unit — distinct tier dari Location aktif, exclude Penunjang & inap tanpa kelas) + `TIER_META`/`TIER_GROUP_CFG`. **Tarif per kelas, BUKAN per ruangan fisik** (kamar 3A-1 & 3B-2 sama Kelas III → harga sama).
3. **KRIS-aware per penjamin** — `validTiersForPenjamin(tipe, derived)`: BPJS → tier inap berkelas collapse jadi 1 `RAWAT_INAP:KRIS` (Perpres 59/2024) + tier non-inap tetap; Umum/Asuransi/Jamkesda → VIP/Kelas tetap, tanpa KRIS. KRIS = tier sintetis (tree tak punya kelas KRIS).
4. **FE rewrite SSR-hybrid** — [TarifPane](../src/components/master/mapping/tarif/TarifPane.tsx): baris = Katalog Tindakan DB (`tindakanRecordsFromDTO`, persis Layanan Unit), kolom = `visibleTiers` per penjamin, sel = harga edge; edit inline → **upsert (>0) / delete (≤0) optimistik** + reconcile (`dirtyRef` guard, `listAllTarif` re-seed) + toast; Bulk Update % = loop upsert sel terisi. [TarifMatrix](../src/components/master/mapping/tarif/TarifMatrix.tsx) kolom dari `tiers` prop (bukan `KELAS_LIST`). SSR: [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) `tarifTindakanService.list` → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) `initialTarif` → Pane (`tindakan`/`tree`/`tarif`).
5. **Keputusan model** (konfirmasi user): derive tier dari tree · KRIS+klasik valid-per-penjamin · `penjaminKode` = kode string (master Penjamin backend menyusul Tier 3, belum FK). `tsc`/`eslint` clean. Lihat memori `project_tarif_jenis_ruangan`.
6. **Fix casing key tier** (2026-06-12) — key META inap `RAWAT_INAP:KELAS_3` → `RAWAT_INAP:Kelas_3` (sama persis enum `LocationKelas`); sebelumnya tier Kelas nyasar ke "Lainnya" (fallback) karena `RAWAT_INAP:${kelas}` tak cocok. Murni FE, key tersimpan DB sudah benar. Verifikasi live: 6 tier (IGD/Kelas 3/2/1/VIP/ICU) semua cocok.
7. **Flat-rate per tindakan** (2026-06-12) — tombol `=` per baris matriks ([TarifMatrix](../src/components/master/mapping/tarif/TarifMatrix.tsx) `FlatRateButton` popover) → `handleFlatRate(tindakanId, harga)` di Pane samakan 1 harga ke SEMUA tier sheet penjamin aktif (batched upsert optimistik + toast). Untuk tindakan ber-harga seragam lintas ruangan/kelas (pasang infus, EKG, akses IV).

## ✅ Selesai — Tindakan IGD Redesign + Konsumen Klinis `tindakan-tersedia` (2026-06-12)

> Tab **Tindakan IGD** ([TindakanTab](../src/components/igd/tabs/TindakanTab.tsx)) di-redesign mirip tab Diagnosa + jadi konsumen pertama Layanan Unit dari sisi klinis. Status backend Mapping Hub didokumentasikan di [docs/BACKEND-MAPPING.md](../docs/BACKEND-MAPPING.md).

1. **Endpoint klinis `tindakan-tersedia`** — `GET /api/v1/master/tindakan-tersedia` baca katalog tindakan **ter-assign** (join `LayananUnit → Tindakan`, distinct + `ruanganKodes[]`, opsional `?ruanganKode=`). Gate **`clinical.tindakan:read`** (Dokter/Perawat) — BUKAN `master.katalog`/`master.mapping` (perawat tak punya hak master); `scopeKunjungan:false` (katalog murni tanpa konteks kunjungan). **Read-only over tabel existing → ZERO migrasi.** Lapisan: [schema](../src/lib/schemas/master/tindakanTersedia.ts) · DAL [`listAssignedTindakan`](../src/lib/dal/master/layananUnitDal.ts) (filter `active`+`deletedAt null`) · Service [`listTindakanTersedia`](../src/lib/services/master/layananUnitService.ts) (agregasi distinct, actor-less) · [route](../src/app/api/v1/master/tindakan-tersedia/route.ts) · [client](../src/lib/api/master/tindakanTersedia.ts). **Lab & Rad tereksklusi** by-design (Lab = tabel paralel `LayananUnitLab`; Rad bukan entri LayananUnit → menu Order tersendiri).
2. **TindakanTab redesign (mirip Diagnosa)** — search-first (dropdown tergrup per kategori) → **kartu konfigurasi** (jumlah stepper + pelaksana **prefilled dari sesi login**) → daftar **tergrup** Diagnostik/Terapi/Prosedur (aksen sky/emerald/amber, animasi add/remove) + **sidebar Ringkasan** (jenis + total qty + bar komposisi + nota hilir Billing/Resume). State states: loading · error (tak login/tanpa hak) · **katalog kosong** (arahkan ke Mapping Hub → Layanan Unit) · belum ada tindakan. Palet indigo/sky/emerald/amber (tanpa ungu). `TINDAKAN_MOCK` lama tak lagi dipakai di tab ini. Item simpan `tindakanId` (forward-ready persist). **Recording = state lokal** (belum ada endpoint persist; detail IGD masih mock).
3. **Verifikasi identitas dari user login** — [IdentitasVerifikasiBanner](../src/components/shared/medical-records/IdentitasVerifikasiBanner.tsx) tambah prop opsional `defaultPerawat`: bila ada (dari sesi) → field perawat jadi **chip read-only** bertanda "Sesi Login" (verifikator = identitas login, tak bisa diketik manual); fallback input manual bila sesi null (RI tak terpengaruh). [IGDRecordTabs](../src/components/igd/IGDRecordTabs.tsx) `useSession()` → `defaultPerawat={session?.namaTampil}`.
4. **Sisa (forward-ready)** — scoping per-ruangan pasien (endpoint sudah terima `?ruanganKode=`; FE belum kirim karena ruangan pasien IGD masih mock) · persist recording tindakan ke rekam medis (domain `clinical.tindakan` per-kunjungan). `tsc`/`eslint` clean.

## ✅ Selesai — Katalog Lab → Layanan Unit Mapping + Matrix Bulk Select-All (2026-06-12)

> Katalog Laboratorium kini dapat dipetakan ke Ruangan di **Mapping Hub → Layanan Unit** sebagai grup baris **"Tindakan Laboratorium"** (matriks terpadu Tindakan+Lab). Backend = tabel **paralel** `master.LayananUnitLab` (bukan polymorphic — tetap berdiri-sendiri sampai federasi chargemaster CM2/CM5). Lihat memori `project_lab_catalog_model`.

1. **Backend LayananUnitLab (contracts paralel)** — model [layananUnit.prisma](../prisma/schema/layananUnit.prisma) `master.LayananUnitLab` (LabTest⇄Location, hard-delete join, `@@unique([labTestId, locationId])` → grant idempoten, FK `Restrict`, back-relation `LabTest.layananUnits` + `Location.layananLab`) mengikuti pola `LayananUnit` · [schema](../src/lib/schemas/master/layananUnitLab.ts) (`GrantLayananLabInput`/`LayananLabQuery`/`LayananUnitLabEdgeDTO`) · [DAL](../src/lib/dal/master/layananUnitLabDal.ts) (`findByPair` keyed `labTestId_locationId`, keyset cursor) · [Service](../src/lib/services/master/layananUnitLabService.ts) (`list` actor-less SSR · `grant` guard lab+location idempoten · `revoke` hard-delete) · Route `GET/POST /master/layanan-unit-lab` + `DELETE /:id` (RBAC `master.mapping`) · [client](../src/lib/api/master/layananUnitLab.ts) (`listAllLayananLab` cursor loop). Migrasi `20260612050000_init_master_layanan_unit_lab` (additive-manual + `migrate deploy`). DB smoke: tabel + 4 index + 2 FK OK; 38 tes lab aktif.
2. **FE unified row/edge model** — [layananShared.ts](../src/components/master/mapping/layanan/layananShared.ts) digeneralisasi: `LayananRow` (`kind` tindakan|lab) + `LayananEdge` (`rowId`+`kind`) → Matrix/MobileView jadi jenis-agnostik. `ROW_KATEGORI_CFG`/`ORDER` tambah `Laboratorium` (cyan); `rowsFromTindakan`/`rowsFromLab` (chip `${n} par` cyan)/`groupRowsByKategori`; `tindakanToEdge`/`labToEdge`/`mapFromEdges`. Counter di-rename `countUnitPerTindakan`→`countUnitPerRow`, `countTindakanPerUnit`→`countRowsPerUnit` (cascade ke Matrix/MobileView/TreePanel). Cache module-level digeneralisasi ke `LayananEdge`.
3. **Pane routing per-kind** — [LayananUnitPane](../src/components/master/mapping/layanan/LayananUnitPane.tsx) terima `lab`+`layananLab`; `allRows = rowsFromTindakan ∪ rowsFromLab`, `kindById`; `persistCell` rute grant/revoke per kind (`grantLayananLab`/`revokeLayananLab` vs tindakan); reconcile fetch `listAllLayanan` + `listAllLayananLab` paralel (fallback `listLabTest({status:"Aktif"})`). SSR hybrid: [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) tambah `labTestService.list` + `layananUnitLabService.list` (`Promise.allSettled`) → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) (`initialLab`/`initialLayananLab`) → Pane.
4. **Bulk select-all 3 level (tri-state)** — selaras pola `VisCheckbox` TreePanel, aksen teal: **(a) per kolom/Location** — checkbox tri-state di header kolom matriks (`handleToggleColumn`), state dari `activeRows` (baris lolos filter kategori). **(b) per baris** — klik judul baris (sudah ada). **(c) per grup kategori** — header tiap `KategoriBlock` jadi tombol tri-state (`handleToggleGroup`: semua baris grup × semua kolom tampak, batched 1 `applyChanges`), termasuk grup "Tindakan Laboratorium". Mobile drill-down ([LayananUnitMobileView](../src/components/master/mapping/layanan/LayananUnitMobileView.tsx)) dapat paritas tombol **"Semua"** per grup utk unit terpilih (`handleToggleGroup(rowIds, unitKode, granted)`). Semua batched → satu update optimistik + persist paralel + revert-sel-gagal. `tsc`/`eslint` clean.

## ✅ Selesai — Katalog Tindakan Backend + Mapping Hub Layanan Unit (2026-06-12)

> Master **[/ehis-master/katalog-tindakan](../src/app/ehis-master/katalog-tindakan/)** jadi backend-backed (layered + SSR hybrid), dan Mapping Hub **Layanan Unit** konsumsi data real. Spec: [docs/BACKEND-MASTER-KATALOG-KLINIS.md](../docs/BACKEND-MASTER-KATALOG-KLINIS.md) §A. Tech debt kode `unitDefault`↔Location → chargemaster CM2.

1. **Katalog Tindakan backend (contracts)** — [tindakan.prisma](../prisma/schema/tindakan.prisma) (`Tindakan` + enum `TindakanKategori`/`TingkatKompleksitas`, **katalog leaf tanpa version**, soft-delete) + [schemas/master/tindakan.ts](../src/lib/schemas/master/tindakan.ts) (Zod+DTO mirror `TindakanRecord`) + [tindakanDal.ts](../src/lib/dal/master/tindakanDal.ts) + [tindakanService.ts](../src/lib/services/master/tindakanService.ts) (`list` actor-less, status⇄active) + Route GET/POST/PATCH/DELETE (`master.katalog`) + [api/master/tindakan.ts](../src/lib/api/master/tindakan.ts). Mengikuti pola sibling **ICD**. Migrasi `20260612000000_add_master_tindakan` (additive-manual + `migrate deploy`).
2. **FE swap SSR hybrid** — [page.tsx](../src/app/ehis-master/katalog-tindakan/page.tsx) Server Component panggil `tindakanService.list` langsung → `initial`/`prefetched`; [KatalogTindakanPage](../src/components/master/katalog-tindakan/KatalogTindakanPage.tsx) seed `useMasterCrud` + CUD via client (`commit`/`removeLocal`) + toast + DiscardDialog + fallback client fetch. `TINDAKAN_MOCK` dikosongkan.
3. **Form Katalog Tindakan (UI)** — toggle **Status KPTL** (`ToggleSwitch` + `SectionGroup` reveal) buka Nomor KPTL + Tingkat Kompleksitas (kini **opsional**, default null) · **dropdown Kategori kustom** (dot warna + popover beranimasi, klik-luar/Escape) · **DiscardDialog** (pola master/icd) ganti `window.confirm` saat batal/pindah dirty.
4. **Kode ICD-9 opsional** — form edit `required`→`hint="Opsional"`; `isTindakanValid` hanya cek nama; kontrak sudah `.optional()` + Prisma `@default("")`.
5. **5 kategori tambahan** — `Non Kategori`·`Prosedur Bedah`·`Prosedur Non Bedah`·`Keperawatan`·`Tindakan Invasif` lintas-lapis (prisma enum + migrasi `20260612010000` `ADD VALUE IF NOT EXISTS` + union FE + `KATEGORI_CFG`/`KATEGORI_ORDER` + Zod + DAL + IGD `IGD_KATEGORI_MAP`).
6. **Mapping Hub → Layanan Unit konsumsi real** — baris = tindakan DB; **kolom = Location (Ruangan) aktif** dari master Unit & Ruangan (`unitsFromTree`, selaras SDM `ruanganFromTree`). SSR hybrid: [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx) fetch tindakan+tree (`Promise.allSettled`) → [MappingHubPage](../src/components/master/mapping/MappingHubPage.tsx) → [LayananUnitPane](../src/components/master/mapping/layanan/LayananUnitPane.tsx) (fallback `getTree`+`listTindakan`). Seed default di-scope ke kode unit valid (stat akurat). `LayananUnitMatrix` kolom dari prop. Helper baru [layananShared.ts](../src/components/master/mapping/layanan/layananShared.ts): `unitsFromTree`/`tindakanRecordsFromDTO`.
7. **Layanan Unit — tree filter kolom + persist FULL** — (a) **Panel tree filter** [LayananUnitTreePanel](../src/components/master/mapping/layanan/LayananUnitTreePanel.tsx) (Unit→Ruangan collapsible, checkbox tri-state per unit, fokus 1-klik, chip jenis Klinis/Poli/Penunjang, Semua/Kosong) → mempersempit kolom saat Location banyak; toggle baris hanya menyangkut kolom tampak. (b) **Persist backend** — model join [layananUnit.prisma](../prisma/schema/layananUnit.prisma) `master.LayananUnit` (Tindakan⇄Location, hard-delete, unik, NO version, pola `PenugasanRuangan`) + [schema](../src/lib/schemas/master/layananUnit.ts)/[DAL](../src/lib/dal/master/layananUnitDal.ts)/[Service](../src/lib/services/master/layananUnitService.ts) (`list` actor-less · `grant` idempoten · `revoke`) + Route `GET/POST /master/layanan-unit` + `DELETE /:id` (RBAC `master.mapping`) + [client](../src/lib/api/master/layananUnit.ts) (`listAllLayanan` loop). Migrasi `20260612030000_init_master_layanan_unit`. (c) **Matriks ter-wire** — kolom bawa `id` Location → `kodeToId`; toggle sel/baris/kolom = `applyChanges` optimistik → grant/revoke paralel → **revert sel gagal** + toast; index `${tindakanId}|${ruanganKode}→edgeId` ([layananShared.ts](../src/components/master/mapping/layanan/layananShared.ts) `mapFromEdges`/`edgeKey`/`setPresence`); seed `LayananMap` dari edge SSR (`layananUnitService.list` di [mapping/page.tsx](../src/app/ehis-master/mapping/page.tsx)); indikator **auto-save**; "Reset Default" (jalur `unitDefault` usang) dibuang. DB smoke: insert+unique-block+FK OK.

## ✅ Selesai — RBAC Prosedur ICD-9 + Record Bus Reaktivitas (2026-06-11/12)

1. **Split prosedur ICD-9** — resource `clinical.prosedur` (read/create/delete) terpisah dari `clinical.diagnosa` (ICD-10) → **Perawat boleh input ICD-9** tanpa hak tulis ICD-10. Endpoint `diagnosa/prosedur/*` re-gate + grant Perawat (`clinical.diagnosa:read` + `clinical.prosedur:*`). Migrasi `20260611250000_rbac_split_prosedur_icd9`. Lihat memori `project_rbac_rekammedis_and_receive`.
2. **Record Bus** [lib/realtime/recordBus.ts](../src/lib/realtime/recordBus.ts) — sinkron header↔tab tanpa refresh (`useSyncExternalStore`, key kunjungan+domain). TTVTab simpan → emit `observation` → PatientHeader re-fetch vitals. Calon sink SSE lintas-user.

## ✅ Selesai — Master Pengguna & Pegawai Backend + Wiring (2026-06-05)

> Tabel **[/ehis-master/pengguna](../src/app/ehis-master/pengguna/)** tersambung penuh ke DB (akun real + pegawai). Layered **Route→Service→DAL→Prisma**, multi-schema `master` + `auth`. Provisioning akun saja — **login/JWT belum** (`getActor()` = DEV actor). Tech debt: [TECH_DEBT.md](../TECH_DEBT.md#pengguna--pegawai-backend-wired-2026-06-05).

1. **Kontrak Pegawai disamakan dgn form** — enum `StatusPegawai` → `ASN/Outsourcing/Honorer/Magang/Mitra` (migrasi data-preserving remap PNS|PPPK→ASN, Kontrak→Outsourcing) + kolom `agama`, `profesi` (sumber kebenaran Dokter/Perawat/…), + DTO `punyaAkun` (relasi balik `auth.User`). `isDokter` diturunkan dari profesi∈{Dokter,Dokter Gigi,Dokter Spesialis} ∨ practitionerId. Migration `20260604140000_pegawai_align_status_agama_profesi`.
2. **API Pegawai (CRUD wired)** — [pegawai.ts](../src/lib/api/pegawai.ts): `createPegawai` (form→CreateInput mapper, buang field kosong) · `listPegawai` · `getPegawai` (detail) · `updatePegawai` (PATCH + `expectedVersion`). Endpoint `GET/POST/PATCH/DELETE` di route pegawai.
3. **Auth provisioning** — schema `auth.*` diimplementasi: hash [password.ts](../src/lib/crypto/password.ts) (scrypt, swappable argon2id) · Zod [user.ts](../src/lib/schemas/user.ts) · DAL [userDal.ts](../src/lib/dal/userDal.ts) (username citext-unik, 1 akun/pegawai, resolve key→Role, list) · Service [userService.ts](../src/lib/services/userService.ts) (zero-orphan, createUser, assignRoles transaksional, listUsers) · Route `GET/POST /auth/users` + `PATCH /auth/users/:id/roles` · seed 9 Role (migration `20260604150000_seed_auth_roles`).
4. **Wizard "Tambah Pengguna" 3-step WIRED** — Step 1 `POST /master/pegawai` · Step 2 `POST /auth/users` (hash password) · Step 3 `PATCH …/roles` (assign peran+status; map status FE Aktif/Suspended/Non_Aktif → server Active/Suspended/Locked). Tiap step toast sukses; error CONFLICT/VALIDATION di banner.
5. **Tabel real + baris kuning** — akun real dari `GET /auth/users` (mock `PENGGUNA_MOCK` dihapus) digabung pegawai `punyaAkun:false` sebagai **baris kuning soft** ("Belum punya akun") + stat "Belum Berakun". Menu ⋮ baris kuning: **"Buatkan Akun"** (wizard mode provisioning, mulai Step 2 dgn pegawaiId existing, Step 1 di-skip) + **"Ubah Data Pegawai"**.
6. **Ubah Data Pegawai** — [PegawaiEditModal](../src/components/master/pengguna/PegawaiEditModal.tsx): `GET` detail (prefill) → PATCH `expectedVersion` (NIK locked/masked, version guard → CONFLICT_VERSION). Ada juga di menu baris akun.
7. **Menu aksi via portal** — `RowActionsMenu` (createPortal + `usePopover` fixed-position) → dropdown lepas dari `overflow` tabel (fix menu terpotong/merusak layout). Hapus plumbing `openMenuId` lama.
8. **Unit test** — [pegawaiService.test.ts](../src/lib/services/pegawaiService.test.ts) 19 + [userService.test.ts](../src/lib/services/userService.test.ts) 8 = **27 pass**. **Smoke test live** semua endpoint (create→assign→list→GET detail→PATCH update+isDokter derive→CONFLICT/CONFLICT_VERSION/VALIDATION).

## ✅ Selesai — Registration Backend Integration RJ (2026-06-04)

> Backend nyata pertama (layered **Route→Service→DAL→Prisma** + PostgreSQL multi-schema). Spec: [docs/BACKEND-PATIENT.md](../docs/BACKEND-PATIENT.md) · [docs/BACKEND-ENCOUNTER.md](../docs/BACKEND-ENCOUNTER.md). Roadmap [TODO-REGISTRASI.md](../TODO-REGISTRASI.md#phase-reg-be--backend-integration-loket--db-2026-06-04) Phase REG-BE.

1. **No. RM `YYMMNNNN`** — format `26060001` (YY+MM+seq) reset/bulan. Counter table `pendaftaran.rm_counter` + atomic upsert (`ON CONFLICT … RETURNING`), anti-race (uji 10-serentak: 0 duplikat) + `noRm @unique` backstop. Periode zona WIB. Migration `20260602140000_rm_counter` + model `RmCounter`.
2. **Pasien API** — `patientService`/`patientDal`: `POST /patients` dedup-first (NIK/paspor blind-index → existing, anti double-MRN) · `GET /patients` (NIK/RM exact + nama trigram cursor) · `GET /patients/:id` · `PATCH /patients/:id` complete (version guard) · **`PATCH /patients/:id/penjamin`** (upsert by tipe + set primer, single-primary invariant `pasien_penjamin_one_primer_uq`; nomor absen = skip anti-korupsi masked).
3. **Kunjungan API (RJ)** — `kunjunganService`/`kunjunganDal`: `POST /kunjungan` register RJ (wajib `dataLengkap`) · `GET /kunjungan` worklist (unit/status/**patientId** cursor, listInclude≠detailInclude split) · `GET /kunjungan/:id`. Spine `encounter.Kunjungan` = sumbu tunggal. noKunjungan `RJ/2026/NNNNN` sequence atomik.
4. **SEP mock (BPJS RJ)** — `bpjsService`/`bpjsDal`: V-Claim belum di-hit → SEP digenerate lokal (Rujukan+SEP, noSep `{ppk}{yymmdd}V{seq}`) dalam transaksi yang sama; tersimpan DB + cetak A4 (`SepCetak`). Migration `20260602130000_encounter_kunjungan_sequences`.
5. **Lifecycle worklist (state machine)** — `PATCH /kunjungan/:id/status` transisi `checkIn/call/recall/receive/complete/cancel/reopen` (callState/recallCount/selesaiAt immutable), version-guarded 2-lapis (422 ilegal · 409 stale). Board RJ `RJBoardLive`: kunjungan API → kartu, aksi Panggil/Terima/Selesai/Batal/Ulang → transisi server + patch idempoten; kartu seed demo tetap queue mock (ruang id terpisah, nol regresi).
6. **Wiring modal + dashboard** — DaftarKunjunganModal fungsional (`registerKunjungan` + toast + cetak SEP + validasi + guard demo). Riwayat dashboard fetch `GET /kunjungan?patientId` → `dtoToKunjunganRecord` (format mock + `detailPath`), replace idempoten + **guard post-sukses (StrictMode-safe)**. Resolver muat pasien DB **by noRM** (link Beranda/KunjunganHeader). Jaminan: persist BPJS terverifikasi (No.Kartu enc + kelas → primer, jaminan ikut kunjungan terakhir) + tab tampil tipe/No.Kartu masked/kelas/No.SEP. **Modal Ubah Penjamin → 3 jenis** (Umum/Mandiri · BPJS/JKN · Asuransi Lainnya; subtipe PBI/Non-PBI dipertahankan). Backfill data lama dari SEP.

**Infra ditegakkan:** envelope `{ok,data,message,meta}` · `route()` wrapper (auth→RBAC→Zod→handler) · `AppError`/`handleError` · cursor pagination `(createdAt,id)` · optimistic concurrency `version` · soft-delete · PII AES-256-GCM + HMAC blind-index · clock seam injectable · DEV actor (auth belum). `tsc` clean. **Sisa:** board realtime (SSE) · PasienBaru submit→API · IGD/RI unit · nama DPJP (master Dokter) · Invoice draft · Antrean · Auth/RBAC nyata.

---

## ✅ Selesai — Rawat Inap Tabs (Semua)

1. **Asuhan Keperawatan** (`tabs/KeperawatanTab.tsx`) — SDKI katalog 15 dx + auto-fill, evaluasi inline per shift, status luaran badge (Teratasi/Sebagian/Belum/Dipantau), SLKI kriteria hasil, verifikasi supervisor. Sub: `keperawatan/AsuhanForm.tsx` + `AsuhanCard.tsx` + `keperawatanShared.ts`
2. **Pemeriksaan Fisik** (`tabs/PemeriksaanTab.tsx`) — Status generalis pills, 11 sistem head-to-toe accordion, quick-normal template, temuan abnormal checklist, body map, riwayat harian collapsible. Sub: `pemeriksaan/StatusFisikPane.tsx` + `BodyMapPane.tsx` + `RiwayatPane.tsx`
3. **Intake / Output** (`tabs/IntakeOutputTab.tsx`) — Entri per shift (Oral/IV/NGT/Transfusi + Urine/Drainase/Feses/Muntah/Perdarahan), IWL auto-calc (BB×10+koreksi demam), balance, target/restriksi DPJP + progress bar, riwayat multi-hari collapsible. Sub: `intakeOutput/{EntriPane,RingkasanPane,RiwayatPane,ioShared}`
4. **Resep & Obat** (`tabs/ResepTab.tsx`) — 3 sub-tab: Resep Aktif (ObatSearch autocomplete + HAM badge, draft→confirm, Kirim Order, riwayat+salin) · MAR Harian (grid 7-hari × 3-shift, dropdown `fixed`, Panduan Pencatatan) · Rekonsiliasi (SNARS PP 3.1). Shared: `shared/resep/{resepShared,ObatSearch,ResepItemRow}`
5. **Order Lab** (`tabs/OrderLabTab.tsx`) — thin wrapper → `shared/medical-records/OrderLabTab.tsx`. Mock RM-2025-003 (BNP/Ureum/Kreatinin + riwayat abnormal)
6. **Order Radiologi** (`tabs/OrderRadTab.tsx`) — thin wrapper → `shared/medical-records/OrderRadTab.tsx`. Mock RM-2025-003 (Thorax PA + Echo GJK)
7. **Konsultasi Antar SMF** (`tabs/KonsultasiTab.tsx`) — SBAR 4-field + closed-loop (Terkirim→Diterima→Dijawab→Selesai) + 22 SMF dropdown + response timer + CPPT auto-notif + Framer Motion. Sub: `konsultasi/{RequestPane,DetailPane,konsultasiShared}`. Mock RM-2025-003 (GIZ Selesai + RM Dijawab)
8. **Discharge Planning** (`tabs/DischargePlanTab.tsx`) — 3-step stepper (Fase 1 sky: Asesmen MRS / Fase 2 emerald: Edukasi Harian / Fase 3 amber: Checklist H-1 Pulang), `DischargeHeader`, Framer Motion direction-aware, `StepChecklist` (10 item, animated donut), `FinalizeBanner`, DPJP sign-off. Mock RM-2025-003 (7-day). Sub: `discharge/{dischargeShared,StepAsesmen,StepEdukasi,StepChecklist}`
9. **Pasien Pulang** (`tabs/PasienPulangTab.tsx`) — Header orange + 5 sub-tab: Status Kepulangan (4 pilihan + APS warning) · Obat & Jadwal (HAM badge, 22 POLI_OPTIONS, FKTP toggle) · Surat-surat (5 jenis, conditional visibility, terbitkan/cetak) · Resume Medik (klaim BPJS/INA-CBG, prerequisite gate, auto-aggregated TTV/Lab/Rad/MAR/Tindakan, DPJP sign-off, print INA-CBG) · Resume Pulang (salinan pasien PMK 24/2022, print). Sub: `pasienPulang/{pasienPulangShared,StatusPane,ObatJadwalPane,SuratPane,ResumeMedikPane,ResumeMedisPane}`

---

## ✅ Selesai — Gap Kritis

- **Asesmen Awal RI (MRS)** — Tab baru RI: 5 sub-tab (Anamnesis / Riwayat Medis / Alergi / Skrining Gizi / Penilaian Risiko), per-tab completion dots, global progress bar %, Framer Motion direction-aware, SNARS AP 1.1–1.5. Shared di `shared/asesmen/`. PenilaianRisikoPane: tab-per-skala (Barthel/Morse/Braden) + chip options + dashed border. Bug fix: AnamnesisPaneRI form text invisible → `text-slate-900`.
- **Redesign /ehis-care/igd page** — `IGDBoard`: DPJP filter dropdown, pagination 9/hal, AnimatePresence. `PatientCard`: seluruh card clickable Link, urgency indicator pulsing P1/P2, boarding badge ≥6 jam. `IGDRuanganPanel`: collapse toggle + summary chips.
- **Skala Nyeri di TTVTab** — `PainScale` component interaktif (grid 11 tombol NRS 0–10, warna per level) + read-only di history. SNARS AP 1.2 ✅
- **SBAR Transfer IGD→RI** — `SBARTransferPanel.tsx` (497 ln): 4 seksi SBAR warna, progress bar, auto-populate TTV+GCS+NRS+diagnosa, read-back gate. Refactor `PasienPulangTab.tsx` (1271→472 ln, split 7 file). SKP 2 ✅
- **SBAR Serah Terima Shift (Handover)** — `HandoverTab.tsx` (RI) + `handover/`: date nav prev/next, 3 shift pills, `HandoverCard` (collapsible SBAR + TTV strip), `HandoverForm` (SBAR 4-seksi, auto-populate TTV, progress bar, canSubmit gate). Mock RM-2025-003 (4 entry). SKP 2 ✅

---

## ✅ Selesai — Tier 1

- **Informed Consent (IC)** — shared `InformedConsentTab.tsx` + `informedConsent/` sub-components. Template per tindakan, TTD + saksi + nomor IC. PMK 290/2008 · HPK 2.1–2.2
- **Handover IGD** — `shared/medical-records/HandoverTab.tsx` dijadikan shared. RI + IGD thin wrappers. `HandoverPatient` interface dengan `subtitle: string` + `badge?: string`. Mock RM-2025-005 (2 entry Siang+Malam). SKP 2 ✅
- **Monitoring Observasi Terjadwal IGD** — shared `TTVTab.tsx`: prop `triage?: TriageLevel` → `TRIAGE_OBS` config (P1=15mnt/P2=30mnt/P3/P4=60mnt), obs strip (next-due chip, pulsing overdue alert), form ganti shift→jam input, timeline `hideShift`, `timeToShift()` helper. IGD wrapper: pass `triage={patient.triage}`. SNARS AP 2 · PMK 47/2018 ✅

---

## ✅ Selesai — Tier 2 (Care Plan / RAT)

- **Rencana Asuhan Terintegrasi (CarePlanTab)** — tab baru RI disisipkan antara Asesmen Awal & CPPT. `carePlanShared.ts`: types (`PhaseId/PhaseStatus/MasalahEntry/PPASection/PhaseData/CarePlanData`), `PHASE_DEFS` (3 fase: Admisi sky · Perawatan indigo · Pre-Discharge emerald), `STATUS_CFG`, `emptyPhase()/emptyCarePlan()`. `PhaseSection.tsx`: accordion per fase — header (icon+label+status spring-badge+centang emerald AnimatePresence+tanggal range+chevron rotate), body height 0→auto (tanggal mulai/selesai, PPAPanel×2 DPJP+Perawat grid target/intervensi textarea, evaluasi, footer status select+updatedBy+Simpan). `CarePlanTab.tsx`: `ProgressHeader` animated width bar + spring-scale badge, `MasalahPanel` (list stagger AnimatePresence, add via Enter/button, hapus ×), 3 PhaseSection accordion (one-open-at-a-time), `SignOffBanner` amber→hijau setelah DPJP verifikasi. `RIRecordTabs`: icon `Target`, posisi setelah asesmen-awal. TypeScript 0 error. SNARS PP 1 ✅
- **Tech debt 4 item dicatat**: link DiagnosaTab → RAT, template per diagnosis, Multi-PPA, audit trail revisi.

---

## ✅ Selesai — Tier 2 (Shared Rekonsiliasi)

- **Shared RekonsiliasTab (IGD + RI)** — single source of truth `shared/medical-records/RekonsiliasTab.tsx`. 4 file baru: `rekonsiliasiShared.ts` (types `RekonContext/RekonPhase/Keputusan/ObatEntry/RekonData`, `REKON_PHASES` config berbeda label per context, `KEPUTUSAN_CFG` color map, `emptyEntry()/emptyRekon()` factories) · `ObatEntryRow.tsx` (grid compact row: ObatSearch + dosis + keputusan select + expand toggle + delete, AnimatePresence HAM badge spring-scale, expand panel 4-field + gantiDengan conditional + alasan) · `RekonSection.tsx` (accordion per fase: header dengan HAM count badge + selesai spring-check + rotating chevron, height 0→auto panel, tanggal+petugas+obat list+catatan, simpan footer) · `RekonsiliasTab.tsx` (ProgressHeader animated width bar + spring-scale badge, HAMBanner height 0→auto slide-in, HomeMedsBanner untuk RI, `RekonPatient` duck-typing interface). IGD wrapper → `context="igd"` (fase: Admisi/Transfer/Discharge). RI wrapper → `context="ri"` (fase: MRS/Transfer/KLRS). Hapus `resep/RekonsiliasiPane.tsx` (306 ln dead code). ResepTab RI: sub-tab rekonsiliasi dihapus, kini hanya Resep Aktif + MAR. RIRecordTabs: tab "Rekonsiliasi Obat" ditambah di grup Rekam Medis. Tech Debt "RekonsiliasTab IGD" resolved. SNARS PP 3.1 · SKP 3 · PMK 72/2016 ✅

---

## ✅ Selesai — Tier 2 (GCS + NEWS2)

- **GCS Auto-calc + NEWS2 Score** (`shared/medical-records/TTVTab.tsx`) — `calcNEWS2()`: 6 parameter (RR · SpO2 · TD Sistolik · Nadi · Suhu · Kesadaran ACVPU), red-flag logic (any single param=3 pts → min Sedang), 3 level (Rendah 0–4 · Sedang 5–6 · Kritis ≥7). Tampil di: (1) current vitals badge animated + dot, (2) history row compact preview chip, (3) form "Prediksi NEWS2" live preview. GCS live total badge (E+V+M → /15) di form dengan warna status. Benefit IGD + RI sekaligus tanpa perubahan wrapper. SNARS AP 2 ✅

---

## ✅ Selesai — Tier 3 (ICU/HCU Scoring)

- **ICUScoringTab (RI)** — tab kondisional: hanya muncul di sidebar jika `patient.kelas === "ICU" || "HCU"`. `TabDef` diperluas dengan `showFor?: string[]`, filter diterapkan di `visibleRM`. 5 file: `icuScoringShared.ts` · `SOFAPane.tsx` · `APACHEPane.tsx` · `TrendPane.tsx` · `ICUScoringTab.tsx`.

- **Upgrade: Actual Value Inputs (standar internasional)** — Seluruh 3 pane diupgrade dari skor 0–4 manual menjadi input nilai aktual terukur dengan auto-kalkulasi otomatis sesuai standar.

  **SOFA (Vincent 1996 / Sepsis-3 2016):**
  - Respirasi: PaO₂ + FiO₂ (%) → P/F ratio + ventilator checkbox → score 0–4 (`scoreSOFAResirasi`)
  - Koagulasi: trombosit ×10³/µL → score
  - Liver: bilirubin mg/dL → score
  - Kardiovaskular: MAP + vasopressor select (none/dobutamin/dopamin/epi/NE) + dosis µg/kg/min → score (AnimatePresence dose field)
  - Neurologi: GCS total → score
  - Renal: kreatinin + urine output opsional → `Math.max(crScore, uoScore)` (higher wins)
  - `SOFAActualValues` interface, `emptySOFAActual()`, `calcSOFAFromActual()`

  **APACHE II (Knaus 1985 bidirectional range tables):**
  - 9 param standar (Suhu/MAP/Nadi/RR/pH/Na/K/Hkt/WBC): `NumInput` → bidirectional V-shaped range lookup (`T_RNG/MAP_RNG/HR_RNG/RR_RNG/PH_RNG/NA_RNG/K_RNG/HCT_RNG/WBC_RNG`) → `ScoreChip` + collapsible hint ref
  - Oksigenasi (special): FiO₂<50% → skor dari PaO₂ langsung · FiO₂≥50% → A-aDO₂ = (713×FiO₂/100)−(PaCO₂/0.8)−PaO₂ → skor + tampilkan nilai A-aDO₂/P:F ratio
  - Kreatinin + AKI checkbox: `scoreAPACHECr(cr, aki)` → skor dikali 2 bila AKI, maks 8 (Knaus 1985)
  - GCS: `gcsContrib(gcs) = 15 − GCS` → kontribusi APS range 0–12 (bukan dibatasi 4)
  - Usia: `NumInput` → `ageToPoints(age)` → chip +0/2/3/5/6 animated
  - Kronik: radio-style selector (0/2/5)
  - `calcAPACHEFromActual()` → `APACHECalcResult { aps, total, mortalitas, agePoints }`
  - Mortalitas: `ln(odds) = −3.517 + total × 0.146` (general non-operative ICU formula)

  **Mock diupdate** dengan nilai aktual realistis (RM-2025-007, 4 SOFA + 2 APACHE entry). HistoryRow expand → tampilkan nilai aktual lengkap. TypeScript 0 error. SNARS PP · ICU international ✅

---

## ✅ Selesai — Tier 3 (Gizi & Nutrisi)

- **GiziNutrisiTab (RI)** — tab baru di grup Rekam Medis (antara intake-output & handover). 4 file: `giziNutrisiShared.ts` (types `DietOrder/DietitianAddendum/MealEntry/DailyMonitoring/GiziNutrisiData/SkriningSummary`, `PERSEN_CFG` 5-level color map, `TEKSTUR_CFG`, `MONITORING_STATUS_CFG satisfies`, `TIPE_DIET_OPTIONS` 12 item, helpers `calcDailyAvg/getMonitoringStatus`). `DietOrderPane.tsx`: `SkriningSummaryCard` (NRS score badge warna mid/high, rujuk toggle animated), `DietOrderForm` (tipeDiet select + kalori + tekstur 4 pill + batasan), `DietitianAddendumSection` (collapsible teal, nama+catatan+tanggal). `MonitoringPane.tsx`: `PersenSelector` (5 pill whileTap spring, animated progress bar per meal), `MealCard` (icon pagi🌅/siang☀️/malam🌙 + % badge + catatan), `DaySummaryStrip` (avg + status badge), `HistoryRow` (collapsible, mini vertical bar chart P/S/M, expand 3-col detail), `WeekStrip` (7 hari terakhir, color dot emerald/amber/rose/grey, selected=indigo). `GiziNutrisiTab.tsx`: `ProgressHeader` 2 StepPill (Diet Order + Monitoring) + animated width bar, SNARS AP 1.4 note, `xl:grid-cols-2` (DietOrderPane kiri · MonitoringPane kanan), completion banner emerald AnimatePresence. Tech Debt: diet order idealnya dari `DaftarOrderTab` tipe "Diet" (dicatat). SNARS AP 1.4 ✅

---

## ✅ Selesai — Recent (DaftarOrder + GiziPane)

- **Tab Daftar Order RI** — Shared `DaftarOrderTab` di `shared/medical-records/`. IGD refactor thin wrapper (902→12 ln). RI thin wrapper baru. 4 sub-components: `daftarOrderShared.ts` (types+configs+mock IGD+RI), `OrderRow.tsx` (animated expand/collapse, item stagger), `OrderStats.tsx` (Framer Motion StatCard), `CancelDialog.tsx` (confirm modal+toast). RI mock RM-2025-003 (14 order, 4 tipe). RIRecordTabs: tab "Daftar Order" di LAYANAN.
- **GiziPane — Riwayat & Shared IGD** — `shared/asesmen/GiziPane.tsx` direwrite: history/riwayat skrining (HistoryCard collapsible, ScoreChip, Framer Motion new-entry highlight, save toast), `everSaved` pattern. IGD `AsesmenMedisTab` refactor: local `GiziPane` (158 ln) dihapus → import shared + `noRM` prop. `GIZI_HISTORY_MOCK["RM-2025-003"]` (2 entry).

---

## ✅ Selesai — EHIS-Registration

- **PatientDashboard redesign** — 2-column layout (info+penjamin+jadwal / profil+riwayat terkini+tagihan), compact penjamin card, "Riwayat Pendaftaran Terkini" card, bottom CTA replaces table, modal renamed "Riwayat Pendaftaran", responsive multidevice
- **Detail Pendaftaran Kunjungan** — fullpage `/pasien/[id]/kunjungan/[kunjunganId]`, dokumen, aksi, cetak, modals

---

## ✅ Selesai — EHIS-Care (Earlier)

- **Diagnosa — shared + redesign** — `shared/medical-records/DiagnosaTab.tsx` (ICD-10 + ICD-9-CM, status kepastian Pasti/Dicurigai/Diferensial, alasan & analisa inline, INA-CBG preview chip). `diagnosaShared.ts`. IGD refactor ke thin wrapper. RI thin wrapper.
- **CPPT — interaktif + SNARS compliance** — DPJP co-sign verification, Template SOAP (4 template), Search & Filter, Flag Tindak Lanjut. Split: `cpptShared.ts` + `CPPTEntryCard.tsx` + `CPPTTab.tsx`
- **Rawat Inap — fullpage detail** — route `/ehis-care/rawat-inap/[id]`, `RIPatientHeader` (status-based theme, vitals bar), `RIRecordTabs`. `RawatInapPatientDetail` type + mock ri-1/ri-3.
- **IGD Triase Modal** — "+ Triase" button, modal fullscreen, primary survey ABCDE, backdrop shake, portal z-index. `IGDTriaseButton` + `TriaseModal` + `TriasePrimaryForm`
- **Rawat Inap — halaman utama** — header + BOR gauge + 6 stats card, `RIRuanganPanel` (7 kelas, occupancy ring, bed map modal), `RIBoard` (filter status/kelas/DPJP/search)
- **Redesign IGD tabs/PenilaianTab** — multi-tab (Fisik, Jantung, Kanker, dll.), two-panel layout, auto-resize textarea
- **StatusFisikPane shared** — dipindah ke `shared/medical-records/pemeriksaan/`. IGD + RI keduanya import dari shared. IGD tetap punya sub-tab Anatomi + Penunjang tersendiri.

---

## ✅ Selesai — Tech Debt

- **Skala Nyeri (0–10)** — `PainScale` component interaktif + read-only di shared TTVTab. SNARS AP 1.2 ✅
- **PemeriksaanTab IGD** — upgrade ke head-to-toe shared StatusFisikPane (11 sistem), menggantikan FisikPane lama (6 sistem)
- **Audit PenilaianTab IGD** — Morse Fall Scale, Braden Scale, Barthel Index, NRS semua ✅ ada
- **Audit EdukasiPane IGD** — `TOPIK_EDUKASI` checklist, `METODE_EDUKASI`, evaluasi pemahaman ✅ sesuai HPK 2
- **GiziPane shared** — local GiziPane IGD (158 ln) dihapus, diganti import shared + `noRM` prop ✅

---

## ✅ Selesai — Tier 2 SNARS (Wave 2)

- **HAM Label IGD ResepTab** — badge `⚠ HAM` merah di setiap item obat HAM + `HAMConfirmModal` double-check wajib (checkbox konfirmasi + daftar obat HAM) intercept sebelum order. 7 obat HAM di-flag di `resepShared.ts` katalog. `HAM_BADGE` shared style. SKP 3 · PMK 72/2016 ✅
- **Isolasi dan PPI Documentation (RI)** — isolasi flag chip (Contact/Droplet/Airborne) di `RIPatientHeader` + inline form (tanggal, alasan, dokter, cabut) · Bundle HAI (VAP 5 item / CAUTI 3 item / CLABSI 4 item) di `KeperawatanTab` kondisional ICU/HCU, toggle per alat terpasang · **checklist per shift** (Pagi 07–14 / Siang 15–21 / Malam 22–06) dengan auto-detect `currentShift()` + manual selector + reset ke otomatis · SummaryCard real-time shift dots P/S/M per bundle · history strip 7-hari (3 squares/hari) + history list grouped-by-date · simpan per perawat·shift · liveChecks reset otomatis setelah simpan (shift berikutnya mulai bersih) · badge "X/3 shift kmrn" di card header. Files: `ppiIsolasi/{ppiIsolasiShared,BundleHAISection}`. Types: `Shift` · `SHIFT_ORDER` · `SHIFT_CFG` · `DailyRecord.shift`. Mock history ri-3 (3 shift/hari, 6 hari). SNARS PPI 1–7 ✅
- **Identifikasi 2 Identitas Sebelum Tindakan (IGD + RI)** — lazy intercept: banner amber muncul saat masuk tab aksi (Tindakan · Resep · Order Lab · Order Rad · Pasien Pulang), bukan saat buka rekam medis. Banner tampilkan 3 identity card (Nama / Tgl Lahir / No RM) dengan staggered animation + checkbox konfirmasi + input nama perawat. Setelah verifikasi: banner collapse smooth → emerald chip "Identitas terverifikasi · [perawat] · [jam]" · konten tab di-blur + `pointer-events:none` sampai terverifikasi · state shared antar tab dalam satu sesi. `RawatInapPatientDetail` ditambah field `tanggalLahir`. Files: `shared/medical-records/IdentitasVerifikasiBanner.tsx` · modifikasi `IGDRecordTabs.tsx` + `RIRecordTabs.tsx`. SKP 1 · JCI IPSG 1 ✅

---

## ✅ Selesai — Rawat Jalan (Poliklinik) — Lengkap 100%

Scope: rekam medis per-kunjungan (13 tab). Route: `app/ehis-care/(fullpage)/rawat-jalan/[id]/`. Mock IDs: `rj-1` · `rj-2`.

- **Fondasi RJ** ✅ — `RJPatientDetail` type + mock data (rj-1, rj-2) + route `/ehis-care/rawat-jalan/[id]` + `RJPatientHeader` + `RJRecordTabs` skeleton (13 tab router, semua shared di-wire)
- **Promote KonsultasiTab → shared** ✅ — pindah `rawat-inap/tabs/KonsultasiTab.tsx` + `rawat-inap/konsultasi/{konsultasiShared,RequestPane,DetailPane}` → `shared/medical-records/`. Update import RI.
- **AsesmenAwalTab RJ** ✅ — adapt dari RI: hanya 3 sub-tab (Anamnesis + Riwayat + Alergi). Tanpa Skrining Gizi + Penilaian Risiko. SNARS AP 1.1
- **SuratDokumenTab** ✅ — baru (shared): Surat Keterangan Sakit · Surat Kontrol · Surat Keterangan Sehat · Resume Medis Kunjungan. 4-card selector + form auto-fill + riwayat expandable + cetak. Sub: `suratDokumen/{suratDokumenShared,SuratFormPane,SuratHistoryPane}`. PMK 269/2008
- **DisposisiRJTab** ✅ — adapt dari IGD: Rujuk Internal (poli tujuan, prioritas Segera/Elektif/Konsultasi) + Rujuk Eksternal (surat rujukan full: jenis pelayanan 4 opsi, jenis rujukan 5 opsi, live preview, tujuan PPK/poli, diagnosa multi-select) + Admisi Rawat Inap (kelas 7 opsi, konfirmasi dokter, pengantar admisi). Tanpa Pulang/APS/Meninggal. File: `rawat-jalan/tabs/DisposisiRJTab.tsx`.

13 tab final: Asesmen Awal · TTV · CPPT · Diagnosa · Pemeriksaan · Konsultasi · IC · Daftar Order · Resep · Lab · Rad · Surat · Disposisi.

---

## ✅ Selesai — Farmasi Worklist + Detail (`/ehis-care/farmasi`) — 4 Layer

**Layer 1 — Halaman Apoteker (cross-patient worklist):** ✅
- `farmasiShared.ts` — Types + config maps + `deriveResepOrders()` + `updateFarmasiWorkflow()` + `workflowStore` + `getOrderById()` + `getPatientInfo()`. Pricing/stock mock (`lookupPrice`, `lookupStock`, `parseSatuan`). `PatientInfoEntry` dengan demographics (usia, jenisKelamin, ruangan, noBed).
- `OrderCard.tsx` — Card per order: HAM badge, status badge, progress bar, action button → Link navigasi ke `/ehis-care/farmasi/[id]`.
- `FarmasiBoard.tsx` — Stat bar + depo tabs + filter + HAM toggle + search + grid + pagination. Modals dihapus — workflow pindah ke halaman detail.

**Layer 2 — Tab Farmasi di rekam medis pasien:** ✅
- `FarmasiTab.tsx` (shared) — Summary cards + order list accordion + catatan apoteker + link ke halaman farmasi. Pakai `deriveResepOrders(noRM)`.
- Wire ke IGDRecordTabs + RIRecordTabs + RJRecordTabs — Tab "Status Farmasi" (icon: Tablets) di grup LAYANAN ketiga modul.

**Layer 3 — Data Bridge (ORDERS_MOCK ↔ Farmasi):** ✅
- Standarisasi tujuan: `"Depo Rawat Inap"` → `"Apotek RI"`, `"Apotek Rawat Jalan"` → `"Apotek RJ"`.
- `updateOrderStatus()` — fungsi mutasi status order di `ORDERS_MOCK`, dipanggil saat apoteker submit telaah/dispensasi → `DaftarOrderTab` pasien ikut terupdate dalam sesi yang sama.
- Single source of truth: `ORDERS_MOCK` adalah satu-satunya sumber. Saat migrasi ke DB, cukup ganti `ORDERS_MOCK` dengan Prisma query — semua UI tidak perlu disentuh.

**Layer 4 — Halaman Detail Order Farmasi (`/ehis-care/farmasi/[id]`):** ✅
- Route fullpage `app/ehis-care/(fullpage)/farmasi/[id]/` layout + page. Server component, `getOrderById(id)`.
- `FarmasiOrderHeader.tsx` — Back button, patient info (nama, RM, usia, gender, ruangan, bed), order info (dokter, depo, tanggal, jam, item count), status badge animated, HAM + prioritas badge, progress strip 4-step.
- `FarmasiOrderTabs.tsx` — Sidebar 2 tab (Layanan Farmasi · CPPT Apoteker) + AnimatePresence content.
- `TelaahPane.tsx` — Two-panel layout: alerts (AllergyBanner + HAM) full width · Left panel `Administratif & Farmasetis` · Right panel `Klinis & Keputusan`. Centang Semua per seksi. Locked view setelah submit.
- `DispensingSerahPane.tsx` — Combined pane: tabel obat + Lot/Batch/Exp/label input → serah terima form (penerima + cara pemberian + edukasi checklist). Footer: total tagihan IDR. Locked setelah selesai.
- `RiwayatResepPane.tsx` — Dedicated 4th sub-tab. Stats strip + `OrderHistCard` expandable per-item detail.
- `DokumenPane.tsx` — Pure cetak dokumen: 4 DocCard (Resep, Kwitansi, Label Obat, Etiket Aturan Pakai) + Cetak Semua.
- CPPT Apoteker — Shared `CPPTTab` dengan `initialEntries=[]` + `showDate=true`.

Alur data: Dokter order resep di `DaftarOrderTab` → `ORDERS_MOCK` → `deriveResepOrders()` → FarmasiBoard overview → klik action → halaman detail → Telaah + Dispensasi + Serah Terima → `workflowStore` + `ORDERS_MOCK` sync → FarmasiTab pasien terupdate. PMK 72/2016 · SKP 3 ✅

---

## ✅ Selesai — Farmasi Gap SNARS / PMK 72/2016 (Tier 1+2+3)

**Tier 1 — Kritis (wajib akreditasi):** ✅
- **MAR (Medication Administration Record)** — `shared/medical-records/MARTab.tsx` + `mar/marShared.ts`. Shift tabs (Pagi/Siang/Malam) + date nav 7 hari. Drug cards per obat aktif dari `resepRI.items` dengan time slot per signa. Input modal: status (Diberikan/Ditunda/Ditolak/TidakTersedia) + waktu + perawat + catatan. HAM double-check: field perawat ke-2 wajib. Tab "MAR" di RIRecordTabs LAYANAN. SNARS PKPO 6 · PMK 72/2016 Ps. 25
- **Register Narkotika & Psikotropika** — `farmasi/narPsi/narPsiShared.ts` + `RegisterNarPsiPane.tsx`. Catalog 5 N + 5 P drugs. Register table + Saldo card per obat + alert stok minimum. Tambah Pengeluaran modal. Stok Opname modal + selisih alert. Cetak Laporan Bulanan. Tab "Register N/P" di FarmasiViewTabs. UU 35/2009 · UU 5/1997 · PMK 3/2015
- **LASA Warning System** — `LASA_PAIRS` + `getLASAPair()` di `farmasiShared.ts`. `isLASA` auto-detect di `deriveItems()`. `LASAConfirmPanel` di TelaahPane. Toggle LASA per item di DispensingSerahPane Step 1. Badge amber di OrderCard + TelaahAkhirItem. PMK 72/2016 Ps. 8 · SKP 3
- **Formularium RS Check + Non-Formularium Justification** — `FORMULARIUM_LIST` + `isFormularium` auto-detect. `FormulariumPanel` di left panel TelaahPane: badge FORM/NON-FORM per item, justifikasi wajib untuk non-formularium (blocks submit). SNARS PKPO 2 · PMK 72/2016 Ps. 5-7
- **TAT Tracking (Waktu Tunggu Pelayanan)** — `OrderTimestamps` + `calcTATMenit()` + `getTATStatus()` + `TAT_TARGET_UNIT`. `TATTimeline` strip di `FarmasiOrderHeader`. `TATChip` di `OrderCard`. Standar: IGD ≤30 mnt · RI ≤60 mnt · RJ ≤30 mnt. SNARS PKPO 6

**Tier 2 — Klinis Penting:** ✅
- **PTO (Pemantauan Terapi Obat)** — `farmasi/pto/ptoShared.ts` + `tabs/PTOPane.tsx`. Two-panel: drug cards + status terbaru / sparkline SVG trend + riwayat observasi + form tambah. Drug-to-parameter template 9 drug class. `calcPTOStatus()` Kritis/Tinggi/Rendah/Normal. SNARS PKPO 7 · PMK 72/2016 Ps. 30–32
- **MESO (Monitoring Efek Samping Obat)** — `farmasi/meso/mesoShared.ts` + `tabs/MESOPane.tsx`. WHO-UMC causality 5 level. Severitas Ringan/Sedang/Berat/Fatal. Outcome + tindakan diambil. Flag dikirim BPOM. PMK 72/2016 Ps. 33
- **DRP (Drug-Related Problems)** — `farmasi/drp/drpShared.ts` + `tabs/DRPPane.tsx`. PCNE V9: 9 problem code (P1–P3), 13 cause code (C1–C5), 6 intervensi code (I0–I3), 4 outcome (O0–O3). PMK 72/2016
- **Konseling Obat Pulang** — `konseling/konselingShared.ts` + `shared/medical-records/KonselingTab.tsx`. Drug checklist + info obat + form penilaian (metode/penerima/pemahaman/durasi/TTD). `getDrugInfo()` lookup 6 drug class. SNARS PP 5 · PMK 72/2016 Ps. 27

**Tier 3 — Operasional:** ✅
- **Pengembalian Obat Pasien Pulang** — `farmasi/pengembalian/pengembalianShared.ts` + `PengembalianPane.tsx`. Two-panel: list item per resep + summary card + panduan prosedur 5-step. Tab "Kembalian Obat" di PasienPulangTab RI. Verifikasi apoteker per record. PMK 72/2016 Ps. 20
- **PIO Log (Pelayanan Informasi Obat)** — `farmasi/pio/pioShared.ts` + `PIOPane.tsx`. 6 mock entries (Dosis, Interaksi, ESO, Farmakokinetik, Ketersediaan). Tab "Pelayanan Informasi Obat" di FarmasiViewTabs. PMK 72/2016 Ps. 27-29

---

## ✅ Selesai — Laboratorium (`/ehis-care/laboratorium`) — Tier 1+2+3

Arsitektur: worklist cross-patient → detail per-order → hasil tampil di `OrderLabTab` pasien. Alur: Dokter order via `OrderLabTab` → `ORDERS_MOCK` → Lab Worklist → proses tiap fase → hasil rilis → `OrderLabTab` pasien terupdate. Standar: ISO 15189:2022 · SNARS AP 5.9/5.11 · PMK 43/2013 · JCI AOP.5.

**Tier 1 — Kritis (Wajib Akreditasi):** ✅
- **`labShared.ts`** — `LabOrder` · `HasilItem` · `SpecimenInfo` · `PenolakanInfo` · `CriticalNotif` · `LabTimestamps` types. Config maps (8 status · 7 kategori · prioritas · unit · flag). `deriveLabOrders()` · `getLabOrderById()` · `updateLabWorkflow()`. `autoFlag()` · `calcTATMenit()` · `getTATStatus()`. 6 mock orders lintas unit.
- **Lab Worklist (`LabBoard.tsx`)** — Stats bar (CITO aktif/Antrian/Proses/Selesai) + Critical value alert banner + Filter unit + status group + CITO toggle + search + Skeleton + Pagination. `LabOrderCard.tsx` dengan TAT chip + progress bar + CITO stripe.
- **Lab Order Detail** — `LabOrderHeader` (TAT timeline 7-step + status progress bar) + `LabOrderTabs` sidebar (4 workflow + 1 dokumen). ISO 15189
- **Penerimaan Order + Verifikasi Identitas** — `PenerimaanPane.tsx`: 3 identity cards + 3-checkbox confirm + petugas input. SKP 1 · ISO 15189
- **Pengambilan + Registrasi Sampel** — `SampelPane.tsx` Step A (jenis tabung/volume/waktu/petugas/lokasi) + Step B (no. registrasi/waktu terima/kondisi). ISO 15189 §5.4
- **Penolakan Sampel** — kondisi dropdown (Hemolisis/Lipemia/Bekuan/dst) → reject flow dengan instruksi pengambilan ulang. ISO 15189 §5.4.5
- **Entry Hasil + Validasi** — `HasilPane.tsx` (input + autoFlag N/H/L/C real-time) + `ValidasiPane.tsx` (review SpPK + 2-checkbox + TTD digital). ISO 15189 §5.5/5.6
- **Critical Value Alert** — `CriticalValueModal` intercept wajib sebelum save, per-test konfirmasi (Telepon/SMS/WA/Langsung + dokter + pelapor + log). SNARS AP 5.9 · ISO 15189 §5.6.2
- **TAT Tracking** — `LabTimestamps` 7 fase + `TATTimeline` strip + `TATChip`. CITO ≤60 mnt · RI/RJ ≤120 mnt. SNARS AP 5.11

**Tier 2 — Klinis Penting:** ✅
- **Trend & Riwayat Hasil** — `trend/trendShared.ts` + `tabs/TrendPane.tsx`. Mini sparkline per parameter + full sparkline + history table. Click-to-select parameter.
- **Delta Check** — `DELTA_THRESHOLDS` (15 parameter). `calcDelta()` + `getPreviousResult()`. Inline amber banner real-time di `HasilPane.tsx`. Badge ⚠ di TrendPane. ISO 15189 §5.6.2
- **Add-on Test** — `tabs/AddOnPane.tsx`. Catalog 30 pemeriksaan. Specimen validity check per jenis tabung (EDTA 4 jam, SST 6 jam, dll).
- **POCT** — `poct/poctShared.ts` + `tabs/POCTPane.tsx`. 10 jenis tes + 7 device config. Auto-flag N/H/L/C real-time. PMK 43/2013 · ISO 15189 §5.7
- **Cetak Hasil Lab** — `PrintPreviewModal` di `RiwayatPane.tsx`. iframe+srcdoc (no document.write). KOP RS + watermark "HASIL RESMI". PMK 269/2008

**Tier 3 — QC & Manajemen:** ✅
- **Internal QC** — `manajemen/InternalQCPane.tsx`. Levey-Jennings SVG chart per parameter (mean ±1/2/3SD color bands). Westgard auto-check (6 rules). Form input run QC baru + WestgardPreview real-time. ISO 15189 §5.6.3
- **Register Pemeriksaan** — `manajemen/RegisterPane.tsx`. Filter 1/7/30 hari + stats cards + horizontal bar chart distribusi + volume sparkline + log tabel harian. PMK 43/2013
- **Manajemen Reagen** — `manajemen/ReagenPane.tsx`. Kartu stok per alat + stock progress bar + alert kritis/kadaluarsa. Form penerimaan reagen. ISO 15189 §5.3.2
- **Kalibrasi Alat** — `manajemen/KalibrasiPane.tsx`. List instrumen + status Valid/Overdue/Segera + log kalibrasi 2 entry. ISO 15189 §5.3.4
- **EQA / PT** — `manajemen/EQAPane.tsx`. Provider list + siklus table (nilai RS vs target, deviasi bar bidirectional + status Lulus/Tidak Lulus/Pending). CAPA banner otomatis. ISO 15189 §5.6.4
- **Laporan Bulanan** — `manajemen/LaporanPane.tsx`. KPI cards + mini bar chart + distribusi unit/kategori + tabel harian. Tombol Cetak. PMK 43/2013

`LabManajemenTabs.tsx` — sidebar 6 tab. `LabPageView.tsx` — view switcher Worklist ↔ QC & Manajemen.

---

## ✅ Selesai — Radiologi (`/ehis-care/radiologi`) — Tier 1+2+3

Arsitektur mengikuti pola Lab. Standar: SNARS AP 6 · PMK 1014/2008 · PMK 24/2020 · Perka BAPETEN No. 2/2018 · JCI AOP.6 · ACR · IAEA HH-19.

**Modalitas:** Konvensional (X-Ray) · USG · CT · MRI · Fluoroskopi · Mammografi · DEXA. **TAT:** CITO ≤60 mnt · Semi-Cito ≤180 mnt · Rutin ≤360 mnt. **9 Status:** Menunggu → Dijadwalkan → Verifikasi → Persiapan → Akuisisi → Expertise → Verifikasi Hasil → Selesai | Ditolak.

**Tier 1 — Kritis:** ✅
- **`radShared.ts`** — types lengkap + config maps (9 status · 7 modalitas · urgensi · DRL values PMK 1014/2008). Helpers + `PROTAP_MAP` per modalitas + `CRITICAL_KATEGORI_LIST` 8 temuan. 5 mock orders.
- **RadBoard + Order Detail** — Stats bar + Critical finding banner + filter + `RadOrderCard` (CITO stripe, TATChip, progress bar). `RadOrderHeader` (8-step TATTimeline) + `RadOrderTabs` (5 workflow + 1 dokumen).
- **Verifikasi Identitas** — `VerifikasiPane.tsx`: 3 identity cards + 3-checkbox confirm + radiografer. SKP 1
- **Persiapan + Kontras** — `PersiapanPane.tsx` + `persiapan/KontrasPanel.tsx`: protap per modalitas + kontras panel (jenis IV/oral/rektal/Gadolinium + dosis + premedikasi + reaksi grading). Kontraindikasi checklist. PMK 24/2020 · ACR
- **Akuisisi + Proteksi Radiasi** — `AkuisisiPane.tsx`: parameter teknis per modalitas + `DRLGauge` (CTDIvol+DLP CT / DAP+waktu Fluoroskopi / entrance dose Konvensional/Mammografi). Auto-alert DRL exceeded + proteksi checklist + ALARA reminder. BAPETEN · IAEA
- **Expertise + Critical Findings** — `EkspertasiPane.tsx`: 5 report fields (Indikasi/Teknik/Temuan/Kesan/Saran). `CriticalFindingModal`: blocking full-screen rose, per-temuan konfirmasi (Telepon/SMS/WA/Langsung + dokter + pelapor + jamLapor + log). Cannot dismiss without confirming all. SNARS AP 6.1 · JCI AOP.6
- **Validasi & Verifikasi Laporan** — `ValidasiPane.tsx`: 2-checkbox + validator. `updateRadWorkflow` → status: "Selesai". SNARS AP 6
- **TAT Tracking** — `RadTimestamps` 8 fase + `TATTimeline` + `TATChip`.

**Tier 2 — Klinis Penting:** ✅
- **Riwayat & Perbandingan** — `tabs/RiwayatRadPane.tsx`. Stats strip + `HistCard` expandable. Current order highlighted teal ring. ACR
- **Cetak Laporan Radiologi** — `PrintPreviewModal` di `RiwayatRadPane.tsx`. iframe-based print: KOP RS + laporan terformat + kolom TTD SpRad + watermark "LAPORAN RESMI". Tersedia hanya jika status "Selesai". PMK 269/2008
- **Image Viewer (Basic DICOM Preview)** — `tabs/ViewerPane.tsx` + `MockImage.tsx`. Grid viewer 1×1/2×2 + CSS window/level presets (Standard/Paru/Mediastinum/Tulang/Otak/Jaringan Lunak) + Zoom ±0.25 + mode anotasi. Upload PNG/JPG/DICOM thumbnail. Watermark "HANYA PREVIEW — BUKAN PENGGANTI DICOM VIEWER". Mock SVG anatomy per modalitas.
- **Alergi Kontras & Premedikasi Tracker** — `tabs/KontrasPane.tsx`. Two-panel: banner peringatan + current order kontras info + history list expandable. `AddReaksiForm`: grade selector + manifestasi chips + onset + tatalaksana + dokter. Protokol premedikasi steroid 3-step auto-muncul. ACR Manual on Contrast Media Ed. 11

**Tier 3 — QC & Manajemen:** ✅
- **QC Pesawat** — `manajemen/QCPane.tsx`. Two-panel: list 5 pesawat per modalitas dengan status Valid/Overdue/Segera + uji kesesuaian expandable per parameter (kolimasi/keluaran/resolusi/HVL/CTDIvol/SNR) + log kalibrasi + form tambah. BAPETEN · IAEA HH-19 §7
- **Register Pemeriksaan** — `manajemen/RegisterPane.tsx`. Filter 1/7/30 hari + stats cards + volume sparkline SVG + horizontal bar chart distribusi modalitas + log tabel harian 14 baris.
- **Log Dosis Radiasi (DRL)** — `manajemen/DosisPane.tsx`. Two-panel + DRLGauge animated + DRLSummary panel + Form Tambah Log dengan DRLPreview real-time. 12 mock entries. Perka BAPETEN · IAEA Safety Reports 39
- **EQA / Phantom Test** — `manajemen/EQAPane.tsx`. 3 program (AAPM CT Phantom · SMPTE USG · ACR MRI). ProgramCard collapsible + SiklusTable + CAPA banner. IAEA · ACR
- **Laporan Bulanan** — `manajemen/LaporanPane.tsx`. KPI 5 cards + mini bar chart 7 hari + distribusi modalitas/unit/urgensi + tabel rekapitulasi DRL.

`RadManajemenTabs.tsx` — sidebar 5 tab. `RadPageView.tsx` view switcher Worklist ↔ QC & Manajemen.

---

## ✅ Selesai — Master Data (`/ehis-master`) — Phase 0–3 Lengkap 100%

**Total:** 30 task lintas 4 phase. 25 sub-master + 8 mapping hub sub-page. Lihat [TODO.md](../TODO.md) untuk detail per-task.

### Phase 0 — Foundation ✅ (7/7)
- Module routes scaffolding
- `masterNav` di `lib/navigation.ts`
- Master Template Layer: `MasterPageLayout` · `MasterListPanel` · `MasterDetailPanel` · `MasterEmptyState` · `MasterTabNav` · `StatCard` · `useSkeletonDelay` · `useMasterCrud` · `FormPrimitives` (Field/TextInput/NumberInput/TextArea/Select/ToggleSwitch/ChipToggle/SectionGroup) · `masterAccent` (8 tone palette purge-safe)
- `MappingSourceBadge` (3 variant: card/banner/inline) untuk cross-link entitas → Mapping Hub

### Phase 1 — Refactor (Strip FHIR) ✅ (6/6)
**Refactor Strip FHIR dari Master (2026-05-19):**
- **Strip FHIR dari Ruangan** — hapus `SyncSection.tsx`, `SYNC_CFG`/`SyncStatus`/`canSyncNode`/`countSyncedAll`, `fhirId`/`syncStatus` dari `OrganizationNode`/`LocationNode`/`BedSubRecord`. Hapus per-bed sync chip + stat card SatuSehat + sync dot indicator. RS root banner di-rephrase: "Profil RS — Read Only". TETAP: `Organization.active` + `Organization.type`.
- **Strip FHIR dari Dokter & Nakes** — hapus `NIKLookupPanel.tsx`, `SatuSehatPractitioner` interface + `SATUSEHAT_PRACTITIONER_DB` + `lookupSatuSehatByNIK()`, `fhirId`/`verifiedAt`. `DokterDetail` di-restruktur: section "Data dari SatuSehat" read-only diganti "Data Profesi" editable. Stat card "Terverifikasi SatuSehat" diganti "Dokter Spesialis".
- **Strip rsConfig.ts** — hapus `fhirId`, `SATUSEHAT_ORG_IDENTIFIER_SYSTEM`, `SATUSEHAT_LOC_IDENTIFIER_SYSTEM`. RS_PROFIL hanya berisi data RS sebagai seed root Organization. Konfigurasi SatuSehat **pindah ke modul `/ehis-fhir`** (belum dibangun).

**Refactor Duplikasi Master vs Mapping Hub (2026-05-22):**
- Shared `MappingSourceBadge` (3 variant card/banner/inline).
- **DokterDetail — hapus Penugasan Poli/Unit** + refactor ke tabs (Profil & Lisensi / Jadwal Praktik). `MappingSourceBadge` card pointer ke SDM Assignment.
- **PenggunaFormModal — hapus Penugasan Unit** + validasi terkait. `MappingSourceBadge` card.

### Phase 2 — 13 Master Baru ✅ (13/13)

**Tier 1 Foundation Master (Resource klinis dasar):**
- **Unit & Ruangan — Unified Tree** ✅ — Organization n-level nested via `parentId`, Bed sebagai sub-collection `LocationNode.beds[]`. Komponen: `RuanganPage` + `TreePanel` 360px + `TreeNode` recursive + `OrganizationForm` 5 section + `LocationForm` + `BedManagerPanel`. Cascading Kemendagri 5 provinsi. RS root readonly.
- **Dokter & Nakes** ✅ — `dokterShared.ts` + 15 kode spesialis + `DokterPage` + `DokterList` + `DokterDetail` (2-tab: Profil & Lisensi / Jadwal Praktik) dengan max-w field cap. 4 mock dokter.
- **Pengguna Sistem** ✅ — `penggunaShared.ts` (9 role, 3 status, 10 unit). Table-based: 3 stat card + toolbar (search + 3 filter dropdown) + table 5 kolom + menu aksi. `PenggunaFormModal` slide-in.

**Kategori A — Skala Klinis ✅** (2026-05-23):
- **Skala Risiko** (teal) — 5 skala: Barthel/Morse/Braden/NRS/MUST. Mahoney 1965 · Morse 1989 · Braden 1987 · BAPEN MUST.
- **Skala Umum** (sky) — 5 skala: GCS/Kesadaran/KU/NEWS2/MEWS. Teasdale 1974 · RCP 2017 · Subbe 2001.
- **Skala Penyakit** (violet) — 5 skala: Killip/NYHA/TIMI/ECOG/Stadium Kanker. AJCC 8th ed. 2017.
- **Triase IGD** (amber) — `TriaseRecord` matrix levels × parameters. 1 protokol default 6 level × 8 parameter (ESI + DOA). Sticky-header matrix + tone swatch picker + inline textarea cells.

Shared layer zero-duplication: 3 master skala struktur data identik → ekstraksi ke `components/master/skala-shared/`. Per-master page jadi thin wrapper ~113 lines.

**Kategori B — Reference Klinis ✅** (2026-05-23):
- **ICD-10 & ICD-9-CM** (sky) — `lib/master/icdMock.ts` ~80 ICD-10 (lintas 22 chapter WHO) + ~30 ICD-9-CM. `IcdItem` dengan `jenis` discriminator + chapter/blok + `inaCbg?` mapping BPJS.
- **Asesmen Katalog** (violet) — 120 entries lintas 11 kategori (Alergi 45 · Penyakit 50 · Sosial 8 · Reproduksi 14). SNOMED CT mapping pada 10 allergen tervalidasi.
- **SDKI/SIKI/SLKI** (rose) — ~30 diagnosa lintas 5 kategori × 3 jenis. Schema lengkap: dataMayor + dataMinor + kriteriaHasil (SLKI) + intervensi (SIKI 4 sub-kategori). 3-tab structure (Identitas + Klinis + Intervensi) + shared `ListEditor`.

Strategi mock representative: 30–120 entry per master dengan schema 1:1 ke target real (saat backend ready swap dengan `prisma.X.findMany()`).

**Kategori C — Template & Enum ✅** (2026-05-23):
- **Status Enum** (violet) — 9 enum group, 50 entries total, 9 tone palette + 30+ icon registry.
- **Template Anamnesis** (teal) — 17 template lintas 3 context (IGD 8 · RI 4 · RJ 5) × 12 kategori keluhan. Placeholder ___ untuk field user.
- **Template Form** (sky) — discriminated union (sbar/ic-risiko/surat/quick-text), 20 mock template. Custom orchestrator multi-collection per jenis.

**Kategori D — Workflow Klinis ✅** (2026-05-24):
- **Discharge Klasifikasi** (emerald) — 5 sub-master shape berbeda: Homecare 10 / Alat Bantu 9 / Checklist 11 / Phase Planning 3 fase × 11 target / Risiko Readmisi rule engine.
- **Operasional Klinis** (slate) — 4 sub-koleksi (77 entries total): Sumber Cairan I/O 31 / Diet & Tekstur 16 / Bundle HAI 12 / Penyakit Isolasi 18. Pattern: sidebar nav + switch-by-key pane.
- **Workflow Edukasi** (amber) — 7 koleksi (57 entries) lintas workflow edukasi: Topik 14 / Media 7 / Metode 5 / Hambatan 8 / Pemahaman 3 / Tanda Bahaya 14 / Tipe Instruksi 6. SNARS PP 5 · PMK 269/2008

**Tier 2 — Katalog Klinis:**
- **Katalog Obat** ✅ — schema full `ObatRecord` 25+ field. 30 mock obat. GOLONGAN_CFG UU 35/2009 + PMK 3/2015. LASA pairs. 4 tabs (Identitas/Klasifikasi/Klinis/Harga). PMK 72/2016 · UU 35/2009 · BPOM HET · Fornas BPJS · PMK 3/2015
- **Katalog Tindakan** ✅ — 35 tindakan ICD-9-CM lintas 11 kategori, 4 level kompleksitas. 2 tab (Identitas / Relasi Default). Source-of-truth untuk Kewenangan Klinis + Layanan Unit + Tarif Matrix. PMK 755
- **Katalog Laboratorium** ✅ — 31 item lintas 4 kategori. 3 tab (Identitas / Nilai Rujukan / Delta & Kritis). ISO 15189:2022 · SNARS AP 5.9 · PMK 43/2013
- **Katalog Radiologi** ✅ — 15 pemeriksaan lintas 7 modalitas (Konvensional/CT/MRI/USG/Fluoroskopi/Mammografi/DEXA). 3 tab (Identitas / Persiapan & DRL / Reporting Template). PMK 1014/2008 · PMK 24/2020 · BAPETEN · IAEA HH-19 · ACR

**Tier 3 — Operasional:**
- **Tarif & Paket Layanan** ✅ — 18 item lintas 7 kategori + 3 paket. Two-panel: Tarif Dasar (2 tab Identitas+Harga) ↔ Paket Layanan (Identitas+Komposisi).
- **Penjamin & Kontrak** ✅ — 7 mock penjamin (BPJS/Umum/Allianz/AXA/Inhealth/Jamkesda/Astra). 40+ kode SMF/Poli BPJS V-Claim. 4-tab (Identitas/Kelas&Coverage/Kontrak/BPJS). Cross-link banner ke Mapping Hub. BPJS V-Claim · PMK 56/2014 · PMK 28/2014

**Tier 4 — Konfigurasi RS:**
- **Profil RS** ✅ — singleton record. 5 seksi via sidebar nav (Identitas/Alamat/Akreditasi/Konfigurasi Shift/KOP Surat). Konfigurasi Shift **unblock** `SHIFT_CFG` di `ppiIsolasiShared.ts` & `marShared.ts`. KOP **unblock** semua `PrintPreviewModal`. PMK 1045/2006 · UU 44/2009

**Tier 5 — Mapping Hub Terpadu ✅ (8 sub-page complete):**
- **MappingHubPage + sidebar shell** — `SUBPAGE_REGISTRY` 8 entri + `MappingHubSidebar` 260px + `ComingSoonPane`. **Density Toggle**: 3 level (Compact/Comfortable default/Cozy) via CSS custom properties + utility classes `.m-mini/.m-tiny/.m-xs/.m-sm/.m-base/.m-lg`. Toggle button top-right header dengan localStorage persist.
- **SDM Assignment** — `AssignmentMap` SDM × Unit. SDM 13 entries (4 dokter + 9 pengguna), unit 18 entries. `UnitListPanel` + `SDMRosterPanel` (tab Bertugas/Tersedia + chip filter kategori + bulk action bar + `BulkMoveModal`).
- **Kewenangan Klinis** — Dokter × Tindakan matrix. PMK 755 credentialing. `KewenanganMatrix` per-dokter view dengan kategori accordion + 3-filter status + bulk actions per-kategori + bulk global "Sesuai Spesialis"/"Hapus Semua".
- **Layanan Unit** — Tindakan × Unit matrix (14 unit). Compact matrix table sticky header & first column. Bulk: klik judul kolom/baris → toggle all. Heatmap visual.
- **Tarif Matrix** — 3D map `[penjamin][tindakan][kelas] → harga`. 6 penjamin × 35 tindakan × 7 kelas = ~1470 cell. Inline-edit + `BulkAdjustModal` (percent stepper + preset chips + warning amber pembulatan).
- **Formularium Penjamin** — `[penjamin][obat][kelas] → { allowed, alasan? }`. Default rules per tipe penjamin (Umum=all/BPJS=formularium-only+no VIP/Asuransi=allow kecuali HAM Kelas_3/Jamkesda=formularium-only+Kelas 2-3+RJ). Cell 3-state (allowed/revoked-with-reason/revoked). PMK 51/2009 · SNARS PKPO 2 · BPJS Fornas
- **Distribusi Obat** — `[depo][obat] → StokCell { stok, min, max }`. 6 depo (Gudang Pusat + Depo IGD/ICU/OK + Apotek RI/RJ). 6-status stock (Habis/Kritis/Rendah/Aman/Penuh/TidakStock). PMK 72/2016 Bab IV
- **Penjamin × Ruangan** — Kode SMF BPJS V-Claim × Ruangan RS. AddForm cascading penjamin → kelas/SMF → ruangan. Sticky-header table inline edit. BPJS V-Claim · PMK 56/2014
- **RBAC (Role × Permission)** — `PERMISSION_TREE` 5 modul × 27 leaf permission × 5 action (read/create/update/delete/export). 9 role default grants realistis. Accordion collapsible per modul + bulk actions. NIST RBAC

**Query-param routing:** `MappingHubPage` baca `?sub=<key>` dari URL untuk deep-link. `useSearchParams` re-sync saat URL berubah, route wrapped Suspense.

### Phase 3 — UX Polish ✅ (4/4)

- **3.1 Beranda Master** ✅ (2026-05-24) — `src/components/master/beranda/` + route `/ehis-master`. Dashboard custom 12-col (bukan `MasterPageLayout`). Hero violet + KPI Strip 5 hero card + Quick-Nav Grid 9 kelompok × 24 nav card + Mapping Coverage Panel (8 mini-meter dengan progress bar tone semantik rose<25%/amber<60%/emerald≥60%) + Recent Edits Panel (8 entri mock dengan timeline rail). Aggregator `getBerandaStats()` consume 20+ mock source. `TONE_PALETTE` 9 tone purge-safe static. 6 file <300L (BerandaMasterPage 133L · berandaShared 286L · KPIStrip 71L · QuickNavGrid 109L · MappingCoveragePanel 111L · RecentEditsPanel 127L).
- **3.2 Banner Default-Flag Katalog Obat** ✅ — `<MappingSourceBadge subpage="formularium" variant="banner" />` di [KlasifikasiTab.tsx:33-50](../src/components/master/katalog-obat/tabs/KlasifikasiTab.tsx#L33-L50). Formularium row dibungkus `sm:col-span-2 flex flex-col gap-2` sehingga banner full 2 kolom grid. Copy: title "Default global — coverage final dikelola di Mapping Hub" + desc + CTA "Atur Coverage". Cegah user mengira flag obat = keputusan final coverage.
- **3.3 Restruktur masterNav** ✅ — di [navigation.ts:168-242](../src/lib/navigation.ts#L168-L242): Katalog Klinis sekarang 6 item (tambah ICD-10 & ICD-9 + SDKI/SIKI/SLKI dari Reference). Reference → Referensi (Indonesian). Sync ke `berandaShared.ts` `getQuickNavGroups()`.
- **3.4 Update CLAUDE.md** ✅ — pointer ke TODO.md di header. Tier 0 Beranda done. Tier 2 ICD done. Tier 2 Banner default-flag done.

---

## ✅ Selesai — Workflow Docs Sterilization (2026-05-24)

- **Splitting CLAUDE.md** menjadi 4 file:
  - [CLAUDE.md](../CLAUDE.md) — lean overview (current state + active work + pointers + key data contracts)
  - [TECH_DEBT.md](../TECH_DEBT.md) — per-modul tech debt registry
  - [TODOS_BACKEND.md](../TODOS_BACKEND.md) — backend implementation roadmap (B0 Foundation → B4 Polish, ~21–28 minggu)
  - [.claude/DONE.md](DONE.md) — completed work archive (file ini)
- Cross-link semua docs satu sama lain di header masing-masing supaya context navigable.

---

## ✅ Selesai — EHIS-Eklaim Foundation EK0.1 Types (2026-05-26)

- **`src/lib/eklaim/eklaimShared.ts`** (572 ln) — single source of truth types untuk modul `/ehis-eklaim`. Pivot iDRG-first (resmi 1 Okt 2025 Kemenkes) + INA-CBG active secondary (industri SIMRS dual support). Field `eraGrouper: "iDRG" | "INA_CBG_Legacy"` routing logic.
- **Money:** `Rupiah = bigint` (bulat rupiah tanpa sen subdivision — sesuai akuntansi RS Indonesia, hindari floating-point drift untuk klaim ratusan juta) · helpers `money.ts` di EK0.3.
- **Result/Error:** `Result<T, E>` discriminated union + `Ok()`/`Err()` constructors · `ClaimError` taxonomy 7 type (NetworkError/AuthError/ValidationError/EligibilityError 5 reason/DuplicateClaimError/GrouperError/ConcurrencyError).
- **Domain enums:** `TipePenjamin` (bpjs/asuransi/jamkesda) · `EraGrouper` · `TipePelayanan` (RI/RJ/SameDay) · `CaraPulang` (Sembuh/PulangAPS/Rujuk/Meninggal) · `Gender` · `KelasRawat` (KRIS default + VIP/K1/K2/K3 legacy + ICU/HCU/Isolasi) · `TingkatKompetensiRS` (dasar/menengah/utama/komprehensif per Perpres 59/2024).
- **`ClaimStatus`** — 13 state granular (+`Susulan Required` distinct dari Rejected, +`Sengketa` nominal sebelum write-off). Transition rules di `stateMachine.ts` EK0.3. `CLAIM_STATUS_LABEL` map terpisah (code stable, label mutable).
- **ICD (Indonesian Modification):** `KodeICD10IM` + `KodeICD9CMIM` — sumber Pedoman Pengodean iDRG 2025 Kemenkes (BUKAN ICD WHO). Flag `hospitalAcquired` untuk CC/MCC PPI (PMK 27/2017).
- **`SEPRecord`** — V-Claim rich struct (noKartu 13-digit, masaBerlaku, kontrolKe, jenisRawat) — match spek V-Claim API.
- **`BerkasKlaim`** — checklist item + `BerkasVersion` append-only (UU PDP 27/2022 integrity) + `BerkasFile` (SHA-256 hash) + `BerkasSumber` discriminated (upload-manual vs auto-pull dengan sumberType+id) + `BerkasKategori` 10 jenis + `BerkasStatus` (+`Reject Verifikator`).
- **Grouper Results:**
  - **`iDRGResult`** (PRIMARY) — kode 7-digit numerik, `mdc`, `iDRGSeverity` (level/label/ccList/mccList per ICS v1), `tarifAktual` + `tarifPerTingkat` (4 tingkat kompetensi RS), `TopUpCmg[]`, `versiGrouper`, `timestampGroup`, `sumberRegulasi: "Pedoman_iDRG_2025_Kemenkes"`.
  - **`InaCbgLegacyResult`** (active secondary) — kode 4-digit alphanumeric, severity 1/2/3, tarif per kelas {kelas3/kelas2/kelas1/vip}, versiGrouper e.g. "INA-CBG_v6.2" / "v5.9".
  - **`iDRGLookupEntry`** — master untuk IDRG_LOOKUP_MOCK (severityLevels 1/2/3 dengan TarifPerTingkat per level + icd10IMList/icd9CMIMList mapping).
- **`ClaimTimelineEntry`** — discriminated union 10 event type (claim-created/coding-changed/berkas-uploaded/berkas-rejected/grouper-resolved/status-transition/submitted-batch/verifikator-comment/banding-submitted/payment-received) — type-safe audit per UU PDP 27/2022 + PMK 269/2008.
- **`BandingRecord`** — 2-tingkat per PMK 26/2021 (tingkat 1 cabang, tingkat 2 pusat) + `BandingStatus` + dokumenPendukung pakai BerkasKlaim type konsisten.
- **`ReconciliationRecord`** — multi-criteria match + `ReconciliationMatch` dengan `matchingConfidence` 0-1 + `matchingReason` audit string + `matchedBy`/`matchedAt` + `SelisihStatus` (Write-off/Refund/Pending).
- **Concurrency:** `OptimisticLock { version, updatedBy, updatedAt }` + `SoftLock { lockedBy, lockedAt, expiresAt }` (TTL 15min default untuk multi-coder edit safety).
- **`Penjamin`** + **`ClaimRecord`** (entity utama, ~35 field) — source of truth di-host di modul ini. Billing read-only via `claimReadCache.getClaimStatusForInvoice()`.
- **`CoderShift`** — scaffold type only (implementasi di EK8.4).
- **Best practices applied:** `interface` untuk object types · `type` untuk unions · `ReadonlyArray` untuk audit collections · discriminated unions dengan literal `type` field · JSDoc minimal explaining WHY (regulasi reference, non-obvious convention) · `// ── Section ──` headers · `npx tsc --noEmit` zero output.
- Verifikasi: `npx tsc --noEmit` clean, 572 lines (under 800 limit).

---

## ✅ Selesai — EHIS-Eklaim Foundation EK0.2 Mock Seed (2026-05-26)

7 file mock data + 1 infra change (~2350 ln total). All `npx tsc --noEmit` clean. **tsconfig target bumped ES2017 → ES2020** untuk support BigInt literals (zero browser regression untuk Next.js 16 + Node 18+).

- **`src/lib/eklaim/icdIMMock.ts`** (400 ln) — `ICD10_IM_MOCK` 30 kode (kardiovaskular/endokrin/obstetri/pernapasan/pencernaan/ginjal/infeksi) + `ICD9_CM_IM_MOCK` 20 kode prosedur (kardio/obstetri/pencernaan/ginjal/ICU/imaging). Versi `ICD-10-IM_2025` & `ICD-9-CM-IM_2025`. Flag `hospitalAcquired` untuk CC/MCC PPI (PMK 27/2017). Helpers `findICD10IM()` & `findICD9CMIM()`.
- **`src/lib/eklaim/iDRGLookupMock.ts`** (486 ln) — `IDRG_LOOKUP_MOCK` 30 entries 7-digit numerik lintas 7 MDC (sirkulasi 8 · endokrin 4 · obstetri 5 · pernapasan 4 · pencernaan 3 · ginjal 3 · infeksi 3). Setiap entry punya 3 severity (Ringan/Sedang/Berat) × 4 tingkat kompetensi RS (dasar/menengah/utama/komprehensif) = 12 tarif. Internal helper `tpt()` factory (multiplier dasar 70% · menengah 85% · utama 100% · komprehensif 120%). Helpers `findIDRG()` & `findIDRGByICD10IM()`. Sumber `Pedoman_iDRG_2025_Kemenkes`.
- **`src/lib/eklaim/inaCbgLegacyMock.ts`** (126 ln) — `INA_CBG_LEGACY_MOCK` 10 entries CBG paling umum (AMI I/II/III · CHF I/II · DM II · Sectio I/II · Persalinan I · Pneumonia I). Format kode 4-digit alphanumeric (e.g. `I-1-01-II`). Tarif per kelas pasien {kelas3/kelas2/kelas1/vip} dengan multiplier 1.0x/1.2x/1.4x/1.6x. Versi `INA-CBG_v5.9` (Permenkes 3/2023). Helper `findInaCbgLegacy()`. Type `InaCbgLegacyLookupEntry = Omit<InaCbgLegacyResult, "timestampGroup">` (timestamp populated saat grouper call, bukan static).
- **`src/lib/eklaim/berkasTemplatesMock.ts`** (284 ln) — 4 templates: `BERKAS_TEMPLATE_BPJS_RI` (11 berkas: SEP + Identitas + Rujukan + Resume Medis + Tindakan + Lab + Rad + Billing + iDRG Grouper + Khusus anestesi/kemo/dialisis) · `BERKAS_TEMPLATE_BPJS_RJ` (8 berkas, tanpa tindakan operasi) · `BERKAS_TEMPLATE_BPJS_IGD` (9 berkas, rujukan optional P1/P2 emergency) · `BERKAS_TEMPLATE_ASURANSI` (8 berkas AAJI + form penjamin per perusahaan + pre-authorization cashless conditional). Type `BerkasTemplate` + helpers `getBerkasTemplate(penjamin, tipePelayanan)` + factory `instansiBerkasFromTemplate(template, claimId)` untuk generate `BerkasKlaim[]` per-claim.
- **`src/lib/eklaim/claimMockFactory.ts`** (297 ln) — internal factory `buildClaim(input: BuildClaimInput)` + 5 helpers (`icd10`/`icd9` lookups · `resolveIDRG` resolves severity & tarif per tingkat · `resolveInaCbg` adds timestamp · `makeSEP` generates SEP dengan masaBerlaku 30-hari · `makeTimeline` append-only events per status). Auto-calculate `selisih`, `batchId`, `noKlaim` (DRAFT prefix jika belum submit), berkas populated dari template dengan status "Siap" jika status !== Draft Coding.
- **`src/lib/eklaim/claimsMock.ts`** (715 ln) — `CLAIM_BOARD_MOCK` 25 happy path ClaimRecord lintas distribusi: penjamin (BPJS 16 · Asuransi 8 · Jamkesda 1) · status (Belum Submit 3 · Pending Verifikasi 5 · Approved 4 · Paid 4 · Draft Coding 2 · Rejected 1 · Susulan Required 1 · Banding Submitted 1 · Banding Approved 1) · era (iDRG 24 · INA-CBG Legacy 1) · kelas (KRIS dominan post-Okt · VIP/K1/K2 untuk legacy + ICU sepsis) · tingkat kompetensi RS (dasar/menengah/utama/komprehensif mix) · unit (RI 17 · RJ 7 · 1 admitted-via-IGD). Helpers `findClaim()` · `findClaimsByStatus()` · `findClaimsByPenjamin()`.
- **`src/lib/eklaim/reconciliationMock.ts`** (150 ln) — `RECONCILIATION_MOCK` 5 transfer batch: BPJS multi-klaim exact match (auto, confidence 1.0) · Mandiri Inhealth cashless single · Prudential reimbursement · BPJS partial paid dengan `selisih: 320_000n` `statusSelisih: "Write-off"` (manual match, confidence 0.85) · BPJS unmatched Pending (transfer baru masuk, empty matchedClaims). Helpers `findReconciliation()` & `findReconciliationsByPenjamin()`.
- **Infra:** `tsconfig.json` `target` bumped `ES2017` → `ES2020` untuk support BigInt literals (`123n` syntax). Zero breaking change — Next.js 16 + Node 18+ sudah modern stack. Lib `["dom", "dom.iterable", "esnext"]` tetap.
- **DEFERRED:** `CLAIM_EDGE_CASES_MOCK` (10 edge cases — pickup saat helper EK0.3 atau adapter EK0.4 butuh test robustness) · `__fixtures__/claimsTestFixtures.ts` (deterministic minimal — pickup saat unit testing helper).
- **Best practices applied:** Factory pattern untuk DRY mock entries · Lookup helper functions (`findX` by code/status/penjamin) · `Omit<>` utility type untuk lookup-vs-result distinction · `ReadonlyArray<T>` everywhere · BigInt literals (`123n`) untuk Rupiah · file split saat exceed 800 ln limit (claimsMock 999 → claimMockFactory 297 + claimsMock 715) · sumber regulasi traceable di setiap mock (Pedoman iDRG 2025 · PMK 26/2021 · PMK 3/2023 · AAJI Standar Klaim).
- Verifikasi: `npx tsc --noEmit` clean, semua file under 800 ln limit (terbesar claimsMock.ts 715 ln).

---

## ✅ Selesai — EHIS-Eklaim Foundation EK0.3 Helpers (2026-05-26)

8 helper file (~1600 ln total) + 1 deferred (`zodSchemas.ts` ke EK0.4 karena depends zod install + adapter shape final). All `npx tsc --noEmit` clean.

- **`src/lib/eklaim/money.ts`** — Rupiah arithmetic & format. `formatRupiah()` (id-ID "Rp 1.250.000") · `formatRupiahShort()` (rb/jt/M untuk KPI card) · `parseRupiah()` (accept "Rp 1.250.000" / "1,250,000" / raw) · `addRupiah/subtractRupiah/multiplyRupiah` (BigInt-safe) · `applyPercent()` (banker's rounding via `(rp * num + denom/2) / denom`) · `eqRupiah/maxRupiah/minRupiah` (comparison). Boundary-only: `rupiahFromNumber()` (throw if float) + `rupiahToDisplayNumber()` (unsafe annotated, DISPLAY ONLY). Spek awal `parseRupiah → sen` di-revise karena `Rupiah = bigint` bulat tanpa sen (sesuai EK0.1 decision).
- **`src/lib/eklaim/stateMachine.ts`** — 13-status state machine. `ALLOWED_TRANSITIONS: Record<ClaimStatus, ReadonlySet<ClaimStatus>>` + `REQUIRED_ROLE: Record<ClaimStatus, ReadonlySet<ClaimActorRole>>` (Coder/TimKlaim/VerifikatorBPJS/Kasir/system). Predicates: `canTransition(from, to, role)` · `isTerminal()` · `allowedNextStatuses()` untuk UI dropdown. Executor: `transitionClaim(claim, input) → Result<ClaimRecord, ClaimError>` (append timeline `status-transition` event + bump `optimisticLock.version` + auto-set `submittedAt/rejectionReason/bandingCount/paidAt` sesuai target). `STATUS_REQUIRE_REASON` Set: Rejected/Susulan Required/Write-off/Sengketa/Banding Rejected. Status terminal: Paid + Write-off.
- **`src/lib/eklaim/softLock.ts`** — Multi-coder concurrency. In-memory `Map<claimId, SoftLock>` REGISTRY (sesuai mock-stage). `acquireSoftLock(claimId, userId, opts)` (re-acquire by same user OK + perpanjang TTL) · `releaseSoftLock()` (no-op kalau bukan owner, idempotent) · `isLockedByOther(claimId, currentUserId)` (UI banner predicate) · `getLockInfo()` (return remaining menit + expiresAt). Maintenance: `purgeExpiredLocks()` + test-only `_resetSoftLockRegistry()`. TTL default 15 menit. Production swap → Redis SETNX TTL zero refactor caller.
- **`src/lib/eklaim/claimCalc.ts`** — Pure aggregates. `totalApproved/totalPaid/totalTarifRS` (sum dengan undefined filter) · `approvalRate()` (exclude in-progress status) · `avgDaysToPaid()` (days dari submittedAt → paidAt, rounded .1) · `agingBucket()` 4-bucket "0-30"/"31-60"/"61-90"/">90" + `bucketByAging()` Record map untuk chart · `cbgMarginPercent()` (renamed dari marginCbg untuk clarity grouper vs RS) + `avgMarginPercent()` · `countByStatus()` untuk filter chip Board · filter predicates `isBelumSubmit/isPendingBPJS/isButuhBanding`.
- **`src/lib/eklaim/berkasChecker.ts`** — Validasi kelengkapan berkas. `checkBerkas(claim) → BerkasCheckResult { ready, missing, optional, progressPercent, items }`. Resolve template via `getBerkasTemplate(penjamin, tipePelayanan)` lalu match instance by (kategori, nama). "Siap" + "Tidak Berlaku" dianggap satisfied. Convenience: `isBerkasReady()` fast predicate (early exit) + `missingBerkasCategories()` ringkas untuk banner.
- **`src/lib/eklaim/eligibilityChecker.ts`** — V-Claim API parity. `checkEligibility({noKartu, tanggalSEP, jnsPelayanan}) → Promise<Result<EligibilityCheckResult, ClaimError>>`. Validation order fail-fast: shape (13-digit numerik) → ISO date format → transient fail simulation → SEP lookup di CLAIM_BOARD_MOCK → masaBerlaku boundary → jnsPelayanan vs SEP.jenisRawat consistency. Options: `transientFailRate` (default 0 deterministic) + `forceResult` test override. Latency 200-500ms match real V-Claim. Production swap → `vClaimAdapter.checkEligibility()` call.
- **`src/lib/eklaim/reconciliationMatcher.ts`** — 3-strategy matching. `matchTransfer(transfer, pool)` order: (1) exact nominal subset 1.0 conf via greedy desc sort, (2) periode+count ±2% 0.9 conf, (3) fuzzy ±5% 0.7 conf, (4) unmatched. Output `MatchResult { matched, unmatched, selisih, recommendedStatus: "AutoMatched" | "NeedsReview" | "Unmatched" }`. `matchBatch()` untuk N transfer dengan exclude-after-match (avoid double-count). `toReconciliationRecord()` bridge ke storage. Filter eligible: status Approved/Sengketa + approvedAmount defined + penjamin tipe + periode submittedAt YYYY-MM match.
- **`src/lib/eklaim/groupingResolver.ts`** — Dual-engine router (AD-19). `resolveGrouping(ctx) → Promise<Result<iDRGResult | InaCbgLegacyResult, ClaimError>>` route by `ctx.eraGrouper`. iDRG path: lookup `findIDRGByICD10IM(primer.kode)` → pick entry matching procedure (fallback first) → severity scorer heuristik (sekunder count + LOS 5/10 threshold + caraPulang Meninggal/kelas ICU + age <=1/>=70) → return dengan tarif per tingkat kompetensi RS. INA-CBG Legacy path: prefix mapping ICD-10-IM letter → CBG group letter (I→I-1, E→I-4, O→O-6, J→J-1, K→K-1, U→U-1) + severity Roman dari LOS. `resolveComparator(ctx)` resolve KEDUA engine paralel untuk EK4 dual preview. Helpers `countIDRGCandidates()` + `hasIDRGMapping()` untuk UI hint. Latency 500-1500ms match real grouper. CC vs MCC split via `hospitalAcquired` flag.
- **DEFERRED:** `zodSchemas.ts` ke EK0.4 — depends on zod install (dependency baru) + adapter shape harus stable dulu sebelum schema runtime validation make sense. Sementara: TypeScript compile-time types + manual shape check di adapter mock.
- **Best practices applied:** `Result<T, E>` discriminated union via `Ok()/Err()` constructors (no throw) · `ReadonlySet`/`ReadonlyArray` untuk immutable contracts · pure functions semua kecuali softLock (intentional in-memory registry) · `// ── Section ──` headers · JSDoc explain WHY non-obvious (regulasi reference + production swap path) · interface match spek V-Claim/iDRG resmi (zero-refactor saat backend ready) · helper extraction untuk readability (e.g. `scoreSeverity`, `findExactSubset`, `buildChecklist`) · test override params (`now`, `forceResult`) untuk deterministic testing.
- Verifikasi: `npx tsc --noEmit` clean, semua file under 800 ln limit (terbesar reconciliationMatcher.ts ~260 ln).

---

## ✅ Selesai — EHIS-Eklaim Foundation EK0.4 Adapter Stubs (2026-05-26)

5 adapter file + 2 refactor (~1200 ln total). All `npx tsc --noEmit` clean. **Architecture pattern:** Adapter (transport layer, raw response shape match spek resmi) ↔ Resolver/Checker (orchestration + raw→domain mapping). Production swap = ganti body adapter function ke real `fetch()` call; caller (resolver/UI) tidak berubah.

- **`src/lib/eklaim/iDRGGrouperAdapter.ts`** (PRIMARY) — Bridge ke INA-Grouper iDRG (Pedoman iDRG 2025 Kemenkes). `groupiDRG(ctx, config) → Promise<Result<iDRGGrouperRawResponse, ClaimError>>` (raw shape `{ status, metadata: { grouperVersion, requestId, timestamp, elapsedMs }, result, error }`) + `toIDRGResult(raw, tingkat) → iDRGResult` mapper. Severity scorer heuristik (sekunder count + LOS + caraPulang + age extreme + kelas ICU). Tarif as bigint string (JSON precision safety). `iDRGGrouperConfig` opts: `failRate` (default 5%) + `fixedLatencyMs`. Latency 500-1500ms match real grouper. Status "ERROR" envelope return Ok (caller decide map ke ClaimError).
- **`src/lib/eklaim/inaCbgLegacyAdapter.ts`** (LEGACY — parked) — E-Klaim Kemenkes desktop file-based integration. `exportToEklaimXml(claim) → string` minimal XML serializer (no XML lib dep, manual escape `<&>"`) + `importGrouperResult(xml) → Result<InaCbgRawResult, ClaimError>` regex parser + `groupInaCbg(ctx, config)` in-memory convenience untuk EK4 Comparator + `toInaCbgLegacyResult(raw) → InaCbgLegacyResult` mapper. Raw shape: `{ cbgCode, groupDescription, severityRoman: "I"/"II"/"III", tarifKelas3/2/1/VIP as string, versiGrouper, generatedAt }`. PARKED — hanya dipakai klaim transisi pre-Okt 2025 + dual-engine Comparator.
- **`src/lib/eklaim/vClaimAdapter.ts`** — BPJS V-Claim REST. 3 methods: `checkSEP(noSEP, config)` · `getEligibility(noKartu, tanggalSEP, jnsPelayanan, config)` · `submitClaim(claim, batchId, config)` semua return `Promise<Result<VClaimEnvelope<T>, ClaimError>>`. Envelope shape match spek: `{ metaData: { code, message }, response? }`. 3 mappers: `toSEPRecord/toEligibilityDomain/toClaimStatus`. Header pattern annotated JSDoc (`X-cons-id` consumer ID · `X-timestamp` Unix epoch · `X-signature` HMAC-SHA256 base64 · `user_key`). LZ-String compression absent di mock (real production decompress di adapter, caller zero-change). Submit distribusi: 60% Pending Verifikasi · 35% Approved · 5% Rejected. `VClaimConfig` opts: `consId/userKey/failRate/fixedLatencyMs/forceResult`.
- **`src/lib/eklaim/vedikaAdapter.ts`** — Verifikasi Digital Klaim BPJS (pull pattern, bukan polling). `pullVerifikatorStatus(batchId, config) → Promise<Result<VedikaBatchResponse, ClaimError>>` filter `CLAIM_BOARD_MOCK` by batchId + generate random per-klaim status. Raw shape per klaim: `{ noKlaim, klaimId, statusVerifikator: BELUM_DIPROSES/DALAM_PROSES/DISETUJUI/DITOLAK/PENDING_BERKAS, tarifDisetujui, alasanReject, daftarBerkasSusulan, verifierNama, verifiedAt }`. Distribusi default: 60% Approved · 25% Pending · 10% Susulan Required · 5% Rejected (overridable via `VedikaConfig.distribution` untuk deterministic test). `statusBatch` derived: QUEUED/PROCESSING/COMPLETED. Mapper `toClaimStatusFromVedika()`.
- **`src/lib/eklaim/apolAdapter.ts`** — STUB PHASE LATER. Interfaces `APOLResepRecord` + `APOLBatchSubmitInput` defined. Methods `submitAPOLBatch/pullAPOLStatus` return `Err({ type: "ValidationError", field: "apol", message: "PHASE_LATER" })` — eksplisit reject (no silent no-op). APOL = Aplikasi Pelayanan Obat Layanan FKTL untuk klaim obat kronis FKTL. Diimplementasi saat EK7 reconciliation obat kronis aktif.
- **Refactor `groupingResolver.ts`** — Sekarang delegate ke `iDRGGrouperAdapter.groupiDRG()` + `inaCbgLegacyAdapter.groupInaCbg()`. Lookup logic + severity scorer extracted ke adapter; resolver tinggal orchestrate + map raw "ERROR" envelope ke `ClaimError` via `toIDRGResult()`/`toInaCbgLegacyResult()`. `resolveComparator()` paralel kedua engine via `Promise.all([..])` + secondary failure attach (tidak block).
- **Refactor `eligibilityChecker.ts`** — Sekarang delegate ke `vClaimAdapter.getEligibility()`. Pakai `toEligibilityDomain()` mapper + business rules tambahan: `mapMetaDataToEligibilityError()` pattern match V-Claim message → typed `EligibilityError.reason` (SEP_EXPIRED/NIK_NOT_FOUND/KELAS_NOT_COVERED) + `resolveFallbackContext()` derive `tingkatKompetensiRS` dari klaim mock (V-Claim tidak return field ini, production resolve dari master RS profile).
- **Best practices applied:** Adapter pattern (transport ↔ orchestration separation) · raw response shape match spek resmi (BPJS V-Claim envelope · iDRG INA-Grouper · VEDIKA distribution) · bigint as string di JSON shapes (avoid precision loss) · header pattern annotated JSDoc untuk production swap reference · config overridable per-call (`failRate`/`fixedLatencyMs`/`forceResult`/`distribution`) untuk deterministic test · explicit PHASE_LATER stub (apol) — no silent no-op · mapper functions exposed (`toX(raw)`) untuk caller reuse · `Promise.all` + `.catch` pattern di Comparator untuk paralel resolve dengan graceful degradation.
- Verifikasi: `npx tsc --noEmit` clean, semua file under 800 ln limit (terbesar vClaimAdapter.ts ~320 ln).

**EK0 Foundation 100% selesai** — 4/4 sub-phase done (Types · Mocks · Helpers · Adapters). Total `src/lib/eklaim/` = 15 file, ~5150 ln. Siap pickup EK1 (Beranda) atau EK2 (Klaim Board) atau EK3 (Klaim Detail) sesuai prioritas business.

---

## ✅ Selesai — EHIS-Eklaim EK1 Beranda (2026-05-26)

Frontend dashboard landing untuk `/ehis-eklaim` — 7 file komponen + 2 file route + nav wiring (~1368 ln total komponen). All `npx tsc --noEmit` clean. Dev server `GET /ehis-eklaim` → HTTP 200 (skeleton 500ms → fade-in client-side hydration). Frontend-design skill diterapkan.

- **Accent teal** dipilih (distinct dari modul lain: care=rose · dashboard=indigo · master=violet · registration=sky · billing=amber · report=emerald). Hindari indigo per preferensi user.
- **Layout 12-kolom** anti long-scroll: kiri (col-7) = QuickNav 2x2 · kanan (col-5) = 3 panel stacked. Fit dalam 1 viewport ~720p+. Skeleton 500ms via `useSkeletonDelay()` (existing helper di master/shared).
- **`src/components/eklaim/beranda/berandaEklaimShared.ts`** (374 ln) — single source: tone palette (`EKLAIM_TONE` 6 tone: teal/amber/rose/emerald/sky/slate) · helper format Rupiah (`fmtRupiahKpi` short suffix · `fmtRupiahFull` thousand sep) · derived stats functions (`getEklaimStats` 5 KPI · `getQuickNavCards` 4 nav · `getButuhBanding` sort hari desc · `getAkanExpired` sort kunjungan desc · `getRecentSubmissions` sort agoSec asc) · `daysUntilDeadlineSubmit()` countdown ke tgl 10 next month · penjamin tipe config · `fmtAgo()` relative time.
- **`KPIStripEklaim.tsx`** (173 ln) — 5 KPI card grid-5 (Klaim Hari Ini teal · Pending Verifikasi amber · Belum Submit rose dengan meter · Approval Rate emerald dengan meter · Total Pembayaran sky). Each card: icon ring + label + value (text-2xl black tabular-nums) + sub + optional meter bar + hover underline bar. Framer stagger 0.04s.
- **`QuickNavGridEklaim.tsx`** (138 ln) — section card 2x2 grid. Per card: icon-bg ring + label + badge mono + desc line-clamp + chevron/lock. Card disabled tampil opacity-70 + border-dashed + lock icon. Hover translate-x chevron.
- **`ButuhBandingPanel.tsx`** (179 ln) — Header icon rose + total potensi rugi. List 5 klaim Rejected/Banding Rejected sort hari desc. Row: pasienId + noKlaim + penjamin badge + hari + selisih chip. Empty state Inbox. Footer link banding (Soon badge).
- **`AkanExpiredPanel.tsx`** (190 ln) — Header amber + total tertahan. List 5 klaim belum-submit sort hari kunjungan desc. Row: badge "{hari}h lalu" rose ≥20h amber otherwise + urgency bar (% dari 30-hari window). Empty state CheckCircle2. Footer link `/ehis-eklaim/klaim?status=belum-submit`.
- **`RecentSubmissionPanel.tsx`** (164 ln) — Header teal + total nominal. List 8 submission terbaru. Row: kind badge (Submitted amber · Approved emerald · Paid teal · Rejected rose) + penjamin badge + pasienId + noKlaim mono + nominal (approvedAmount kalau ada) + agoSec compact.
- **`BerandaEklaimPage.tsx`** (150 ln) — Page shell: hero teal-accent + KPIStrip + 12-col body grid. Skeleton match section heights. Framer `AnimatePresence mode="wait"` skel → page transition 0.2s. Timestamp pill jam (id-ID).
- **Route wiring `src/app/ehis-eklaim/{layout,page}.tsx`** — `ModuleLayout moduleKey="eklaim"` shell + metadata "E-Klaim · Beranda". Plus `src/lib/navigation.ts`: new `ModuleKey "eklaim"`, descriptor (icon ShieldCheck · accent teal), `eklaimNav` (Beranda LayoutGrid · Klaim Board Inbox · iDRG Calculator Scale · Banding FileText · Reconciliation ArrowDownUp), `NAV_MAP.eklaim`. Module switcher otomatis include via MODULES array.
- **Best practices applied:** Skeleton 500ms (no jarring flash) · framer stagger animation (0.04-0.05s delay per item) · density-friendly typography (text-[10px]-[12.5px] hierarchy) · tabular-nums untuk numerik · semantic HTML (header/section/aside/footer/ul/li) · accessibility focus-visible ring · responsive mobile-first (grid-cols-1 → md → lg break) · component file size 138-374 ln (all <800) · single source of truth pattern (shared file) · no indigo per user preference · no bright font in body content · no long scroll (12-col split) · clickable rows via Link href deep-link (UI siap saat klaim detail dibangun).
- Verifikasi: `npx tsc --noEmit` clean, dev server boot 591ms · `curl /ehis-eklaim` HTTP 200, no runtime errors.

---

## ✅ Selesai — EHIS-Eklaim EK1 Beranda V2 Redesign (2026-05-26)

User feedback V1 ("layout tidak optimal · tidak interaktif · scroll panjang"). Total redesign single-viewport interactive dashboard pakai /frontend-design skill. 9 file komponen (~1883 ln · all <800). `npx tsc --noEmit` clean.

**Innovation utama:**
- **Anti-scroll**: 3 panel stacked (V1) → 1 tabbed panel (V2). Eliminates 3x vertical scroll segments.
- **Hero composite card**: Featured stat besar (3-4xl tabular-nums) + SVG sparkline 14-hari animated + trend chip ↑/↓% vs periode lalu + Period segmented control 3-opsi (Hari Ini · 7 Hari · Bulan Ini) dengan `motion.layoutId` smooth indicator + 4 mini KPI 2x2 grid di kolom kanan.
- **Interactive pipeline funnel**: 5-stage horizontal (Draft → Belum Submit → Pending → Approved → Paid) dengan bar fill proportional + click stage → deep-link `/ehis-eklaim/klaim?status=<key>` filter pre-applied.
- **Tabbed activity sidebar**: 3 tab (Banding · Expired · Recent) dengan count badge + active indicator `motion.layoutId` + content `AnimatePresence` slide-fade 0.18s + adaptive footer per tab.

**File changes:**
- **NEW** `HeroSummaryCard.tsx` (290 ln) — Composite featured card 2-col layout. LEFT: featured stat + sparkline SVG + period segmented + CTA button. RIGHT: 4 mini KPI tiles. Subtle gradient bg `from-white via-white to-teal-50/30` + radial blur accent.
- **NEW** `PipelinePanel.tsx` (143 ln) — Horizontal funnel 5-stage clickable. Per stage: tone dot + label + count (text-xl black) + nominal + bar fill animated (delay stagger). Hover translate-y + shadow boost.
- **NEW** `ActivityTabPanel.tsx` (239 ln) — Tabbed sidebar orchestrator. Tab bar: 3 button dengan count badge. `motion.layoutId="activity-tab-active"` indicator. Content area `flex-1 min-h-0 overflow-y-auto` (single scroll). Adaptive footer link per active tab.
- **REWRITE** `QuickNavGridEklaim.tsx` (137 ln) — Compact 4-col grid (sm:2 / lg:4). Per card: icon ring with hover rotate-3 + scale-110, count badge mono, 1-line desc truncate, bottom bar animation. Lebih dense + interactive.
- **REWRITE** `BerandaEklaimPage.tsx` (144 ln) — New layout 4-section vertical: HeroBar slim (1-line) · HeroSummaryCard · PipelinePanel · MainGrid (col-7 QuickNav + col-5 ActivityTabPanel). Target ~640px fit 720p.
- **REWRITE** `ButuhBandingPanel.tsx` (86 ln) · `AkanExpiredPanel.tsx` (107 ln) · `RecentSubmissionPanel.tsx` (101 ln) — Strip outer card + header + footer. Return flat list saja (now content untuk ActivityTabPanel tabs). Empty state inline tetap.
- **EXTEND** `berandaEklaimShared.ts` (374 → 636 ln) — `PipelineStage` type + `getPipelineStages()` builder (5-stage Draft/Belum Submit/Pending/Approved/Paid · status mapping ke ClaimStatus[]) · `SparklineDatum` + `getSparkline14d()` last-14-day createdAt groupBy + `buildSparklinePath()` SVG path constructor (M/L commands + area close) · `Period` type + `PERIOD_OPTIONS` + `calcTrend(period)` window comparator (current vs previous same-length window) + `periodRanges()` helper · `MiniKpi` type + `getMiniKpis()` 4-tile builder dari EklaimStats.
- **DELETED** `KPIStripEklaim.tsx` — superseded by HeroSummaryCard mini KPIs.

**Design tokens applied (frontend-design skill):**
- **Visual hierarchy**: Featured stat 3-4xl `font-black tracking-tight tabular-nums` → 4 mini KPI text-lg → support meta 10-11px
- **Color discipline**: teal primary (E-Klaim accent) · 5 tone variations untuk pipeline + activity tabs · slate base · no indigo · no bright colors di body content (slate-500 untuk meta, slate-800 untuk title)
- **Micro-interactions**: SVG path-draw 0.7s easeOut (sparkline) · scale-spring on tab indicator (stiffness 380 damping 30) · stagger reveal 0.04-0.05s per item · hover rotate-3 + scale-110 icon · chevron translate-x · border-bottom bar grow
- **Accessibility**: role="tab"/"tablist" + aria-selected · focus-visible ring-2 ring-slate-300 ring-offset · button vs Link semantic · aria-label deskriptif (sparkline + stage click)
- **Spacing scale**: base-4 (gap-1 / gap-1.5 / gap-2 / gap-3 / gap-4) · padding p-2.5 / p-3 / p-4 / p-5 (responsive)
- **Surface**: rounded-xl border-slate-200 bg-white shadow-sm — konsisten semua card · gradient hero only · hover -translate-y-0.5 + shadow-md

**Verifikasi:** `npx tsc --noEmit` clean. File sizes 86-636 ln (all <800 limit). 9 file total ~1883 ln di `src/components/eklaim/beranda/`. Pattern berbeda dari Beranda Billing/Master (lebih interactive + featured-card-driven instead of KPI-strip-driven).
