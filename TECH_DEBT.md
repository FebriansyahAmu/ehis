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

- [✅ **Decision 2026-05-30**] **ClaimRecord source-of-truth di `/ehis-eklaim`** — `claimReadCache.ts` di `/ehis-billing` hanya read-only cache (helper `getClaimStatusForInvoice`, `eklaimDeepLink`). Billing tidak boleh mutate `ClaimRecord`. Cross-modul links (PenjaminDetail, BillingGateBanner, PatientHeader IGD/RI/RJ) pakai query-param deep-link (`?pasien=`, `?invoice=`, `?penjamin=`) — tidak ada shared state. Saat backend siap: swap `CLAIM_BOARD_MOCK` → `prisma.claim.findMany()`, cache read via REST endpoint `/api/eklaim/claim-status/{invoiceId}`.
- [ ] **Replace mock data dengan Prisma queries** — mulai dari `PatientMaster`. Lihat [TODOS_BACKEND.md](TODOS_BACKEND.md#phase-1-database-layer) untuk roadmap migrasi.
- [ ] **Error boundary + loading skeleton** — wajib untuk semua fullpage routes (saat ini hanya beberapa route punya skeleton 500ms via `useSkeletonDelay`).
- [ ] **`SidebarContext`** — belum dipakai konsisten di semua modul. Beberapa modul masih pakai prop drilling untuk collapse state.
- [ ] **Print / Export Dokumen PDF** — cetak dokumen legal per tab: CPPT (per tanggal), TTV chart, Resume Medis (INA-CBG), Resume Pulang (PMK 24/2022), Surat-surat (Keterangan Sakit, Rujukan, dll), Informed Consent, RAT. Kandidat: `window.print()` + print stylesheet, atau `@react-pdf/renderer`. PMK 269/2008 · PMK 24/2022
- [ ] **Clinical Pathway Integration (RI)** — alur tatalaksana standar per diagnosis (GJK, Pneumonia, Sepsis, dll), CBG-aligned. Kandidat: tab baru di RI, pull diagnosis dari `DiagnosaTab`, template per ICD-10. PERMENKES 1438/2010

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

## 💊 Farmasi

- [ ] **Gudang Farmasi (Inventory & Stok)** — modul terpisah: kartu stok digital per depo, FEFO/FIFO enforcement, min-max stock alert, permintaan depo ke gudang, transfer antar depo, penerimaan dari supplier. PMK 72/2016 Bab IV

---

## 🗄 Master Data

### Mapping Hub
- [ ] **Mocks lightweight** — `penjaminMock.ts` (6 penjamin), `obatMock.ts` (30 obat), `depoMock.ts` (6 depo) dibikin sebagai placeholder sebelum Tier 2/3 dibangun. Saat Katalog Obat/Penjamin/Depo real ready, migrate import path. Field schema sengaja diselaraskan dengan rencana Tier 2/3 (kode/nama/kategori/flags) supaya replace tidak break consumers.
- [ ] **Bidirectional sync** — Map perubahan di Tarif/Formularium/Distribusi/RBAC belum push back ke source entity (state lokal only). Saat backend ready, perlu sync helper + audit log per relasi. Kandidat: `syncAssignmentFromMapping(sdmId)` push ke `DokterRecord.poliAssignment` / `PenggunaRecord.unitAssignment`.
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
- [ ] **Katalog ICD-10 & ICD-9 — Import CSV** — saat ini mock 80–120 entry. Real WHO dataset ~15.000 kode → perlu UI upload CSV/Excel admin di Phase 3 (backend ready). Tetap pakai sample mock untuk dev.
- [ ] **Poliklinik & Jadwal Dokter** — kapasitas antrian per poli per hari, jadwal buka (hari + jam mulai/selesai), assignment dokter per slot, libur/cuti override. Weekly schedule grid. Unblock Registration antrian real. Route: `/ehis-master/poli`. **Belum dibangun** (rencana Tier 3 master).
- [ ] **Promote Jadwal Praktik dari DokterDetail → Poliklinik atau Mapping Hub** — section "Jadwal Praktik" di [DokterDetail.tsx](src/components/master/dokter/DokterDetail.tsx) saat ini per-dokter, sulit lihat clash jadwal antar dokter. Promote ke weekly grid global. Decide saat Poliklinik dikerjakan.

### Pengguna & Pegawai (backend WIRED 2026-06-05)
- [ ] **Edit/suspend/hapus AKUN belum persist** — di tabel Pengguna, aksi Edit Akun (username/peran/status), Suspend/Aktifkan, Hapus masih **optimistic UI** (state lokal) → revert saat refresh. Butuh endpoint `PATCH /auth/users/:id` (username/status) + `DELETE /auth/users/:id` (cek akun-yatim/audit) + wiring. `PenggunaEditForm` masih mock.
- [ ] **Paginasi tabel** — `listPegawai`/`listUsers` di-cap `limit=50` (kontrak `ListQuery`/`ListUsersQuery` max 50). UI belum punya "muat lebih"/cursor → >50 baris terpotong. Tambah infinite-scroll atau tombol cursor.
- [ ] **`Non_Aktif` → `Locked`** — enum FE (Aktif/Suspended/Non_Aktif) dipetakan ke enum server auth (Active/Suspended/Locked) di [users.ts](src/lib/api/users.ts); `Locked` semantiknya brute-force lockout, bukan "dinonaktifkan". Saat modul auth runtime, tambah nilai enum `Disabled` khusus + revisi mapping.
- [ ] **Password hash scrypt → argon2id** — [password.ts](src/lib/crypto/password.ts) pakai `node:crypto` scrypt (tanpa dependency native). Format self-describing `scrypt$N$r$p$salt$dk` → swappable; saat auth runtime ganti ke argon2id (per BACKEND-AUTH §3), `verifyPassword` baca format lama utk migrasi mulus.
- [ ] **`UserUnitScope` belum diisi** — wizard Step 3 hanya set roles+status; unit-scope (ABAC) belum (butuh id `master.ruangan` yg belum ada). Saat master ruangan siap, assign unit per akun.
- [ ] **Edit pegawai: clear field opsional** — [PegawaiEditModal](src/components/master/pengguna/PegawaiEditModal.tsx) kirim `undefined` utk field opsional kosong (skip, bukan null) → tak bisa **mengosongkan** gelar/agama/dll yg sudah terisi. `UpdatePegawaiInput` belum terima `null` untuk clear. NIK juga read-only (tak bisa koreksi via UI).

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
