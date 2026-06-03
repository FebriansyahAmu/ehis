# EHIS Registrasi — Phase Roadmap

> **Source of truth untuk modul `/ehis-registration` (Loket Pendaftaran).**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
>
> **Workflow docs:**
> - [CLAUDE.md](CLAUDE.md) — current state + module map
> - [TODO.md](TODO.md) — Master phase roadmap (Phase 0–3 ✅)
> - [TODO-ANTREAN.md](TODO-ANTREAN.md) — **Antrean Online + Onsite roadmap (modul mandiri `/ehis-antrian`)** — registrasi *consume* statusnya
> - [TODO-BPJS.md](TODO-BPJS.md) — V-Claim (Kepesertaan/SEP/Rujukan) yang di-consume saat pendaftaran
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt registry (item yang ditunda dicatat di sini)
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend roadmap (RBAC role-gate depend B0)
>
> **Last updated:** 2026-06-04
> **Status:** ✅ **REG0 fondasi + Backend RJ Integration (2026-06-04).** Beralih dari mock-store ke **backend nyata** (layered Route→Service→DAL→Prisma + PostgreSQL). **PasienBaruModal & DaftarKunjunganModal fungsional** (bukan lagi no-op): PasienBaru → `POST /patients` (dedup-first) → DB; DaftarKunjungan → Kunjungan tersimpan + SEP mock terbit & cetak A4 + toast + validasi. Pasien API (register / complete / updatePenjamin), Kunjungan API (register RJ / worklist cursor / detail), lifecycle worklist (check-in→complete, version-guarded) wired ke board RJ, Jaminan persist (ikut kunjungan terakhir), noRM `YYMMNNNN` reset/bulan. Detail di **Phase REG-BE** ⬇. **Sisa:** board loket, IGD/RI, realtime (SSE), nama DPJP (master Dokter).
> **Target effort:** RJ ✅ done; sisa per-item di [TECH_DEBT.md](TECH_DEBT.md) / Phase REG-BE.

---

## 📌 Konteks & Batas Scope

**Registrasi** = hulu seluruh alur RS. Setiap pelayanan klinis (IGD/RI/RJ) berawal dari **pendaftaran kunjungan** di loket. Modul saat ini berpusat pada *lihat & edit pasien*, bukan *alur loket produktif*.

### Keputusan scope (2026-05-30)
| Topik | Keputusan |
|---|---|
| **Antrean online (Mobile JKN/Antrol)** | **PISAH** ke modul baru `/ehis-antrian` — lihat [TODO-ANTREAN.md](TODO-ANTREAN.md). Registrasi hanya *consume* status & badge-nya di pasien RJ. |
| **Cakupan SEP** | **Hanya Rawat Jalan** untuk batch ini. SEP IGD & RI → ditunda (TECH_DEBT). |
| **Board loket** | **PINDAH ke `/ehis-antrian` › tab Antrean List** (revisi 2026-05-30, lihat [TODO-ANTREAN.md](TODO-ANTREAN.md) ANT2). Registrasi cukup sediakan modal yang di-*trigger* dari "Respon Kedatangan" + dukung deep-link auto-open. REG3 lama di-**deprecate**. |
| **Bed management saat admisi RI** | Ditunda (TECH_DEBT). |
| **General Consent capture + cetak** | Ditunda (TECH_DEBT). |

### Prinsip arsitektur (sebelum coding)
1. **Mock-first → swap pattern** — `NewPatientInput` & `PendaftaranKunjunganInput` mirror schema target Prisma (`Patient`/`Encounter`). Zero-refactor saat backend.
2. **Persistensi via store reaktif** — pakai pola `useSyncExternalStore` (sama seperti `billingStore`) untuk menyimpan pasien & kunjungan baru tanpa backend. Server-component resolver di-merge dengan store.
3. **Consume, jangan duplikasi** — kepesertaan/SEP dari V-Claim ([TODO-BPJS.md](TODO-BPJS.md)), antrean dari `/ehis-antrian`. Registrasi tidak re-implement WS.
4. **Accent module = sky** (sudah dipakai di nav icon `ClipboardList`).
5. **Compliance**: PMK 24/2022 (RME), single patient identity (cegah double-MRN), SKP 1 (identifikasi pasien).

### Status hari ini (inventaris)
- ✅ [RegistrationBerandaPage.tsx](src/components/registration/beranda/RegistrationBerandaPage.tsx) — KPI + kunjungan terkini + distribusi penjamin + aksi cepat.
- ✅ [PasienListPage.tsx](src/components/registration/pasien-list/PasienListPage.tsx) — search · filter penjamin/status · pagination.
- ✅ [PatientDashboard.tsx](src/components/registration/PatientDashboard.tsx) — MDI multi-tab + panel kiri/kanan + 8 modal.
- 🟡 [PasienBaruModal.tsx](src/components/registration/pasien-baru/PasienBaruModal.tsx) — wizard 3-step **tapi submit hanya generate RM acak, tidak persist & tidak navigasi**.
- 🟡 [DaftarKunjunganModal.tsx](src/components/registration/patient/modals/DaftarKunjunganModal.tsx) — form IGD/RJ/RI **tapi tombol "Daftarkan" no-op**.
- ✅ [KunjunganTabs.tsx](src/components/registration/kunjungan/KunjunganTabs.tsx) — overview + 7 tab aksi + komponen SEP di [Tabs/sep/](src/components/registration/kunjungan/Tabs/sep/).
- ❌ Board loket: rute `/ehis-registration/antrian` **dead-link** ([beranda L226](src/components/registration/beranda/RegistrationBerandaPage.tsx#L226)), nav hanya Beranda + Pasien ([navigation.ts:358-369](src/lib/navigation.ts#L358-L369)).
- ⚠️ Server-component `/pasien/[id]` & `/kunjungan/[kunjunganId]` baca `patientMasterData` statis → `notFound()` untuk pasien baru ([page.tsx:24](src/app/ehis-registration/(fullpage)/pasien/[id]/page.tsx#L24)).

---

## Phase REG0 — Fondasi Persistensi *(BLOCKER untuk REG1–REG2)*

**Effort:** 1 hari · **ROI:** tanpa ini, pendaftaran cuma UI mati.

### REG0.1 Data contracts ✅ (2026-05-31)
- [x] `NewPatientInput`, `PendaftaranKunjunganInput`, `BpjsPesertaAutofill`, `JenisKunjunganUnit/JenisKunjungan` di [src/lib/registration/types.ts](src/lib/registration/types.ts) — mirror schema target.

### REG0.2 `registrationStore` ✅ (2026-05-31) — [src/lib/registration/registrationStore.ts](src/lib/registration/registrationStore.ts)
- [x] State: `patients: Record<noRM, PatientMaster>` + `kunjungan: Record<noRM, KunjunganRecord[]>` (overlay, sessionStorage `ehis.registration.v1`).
- [x] API: `addPatient()`, `addKunjungan()`, `getMergedPatient()`, `getMergedKunjungan()`, `getAllMergedPatients()`, `useRegistrationStore()` (useSyncExternalStore).
- [x] Generator `noRM` deterministik (`RM-<th>-<seq>` max+1 vs seed+store) + age/format tanggal id + no. pendaftaran/kunjungan.

### REG0.3 Resolver merge statis + store ✅ (2026-05-31)
- [x] [PatientResolver](src/components/registration/PatientResolver.tsx) & [KunjunganResolver](src/components/registration/KunjunganResolver.tsx): server render seed (deterministik, no hydration mismatch) → setelah mount resolve dari store. `notFound()` hanya bila tak ada di keduanya pasca-hidrasi.
- [x] Server page `/pasien/[id]` & `.../kunjungan/[kunjunganId]` render resolver. `tsc` clean.

---

## Phase REG-BE — Backend Integration (Loket → DB) ✅ (2026-06-04)

> **Beralih dari `registrationStore` (mock client) ke backend nyata** mengikuti [docs/BACKEND-PATIENT.md](docs/BACKEND-PATIENT.md) + [docs/BACKEND-ENCOUNTER.md](docs/BACKEND-ENCOUNTER.md). Layering **Route→Service→DAL→Prisma**, PostgreSQL (multi-schema `pendaftaran`/`encounter`/`bpjs`), envelope `{ok,data,...}`, Zod boundary, optimistic concurrency (`version`), PII column-level AES-256-GCM + HMAC blind-index, clock seam injectable. Merealisasikan REG1 *submit* + REG2 *SEP RJ* dengan DB sungguhan.

### REG-BE.1 No. RM format `YYMMNNNN` ✅
- [x] Format baru `26060001` (YY+MM+seq) — **reset tiap bulan**. Counter table `pendaftaran.rm_counter` + atomic upsert (`INSERT … ON CONFLICT … RETURNING`), anti-race, anti-duplikat (uji race 10-serentak). Periode ikut kalender **WIB** (bukan UTC). Pad min 4 digit (tumbuh bila >9999/bulan). Search dukung format lama `RM-YYYY-N` + baru.

### REG-BE.2 Pasien API ✅ — [patientService](src/lib/services/patientService.ts) · [patientDal](src/lib/dal/patientDal.ts)
- [x] `POST /patients` register **dedup-first** (NIK/paspor blind-index → kembalikan existing, cegah double-MRN) · `GET /patients` search (NIK/RM exact + nama trigram cursor) · `GET /patients/:id` · `PATCH /patients/:id` complete draft (version guard).
- [x] **`PATCH /patients/:id/penjamin`** — ubah jaminan aktif (upsert by tipe + set primer, single-primary invariant DB `pasien_penjamin_one_primer_uq`). No. Kartu absen = skip (anti-korupsi nilai masked).

### REG-BE.3 Kunjungan API (RJ) ✅ — [kunjunganService](src/lib/services/kunjunganService.ts) · [kunjunganDal](src/lib/dal/kunjunganDal.ts)
- [x] `POST /kunjungan` register RJ (wajib pasien `dataLengkap`) · `GET /kunjungan` worklist (filter unit/status/**patientId** cursor) · `GET /kunjungan/:id` detail (incl. rujukan+SEP).
- [x] Spine `Kunjungan` (encounter schema) = sumbu tunggal; worklist = query `(unit,status)`. noKunjungan `RJ/2026/NNNNN` sequence atomik.

### REG-BE.4 SEP mock (BPJS RJ) ✅ — [bpjsService](src/lib/services/bpjsService.ts) · [bpjsDal](src/lib/dal/bpjsDal.ts)
- [x] V-Claim belum di-hit → SEP **digenerate lokal** (skenario terbit) dalam transaksi yang sama: Rujukan + SEP (`bpjs.Rujukan`/`bpjs.SEP`), noSep `{ppk}{yymmdd}V{seq}`. **Tersimpan DB + bisa dicetak** A4 ([SepCetak](src/components/registration/patient/modals/daftar-kunjungan/SepCetak.tsx)).

### REG-BE.5 Lifecycle worklist (state machine) ✅
- [x] `PATCH /kunjungan/:id/status` — transisi `checkIn/call/recall/receive/complete/cancel/reopen` (callState + recallCount + selesaiAt immutable), **version-guarded 2-lapis** (422 ilegal · 409 stale).
- [x] Board RJ ([RJBoardLive](src/components/rawat-jalan/RJBoardLive.tsx)): kunjungan API muncul sbg kartu, aksi Panggil/Terima/Selesai/Batal/Ulang → transisi server + patch idempoten. Kartu seed demo tetap pakai queue mock (ruang id terpisah).

### REG-BE.6 Wiring modal + dashboard ✅
- [x] **DaftarKunjunganModal fungsional** — `registerKunjungan` API + toast + cetak SEP + validasi `nextHint` + guard pasien-demo. Adapter `buildRegisterInput`.
- [x] **Riwayat** dashboard ([PatientDashboard](src/components/registration/PatientDashboard.tsx)) fetch `GET /kunjungan?patientId` → `dtoToKunjunganRecord` (format mock, `detailPath` ke worklist klinis). Replace idempoten + guard **post-sukses** (StrictMode-safe). Resolver muat pasien DB **by noRM** juga (link Beranda/KunjunganHeader).
- [x] **Jaminan** — jaminan aktif ikut kunjungan terakhir (persist BPJS terverifikasi: No.Kartu enc + kelas, set primer), tab tampil tipe + No.Kartu (masked) + kelas + No.SEP. **Modal Ubah Penjamin → 3 jenis** (Umum/Mandiri · BPJS/JKN · Asuransi Lainnya; subtipe PBI/Non-PBI dipertahankan). Backfill data lama dari SEP.

### 🅿️ Sisa backend (belum)
- [ ] **Board loket** real-time (SSE/polling) — board RJ belum auto-refresh antar-operator.
- [x] ~~PasienBaruModal submit → API~~ ✅ **sudah** ([PasienBaruModal.tsx:255](src/components/registration/pasien-baru/PasienBaruModal.tsx#L255) `registerPatient`→`POST /patients` dedup-first→DB). Sisa kecil: auto-buka pasien pasca-sukses (kini success-panel only) + quick-register draft minimal (REG1).
- [ ] **IGD/RI unit** — `registerKunjungan` hardcode RawatJalan; triase/bed/kelas belum.
- [ ] **Nama DPJP** — `dpjpId` placeholder; butuh master Dokter (`sdm.Pegawai`/Practitioner) untuk resolve nama (board/riwayat tampil "—").
- [ ] **Invoice draft saat check-in** (`Registered→Queued`) — depend domain Billing backend.
- [ ] **Antrean** `antreanKodebooking` + nomor antri — depend domain Antrean.
- [ ] **Auth/RBAC nyata** — `getActor()` masih DEV actor (depend [docs/BACKEND-AUTH.md](docs/BACKEND-AUTH.md)).
- [ ] **`berlakuSampai`** persist di Ubah Penjamin (butuh date picker).

---

## Phase REG1 — Pasien Baru: persist + redirect

**Effort:** 0.5–1 hari · **Depend:** REG0.

> **Model pemersatu (2026-05-31): "daftar minimal → draft → lengkapi di admisi".** Ketiga channel (Onsite/APM, MJKN, walk-in) membuat **draft patient** (`dataLengkap:false`, norm terbit) dgn field minimal (NIK · Nama · Tempat Lahir · Tgl Lahir · No HP), lalu dilengkapi via mode **"Lengkapi Data RM"** saat admisi. Onsite/APM = build pertama (lihat [TODO-ANTREAN.md](TODO-ANTREAN.md) Phase ANT-ONSITE).

- [x] **`dataLengkap` flag** ✅ server-side — `isComplete()` di [patientService](src/lib/services/patientService.ts) set `false` (draft) / `true` (lengkap); `Pasien.dataLengkap` di DB; gate RJ wajib `dataLengkap`.
- [ ] **Quick-register minimal (5 field)** — fungsi minimal untuk kiosk/MJKN; `PasienBaruModal` wizard penuh berubah peran jadi mode **"Lengkapi Data RM"** (prefill draft + isi sisanya) di admisi. *(Wizard penuh sudah ke API; mode draft minimal belum.)*
- [x] **`handleSubmit` → API** ✅ — [PasienBaruModal.tsx:255](src/components/registration/pasien-baru/PasienBaruModal.tsx#L255) `registerPatient`→`POST /patients`→DB + toast No.RM. *Sisa:* redirect kini **success-panel only** (belum `router.push('/pasien/{id}')` otomatis).
- [x] **NIK dedup (search-first)** ✅ — server **dedup-first** di [patientService.registerPatient](src/lib/services/patientService.ts) (blind-index `nikHash`/`pasporHash` → kembalikan existing `created:false`, anti double-MRN) + race-catch P2002.
- [ ] **Search fallback by nama + tgl lahir** — untuk pasien lama tanpa NIK/kartu.
- [ ] Refresh daftar/Beranda otomatis (store reaktif).

### REG1.1 Autofill Peserta BPJS (Pasien Baru via antrean) — *core contract*

Saat Respon Kedatangan pasien BPJS baru (ANT4.1), payload peserta meng-autofill `PasienBaruModal`. Tipe `BpjsPesertaAutofill`:

```jsonc
{
  "nomorkartu": "00012345678",      // → penjamin.nomor (BPJS)
  "nik": "3212345678987654",        // → nik
  "nomorkk": "3212345678987654",    // → KK (field baru di PatientMaster)
  "nama": "sumarsono",              // → namaLengkap
  "jeniskelamin": "L",              // → gender (L/P)
  "tanggallahir": "1985-03-01",     // → tanggalLahir (YYYY-MM-DD, cocok input date)
  "nohp": "085635228888",           // → noHp
  "alamat": "alamat lengkap",       // → alamat
  "kodeprop": "11",  "namaprop": "Jawa Barat",   // → provinsi (+ simpan kode BPJS)
  "kodedati2": "0120","namadati2": "Kab. Bandung",// → kota
  "kodekec": "1319", "namakec": "Soreang",        // → kecamatan
  "kodekel": "D2105","namakel": "Cingcin",        // → kelurahan
  "rw": "001", "rt": "013"          // ⚠️ lihat gotcha #2
}
```

- [ ] Tipe `BpjsPesertaAutofill` + mapper `bpjsPesertaToForm()` → prefill `FormState`.
- [ ] Field BPJS **tidak sediakan** (wajib manual): `tempatLahir`, `kodePos`, `golonganDarah`, `statusPerkawinan`, `agama`, `pekerjaan`, `pendidikan`, `suku`, `email`, kontak darurat, alergi. Tandai field ter-autofill (badge "dari BPJS") vs manual.
- [ ] Tambah field `nomorKK` ke `PatientMaster`/`FormState` (belum ada).
- [ ] Set `penjamin = { tipe: BPJS_*, nomor: nomorkartu }` otomatis.
- [ ] **Dua jalur pasien baru** (lihat [docs/API-ANTREAN.md](docs/API-ANTREAN.md) §6): **(a) online** — WS `POST /pasien` sudah terbitkan `norm` + data minimal → di loket = mode **"Lengkapi Data RM"** (prefill incomplete), bukan create baru. **(b) walk-in** — `PasienBaruModal` penuh. Pesan WS: *"Harap datang ke admisi untuk melengkapi data rekam medis"*.

> **⚠️ Gotcha #1 — Kode wilayah BPJS ≠ Kemendagri.** `kodeprop:"11"`+`"Jawa Barat"` membuktikan BPJS pakai sistem kode dati sendiri (Kemendagri: 11=Aceh, Jabar=32). CLAUDE.md mewajibkan **kode Kemendagri** untuk FHIR `administrativeCode`. → Butuh **mapping BPJS-dati ↔ Kemendagri** (simpan kode BPJS apa adanya + resolve Kemendagri saat sync FHIR). Jangan tulis kode BPJS ke field yang diharapkan Kemendagri.
>
> **⚠️ Gotcha #2 — Label `rt`/`rw` BPJS tampak tertukar.** Di definisi field: `"rw": "{no RT}"`, `"rt": "{no RW}"`. Map **BPJS `rw` → RT kita**, **BPJS `rt` → RW kita** (form kita pakai 1 field `rtRw` "RT/RW"). Verifikasi saat bridging real; untuk mock ikuti label ini.

---

## Phase REG2 — `DaftarKunjunganModal`: SEP Rawat Jalan

**Effort:** 1.5–2 hari · **Depend:** REG0. **Scope:** cabang **Rawat Jalan** saja.

### REG2.1 Tarik Rujukan / Surat Kontrol FKTP
- [ ] Seksi baru di cabang RJ: input **No. Rujukan FKTP** atau **No. Surat Kontrol** → lookup (mock V-Claim) → auto-populate faskes asal, diagnosa rujukan, poli tujuan, tgl rujukan, sisa kunjungan.
- [ ] Validasi: rujukan aktif & belum kadaluarsa (mock rule).

### REG2.2 Terbitkan + cetak SEP RJ ✅ (via REG-BE.4, backend)
- [x] Submit kunjungan RJ BPJS → SEP **terbit di server** (mock V-Claim), `noSep`/`penjamin`/`noKartu` tersimpan `bpjs.SEP`.
- [x] Cetak SEP RJ (template A4) — [SepCetak](src/components/registration/patient/modals/daftar-kunjungan/SepCetak.tsx) (`.print-area` + KopSuratEklaim).

### REG2.3 Submit fungsional ✅ (via REG-BE.3/.6, backend)
- [x] Tulis `Kunjungan` ke **DB** (bukan registrationStore) lewat `POST /kunjungan` — transaksi atomik + toast.
- [x] SuccessPanel + cetak SEP; dashboard refresh Riwayat + Jaminan (`onRegistered`).

---

## Phase REG3 — ~~Board Loket~~ → Deep-link auto-trigger modal *(revisi)*

> **DEPRECATED sebagai board.** Board loket pindah ke `/ehis-antrian` › Antrean List ([TODO-ANTREAN.md](TODO-ANTREAN.md) ANT2/ANT4). Registrasi hanya perlu mendukung trigger modal dari "Respon Kedatangan".

**Effort:** 0.5 hari · **Depend:** REG0, REG1, REG2.

- [ ] Dukung deep-link `/pasien/{rm}?daftar=rj&kodebooking=...` → auto-open `DaftarKunjunganModal` (RJ) untuk alur Respon Kedatangan pasien lama (ANT4.2).
- [ ] `PasienBaruModal` sukses dengan param `kodebooking` → setelah redirect, auto-lanjut ke modal Daftar Kunjungan (alur pasien baru ANT4.1).
- [ ] Expose hook agar modal memanggil `emitTask()` antrean (task 2 saat modal dibuka, task 3 saat kunjungan dibuat) — kontrak dari `/ehis-antrian`.
- [ ] Hapus dead-link `/ehis-registration/antrian` di [beranda L226](src/components/registration/beranda/RegistrationBerandaPage.tsx#L226) → arahkan ke `/ehis-antrian` (atau hapus tombol).

---

## 🅿️ Ditunda → dicatat di [TECH_DEBT.md](TECH_DEBT.md)

| Item | Alasan tunda |
|---|---|
| SEP IGD & RI | Fokus batch = RJ. Alur emergency & admisi beda. |
| Bed management real-time saat admisi RI | Butuh sync ke `/ehis-master/ruangan` + Aplicares; scope tersendiri. |
| General Consent capture + TTD digital + cetak | Legal-doc flow tersendiri (PMK). |
| APM / kiosk self check-in | Nilai tambah, bukan core. |
| Audit trail pendaftaran | Tunggu pola audit konsisten + B0. |
| Cascading wilayah Kemendagri (alamat) | Embed JSON ~500KB; perlu untuk FHIR `administrativeCode`. |
| Jalur darurat IGD (Mr. X / pasien tak dikenal) | Masuk batch SEP IGD nanti. |

---

## 🔗 Integrasi Lintas Modul

- **→ [TODO-ANTREAN.md](TODO-ANTREAN.md)**: board loket & pasien RJ *consume* `AntreanOnlineRef` (owner: `/ehis-antrian`).
- **→ [TODO-BPJS.md](TODO-BPJS.md)**: SEP RJ & lookup rujukan FKTP consume V-Claim (Kepesertaan/SEP/Rujukan).
- **→ EHIS Care**: kunjungan baru (REG2/REG1) idealnya muncul di worklist IGD/RJ/RI — *spine Registration→Care* (saat ini mock hardcoded; jadi target setelah store reaktif stabil).
- **→ [TODO-BILLING.md](TODO-BILLING.md)**: detail pasien sudah read-only deep-link ke billing (existing).
