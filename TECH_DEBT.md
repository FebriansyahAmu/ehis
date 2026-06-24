# EHIS — Tech Debt Registry

> Daftar tech debt + refactor pending lintas modul. Update setiap menemukan masalah arsitektural / duplikasi / shortcut sementara.
>
> **Workflow docs**:
> - [CLAUDE.md](CLAUDE.md) — current state + active work
> - [TODO.md](TODO.md) — Master phase roadmap (Phase 0–3 ✅)
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend implementation roadmap
> - [.claude/DONE.md](.claude/DONE.md) — completed work archive
> - [.claude/GAP_ANALYSIS.md](.claude/GAP_ANALYSIS.md) — clinical gap audit
> - [.claude/STANDARDS.md](.claude/STANDARDS.md) — clinical standards reference

---

## 🌐 Cross-Module

- [~] 🔐 **AuthN + RBAC enforcement (backend)** — ✅ **TERIMPLEMENTASI & AKTIF** (2026-06-07, `AUTH_ENFORCE=true`): `getActor`/`getServerActor` ([src/lib/auth/actor.ts](src/lib/auth/actor.ts)) verifikasi **JWT (jose)** → `401` bila invalid; `assertCan` menolak `403`; superuser = **Admin** (`isSuperuser` ≠ `isGlobal`, [superuser.ts](src/lib/auth/superuser.ts)); RBAC seed **97 perm/187 grant** + matriks **editable dari Master (DB-wired)**; menu-gating + `requireModule` per-layout. **Sisa:** (1) **ABAC `scopeBy(actor)` di DAL** — Service terima `actor` tapi belum object-level/unit scoping (anti-IDOR, OWASP API1/API5) → `requireScope` **wajib sebelum akun klinis unit-scoped** live; (2) **hardening produksi** → lihat **§🔑 Auth & RBAC Security** di bawah. Catatan: AuthN ini juga membuka idempotency (GAP-D), rate-limit, dan audit trail CUD (GAP-B).
- [✅ **Decision 2026-05-30**] **ClaimRecord source-of-truth di `/ehis-eklaim`** — `claimReadCache.ts` di `/ehis-billing` hanya read-only cache (helper `getClaimStatusForInvoice`, `eklaimDeepLink`). Billing tidak boleh mutate `ClaimRecord`. Cross-modul links (PenjaminDetail, BillingGateBanner, PatientHeader IGD/RI/RJ) pakai query-param deep-link (`?pasien=`, `?invoice=`, `?penjamin=`) — tidak ada shared state. Saat backend siap: swap `CLAIM_BOARD_MOCK` → `prisma.claim.findMany()`, cache read via REST endpoint `/api/eklaim/claim-status/{invoiceId}`.
- [ ] **Replace mock data dengan Prisma queries** — mulai dari `PatientMaster`. Lihat [TODOS_BACKEND.md](TODOS_BACKEND.md#phase-1-database-layer) untuk roadmap migrasi.
- [ ] **Error boundary + loading skeleton** — wajib untuk semua fullpage routes (saat ini hanya beberapa route punya skeleton 500ms via `useSkeletonDelay`).
- [ ] **`SidebarContext`** — belum dipakai konsisten di semua modul. Beberapa modul masih pakai prop drilling untuk collapse state.
- [ ] **Print / Export Dokumen PDF** — cetak dokumen legal per tab: CPPT (per tanggal), TTV chart, Resume Medis (INA-CBG), Resume Pulang (PMK 24/2022), Surat-surat (Keterangan Sakit, Rujukan, dll), Informed Consent, RAT. Kandidat: `window.print()` + print stylesheet, atau `@react-pdf/renderer`. PMK 269/2008 · PMK 24/2022
- [ ] **Clinical Pathway Integration (RI)** — alur tatalaksana standar per diagnosis (GJK, Pneumonia, Sepsis, dll), CBG-aligned. Kandidat: tab baru di RI, pull diagnosis dari `DiagnosaTab`, template per ICD-10. PERMENKES 1438/2010

---

## 🔑 Auth & RBAC Security *(hardening produksi — 2026-06-07)*

> Fondasi sudah praktik-baik (scrypt · JWT pendek 30m httpOnly/sameSite=lax · refresh rotating + reuse-detection · enforcement server `assertCan` · lockout 5×/15m · pesan login generik · privilege separation `isSuperuser`≠`isGlobal` · PII enc at-rest). **Aman untuk dev/internal; BELUM production-secure.** Item ditunda (acuan [BACKEND-AUTH §11](docs/BACKEND-AUTH.md)) — semua *tracked*, bukan terlupa.

**🔴 Wajib sebelum produksi (hadapkan ke jaringan tak tepercaya / data pasien nyata):**
- [ ] **`AUTH_SECRET` produksi** — ganti nilai dev di `.env` → secret manager + rencana rotasi (rotasi = invalidasi semua access; refresh DB tetap).
- [ ] **Audit trail auth** (LOGIN/LOGOUT/REVOKE/ubah-izin/akses-sensitif) — **penting RS/UU PDP**; siapa akses apa, kapan. Seam GAP-B.
- [ ] **Rate-limit login** (per-IP + per-akun) — credential-stuffing terdistribusi; lockout saat ini hanya per-akun. (Redis ditunda → bisa in-memory/DB interim.)
- [ ] **Security headers** — CSP · HSTS · X-Frame-Options/`frame-ancestors` · X-Content-Type-Options · Referrer-Policy (di `proxy.ts`/`next.config`).
- [ ] **ABAC `requireScope`/`scopeBy(actor)`** — wajib **sebelum akun klinis unit-scoped** (Dokter/Perawat) live; tanpa ini akun klinis lihat data **semua unit**. (= sisa #1 Cross-Module.)
- [ ] **Gate RBAC domain klinis SHARED salah resource** — endpoint rekam medis shared (`/kunjungan/:id/{triase,observasi,anamnesis}`, dan domain klinis berikutnya) semua di-gate `clinical.igd:read|create` (mirror Triase), padahal **Observation/Anamnesis/… shared lintas IGD/RI/RJ**. Akibat: akun klinis RI/RJ (punya `clinical.ri`/`clinical.rj`, BUKAN `clinical.igd`) akan **salah ditolak** menulis TTV/anamnesis pasien RI/RJ. Superadmin OK sekarang (bypass), jadi tak memblok dev. **Wajib sebelum akun klinis unit-scoped live.** Opsi: (a) perm baru per-domain (`clinical.observation`, `clinical.anamnesis`, …) + re-seed `auth.permission`/`role_permission`, atau (b) gate per-unit dinamis (resolve unit kunjungan → cek `clinical.{igd|ri|rj}`) — `route()` resource statis jadi butuh pola baru (assert di Service via `actor`). Selaraskan dgn item namespace `clinical.*`→`medicalrecord.*` (🟢) + ABAC `requireScope`. Lihat [TODO-CLINICAL](TODO-CLINICAL.md) (catatan per-domain).

**🟡 Perlu ditinjau / dikonfirmasi:**
- [ ] **Akses lintas-unit Farmasi (ABAC) — Apoteker tak bisa rekonsiliasi IGD/RI** — `clinical.rekonsiliasi:create` sudah di-grant ke Apoteker (RBAC, 2026-06-14), tapi `route()` choke-point men-scope semua `clinical.*` ke `careUnit` aktor (turunan `Pegawai.unitKerja` → hanya cocok pola IGD/RawatInap/RawatJalan). Apoteker (unit "Farmasi") → `careUnits=[]` → **404** untuk kunjungan IGD/RI manapun. Padahal rekonsiliasi obat = tanggung jawab klinis Apoteker (PMK 72/2016). Opsi: (a) role Apoteker `unitScoped=false` (terlalu luas — buka semua data klinis), (b) **exception per-resource**: izinkan resource lintas-unit tertentu (`clinical.rekonsiliasi`, mungkin `clinical.resep`) bypass careUnit untuk role farmasi, (c) map "Farmasi" → semua careUnit khusus endpoint obat. Sampai diputuskan, inputter rekonsiliasi efektif = **Dokter/Perawat**. Sejalan dgn item ABAC `requireScope` di atas + [project_rbac_penunjang_standalone].
- [ ] **CSRF untuk mutasi** — `sameSite=lax` proteksi wajar, tapi pertimbangkan `sameSite=strict` atau CSRF token untuk POST/PATCH/DELETE berisiko.
- [ ] **Parameter scrypt** (N/r/p) — pastikan cukup kuat (atau swap **argon2id**; format hash self-describing → migrasi mulus).
- [ ] **Pastikan `.env` ter-`.gitignore`** — `AUTH_SECRET`/`PII_*`/`DATABASE_URL` jangan ter-commit.

**🟢 Nice-to-have (bukan keamanan inti):**
- [ ] **Revoke instan** (Redis `jti` blocklist) — token curian valid ≤30m walau logout; dimitigasi TTL pendek + revoke-saat-refresh (DB).
- [ ] **MFA TOTP** — field `mfaEnabled`/`mfaSecret` sudah ada (forward-compat), enforcement ditunda.
- [ ] **`changePassword` flow FE** + paksa saat `mustChangePassword=true`.
- [ ] **Menu/aksi gating `<Can>` rollout** — UX (server tetap penjaga via 403); bungkus tombol CRUD per-modul iteratif. Lihat [TODO-RBAC-MODUL](TODO-RBAC-MODUL.md) Fase 2e.
- [ ] **Selaraskan namespace permission `clinical.*` → `medicalrecord.*`** *(opsional, kosmetik)* — schema DB sudah di-rename `clinical`→`medicalrecord` (2026-06-08), tapi resource RBAC tetap `clinical.igd|ri|rj|cppt|diagnosa|tindakan|resep` (namespace izin ≠ schema DB; endpoint Triase pakai `clinical.igd`). Menyelaraskan = pekerjaan terpisah: ubah `PERMISSION_TREE`/`rbacShared` + generator + **migrasi re-seed `auth.permission`/`role_permission`** (rename kode, jaga grant) + sinkron `route()` resource + `navigation.ts`. Tak mendesak (fungsional sama). Lihat [TODO-CLINICAL](TODO-CLINICAL.md).

---

## 🩺 IGD

- [ ] **AllergyPane IGD** — masih local, padahal `shared/asesmen/AllergyPane.tsx` sudah ada. Refactor `AsesmenMedisTab` sub-pane Alergi ke thin wrapper.
- [ ] **PenilaianTab IGD** — audit overlap Morse/Braden/Barthel dengan `PenilaianRisikoPane.tsx` RI. Ekstrak konstanta ke `shared/asesmen/penilaianShared.ts`.

---

## 🛏 Rawat Inap

### CarePlanTab (RAT)
- [ ] **Link ke DiagnosaTab** — masalah aktif di RAT idealnya pull dari entri ICD-10 di `DiagnosaTab` (bukan diketik ulang). Perlu shared state atau props `diagnosaList` dari parent `RIRecordTabs` diteruskan ke `CarePlanTab`.
- [ ] **Template per diagnosis** — library template RAT per diagnosis umum (GJK, Pneumonia, Sepsis, App Akut, dll). Target/intervensi pre-fill saat masalah dikenali. Kandidat: `carePlan/careplanTemplates.ts`.
- [ ] **Multi-PPA** — tambah kolom Gizi, Farmasi, Fisioterapis saat modul tersebut aktif. `PPASection` sudah generic — tinggal extend `PhaseData` dan tambah panel baru di `PhaseSection`.
- [ ] **Riwayat revisi / audit trail** — RAT bisa berubah saat kondisi pasien berubah drastis; simpan snapshot per-edit dengan `revisedAt` + `revisedBy`. Perlu Prisma schema.

### MAR (Medication Administration Record)
- [ ] **Gate dispensasi selesai** — obat seharusnya muncul di MAR hanya setelah farmasi `status: "Selesai"` (serah terima sudah dilakukan). Saat ini `MARTab` langsung baca `resepRI.items` tanpa cek status farmasi. Fix: tambah filter `isDispensed(item.id)` yang cek `workflowStore` atau field status di `ResepRIItem`. Tanpa ini perawat bisa "mencatat pemberian" obat yang belum diterima dari apotek.
- [ ] **Overdue alert** — tidak ada indikasi obat yang jadwal jam-nya sudah lewat tapi belum dicatat. Tambah visual `overdue` di `DrugCard`: jika `timeSlot.waktu < now` dan belum ada entri untuk slot itu, tampilkan ring amber + label "Terlambat X mnt" di samping time chip. Hanya aktif di tab "Hari ini".

### Gizi & Nutrisi
- [ ] **GiziNutrisiTab — Diet Order dari DaftarOrderTab** — saat ini diet order diisi standalone di GiziTab. Idealnya DPJP order diet dari `DaftarOrderTab` (tipe baru `"Diet"`), GiziTab hanya membaca order aktif (read-only) + dietitian addendum + monitoring tetap di sini. Perlu: tambah tipe `"Diet"` di `daftarOrderShared.ts`, filter di `GiziNutrisiTab`, hapus form `DietOrderForm`. Kerjakan saat DaftarOrder pakai real data.

---

## 🩻 Rekam Medis Klinis (shared IGD/RI/RJ)

### Pemeriksaan Fisik — cleanup pasca Anatomi domain *(2026-06-14)*
- [ ] **`PemeriksaanFisik.bodyMarkings` (JSONB) vestigial** — sub-tab Anatomi kini punya domain sendiri `medicalrecord.PenandaanAnatomi` (per-item, body-map). Kolom `bodyMarkings` di `pemeriksaan_fisik` (+ field di `PemeriksaanFisikEntry`/Zod/DTO/`emptyFormState`) tak lagi sumber kebenaran & selalu kosong (StatusFisikPane tak mengisinya). Aman di-drop (belum ada data nyata): drop-column migration + bersihkan schema/Zod/Service/DTO/FE. Ditunda — harmless.
- [x] **Sub-tab Penunjang (PemeriksaanTab IGD) di-wire** ✅ *(2026-06-15)* — difokuskan ulang ke diagnostik bedside **non-Lab/Rad** (Lab/Rad/USG dihapus karena punya modul sendiri; sisa EKG + Spirometri/EEG/EMG/Audiometri/Ekokardiografi/Treadmill). Form di-redesain (interpretatif: Keterangan+Hasil+Kesimpulan, tanggal=DateTimePicker). Domain backend `medicalrecord.PemeriksaanPenunjang` (add/delete only, soft-delete, gate `clinical.pemeriksaan`). **Sisa: upload file hasil masih placeholder** — butuh storage (belum ada); object storage + tabel attachment lintas-domain = follow-up tersendiri.
- [ ] **Riwayat pemeriksaan fisik (>1 baris) belum ditampilkan** — domain append-only "latest wins" simpan tiap re-pemeriksaan sbg baris baru; FE baru tampilkan/prefill yang terbaru. Tambah panel riwayat (mirror RiwayatPane RI) bila perlu jejak.

### Pemeriksaan Fisik — mode per-unit (Head-to-toe vs Per-sistem) *(diputuskan 2026-06-14, belum diimplementasi)*

> **Keputusan desain** (diskusi 2026-06-14): tab Pemeriksaan Fisik pakai **mode berbeda per unit** — **IGD = head-to-toe** (topografik, seperti sekarang), **RI & RJ = per-sistem** (fisiologis/organ-system). Komponen tetap **satu shared** [StatusFisikPane.tsx](src/components/shared/medical-records/pemeriksaan/StatusFisikPane.tsx) (dipakai IGD/RI/RJ via `PemeriksaanTab`). **Belum backend** (Pemeriksaan = bagian "11 tab lain ⬜" TODO-CLINICAL) → murah diubah sebelum kontrak DB; saat backend, schema harus mencerminkan organisasi terpilih.

**Rencana implementasi — Tier 1 dulu (free-text reorganisasi), Tier 2 menyusul:**
- [ ] **Tier 1 (sekarang) — reuse akordion, tambah prop `mode`** (tak perlu skill frontend-design, pattern-conforming):
  - Prop `mode: "headToToe" | "perSistem"` di shared pane. Dua set def di file yg sama: `HEADTOTOE_DEF` (11 region, persis sekarang) + `PERSISTEM_DEF` (8 pane di bawah). `sistem` → `Record<string,string>` (key per mode, longgar — bukan lagi 11 key head-to-toe terkunci di [`SistemFisikKey`](src/lib/data.ts#L159)). `emptyFormState(mode)`.
  - IGD `mode="headToToe"`, RI/RJ `mode="perSistem"`. Label header ikut mode (sekalian perbaiki label rancu "Per Sistem (Head-to-toe)").
  - **Status Generalis** (KU/Kesadaran/Gizi/Orientasi) + **Temuan Abnormal** + **Catatan Umum** + **BodyMap** → tetap sama di kedua mode. **Kesadaran/GCS/Orientasi tetap di Status Generalis (Konstitusional)**; pane Neurologi per-sistem fokus motorik/sensorik/refleks/N. kranialis/meningeal (hindari dobel).
  - **Cleanup:** hapus copy nyasar [rawat-inap/tabs/pemeriksaan/StatusFisikPane.tsx](src/components/rawat-inap/tabs/pemeriksaan/StatusFisikPane.tsx) — tak dipakai (RI impor yang shared).
- [ ] **Tier 2 (menyusul)** — field terstruktur per sistem prioritas (KV: BJ I-II/murmur/JVP/edema/CRT · Respirasi · Neuro) → CDS + tagging FHIR `Observation`/SNOMED *body system* (interop SatuSehat). **Greenfield UI → wajib invoke skill frontend-design.**

**Cakupan "9 ringkas"** = Konstitusional (blok Status Generalis, kedua mode) + **8 pane per-sistem** (RI/RJ):

| # | Pane sistem | Cakupan | Serap dari head-to-toe |
|---|---|---|---|
| 1 | **Kepala–Leher** | Mata · THT-KL · mulut · tiroid · KGB | kepala+mata+tht + tiroid/KGB(leher) |
| 2 | **Neurologi** | motorik · sensorik · refleks · N. kranialis · meningeal | neurologi |
| 3 | **Kardiovaskuler** | BJ I-II · murmur · gallop · JVP · akral · CRT · edema | jantung + JVP(leher) + akral/edema(ekstremitas) |
| 4 | **Respirasi** | trakea · toraks · suara napas · ronkhi/wheezing | toraks_paru + trakea(leher) |
| 5 | **Gastrointestinal** | abdomen · bising usus · hepar/lien | abdomen + mulut(tht) |
| 6 | **Genitourinaria** | nyeri ketuk CVA · kandung kemih · genitalia | urogenital |
| 7 | **Muskuloskeletal** | ROM · kekuatan otot · sendi · deformitas | ekstremitas (ROM/kekuatan) |
| 8 | **Integumen** | turgor · warna · lesi · luka/dekubitus | kulit |

Endokrin & Limfatik **regional** (tiroid, KGB) → masuk Kepala–Leher; tanda sistemik sementara ke Catatan Umum (dipisah saat Tier 2).

**Draft teks "Normal" per pane** (sudah disepakati, untuk preset tombol ✓ Normal):
1. Kepala–Leher — *"Normosefali. Konjungtiva tidak anemis, sklera tidak ikterik, pupil isokor ∅3mm, RC +/+. Hidung sekret (-); telinga membran timpani intak; mulut mukosa lembab, faring tidak hiperemis, tonsil T1/T1. Leher: tidak ada pembesaran KGB maupun tiroid."*
2. Neurologi — *"Kaku kuduk (-). N. kranialis dalam batas normal. Kekuatan motorik 5555/5555, sensorik baik. Refleks fisiologis +/+ normal, patologis (-)."*
3. Kardiovaskuler — *"Iktus kordis tidak tampak/teraba, batas jantung normal. BJ I-II normal reguler, murmur (-), gallop (-). JVP tidak meningkat. Akral hangat, CRT <2 detik, edema (-)."*
4. Respirasi — *"Trakea di tengah. Toraks simetris statis-dinamis, fremitus simetris, sonor. Suara napas vesikuler +/+, ronkhi -/-, wheezing -/-."*
5. Gastrointestinal — *"Datar, supel. Bising usus (+) normal. Tidak ada nyeri tekan/defans muskular. Hepar & lien tidak teraba. Perkusi timpani."*
6. Genitourinaria — *"Nyeri ketuk kostovertebra (-). Kandung kemih tidak teraba. Genitalia eksterna normal. BAK tidak ada keluhan."*
7. Muskuloskeletal — *"Tidak ada deformitas. ROM penuh semua sendi. Kekuatan otot 5/5/5/5. Edema/atrofi (-)."*
8. Integumen — *"Turgor kulit baik. Tidak ikterik, tidak sianosis. Tidak ada lesi maupun luka tekan (dekubitus)."*

**Konteks klinis:** head-to-toe = *teknik melakukan* pemeriksaan (topografik, alur bedside perawat); per-sistem = *kerangka mendokumentasikan & menalar* (organ-system → korelasi diagnosa ICD/SDKI, koding FHIR/SNOMED, agregasi abnormal). Keduanya tak saling meniadakan.

---

## 💊 Farmasi

- [ ] **Gudang Farmasi (Inventory & Stok)** — modul terpisah: kartu stok digital per depo, FEFO/FIFO enforcement, min-max stock alert, permintaan depo ke gudang, transfer antar depo, penerimaan dari supplier. PMK 72/2016 Bab IV

### Resep Order DB (BE+wiring ✅ 2026-06-19)
- [x] **Workflow status order DB persist** ✅ (2026-06-20) — Telaah & Dispensing kini tersimpan snapshot (`medicalrecord.ResepTelaah`/`ResepDispensing`) + transisi atomik `Diterima→Ditelaah→Selesai` (`receive`/`telaah`/`dispensing` di [resepService](src/lib/services/resep/resepService.ts), gate `ancillary.farmasi.telaah`/`serah`). [FarmasiBoard](src/components/farmasi/FarmasiBoard.tsx) refetch setelah aksi. Sisa: board belum real-time (SSE) antar-user; status pakai String column (tanpa enum) — by-design.
- [ ] **`bzaKode` belum dibawa dari item resep IGD** — `ResepItem.bzaKode` ada di schema (untuk pelinkan alergi presisi di Farmasi) tapi IGD [ResepPasienTab](src/components/igd/tabs/ResepPasienTab.tsx) memilih obat dari `OBAT_CATALOG` (mock tanpa BZA) → bzaKode dikirim kosong. Saat IGD pindah ke katalog obat DB (`obat-tersedia` punya `bza[]`), isi `bzaKode` saat select. RI/RJ `ResepPane` juga belum kirim bzaKode.
- [ ] **Resep = tabel sendiri, BUKAN domain Order generik** — keputusan 2026-06-19: tab Resep di-backend-kan duluan via `medicalrecord.ResepOrder`+`ResepItem`, sementara Daftar Order / Order Lab / Order Rad (#14/16/17) MASIH `ORDERS_MOCK`. Saat domain Order generik dibangun, putuskan apakah Resep dilebur atau tetap tabel khusus (MedicationRequest punya struktur signa/dosis/durasi yang beda dari ServiceRequest Lab/Rad — kemungkinan tetap terpisah).
- [ ] **Panel "Riwayat Resep" masih mock** — IGD [ResepPasienTab](src/components/igd/tabs/ResepPasienTab.tsx) menampilkan `RIWAYAT_MOCK` per noRM; endpoint `GET /kunjungan/:id/resep` + client `listResep` **sudah ada tapi belum dikonsumsi**. Fix: ganti panel riwayat → fetch `listResep(kunjunganId)` (UUID-guard) agar resep yang baru di-order langsung muncul. RI/RJ riwayat (`resepRI`) juga dari parent mock.
- [ ] **TTE + Cetak baru di IGD** — alur tanda tangan elektronik + barcode + preview/cetak A4 ([shared/resep/{TteBarcode,ResepCetakTemplate,ResepCetakModal}]) baru dipasang di IGD `ResepPasienTab`. RI/RJ shared [ResepPane](src/components/shared/medical-records/resep/ResepPane.tsx) belum (alurnya draft→`onSend`, tanpa layar signed/cetak). Komponen sudah shared → tinggal di-wire ke ResepPane.
- [ ] **Cari Obat resep fallback ke mock** — `obat-tersedia` (gate clinical.resep:read) hanya kembalikan obat **Aktif & ter-formularium** (Mapping Hub → Formularium). Bila formularium kosong/unauth → [ObatSearch](src/components/shared/resep/ObatSearch.tsx) fallback ke `OBAT_CATALOG` mock (dev-safety). Obat di Katalog Obat yang BELUM dipetakan ke formularium tak akan muncul (by-design). Saat data formularium produksi lengkap, fallback mock bisa dilepas.

### Farmasi klinis lanjutan (follow-up 2026-06-21)
- [ ] **Dispensing Farmasi → OUT Inventory (+ billing)** — saat ini `dispensing` hanya transisi status resep + ingest billing; **belum mengurangi stok** `inventory.StockMovement` (OUT). Fix: post OUT FEFO via `movementService.postMovement` saat serah, stamp `refType="RESEP", refId=resepOrderId`. Membuka: (a) **Register N/P baris "Keluar" + identitas pasien** otomatis (join resep), (b) gate MAR "obat sudah diserahkan" (lihat §RI), (c) saldo depo akurat. Lihat [TODO-INVENTORY-BACKEND.md](TODO-INVENTORY-BACKEND.md) follow-up.
- [ ] **Register N/P — laporan SIPNAP lengkap** — [RegisterNarPsiPane](src/components/farmasi/narPsi/RegisterNarPsiPane.tsx) kini read-only proyeksi ledger (saldo+mutasi dari `getInvItemDetail`). Belum: **saldo berjalan** per baris (DTO `InvItemMovementDTO` terlalu tipis — tak ada arah TRANSFER/identitas) + **template cetak A4 SIPNAP** + ekspor Dinkes. Butuh endpoint movement N/P yang lebih kaya (refType/refId + join resep). Witness 2-petugas narkotika sudah ditangkap saat dispensing.
- [ ] **CPPT shared: sembunyikan Edit/Flag bila tak punya `clinical.cppt:update`** — [CPPTEntryCard](src/components/shared/medical-records/CPPTEntryCard.tsx) selalu menampilkan tombol Edit & Flag; Apoteker & Perawat (grant `[read,create,delete]` tanpa update) → **403 saat klik**. Gate tombol via `useSession().can("clinical.cppt","update")` (selaras pola tombol Hapus yang sudah pakai `canDelete`).

---

## 🗄 Master Data

### Unit & Ruangan (backend ✅ 2026-06-06)
- [ ] **Konsumen `RUANGAN_MOCK` belum migrasi ke API** — `RuanganPage` sudah pakai DB ([api/ruangan.ts](src/lib/api/ruangan.ts) + SSR), tapi `RUANGAN_MOCK` ([ruanganShared.ts](src/components/master/ruangan/ruanganShared.ts)) MASIH dipakai **BPJS Aplicares** ([aplicaresKamarMock.ts](src/lib/bpjs/mock/aplicaresKamarMock.ts)) + **Mapping Hub** ([PenjaminRuanganPane.tsx](src/components/master/mapping/penjamin-ruangan/PenjaminRuanganPane.tsx)). Saat kedua modul di-backend-kan: ganti ke fetch `/api/v1/master/ruangan?view=tree`, lalu hapus `RUANGAN_MOCK`.
- [ ] **SD6 — Tests** (unit Service: anti-cycle/guard hapus/kapasitas/root read-only/version/inherit alamat/kode dup; integration DAL Testcontainers). Lihat [BACKEND-MASTER-SUMBER-DAYA.md](docs/BACKEND-MASTER-SUMBER-DAYA.md) SD6.
- [ ] **Seed clean root manual** — [prisma/seed_ruangan_clean.sql](prisma/seed_ruangan_clean.sql) di-run via `prisma db execute`. Saat Profil RS (Tier 4) dibangun, root di-sync dari sana; jadikan bagian `prisma/seed.ts` resmi.

### Mapping Hub
- [ ] **Layanan Unit — kode `unitDefault`↔Location belum selaras (2026-06-12)** — kolom matrix kini = **kode Location** real (`IGD-TRI`, `POLI-JTG`) dari master Unit & Ruangan, tapi `tindakan.unitDefault` (tab Relasi katalog) masih pakai **kode curated lama** (`IGD`, `RJ`). Seed default sudah di-scope ke kode valid (stat akurat) → default cell mulai kosong, admin map manual. Penyelarasan = **chargemaster CM2** ([TODO-CHARGEMASTER.md](TODO-CHARGEMASTER.md)): tab Relasi pakai unit Location-based + `getBillableServices()`. **Persist FULL ✅ (2026-06-12)** — tabel `master.LayananUnit` (join Tindakan⇄Location, hard-delete, unik) + endpoint `/master/layanan-unit` GET/POST/DELETE (grant/revoke idempoten, `master.mapping` RBAC) **+ matriks ter-wire** (kolom bawa `locationId` · toggle/baris/kolom = grant/revoke optimistik + revert + indikator auto-save · seed map dari edge saat SSR). Sisa murni federasi Lab/Rad + pindah ke `Tarif.unitTerkait` (chargemaster CM2/CM5) + selaraskan kode `unitDefault`↔Location.
- [ ] **Snapshot SSR beku saat ganti sub-page (remount)** — `MappingHubPage` membungkus tiap pane dalam `AnimatePresence mode="wait"` keyed `activeKey` → ganti menu sidebar **unmount→remount** pane, dan pane re-seed state dari prop `initial*` (snapshot SSR saat page-load, BUKAN state DB terbaru). Akibatnya hasil edit sesi ini "hilang" dari grid sampai hard refresh. **Layanan Unit ✅ FIXED (2026-06-12)** — reconcile-on-mount: SSR seed utk first paint instan + selalu `listAllLayanan()` ulang tiap mount (`dirtyRef` guard cegah clobber optimistik in-flight). **SDM Assignment masih kena** (seed dari `initialPenugasan`, fetch hanya bila SSR absen) → terapkan pola reconcile-on-mount yang sama. Solusi tuntas lintas-pane = SSE/record-bus ([[record-bus-reactivity]]) atau lift state ke hub.
- [ ] **Mocks lightweight** — `penjaminMock.ts` (6 penjamin), `obatMock.ts` (30 obat), `depoMock.ts` (6 depo) dibikin sebagai placeholder sebelum Tier 2/3 dibangun. Saat Katalog Obat/Penjamin/Depo real ready, migrate import path. Field schema sengaja diselaraskan dengan rencana Tier 2/3 (kode/nama/kategori/flags) supaya replace tidak break consumers.
- [ ] **Bidirectional sync** — Map perubahan di Distribusi/RBAC belum push back ke source entity (state lokal only). Saat backend ready, perlu sync helper + audit log per relasi. **(SDM Assignment ✅ 2026-06-06 — persist `master.PenugasanRuangan`. Layanan Unit ✅ · Tarif ✅ · Formularium ✅ 2026-06-13 — persist langsung ke `master.FormulariumObat` grant Obat⇄Location, BUKAN push-back. Kewenangan Klinis: dokter source = API real, tapi map kewenangan masih state-only → kandidat tabel `DokterKewenangan`.)**
- [ ] **Formularium — mobile drill-down view (2026-06-13)** — desktop = matriks Obat × Ruangan + `LayananUnitTreePanel` (re-use). Di mobile, tabel hanya scroll horizontal (belum ada drill-down per-unit seperti `LayananUnitMobileView`). Kandidat: `FormulariumMobileView` mirror Layanan Unit, atau generalisasi `LayananUnitMobileView` jadi jenis-agnostik (sekarang coupled ke `LayananRow`/`ROW_KATEGORI`).
- [ ] **Import/export Excel** — Tarif Matrix paling butuh (admin billing biasa kerja via Excel). Kandidat: `xlsx` library + helper `tarifToWorkbook()` / `parseTarifWorkbook()`. Bisa di-extend ke Formularium + Distribusi.
- [ ] **Audit trail** — siapa edit cell apa kapan. Kandidat shared `mapping/MappingAuditPane.tsx` consume audit log dari semua mapping operations. Dipakai oleh Beranda Mapping (recent-edit feed) dan Mapping Validator (root cause finding).
- [ ] **Snapshot / Template per RS Tipe** — backup full mapping state, restore "RS Tipe C default" / "RS Khusus Jantung default" / "RS Tipe B Pendidikan default". Sangat membantu onboarding RS baru — minimal seed state ada vs blank. Kandidat: JSON export/import `MappingSnapshot` yang berisi semua 8 Map.
- [ ] **SDM Assignment — UI edit period** — saat ini hanya `sinceISO` (display-only). UI edit period mulai/sampai per-assignment belum, kandidat panel inline expandable atau modal.
- [ ] **Tarif Matrix — pull base price dari `/ehis-master/tarif`** — refactor `initTarifMap()` (saat ini multiplier hard-coded kompleksitas × kelas × penjamin). Base price diambil dari `TARIF_MOCK` (master tarif), Mapping Hub hanya define `multiplier[penjamin][kelas]`. Saat backend ready, derive harga dari `tarif.hargaBase × multiplier[penjamin][kelas]`. Bonus: tambah override per-cell untuk kasus khusus.

### Mapping Hub — Sub-page Baru (planned)
- [ ] **Beranda Mapping** (sidebar item pertama) — coverage dashboard pane. % cell terisi per matriks (Tarif 1470 cell · Formularium · Distribusi · Kewenangan · Layanan Unit), heatmap mini per matriks (8 grid kecil), stat strip global, recent-edit feed dari audit trail.
- [ ] **Mapping Validator / Health Check** — diagnostic pane dengan severity warna. Aturan: Dokter aktif tanpa unit assignment · Tindakan tanpa unit pelaksana · Obat formularium BPJS tapi di Apotek RJ stok kosong · Kewenangan diberikan ke dokter yang tidak punya spesialis terkait · Tarif kosong untuk kombinasi Tindakan × Kelas wajib · Penjamin × Ruangan duplikat. Setiap finding ada action "Fix di sub-page X" deep-link.
- [ ] **Jadwal Praktik Dokter** — weekly grid Dokter × Hari × Jam. Konsumsi `DokterRecord.jadwal` cross-dokter, deteksi clash (≥2 dokter spesialis sama overlap), highlight slot bentrok rose. Filter per poli/spesialis. Depends on Poliklinik (Tier 3).
- [ ] **Tindakan × Penjamin (Coverage)** — matrix exclude/include sederhana (mis. bedah kosmetik tidak di-cover BPJS). Pane khusus visualisasi cover/non-cover + opsi alasan exclude.
- [ ] **Dokter × Penjamin (Rekanan)** — beberapa asuransi punya dokter rekanan khusus. Matrix Dokter × Penjamin dengan toggle "Rekanan" + tier (Gold/Silver/Standard) per cell. Dipakai Registration saat verifikasi cover asuransi.
- [ ] **PPK × Spesialis** — RS rujukan A terima spesialis apa saja. Untuk lookup saat `DisposisiRJTab` / Rujuk IGD eksternal pilih PPK tujuan. Depends on PPK module + `SPESIALIS_LABEL` dari `dokterShared.ts`.
- [ ] **RBAC granularitas — Role × Unit Scope** — extend RBAC sub-page. Refactor `RBACMap` jadi 3D: `[role][leafKey] → { actions, unitScope? }`. Mis. "Perawat" boleh akses RI tapi hanya ICU bukan semua RI.

### Master — Other
- [x] **Katalog ICD-10 & ICD-9 — Import** — ✅ 2026-06-10: backend `master.IcdCode` + endpoint list/CRUD/`import` (bulk `createMany skipDuplicates`, dedup unique `(jenis,kode)`) + FE wired (pencarian & paginasi server-side cursor, Import Excel/CSV real via SheetJS dikirim per-batch). Mock data dihapus. Detail debt → subseksi **ICD** di bawah.
- [ ] **Poliklinik & Jadwal Dokter** — kapasitas antrian per poli per hari, jadwal buka (hari + jam mulai/selesai), assignment dokter per slot, libur/cuti override. Weekly schedule grid. Unblock Registration antrian real. Route: `/ehis-master/poli`. **Belum dibangun** (rencana Tier 3 master).
- [ ] **Promote Jadwal Praktik dari DokterDetail → Poliklinik atau Mapping Hub** — section "Jadwal Praktik" di [DokterDetail.tsx](src/components/master/dokter/DokterDetail.tsx) saat ini per-dokter, sulit lihat clash jadwal antar dokter. Promote ke weekly grid global. Decide saat Poliklinik dikerjakan.

### ICD-10 & ICD-9 (backend + FE wired ✅ 2026-06-10)
- [ ] **RBAC `master.icd` belum di-seed** — endpoint `/api/v1/master/icd` (GET/POST/PATCH/DELETE + `/import`) pakai resource `master.icd`. Dengan `AUTH_ENFORCE=true`, **superadmin bypass** (dev aman), tapi role non-super (mis. Admin Master) belum punya grant → **403**. Perlu seed permission `master.icd` (read/create/update/delete) + grant ke role pengelola master. Lihat [docs/BACKEND-AUTH.md](docs/BACKEND-AUTH.md) + [TODO-RBAC-MODUL.md](TODO-RBAC-MODUL.md).
- [ ] **Preview duplikat import = in-file saja** — [ImportExcelModal](src/components/master/icd/import/ImportExcelModal.tsx) kirim `existingItems={[]}`; dedup vs DB dilakukan **server** (unique `jenis,kode`) & dilaporkan via `skipped` saat commit. Hasil akhir akurat, tapi preview tak menandai kode yang sudah ada di DB. Kandidat: endpoint cek-dup ringan, atau tampilkan `skipped` per-batch.
- [ ] **Stat & footer count = data yang dimuat saja** — StatCard "Kode dimuat" + footer menghitung halaman yang sudah di-fetch (cursor), **bukan total katalog**. Belum ada endpoint COUNT. Tambah `count` di `meta` list atau endpoint terpisah bila perlu total akurat (mis. "12.480 ICD-10").
- [ ] **Search server-side = ILIKE `contains`** — [icdDal.list](src/lib/dal/icdDal.ts) pakai `contains insensitive` pada `kode`+`display` (seq scan, OK di ~18k). Untuk dataset penuh / latensi rendah, pertimbangkan index trigram (`pg_trgm` GIN) — butuh CREATE EXTENSION + raw SQL migration.
- [ ] **Soft-deleted code + re-import** — `@@unique([jenis,kode])` global → kode yang pernah soft-deleted akan **di-skip** saat re-import (dianggap duplikat) walau `deletedAt` terisi. Edge case; bila perlu "revive", tambah logika undelete/upsert di `importBatch`.

### Pengguna & Pegawai (backend WIRED 2026-06-05)
- [ ] **Edit/suspend/hapus AKUN belum persist** — di tabel Pengguna, aksi Edit Akun (username/peran/status), Suspend/Aktifkan, Hapus masih **optimistic UI** (state lokal) → revert saat refresh. Butuh endpoint `PATCH /auth/users/:id` (username/status) + `DELETE /auth/users/:id` (cek akun-yatim/audit) + wiring. `PenggunaEditForm` masih mock.
- [ ] **Paginasi tabel** — `listPegawai`/`listUsers` di-cap `limit=50` (kontrak `ListQuery`/`ListUsersQuery` max 50). UI belum punya "muat lebih"/cursor → >50 baris terpotong. Tambah infinite-scroll atau tombol cursor.
- [ ] **`Non_Aktif` → `Locked`** — enum FE (Aktif/Suspended/Non_Aktif) dipetakan ke enum server auth (Active/Suspended/Locked) di [users.ts](src/lib/api/users.ts); `Locked` semantiknya brute-force lockout, bukan "dinonaktifkan". Saat modul auth runtime, tambah nilai enum `Disabled` khusus + revisi mapping.
- [ ] **Password hash scrypt → argon2id** — [password.ts](src/lib/crypto/password.ts) pakai `node:crypto` scrypt (tanpa dependency native). Format self-describing `scrypt$N$r$p$salt$dk` → swappable; saat auth runtime ganti ke argon2id (per BACKEND-AUTH §3), `verifyPassword` baca format lama utk migrasi mulus.
- [ ] **`UserUnitScope` belum diisi** — wizard Step 3 hanya set roles+status; unit-scope (ABAC) belum (butuh id `master.ruangan` yg belum ada). Saat master ruangan siap, assign unit per akun.
- [ ] **Edit pegawai: clear field opsional** — [PegawaiEditModal](src/components/master/pengguna/PegawaiEditModal.tsx) kirim `undefined` utk field opsional kosong (skip, bukan null) → tak bisa **mengosongkan** gelar/agama/dll yg sudah terisi. `UpdatePegawaiInput` belum terima `null` untuk clear. NIK juga read-only (tak bisa koreksi via UI).
- [ ] **Unit Kerja multi-pilih = seed interim (keputusan terkunci → [BACKEND-AUTH §2.3](docs/BACKEND-AUTH.md))** — field Unit Kerja di [PenggunaAddWizard](src/components/master/pengguna/PenggunaAddWizard.tsx) Step 1 + [PegawaiEditModal](src/components/master/pengguna/PegawaiEditModal.tsx) kini `MultiSelect`, disimpan koma-join ke `master.Pegawai.unitKerja` (satu String) via `splitUnitKerja`/`joinUnitKerja` ([penggunaShared.ts](src/components/master/pengguna/penggunaShared.ts)). **Best-practice resolution (2026-06-06):** ada **2 lapisan beda** — `unitKerja` (penempatan HR, konvensi 1 home) vs `auth.UserUnitScope` (cakupan akses operasional ABAC, sumber kebenaran, editor = Mapping Hub SDM Assignment). Multi-select sekarang berperan **seed-only**. **Wave-2 (saat auth runtime):** (a) pindahkan pemilih multi ke **wizard Step 3 "Unit Akses"** → tulis `UserUnitScope` (seed-on-provision, sekali-tulis); (b) `unitKerja` balik **single home**; (c) ~~migrasi kosakata SDM Assignment dari `UNIT_LIST`/`POLI_LIST` legacy~~ **✅ 2026-06-06 — SDM Assignment kini tabel sendiri `master.PenugasanRuangan` (Pegawai⇄Location/ruangan), terpisah dari UserUnitScope; mock UNIT_LIST/POLI_LIST dibuang**; (d) `actor` baca `UserUnitScope`. **Catatan:** `UserUnitScope` (akses, level Unit) ≠ `PenugasanRuangan` (operasional, level Ruangan) — dua tabel beda tujuan. Risiko interim: koma-join tak joinable ("siapa di unit X") — diterima karena bukan kontrol akses. Lihat juga "UserUnitScope belum diisi" di atas + Mapping Hub bidirectional sync.

---

## 🔐 BPJS Integration (`/ehis-bpjs`)

- [ ] **vClaimAdapter shim cleanup** — `src/lib/eklaim/vClaimAdapter.ts` saat ini re-export ke `@/lib/bpjs/vClaimAdapter` (Phase BP0.1, 2026-05-28). Consumer eklaim ([eligibilityChecker.ts](src/lib/eklaim/eligibilityChecker.ts), [SubmissionTab.tsx](src/components/eklaim/detail/tabs/SubmissionTab.tsx)) belum di-update import path. **Action:** setelah eklaim refactor selesai, update 2 consumer ke `import { ... } from "@/lib/bpjs/vClaimAdapter"` lalu hapus shim file.
- [ ] **Real HMAC-SHA256 signature** — [authHeader.ts](src/lib/bpjs/authHeader.ts) `mockHmacSha256Base64()` saat ini deterministic stub (base64 of payload), bukan HMAC valid. Backend Phase: swap ke Node `crypto.createHmac("sha256", secret).update(payload).digest("base64")` atau Web Crypto `subtle.sign("HMAC", ...)`.
- [ ] **Real LZ-String compression** — [lzStringHelper.ts](src/lib/bpjs/lzStringHelper.ts) Phase 1 no-op (JSON.stringify saja). Backend Phase: install NPM `lz-string` + swap `compressLZ/decompressLZ` ke `LZString.compressToEncodedURIComponent` / `decompressFromEncodedURIComponent`. Call site tidak berubah.
- [ ] **BPJS Credentials → Secret Manager** — [credentialsStore.ts](src/lib/bpjs/credentialsStore.ts) `BPJS_CREDS_MOCK` placeholder dev. Production wajib load `consId/consSecret/userKey` dari env vars + Secret Manager (Vault/AWS SM), jangan commit.
- [ ] **Reference cache sync (manual → cron)** — Phase 1 (BP8) manual "Sync All References" CTA di Beranda BPJS. Backend Phase: scheduled job (BullMQ + Redis) refresh diagnosa/poli/dokter/faskes/spesialistik weekly.
- [ ] **Audit log → DB table** — Phase 1 `BPJSAuditEntry` di client `useSyncExternalStore`. Backend Phase: persist ke DB table dengan retention 5 tahun (UU PDP 27/2022).
- [ ] **Aplicares bed realtime push (WebSocket)** — Phase 1 manual force-refresh. Backend Phase: WebSocket push saat workflow klinis RI admisi/discharge update bed status.
- [ ] **Rate limiting per cons-id** — BPJS impose limit per consumer. Backend Phase: implement client-side throttle + server-side queue.
- [ ] **Circuit breaker pattern** — handle V-Claim outage anggun (fallback ke cache + degraded mode UI).
- [ ] **Wilayah Kemendagri JSON cascading** — dropdown propinsi/kabupaten/kecamatan reuse Kemendagri JSON yang sudah dipakai master Ruangan. Pastikan loader shared, jangan duplicate.

---

## 🏥 Registration Backend (`/ehis-registration`)

> Backend RJ ✅ (2026-06-04, lihat [TODO-REGISTRASI.md](TODO-REGISTRASI.md#phase-reg-be--backend-integration-loket--db-2026-06-04) REG-BE). Sisa yang ditunda:

- [ ] **Board loket realtime (SSE/polling)** — board RJ ([RJBoardLive](src/components/rawat-jalan/RJBoardLive.tsx)) fetch sekali saat mount + patch optimistik lokal; perubahan operator lain belum auto-refresh. Butuh SSE/Redis (lihat [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md)).
- [x] ~~PasienBaruModal submit → API~~ ✅ **sudah** — [PasienBaruModal.tsx:255](src/components/registration/pasien-baru/PasienBaruModal.tsx#L255) `registerPatient` → `POST /patients` dedup-first → insert DB + toast. **Sisa kecil:** (a) setelah sukses hanya tampil success-panel (No.RM), belum auto-buka `/pasien/{id}`; (b) quick-register draft minimal 5-field (kiosk/MJKN) belum (REG1).
- [ ] **IGD/RI unit** — `registerKunjungan` hardcode `unit:"RawatJalan"` + superRefine tolak unit lain. IGD (triase) & RI (bed/kelas/asalMasuk) belum; SEP IGD/RI menyusul.
- [ ] **Nama DPJP** — `dpjpId` placeholder UUID; board/riwayat tampil "—". Butuh master Dokter (`sdm.Pegawai`/Practitioner) untuk resolve nama. Depend [TODOS_BACKEND.md](TODOS_BACKEND.md) B1.1.
- [ ] **Invoice draft saat check-in** (`Registered→Queued`) — TODO eksplisit di [kunjunganService](src/lib/services/kunjunganService.ts); depend domain Billing backend.
- [ ] **Antrean** — `antreanKodebooking` + nomor antri belum digenerate; depend domain Antrean ([TODO-ANTREAN.md](TODO-ANTREAN.md)).
- [ ] **Auth/RBAC nyata** — `getActor()` masih DEV actor super-akses; depend [docs/BACKEND-AUTH.md](docs/BACKEND-AUTH.md).
- [ ] **🟡 MOCK Cek Kepesertaan JKN "selalu Aktif"** *(2026-06-24)* — `cariKepesertaanJkn()` ([kepesertaanJknMock.ts](src/components/registration/kunjungan/Tabs/sep/kepesertaanJknMock.ts)) SELALU mengembalikan peserta AKTIF + data lengkap (sintesis dari nomor). Di-wire ke `BpjsPanel` (modal Pendaftaran Kunjungan Baru). **Ganti ke V-Claim saat produksi** — checklist + call-site di [docs/MOCK-JKN-KEPESERTAAN.md](docs/MOCK-JKN-KEPESERTAAN.md). Sisa: `SepStep1` (Update SEP) belum di-wire ke fungsi yang sama.
- [ ] **🟡 MOCK Penerbitan SPRI "selalu berhasil"** *(2026-06-24)* — `terbitkanSPRI()` ([spriMock.ts](src/components/igd/tabs/pasienPulang/spriMock.ts)) SELALU sukses + nomor referensi tiruan (format `0491R0010626K000291`). Di-wire ke `SPRIPanel` (tab Pasien Pulang IGD, status **Rawat Inap**) sebagai gerbang submit. **Ganti ke V-Claim `insertSPRI` saat produksi** — checklist + catatan `poliKontrol` (= spesialistik tujuan rawat, BUKAN ruang IGD asal) di [docs/MOCK-SPRI-RAWAT-INAP.md](docs/MOCK-SPRI-RAWAT-INAP.md). Sisa: map DPJP→kode dokter BPJS · `poliKontrol` dari spesialistik DPJP · simpan/cetak SPRI. **`SBARTransferPanel.tsx` kini orphan** (digantikan SPRIPanel di IGD) — pertahankan utk reuse transfer RI atau hapus bila tak dipakai.
- [ ] **`berlakuSampai` persist di Ubah Penjamin** — butuh date picker (field display-only sekarang; schema `UpdatePenjaminInput` belum terima tgl).
- [ ] **Konsistensi taksonomi 3-jenis** — `PENJAMIN_CFG` (badge tab Jaminan/board) masih label kanonik "BPJS Non-PBI"; StepPenjamin (DaftarKunjungan) masih 5 jenis. Selaraskan ke "Umum/Mandiri · BPJS/JKN · Asuransi Lainnya" bila diinginkan (kena lintas modul).

### Detail Kunjungan (`/pasien/:id/kunjungan/:kunjunganId`)

> Resolver + Overview/Header sudah baca DB via `GET /kunjungan/:id` ✅ (REG-BE.7 G-A/G-B/G-H, 2026-06-04). Sisa per-gap di halaman ini:

**Display (read-only) — data DTO belum lengkap:**
- [ ] **G-C · Nama DPJP** — [Header](src/components/registration/kunjungan/KunjunganDetailHeader.tsx#L152) & [RingkasanCard](src/components/registration/kunjungan/Tabs/OverviewTab.tsx#L141) tampil `"—"`; DTO cuma `dpjpId`. **Sama akar dgn "Nama DPJP" di atas** (master Dokter).
- [ ] **G-D · No.Kartu non-SEP** — [PenjaminCard](src/components/registration/kunjungan/Tabs/OverviewTab.tsx#L174) `noPenjamin` hanya terisi dari `sep.noKartu`; penjamin non-BPJS tanpa SEP → kosong. Perlu `KunjunganDTO` expose no kartu via join `PasienPenjamin` (dekripsi + RBAC) atau field `penjaminNoMasked`.
- [ ] **G-E · Dokumen kunjungan** — [DokumenCard](src/components/registration/kunjungan/Tabs/OverviewTab.tsx#L258) hanya `dokumen.rujukan` (dari relasi `rujukan`); `generalConsent` & `pengantarPasien` **belum ada kolom** di schema `encounter` ([encounter.prisma](prisma/schema/encounter.prisma#L71)). Keputusan: tambah kolom/tabel berkas kunjungan vs tetap placeholder.
- [ ] **G-F · jadwalKontrol · G-G · orderedServices** — tak ada di DTO; ranah Rencana Kontrol BPJS (BP6) / modul Order.

**Aksi (semua tab mock/no-op — 0 panggilan API di folder `kunjungan/`):**
- [ ] **G-I1 · Ubah Penjamin = alur ubah SEP** ([PenjaminForm](src/components/registration/kunjungan/Tabs/ActionForms.tsx)) — **KOREKSI (2026-06-04):** tab ini BUKAN ubah penjamin pasien, melainkan **cek keaktifan peserta BPJS (BpjsPanel) → ubah/terbit SEP (InlineSEPCard)**, flow sama dgn pendaftaran kunjungan. UI sudah benar (mock). Wiring backend = sama dgn **G-I2** (butuh endpoint Update/terbit SEP utk kunjungan existing, reuse `bpjsService` dari registerKunjungan). *(Catatan: modal "Ubah Penjamin" patient-level di dashboard **dihapus 2026-06-04** atas permintaan — Jaminan tab dashboard kini display-only; penjamin di-set/ubah via pendaftaran kunjungan. Endpoint `PATCH /patients/:id/penjamin` + service/DAL tetap ada tapi tanpa UI pemicu.)*
- [ ] **G-I2 · Update/terbit SEP** ([UpdateSEPForm](src/components/registration/kunjungan/Tabs/ActionForms.tsx#L226) + PenjaminForm InlineSEPCard) — stepper lokal `setSubmitted(true)` mock; belum panggil `bpjsService`/V-Claim. **Endpoint baru:** terbit/ubah SEP utk kunjungan existing (reuse logika SEP di `registerKunjungan`).
- [ ] **G-I3 · Ubah Paket** ([PaketForm](src/components/registration/kunjungan/Tabs/PaketForm.tsx)) — mock; depend Billing/paket.
- [ ] **G-I4 · Surat Rujukan** ([RujukanForm](src/components/registration/kunjungan/Tabs/RujukanForm.tsx)) — mock; `bpjs.Rujukan` ada di schema, belum di-wire.
- [ ] **G-I5 · Data Kecelakaan** ([KecelakaanForm](src/components/registration/kunjungan/Tabs/KecelakaanForm.tsx)) — mock; depend Jasa Raharja.
- [ ] **G-I6 · Cetak Dokumen** ([CetakTab](src/components/registration/kunjungan/Tabs/ActionForms.tsx#L320)) — `PrintRow` tanpa onClick; belum render dokumen apa pun.
- [ ] **G-I7 · Hapus Kunjungan** ([HapusForm](src/components/registration/kunjungan/Tabs/ActionForms.tsx#L341)) — `SaveBtn` no-op; butuh `DELETE /kunjungan/:id` soft-delete (`deletedAt`) + RBAC admin + guard status.
- [ ] **G-J · Inline-edit Header** ([handleSave](src/components/registration/kunjungan/KunjunganDetailHeader.tsx#L48)) — hanya `setIsEditing(false)`, tak persist. Butuh `PATCH /kunjungan/:id` (DPJP/tanggal/caraMasuk/keluhan, version-guarded).
- [x] ~~**G-K · Penjamin form duplikat**~~ ✅ **selesai (via penghapusan)** — modal "Ubah Penjamin" patient-level (`UbahPenjaminModal`) + hook `usePenjaminEdit` **dihapus 2026-06-04** atas permintaan. Tinggal satu: [PenjaminForm tab](src/components/registration/kunjungan/Tabs/ActionForms.tsx) = alur **ubah SEP**. Tak ada lagi duplikasi/ambiguitas penjamin-vs-SEP.

---

## 🔬 Modul Belum Dibangun

- [ ] **Laporan IKP** — form KTD/KNC/Sentinel. Kemungkinan modul EHIS-Safety. PMK 11/2017
- [ ] **Transfusi Darah (RI)** — pre/intra/post-transfusi checklist. SNARS PP 4
- [ ] **Billing Kasir (`ehis-billing`)** — invoice per kunjungan, rincian tindakan + obat, status pembayaran (Lunas/Proses Klaim/Belum), print struk + klaim BPJS V-Claim + INA-CBG calc + shift kasir + adjustment. `KasirData` type + mock sudah tersedia di `data.ts`. **Roadmap lengkap di [TODO-BILLING.md](TODO-BILLING.md)** — 10 fase (BL0 Foundation → BL9 UX Polish), 40 task, dependency: Master Tarif + Mapping Hub Tarif/Formularium (sudah ✅) + RS Profil KOP (sudah ✅).
- [🚧] **`ehis-registration`** — Backend RJ ✅ (kunjungan/SEP/lifecycle/jaminan); board loket + Pasien Baru API submit belum (lihat §Registration Backend di atas).
- [ ] **`ehis-report`** — laporan per periode, export Excel/PDF
- [ ] **`ehis-dashboard`** — stats cards (pasien hari ini per unit IGD/RI/RJ), BOR chart (bed occupancy rate), recent activity feed, quick-nav ke masing-masing modul. Route: `/ehis-dashboard`. Layout: ModuleLayout sudah ada.
- [ ] **`ehis-fhir` — Integrasi SatuSehat (modul terpisah dari master)** — semua interaksi FHIR/SatuSehat di sini supaya master pages bersih. Calon sub-pages: Beranda · Konfigurasi (kredensial API + env + Org_id Root SatuSehat Kemkes, sementara di `lib/master/rsConfig.ts`) · Sync Resource (Organization/Location/Practitioner via NIK lookup/HealthcareService) · Sync Log (audit trail) · Conflict Resolution (payload diff). Adapter layer di `lib/fhir/adapters/` saat backend ready. User profile target: IT integrator, bukan admin RS.

---

## 📚 Catatan

- Tech debt yang sudah resolved → pindah ke [.claude/DONE.md](.claude/DONE.md) dengan penjelasan resolusi.
- Tech debt yang muncul setiap kali implementasi → catat di file ini (bukan inline di CLAUDE.md) supaya CLAUDE.md tetap lean.
- Untuk feature gaps berdasarkan standar klinis → lihat [.claude/GAP_ANALYSIS.md](.claude/GAP_ANALYSIS.md).
