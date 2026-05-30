# EHIS BPJS — Phase Roadmap

> **Source of truth untuk modul `/ehis-bpjs` (BPJS Integration Hub — V-Claim + Aplicares).**
> Dokumen ini di-update setiap menyelesaikan task. Centang `[x]` saat done, tambah catatan ringkas + tanggal.
>
> **Workflow docs:**
> - [CLAUDE.md](CLAUDE.md) — current state + module map
> - [TODO.md](TODO.md) — Master phase roadmap (Phase 0–3 ✅)
> - [TODO-BILLING.md](TODO-BILLING.md) — Billing Kasir roadmap (accent amber)
> - [TODO-EKLAIM.md](TODO-EKLAIM.md) — **E-Klaim roadmap (saudara modul · konsumen utama BPJS V-Claim)**
> - [TODO-DASHBOARD.md](TODO-DASHBOARD.md) — Dashboard operasional roadmap
> - [TECH_DEBT.md](TECH_DEBT.md) — tech debt registry
> - [TODOS_BACKEND.md](TODOS_BACKEND.md) — backend roadmap (BPJS depend B0 + secret management + LZ-String + HMAC)
> - [.claude/STANDARDS.md](.claude/STANDARDS.md) — clinical & integration standards
>
> **Last updated:** 2026-05-29
> **Status:** ✅ **BP0 Foundation 100% + BP1 Beranda 100% + Spec Aligned 1:1 (SEP+Peserta+Rujukan+RencanaKontrol+Monitoring+CreateSignature) + Endpoint Config** — Audit + alignment selesai vs 6 contract file Trustmark BPJS: [SEP-Contracts.md](contracts/SEP-Contracts.md) · [Peserta-Contracts.md](contracts/Peserta-Contracts.md) · [Rujukan-Contracts.md](contracts/Rujukan-Contracts.md) · [RencanaKontrol-Contracts.md](contracts/RencanaKontrol-Contracts.md) · [Monitoring-Contracts.md](contracts/Monitoring-Contracts.md) · [CreateSignature-contracts.md](contracts/CreateSignature-contracts.md).
>
> **SEP (16 endpoint):** Insert/Update/Delete · Suplesi Jasa Raharja + Data Induk Kecelakaan · Approval Penjamin (Pengajuan + List Persetujuan) · Update Tgl Pulang + List · Integrasi Inacbgs · SEP Internal (GET+DELETE) · Finger Print (Get+List) · Random Question/Answer.
>
> **Peserta (2 endpoint):** GET by No.Kartu + GET by NIK — shape 1:1 spec (sex/pisa/provUmum/cob/umur/tglTAT/tglTMT/informasi).
>
> **Rujukan (17 endpoint — 12 spec + 5 helper):**
> - Keluar (6 spec): `insertRujukan` · `updateRujukan` · `listSpesialistikRujukanPerPPK` · `listRujukanKeluar` · `detailRujukanKeluar` · `jumlahSepPerRujukan`. Conditional rule `poliRujukan` kosong jika tipeRujukan="2" (Balik PRB).
> - Khusus (3 spec): `insertRujukanKhusus` · `deleteRujukanKhusus` · `listRujukanKhusus` (per bulan+tahun). Format diagnosa.kode: `"primer;{ICD}"` atau `"sekunder;{ICD}"`.
> - Pencarian RS rich (3 spec): `cariRujukanRSByNoRujukan` · `cariRujukanRSByKartu` (single) · `listRujukanRSByKartu` (list) — pakai `RujukanRSDetail` dengan peserta full + provPerujuk + noKunjungan.
> - Masuk legacy (2): `getRujukan` FKTP/FKRTL · `listRujukanByPeserta` — kept untuk simple lookup.
> - Referensi (3): `listRujukanKhususPerDiagnosa` (renamed dari listRujukanKhusus) · `listSpesialistik` · `listSarana`.
>
> **Auth Headers (CreateSignature-contracts.md — aligned 2026-05-29):**
> - 4 header wajib semua endpoint V-Claim/Aplicares: `X-cons-id` · `X-timestamp` (UTC epoch sec) · `X-signature` (HMAC-SHA256 base64) · `user_key` (lowercase+underscore).
> - Helper: `generateBpjsHeaders(creds, ts?)` sync mock (deterministic factor-secret, NOT cryptographically valid) + `generateBpjsHeadersAsync(creds, ts?)` production-ready dengan Web Crypto.
> - Public helpers: `buildSignatureMessage(consId, ts)` · `nowUnixSeconds()` di [authHeader.ts](src/lib/bpjs/authHeader.ts).
> - Fix: header naming `user_key` per spec (sebelumnya doc salah tulis `User-Key`).
>
> **Monitoring (4 endpoint — aligned 2026-05-29):**
> - Spec 1: `monitoringKunjungan(tglSEP, jnsPelayanan)` → `KunjunganMonitoringItem[]` (display "R.Inap"/"R.Jalan" · poli null untuk RI · diagnosa kode-only).
> - Spec 2: `monitoringKlaim(tglPulang, jnsPelayanan, statusKode "1"|"2"|"3")` → `KlaimMonitoringItem[]` (`Inacbg{kode,nama}` capital "I" · 5 field `biaya` string Rupiah · `noFPK` "" jika belum terbit · status label string).
> - Spec 3: `monitoringHistoriPelayanan(noKartu, tglMulai, tglAkhir)` → `HistoriPelayananMonitoringItem[]` (diagnosa "KODE - Nama" gabungan · jnsPelayanan kode "1"/"2" · kelasRawat display "Kelas N" / null RJ · ppkPelayanan RS name).
> - Spec 4: `monitoringJasaRaharja(jnsPelayanan, tglMulai, tglAkhir)` → `JasaRaharjaMonitoringItem[]` (nested `{sep, jasaRaharja}` · **signature DIUBAH** ke periode dari single-tgl yang salah sebelumnya · noMr camel di parent vs noMR capital di peserta — sengaja preserve wire format).
> - Status klaim mapping: `KLAIM_MONITORING_STATUS_LABEL["1"]` = "Proses Verifikasi" · `["2"]` = "Pending Verifikasi" · `["3"]` = "Klaim".
>
> **Rencana Kontrol (11 endpoint — aligned 2026-05-29):**
> - CRUD V2 (5 spec): `insertRKV2` (POST `/RencanaKontrol/v2/insert` + `formPRB`) · `updateRKV2` (PUT + formPRB) · `deleteRK` · `insertSPRI` (POST `noKartu`, tanpa formPRB) · `updateSPRI` (PUT `noSPRI`).
> - GET detail (2 spec): `getSEPUntukRK` (shape khusus konteks RK · diagnosa & poli display string) · `getNoSuratKontrol` (detail RK + `formPRB` embedded).
> - List (2 spec): `listRKByKartu` (bulan+tahun+noKartu+filter) · `listRKFiltered` (tglAwal-tglAkhir+filter mode "1"=entri/"2"=rencana).
> - Referensi (2 spec): `getPoliRK` (jnsKontrol+nomor+tglRencana) · `getDokterRK` (jnsKontrol+kdPoli+tglRencana).
> - **PRB Form**: `FormPRB { kdStatusPRB, data }` — 9 penyakit kronis (DM/HT/Asma/Jantung/PPOK/Skizofrenia/Stroke/Epilepsi/SLE) · 37 field measurement nullable + helper `emptyPRBFormData()` + `PRB_LABELS`.
>
> **URL Endpoint Config:** [bpjsEndpoints.ts](src/lib/bpjs/bpjsEndpoints.ts) — central source of truth `VCLAIM_ENDPOINTS` + `APLICARES_ENDPOINTS`. Semua hardcoded URL di-replace ke config (**40 endpoint**: 16 SEP + 2 Peserta + 11 Rujukan + 4 Monitoring + 11 RK V2 + 7 Aplicares). Fix URL Integrasi Inacbgs `/SEP/Inacbg/{noSEP}` (sebelumnya typo `/SEP/InsertInacbg/{noSEP}`). RK pakai V2 path versioning per spec resmi. Monitoring `klaimJasaRaharja` URL FIXED ke periode (JnsPelayanan/{jns}/tglMulai/{m}/tglAkhir/{a}) — sebelumnya salah single-tgl.
>
> Files: **18 file** di `src/lib/bpjs/` (4 core + 1 config + 1 contracts + 6 adapter + 6 mock). Next: **BP1 Beranda BPJS**.
> **Target effort:** ~3.5–4.5 minggu (frontend full) · paralel dengan B0 backend + secret management.
> **Accent module:** `emerald` (warna identitas BPJS Kesehatan) + slate neutral · multi-tone per tab. **No indigo · No purple primary.**

---

## 📌 Konteks: Kenapa Modul Terpisah `/ehis-bpjs`?

**`/ehis-bpjs` ≠ `/ehis-eklaim`.** Setelah analisis cross-modul:

| Modul | Karakter | Scope |
|---|---|---|
| **`/ehis-eklaim`** | Transactional · workflow batch · persona Coder/Tim Klaim | Klaim BPJS/Asuransi/Jamkesda — koding · grouper iDRG · berkas · submission · reconciliation |
| **`/ehis-bpjs`** | **Integration hub · reference data · inspector/audit · manual ops** | V-Claim + Aplicares — manage SEP/Rujukan/RK/Bed sync, surface untuk operasi manual saat workflow biasa gagal |
| **`/ehis-registration`** | Workflow registrasi pasien · admisi | Buat SEP saat admisi via deep-call ke adapter (consume `/ehis-bpjs` services) |

### Why this separation works (best practice SIMRS Indonesia)
Aplikasi standar industri (**KhanzaHIS · Trustmedis · SIMRS Cendana · Aplicare**) semua punya modul "Bridging BPJS" / "VClaim" **terpisah** dari "Klaim". Alasannya:

1. **Persona berbeda** — Operator BPJS / Admin Integrasi (RS punya 1-2 orang dedicated) vs Coder Rekam Medis (eklaim).
2. **Frekuensi akses berbeda** — Klaim batch monthly; V-Claim sehari-hari (cek peserta tiap registrasi).
3. **Operasi manual surface** — saat workflow biasa gagal (network · SEP duplicate · suplesi · update tgl pulang miss), admin BPJS butuh **surface manual** untuk intervensi.
4. **Reference data refresh** — diagnosa/poli/dokter/faskes BPJS perlu sync periodic dari V-Claim ke local cache.
5. **Aplicares = bed monitoring sync** — terpisah dari klaim, real-time sync 24/7.
6. **Compliance audit** — setiap call BPJS API harus tercatat (UU PDP 27/2022 · Perpres 82/2018 · audit BPJS).

### Cross-Module Consumer Map (siapa pakai layanan `/ehis-bpjs`)

```
                  ┌────────────────────────────────────┐
                  │       /ehis-bpjs (Integration Hub)  │
                  │  V-Claim adapter · Aplicares adapter│
                  └──────────────┬─────────────────────┘
                                 │ (export adapter services)
       ┌─────────────────────────┼─────────────────────────────┐
       ▼                         ▼                              ▼
  /ehis-registration       /ehis-eklaim              /ehis-care/rawat-inap
  - Cek peserta            - getEligibility          - Update tgl pulang SEP
    by NIK/Kartu           - submitClaim             - Sync bed status (Aplicares)
  - Buat SEP admisi        - getSEP (lookup detail)
  - Cari rujukan FKTP      - Monitoring batch
  - Insert SPRI/RK
       │
       │ deep-call adapter
       ▼
  /ehis-bpjs (audit trail tercatat, error handling terpusat)
```

---

## 🏛 Compliance & Standar Wajib

| Regulasi | Topik | Dampak |
|---|---|---|
| **Permenkes 26/2021** | Pedoman Verifikasi BPJS | Format SEP wajib · field minimum · masa berlaku |
| **Perpres 82/2018** | Jaminan Kesehatan | Eligibility cek SEP · hak kelas |
| **Permenkes 71/2013** | Pelayanan JKN | SEP issuance + ketentuan FKTP/FKRTL |
| **Permenkes 4/2018** | Kewajiban RS & Pasien | Transparansi antrian + bed availability |
| **PMK 24/2022** | Rekam Medis Elektronik | Audit trail integrasi BPJS |
| **UU PDP 27/2022** | Data Pribadi | Audit setiap akses NIK/Kartu BPJS · hash response · TTL token |
| **PMK 30/2022** | Indikator Mutu | INM-06 waktu lapor hasil kritis (BPJS bridging health) |
| **Pedoman BPJS V-Claim 2.0** | API integration spec | Auth HMAC-SHA256 · LZ-String · envelope shape |
| **Pedoman BPJS Aplicares** | Bed monitoring spec | Sync interval · map kelas · ketersediaan kamar |
| **SK Dirjen Yankes** | Kode SMF/Poli BPJS | Reuse [bpjsRuanganCatalog.ts](src/lib/master/bpjsRuanganCatalog.ts) (sudah ada) |

---

## 🔌 V-Claim API Coverage Map

Spek resmi: `https://apijkn.bpjs-kesehatan.go.id/vclaim-rest/`. Adapter sudah partial di [vClaimAdapter.ts](src/lib/eklaim/vClaimAdapter.ts) — Phase BP0 relocate + extend.

### Authentication (semua endpoint pakai 4 header per [CreateSignature-contracts.md](contracts/CreateSignature-contracts.md))
- `X-cons-id` — consumer ID per RS (BPJS assign)
- `X-timestamp` — UTC Unix epoch second (`(local time UTC sec) - (1970-01-01 sec)`)
- `X-signature` — `HMAC-SHA256("${consId}&${timestamp}", consumerSecret) → base64` (44 char). Spec example: `consId="1234"` · `ts="433223232"` · `secret="pwd"` → `HMAC-SHA256("1234&433223232", "pwd")`
- `user_key` — API key per RS (**lowercase + underscore**, BUKAN header-case `User-Key`)
- `consumerSecret` HANYA disimpan di sisi consumer (RS), TIDAK dikirim sebagai header — dipakai untuk signature only
- Body: **LZ-String compressed JSON** di production
- **Adapter helper:** `generateBpjsHeaders(creds, timestampOverride?)` sync mock di [authHeader.ts](src/lib/bpjs/authHeader.ts) · `generateBpjsHeadersAsync` production-ready dengan Web Crypto (browser + Node 18+). Phase 1 pakai sync mock; backend swap ke async tanpa ubah API signature consumer.

### Endpoint Coverage (target Phase BP2–BP6)

#### 1. Kepesertaan (Phase BP2)
| Endpoint | Method | Tujuan | Status |
|---|---|---|---|
| `/Peserta/nokartu/{noKartu}/tglSEP/{tgl}` | GET | Cek peserta by No Kartu | ❌ BP2 |
| `/Peserta/nik/{nik}/tglSEP/{tgl}` | GET | Cek peserta by NIK | ❌ BP2 |
| `/Peserta/cetakKartu/nokartu/{noKartu}` | GET | Cetak kartu peserta (opsional) | ❌ BP2 (defer) |

#### 2. SEP (Phase BP3)
| Endpoint | Method | Tujuan | Status |
|---|---|---|---|
| `/SEP/2.0/insert` | POST | Insert SEP | ❌ BP3 |
| `/SEP/2.0/update` | PUT | Update SEP | ❌ BP3 |
| `/SEP/2.0/delete` | DELETE | Delete SEP | ❌ BP3 |
| `/SEP/{noSEP}` | GET | Cari SEP detail | ✅ partial di vClaimAdapter (`checkSEP`) |
| `/sep/updtglplg` | PUT | Update tanggal pulang | ❌ BP3 |
| `/SEP/SuplesiCek/{noKartu}/{tgl}/{diagAwal}/{poli}` | POST | Suplesi cek (cek SEP terkait kecelakaan) | ❌ BP3 |
| `/SEP/JasaRaharja/{noKartu}/{tgl}` | POST | SEP Jasa Raharja | ❌ BP3 |
| `/SEP/internal/insert` | POST | SEP Internal (transfer antar SMF) | ❌ BP3 |
| `/SEP/internal/update` | PUT | Update SEP Internal | ❌ BP3 |
| `/SEP/FingerPrint/Peserta/{noKartu}/TglPelayanan/{tgl}` | GET | Get Finger Print peserta | ❌ BP3 |
| `/SEP/FingerPrint/list/tglMulai/{tglMulai}/tglAkhir/{tglAkhir}` | GET | List Finger Print histori | ❌ BP3 |
| `/SEP/UpdTglPlg/list/tglMulai/{tglMulai}/tglAkhir/{tglAkhir}` | GET | List update tgl pulang | ❌ BP3 |

#### 3. Rujukan (Phase BP4)
| Endpoint | Method | Tujuan | Status |
|---|---|---|---|
| `/Rujukan/{noRujukan}` | GET | Cari rujukan FKTP by No Rujukan | ❌ BP4 |
| `/Rujukan/RS/{noRujukan}` | GET | Cari rujukan FKRTL by No Rujukan | ❌ BP4 |
| `/Rujukan/List/Peserta/{noKartu}` | GET | List rujukan FKTP by No Kartu | ❌ BP4 |
| `/Rujukan/RS/List/Peserta/{noKartu}` | GET | List rujukan FKRTL by No Kartu | ❌ BP4 |
| `/referensi/rujukan/khusus/diagnosa/{kdDiag}/tglPelayanan/{tgl}` | GET | List Rujukan Khusus per diagnosa | ❌ BP4 |
| `/referensi/spesialistik` | GET | List Spesialistik | ❌ BP4 |
| `/referensi/faskes/{nama}/{jenisFaskes}` | GET | List Sarana/Faskes | ❌ BP4 |

#### 4. Monitoring (Phase BP5) — 4 endpoint per [Monitoring-Contracts.md](contracts/Monitoring-Contracts.md)
| # | Endpoint | Method | Params | Response | Adapter | Status |
|---|---|---|---|---|---|---|
| 1 | `/monitoring/Kunjungan/Tanggal/{tglSEP}/JnsPelayanan/{jns}` | GET | tglSEP + jns(1/2) | `KunjunganMonitoringItem[]` | `monitoringKunjungan(tglSEP, jns)` | ✅ BP0.4 · 🚧 UI BP5 |
| 2 | `/monitoring/Klaim/Tanggal/{tglPulang}/JnsPelayanan/{jns}/Status/{kode}` | GET | tglPulang + jns + status("1"=Proses, "2"=Pending, "3"=Klaim) | `KlaimMonitoringItem[]` | `monitoringKlaim(tglPulang, jns, statusKode)` | ✅ BP0.4 · 🚧 UI BP5 |
| 3 | `/monitoring/HistoriPelayanan/NoKartu/{noKartu}/tglMulai/{m}/tglAkhir/{a}` | GET | noKartu + periode (max 90 hari) | `HistoriPelayananMonitoringItem[]` | `monitoringHistoriPelayanan(noKartu, tglMulai, tglAkhir)` | ✅ BP0.4 · 🚧 UI BP5 |
| 4 | `/monitoring/KlaimJaminanJasaRaharja/JnsPelayanan/{jns}/tglMulai/{m}/tglAkhir/{a}` | GET | jns + periode (URL FIXED ke periode dari single-tgl) | `JasaRaharjaMonitoringItem[]` | `monitoringJasaRaharja(jns, tglMulai, tglAkhir)` | ✅ BP0.4 · 🚧 UI BP5 |

**Catatan wire format:**
- **Kunjungan (spec 1):** `diagnosa` cuma kode ICD (tanpa nama) · `jnsPelayanan` display "R.Inap"/"R.Jalan" (BUKAN kode) · `poli` null untuk RI · `noRujukan` selalu populated · `tglPlgSep` = tanggal pulang SEP.
- **Klaim (spec 2):** `Inacbg{kode,nama}` capital I sesuai spec · `biaya` 5 field string Rupiah (`byPengajuan/bySetujui/byTarifGruper/byTarifRS/byTopup`) · `noFPK` "" jika belum FPK · `status` LABEL string ("Proses Verifikasi") paralel kode param.
- **Histori (spec 3):** `diagnosa` format "KODE - Nama" gabungan · `jnsPelayanan` kode "1"/"2" · `kelasRawat` display "Kelas N" / null untuk RJ · `ppkPelayanan` nama RS · `poli` bisa empty "".
- **Jasa Raharja (spec 4):** nested `{sep, jasaRaharja}` · spec inkonsisten `noMr` camel di parent vs `noMR` capital di peserta — kedua field sengaja preserve sebagai wire format · `jasaRaharja` 8 field detail (tglKejadian/noRegister/ketStatusDijamin/ketStatusDikirim/biayaDijamin/plafon/jmlDibayar/resultsJasaRaharja).

#### 5. Rencana Kontrol (Phase BP6) — 11 endpoint per [RencanaKontrol-Contracts.md](contracts/RencanaKontrol-Contracts.md)
| # | Endpoint | Method | Tujuan | Adapter | Status |
|---|---|---|---|---|---|
| 1 | `/RencanaKontrol/v2/insert` | POST | Insert RK **V2** + `formPRB` (9 penyakit kronik) | `insertRKV2(payload)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 2 | `/RencanaKontrol/v2/update` | PUT | Update RK **V2** + `formPRB` | `updateRKV2(payload)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 3 | `/RencanaKontrol/Delete` | DELETE | Hapus RK (wrap `t_suratkontrol`) | `deleteRK(noSuratKontrol, user)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 4 | `/RencanaKontrol/InsertSPRI` | POST | Insert SPRI (`noKartu`, **tanpa formPRB**) | `insertSPRI(payload)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 5 | `/RencanaKontrol/UpdateSPRI` | PUT | Update SPRI (`noSPRI`) — terpisah dari Update RK | `updateSPRI(payload)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 6 | `/RencanaKontrol/nosep/{noSEP}` | GET | Lihat SEP untuk keperluan RK (shape khusus) | `getSEPUntukRK(noSEP)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 7 | `/RencanaKontrol/noSuratKontrol/{noSurat}` | GET | Cari detail RK + `formPRB` embedded | `getNoSuratKontrol(noSurat)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 8 | `/RencanaKontrol/ListRencanaKontrol/Bulan/{b}/Tahun/{t}/Nokartu/{kartu}/filter/{f}` | GET | List RK by Kartu (bulan+tahun) | `listRKByKartu(bulan, tahun, noKartu, filter)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 9 | `/RencanaKontrol/ListRencanaKontrol/tglAwal/{m}/tglAkhir/{a}/filter/{f}` | GET | List RK periode (filter "1"=entri, "2"=rencana) | `listRKFiltered(tglAwal, tglAkhir, filter)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 10 | `/RencanaKontrol/Poli/JnsKontrol/{j}/Nomor/{n}/TglRencana/{t}` | GET | Data Poli untuk RK (nomor: kartu jika SPRI, SEP jika RK) | `getPoliRK(jnsKontrol, nomor, tglRencana)` | ✅ BP0.4 wired · 🚧 UI BP6 |
| 11 | `/RencanaKontrol/JadwalPraktekDokter/JnsKontrol/{j}/KdPoli/{p}/TglRencanaKontrol/{t}` | GET | Data Dokter untuk RK | `getDokterRK(jnsKontrol, kdPoli, tglRencana)` | ✅ BP0.4 wired · 🚧 UI BP6 |

**Catatan PRB form (spec V2):** `formPRB.kdStatusPRB ∈ ["01"..."09"]` (DM/HT/Asma/Jantung/PPOK/Skizofrenia/Stroke/Epilepsi/SLE) · `formPRB.data` = 37 field measurement nullable (HBA1C 0.1-15 · GDP/GD2JPP 10-500 · eGFR 5-150 · TD_Sistolik/Diastolik 20-200 · LDL 20-500 · NadiIstirahat 20-200 · FungsiParu/Remisi/RemisiSLE 0-100 · SkorMMRC 0-40 · Usia 1-100 · AsamUrat 0.1-20 · sisanya 0/1 flag). UI BP6 wajib render input dinamis sesuai `kdStatusPRB` (hanya field relevan per penyakit yang ditampilkan).

#### 6. Referensi (cross-cutting, Phase BP0)
Endpoint master untuk dropdown form lintas tab. Cache locally dengan TTL 24 jam.

| Endpoint | Reuse Existing? |
|---|---|
| `/referensi/diagnosa/{nama}` | ✅ reuse `ICD10_IM_MOCK` ([icdIMMock.ts](src/lib/eklaim/icdIMMock.ts)) |
| `/referensi/poli/{kdpoli}` | ✅ reuse `BPJS_RUANGAN_CATALOG` ([bpjsRuanganCatalog.ts](src/lib/master/bpjsRuanganCatalog.ts)) |
| `/referensi/dokter/pelayanan/{jns}/tglPelayanan/{tgl}/Spesialis/{sp}` | ✅ reuse `DOKTER_MOCK` ([dokterMock.ts](src/lib/master/dokterMock.ts)) |
| `/referensi/faskes/{nama}/{jenisFaskes}` | ✅ reuse `PPK_INITIAL` ([ppkStore.ts](src/lib/master/ppkStore.ts)) |
| `/referensi/propinsi` + `/kabupaten` + `/kecamatan` | ✅ reuse Kemendagri JSON (sudah dipakai master Ruangan) |
| `/referensi/kelasrawat` | ✅ reuse `STATUS_ENUM_GROUPS["kelas-perawatan"]` ([statusEnumMock.ts](src/lib/master/statusEnumMock.ts)) |
| `/referensi/carakeluar` | ✅ reuse `STATUS_ENUM_GROUPS["status-pulang"]` |
| `/referensi/pascapulang` | ❌ baru, mock di BP0 |

---

## 🛏 Aplicares API Coverage Map

Spek resmi: `https://apijkn.bpjs-kesehatan.go.id/aplicaresws-rest/`. Bed monitoring sync.

### Endpoint Coverage (target Phase BP7)

| Endpoint | Method | Tujuan | Status |
|---|---|---|---|
| `/ref/kamar` | POST | Get Referensi Kamar BPJS | ❌ BP7.1 |
| `/ref/kelas` | POST | Get Map Kelas BPJS | ❌ BP7.2 |
| `/kamar/list` | POST | List ketersediaan kamar | ❌ BP7.3 |
| `/kamar/insert` | POST | Insert kamar baru ke BPJS | ❌ BP7.3 |
| `/kamar/update` | POST | Update status kamar (Tersedia/Terisi/Maintenance) | ❌ BP7.3 |
| `/kamar/delete` | POST | Hapus kamar | ❌ BP7.3 |
| `/ref/cara_keluar` | POST | Cara keluar pasien | ❌ BP7 (defer) |

**Integrasi Bed:**
- Sync local `LocationNode.beds[]` di [ruanganShared.ts](src/components/master/ruangan/ruanganShared.ts) ↔ Aplicares Bed.
- Bed status operasional (`Tersedia/Terisi`) dikelola **workflow klinis** (admisi/discharge RI) — Aplicares hanya **mirror** untuk transparansi publik (PMK 4/2018).
- Map Kelas BPJS (1/2/3/VIP) ↔ Kelas RS (`KelasRawat` enum + `STATUS_ENUM_GROUPS["kelas-perawatan"]`).

---

## 🏗 Architecture Decisions (jangan diubah tanpa diskusi)

1. **Integration Hub, bukan transactional module** — `/ehis-bpjs` adalah **surface inspector + manual ops + reference refresh**. Operasi inti tetap di modul lain via deep-call adapter.

2. **Adapter relocation (BP0.1):** [vClaimAdapter.ts](src/lib/eklaim/vClaimAdapter.ts) **pindah** dari `src/lib/eklaim/` ke `src/lib/bpjs/vClaimAdapter.ts`. Eklaim akan import dari sana. Backward compat re-export sementara untuk hindari breaking change.

3. **Single source of truth untuk credentials** — `consId`/`consSecret`/`userKey` di-host di `src/lib/bpjs/credentialsStore.ts` (mock untuk Phase 1; backend swap ke env vars + secret manager di Phase backend).

4. **Authentication helper terpusat** — `src/lib/bpjs/authHeader.ts` generate header HMAC-SHA256. Semua adapter pakai helper sama.

5. **LZ-String compression** — body request/response V-Claim production di-compress. Mock skip compression; **wajib activate di Phase backend** (NPM `lz-string`).

6. **Token caching strategy** — V-Claim tidak butuh token (per-request HMAC), tapi response data referensi (diagnosa/poli/dokter/faskes) di-cache locally TTL 24 jam di `src/lib/bpjs/referenceCache.ts`.

7. **Result<T, ClaimError> pattern** — reuse `Result/Ok/Err` dari [eklaimShared.ts](src/lib/eklaim/eklaimShared.ts). Tambahan `BPJSError` extends `ClaimError` dengan field spesifik (`code: "200"|"201"|"500"|"503"`, retry-after).

8. **Mock-first dengan deterministic test override** — semua adapter punya `BPJSConfig`: `failRate` + `fixedLatencyMs` + `forceResult` (sama pattern dengan vClaimAdapter existing).

9. **Audit trail wajib per call** — `BPJSAuditEntry` di `src/lib/bpjs/auditStore.ts`: timestamp, endpoint, method, request hash, response code, response body hash, actor, durationMs. UU PDP 27/2022 compliance. Visible di Beranda BPJS recent calls panel.

10. **Idempotency key** — semua mutation (Insert SEP/RK/SPRI) wajib `idempotencyKey: string` di body untuk hindari duplicate submission. Generated `${noKartu}-${tglPelayanan}-${hash}`.

11. **No indigo · No purple primary** — palette: emerald primary (BPJS brand · GovTech green) · slate neutral · multi-tone per tab (kepesertaan sky · SEP emerald · rujukan teal · monitoring amber · rencana kontrol violet · aplicares pink).

12. **Density tokens `m-*`** wajib untuk list panel (monitoring kunjungan/klaim bisa ratusan baris).

13. **Print-friendly** — SEP cetakan, Rencana Kontrol/SPRI surat — pakai `@media print` stylesheet + KOP RS dari [rsProfilStore.ts](src/lib/master/rsProfilStore.ts).

14. **Cross-link deep-link** — list SEP klik → buka detail klaim di `/ehis-eklaim/klaim/{id}` jika sudah ada klaim · klik rujukan → tampil di registrasi modal · klik Aplicares bed → master ruangan.

15. **Reference data sync periodic** — diagnosa BPJS · poli BPJS · faskes · spesialistik · pasca-pulang. Cache di-refresh weekly via tombol "Sync Referensi" di Beranda BPJS. Saat backend ready: scheduled job (cron).

---

## 📂 File Structure (rencana)

```
src/lib/bpjs/
├── bpjsShared.ts                  # types (PesertaRecord, SEPRecordExt, RujukanRecord,
│                                  #        RencanaKontrolRecord, SPRIRecord, AplicaresKamar,
│                                  #        BPJSError, BPJSAuditEntry, IdempotencyKey)
│                                  # + tone palette + helpers
├── credentialsStore.ts            # consId/consSecret/userKey (mock)
├── authHeader.ts                  # generateBpjsHeaders() HMAC-SHA256 helper
├── lzStringHelper.ts              # compress/decompress wrapper (mock no-op Phase 1)
├── auditStore.ts                  # BPJSAuditEntry log (useSyncExternalStore client store)
├── referenceCache.ts              # local cache referensi dengan TTL 24 jam
├── idempotencyKey.ts              # generateIdempotencyKey(payload) helper
├── vClaimAdapter.ts               # RELOCATE dari src/lib/eklaim/ + extend lengkap V-Claim
├── aplicaresAdapter.ts            # BARU — Aplicares bed monitoring adapter
└── mock/
    ├── pesertaMock.ts             # ~12 peserta mock (BPJS active/inactive/expired/PBI/Non-PBI)
    ├── sepMock.ts                 # ~20 SEP lintas status (Active/Suplesi/Closed/Deleted)
    ├── rujukanMock.ts             # ~15 rujukan FKTP + FKRTL
    ├── rencanaKontrolMock.ts      # ~10 RK + 5 SPRI
    ├── monitoringMock.ts          # data kunjungan/klaim/histori/jasaraharja periode
    └── aplicaresKamarMock.ts      # bed sync mock per ruangan

src/app/ehis-bpjs/
├── page.tsx                       # Beranda BPJS (BP1)
├── vclaim/
│   ├── layout.tsx                 # shared tabs layout
│   ├── kepesertaan/page.tsx       # BP2
│   ├── sep/page.tsx               # BP3
│   ├── rujukan/page.tsx           # BP4
│   ├── monitoring/page.tsx        # BP5
│   └── rencana-kontrol/page.tsx   # BP6
├── aplicares/
│   ├── layout.tsx                 # shared tabs layout
│   ├── referensi-kamar/page.tsx   # BP7.1
│   ├── map-kelas/page.tsx         # BP7.2
│   └── ketersediaan/page.tsx      # BP7.3
└── audit/page.tsx                 # BP8 audit trail viewer

src/components/bpjs/
├── beranda/
│   ├── BerandaBPJSPage.tsx        # hero + KPI strip + recent calls + quick nav
│   ├── BPJSKPIStrip.tsx           # 5 KPI (SEP today · Rujukan today · RK today · Bed sync · Failed calls)
│   ├── RecentCallsPanel.tsx       # audit feed last 20 calls
│   └── ReferenceStatusPanel.tsx   # status cache referensi + tombol refresh
├── shared/
│   ├── BPJSPageShell.tsx          # 2-panel layout + tab nav
│   ├── BPJSResultCard.tsx         # response envelope display (success/error/empty)
│   ├── PesertaCard.tsx            # display peserta detail consistent across tabs
│   ├── AuthHeaderInfo.tsx         # dev-only debug: cons-id/timestamp/signature
│   └── SyncStatusBadge.tsx        # online/degraded/offline badge
├── kepesertaan/                   # BP2
│   ├── KepesertaanPage.tsx
│   ├── CekPesertaForm.tsx         # mode toggle Kartu/NIK + form
│   └── PesertaDetailCard.tsx
├── sep/                           # BP3
│   ├── SEPPage.tsx                # tabs internal (Cari · Update Tgl Plg · Suplesi · Internal · FingerPrint · List)
│   ├── CariSEPForm.tsx
│   ├── HapusSEPModal.tsx
│   ├── UpdateTglPulangForm.tsx
│   ├── UpdateTglPulangList.tsx
│   ├── SEPIntegrasiInaCBGCard.tsx # cross-link ke eklaim
│   ├── SuplesiJasaRaharjaForm.tsx
│   ├── DataIndukKecelakaanForm.tsx
│   ├── SEPInternalForm.tsx
│   ├── SEPInternalList.tsx
│   ├── FingerprintPanel.tsx
│   └── FingerprintListPanel.tsx
├── rujukan/                       # BP4
│   ├── RujukanPage.tsx
│   ├── CariRujukanForm.tsx        # 2 mode (No Rujukan / No Kartu+jenisFaskes)
│   ├── RujukanResultCard.tsx
│   ├── ListRujukanKhususPanel.tsx
│   ├── ListSpesialistikPanel.tsx
│   └── ListSaranaPanel.tsx
├── monitoring/                    # BP5
│   ├── MonitoringPage.tsx         # 4 sub-tab: Kunjungan/Klaim/Histori/Jasa Raharja
│   ├── KunjunganPanel.tsx
│   ├── KlaimPanel.tsx
│   ├── HistoriPelayananPanel.tsx
│   └── JasaRaharjaPanel.tsx
├── rencana-kontrol/               # BP6 (11 endpoint per RencanaKontrol-Contracts.md)
│   ├── RencanaKontrolPage.tsx     # 7 sub-tab: Cari SEP · Insert/Update RK V2 · Insert/Update SPRI · Hapus · No Surat · Data List · Poli/Dokter
│   ├── CariSEPRKPanel.tsx         # spec 6 getSEPUntukRK
│   ├── InsertRKV2Modal.tsx        # spec 1 insertRKV2 + PRB form
│   ├── UpdateRKV2Modal.tsx        # spec 2 updateRKV2 + PRB form
│   ├── PRBFormFields.tsx          # 9 penyakit kronik · 37 field dinamis · range validation
│   ├── InsertSPRIModal.tsx        # spec 4 insertSPRI (noKartu, no PRB)
│   ├── UpdateSPRIModal.tsx        # spec 5 updateSPRI (noSPRI)
│   ├── HapusRKModal.tsx           # spec 3 deleteRK
│   ├── CariNoSuratPanel.tsx       # spec 7 getNoSuratKontrol (detail + PRB embed)
│   ├── DataRKByKartuPanel.tsx     # spec 8 listRKByKartu (bulan+tahun+kartu)
│   ├── DataRKPeriodePanel.tsx     # spec 9 listRKFiltered (periode)
│   ├── DataPoliPanel.tsx          # spec 10 getPoliRK
│   └── DataDokterPanel.tsx        # spec 11 getDokterRK
├── aplicares/                     # BP7
│   ├── ReferensiKamarPage.tsx     # BP7.1
│   ├── MapKelasPage.tsx           # BP7.2
│   ├── KetersediaanKamarPage.tsx  # BP7.3 (link ke master Bed)
│   ├── KamarMappingForm.tsx       # form map BPJS kamar ↔ local LocationNode/Bed
│   └── BedSyncStatusBanner.tsx    # last sync time + force refresh
└── audit/                         # BP8
    └── AuditTrailPage.tsx         # filter/search audit log lintas adapter
```

**File limit ≤800 lines** — split ke sub-components jika lebih besar (pola sama dengan billing/eklaim/master).

---

## Phase BP0 — Foundation & Data Contracts

**Effort:** 4-5 hari · **ROI:** semua fase berikut bisa paralel, schema stabil & sesuai spek BPJS resmi.

### BP0.1 Adapter relocation + auth foundation ✅ (2026-05-28)

- [x] **Buat folder `src/lib/bpjs/`** + 4 file core: `bpjsShared.ts` · `credentialsStore.ts` · `authHeader.ts` · `lzStringHelper.ts`. ✅
- [x] **Relocate `vClaimAdapter.ts`** dari `src/lib/eklaim/` ke `src/lib/bpjs/` — import path internal di-update ke `@/lib/eklaim/claimsMock` + `@/lib/eklaim/eklaimShared`. Consumer eklaim (`eligibilityChecker.ts` + `SubmissionTab.tsx`) tetap pakai path lama via shim (dicatat di TECH_DEBT untuk cleanup later). `groupingResolver.ts` tidak ada (consumer hanya 2 file). ✅
- [x] **Backward-compat re-export** di `src/lib/eklaim/vClaimAdapter.ts`: `export * from "@/lib/bpjs/vClaimAdapter"` + TODO header komentar. ✅
- [x] **`credentialsStore.ts`** — `BPJS_CREDS_MOCK` constant + `BPJSCredentials` interface + `resolveCredentials(override?)` helper. Tambah `aplicaresBaseUrl` untuk Phase BP7 (split V-Claim + Aplicares baseUrl). ✅
- [x] **`authHeader.ts`** — `generateBpjsHeaders(creds, timestampOverride?)` return `{ "X-cons-id", "X-timestamp", "X-signature", user_key }`. Mock HMAC deterministic stub (base64 of `cons-id&timestamp`). Backend swap docs (Node `crypto.createHmac` / Web Crypto `subtle.sign`) di JSDoc. ✅
- [x] **`lzStringHelper.ts`** — `compressLZ<T>(payload) → string` + `decompressLZ<T>(s) → T` + bonus `isLZRoundtripSafe<T>(payload)` smoke test helper. Mock no-op (JSON.stringify/parse). ✅
- [x] **`bpjsShared.ts` (BP0.1 scaffold)** — Re-export `Result/Ok/Err` + types dari eklaim · `BPJSConfig` (consId/userKey/timestampOverride/failRate/fixedLatencyMs/forceResult) · `BPJSEnvelope<T>` · `BPJSCode` + `BPJS_CODE_MESSAGES` + `BPJS_RETRYABLE_CODES` + `isBPJSCode()` guard · `TONE_PALETTE_BPJS` + `BPJSToneKey/BPJSTone` types · helpers `simulateLatency`/`shouldSimulateNetworkError`. Domain types (PesertaRecord/SEPRecordExt/dst) ditunda ke BP0.2. ✅
- [x] **TSC clean** — `npx tsc --noEmit` no errors. ✅
- [x] **TECH_DEBT updated** — section baru "🔐 BPJS Integration" dengan 10 item (shim cleanup, real HMAC, real LZ, Secret Manager, cron sync, DB audit, WS realtime, rate limit, circuit breaker, Kemendagri JSON). ✅

### BP0.2 Types di [src/lib/bpjs/bpjsShared.ts](src/lib/bpjs/bpjsShared.ts) ✅ (2026-05-28)

- [x] **`PesertaRecord`** — peserta BPJS detail (replace flat envelope):
  ```ts
  {
    noKartu: string,        // 13-digit
    nik: string,            // 16-digit
    nama: string,
    tglLahir: string,       // ISO
    gender: "L" | "P",
    hakKelas: { kode: "1" | "2" | "3", keterangan: string },
    jenisPeserta: { kode: string, keterangan: string },  // PBI/Non-PBI/Mandiri/dst
    statusPeserta: { kode: "0" | "1", keterangan: "Aktif" | "Non-Aktif" },
    mr?: { noMR: string, noTelepon: string },
    asuransi?: { plafon: Rupiah, sisaPlafon: Rupiah },
    sisaHariRawat?: number,
    suplesi?: { adaSuplesi: boolean, noSEPSuplesi?: string },
    informasi: {
      prolanis?: { jenis: string, kodeJenis: string },
      noSktAktif?: string,
      tunggakan?: Rupiah,
    },
  }
  ```

- [x] **`SEPRecordExt`** — extend `SEPRecord` di eklaim dengan field lengkap V-Claim 2.0:
  ```ts
  {
    // existing
    noSEP, noKartu, tglTerbit, masaBerlaku, kontrolKe?, faskesRujukan?, jenisRawat,
    // baru BP0
    jnsPelayanan: "1" | "2",  // 1=Rawat Inap, 2=Rawat Jalan
    poli: { kode: string, nama: string },
    klsRawat: { klsRawatHak: string, klsRawatNaik?: string, pembiayaan?: string, penanggungJawab?: string },
    catatan?: string,
    rencanaTindakLanjut?: { jenis?: "1"|"2"|"3", noKontrol?: string, poli?: string, tgl?: string },
    asalRujukan?: "1" | "2",  // 1=Faskes 1, 2=Faskes 2
    rujukan: { tglRujukan?: string, noRujukan?: string, ppkRujukan?: { kode: string, nama: string } },
    catatanDiagnosaPertama?: string,
    diagnosaAwal: { kode: string, nama: string },
    kelainanBawaan?: boolean,
    eksekutif?: boolean,
    cob?: { cob: "0" | "1" },        // Coordination Of Benefit (Asuransi swasta tambahan)
    katarak?: { katarak: "0" | "1" },
    jaminanKecelakaan?: { lakaLantas?: "0"|"1"|"2", penjamin?: "1"|"2"|"3", tglKejadian?: string, ket?: string,
                          suplesi?: { suplesi: "0"|"1", noSEPSuplesi?: string, lokasiLakaLantas?: object } },
    skdp?: { noSurat: string, kodeDPJP: string },  // SKDP = Surat Kontrol DPJP
    dpjpLayan: string,
    tujuanKunj?: string,
    flagProcedure?: string,
    kdPenunjang?: string,
    assesmentPel?: string,
    // status internal
    statusInternal: "Draft" | "Issued" | "Suplesi" | "Updated" | "Closed" | "Deleted",
    tglPulang?: string,
    audit: { createdBy, createdAt, updatedBy?, updatedAt?, deletedBy?, deletedAt? },
  }
  ```

- [x] **`RujukanRecord`** — rujukan FKTP atau FKRTL:
  ```ts
  {
    noRujukan: string,
    asalRujukan: "FKTP" | "FKRTL",
    tglKunjungan: string,
    tglRujukan: string,
    ppkAsal: { kode: string, nama: string, tipe?: "FKTP" | "FKRTL" },
    ppkRujukan: { kode: string, nama: string },
    jnsPelayanan: "1" | "2",
    poli: { kode: string, nama: string },
    diagnosa: { kode: string, nama: string },
    catatan?: string,
    peserta: PesertaRecord,
    keluhan?: string,
    status: "Aktif" | "Expired" | "Used",
    masaBerlaku: { from: string, to: string },  // 30/90 hari per tipe rujukan
  }
  ```

- [x] **`RencanaKontrolRecord`** + **`SPRIRecord`** (extend dari RK):
  ```ts
  type RencanaKontrolRecord = {
    noSurat: string,
    jenis: "Kontrol" | "SPRI",  // Kontrol = pasca RJ, SPRI = jadwal masuk RI
    noSEPAsal: string,
    tglRencana: string,
    poli: { kode: string, nama: string },
    dokter: { kode: string, nama: string },
    tipeKontrol: "1" | "2",  // 1=Kontrol pasca RJ, 2=SPRI
    keterangan?: string,
    status: "Issued" | "Used" | "Expired" | "Cancelled",
    audit: { createdBy, createdAt, updatedBy?, updatedAt? },
  };
  ```

- [x] **`KunjunganBPJSRecord`** — untuk monitoring kunjungan:
  ```ts
  {
    noSEP, noKartu, namaPeserta,
    tglSEP, jnsPelayanan, kelasRawat,
    poli, diagnosaAwal, dpjpLayan,
    biayaTagih?: Rupiah, biayaSetuju?: Rupiah,
    statusKlaim?: ClaimStatus,
  }
  ```

- [x] **`HistoriPelayananRecord`** — untuk monitoring histori per peserta:
  ```ts
  {
    noSEP, tglSEP, jnsPelayanan, poli, diagnosa, dpjp,
    biayaTagih: Rupiah, biayaSetuju: Rupiah, statusVerifikasi: string,
  }
  ```

- [x] **`AplicaresKamarRecord`** — bed Aplicares:
  ```ts
  {
    kdKelas: "1" | "2" | "3" | "VIP",
    namaKelas: string,
    kapasitas: number,
    tersedia: number,
    terisi: number,
    kosong: number,
    namaRuang: string,
    kodeRuang: string,
    flagMaintenance?: boolean,
    lastSyncISO: string,
  }
  ```

- [x] **`MapKelasRecord`** — mapping BPJS kelas ↔ local kelas:
  ```ts
  {
    kdKelasBPJS: "1" | "2" | "3" | "VIP",
    namaKelasBPJS: string,
    kdKelasLokal: KelasRawat,  // reuse dari eklaimShared
    namaKelasLokal: string,
    multiplier?: number,  // untuk tarif adjustment
  }
  ```

- [x] **`BPJSError`** — extends `ClaimError` reuse + tambah BPJS-specific:
  ```ts
  type BPJSError = ClaimError | {
    type: "BPJSMetaError",
    code: "201" | "202" | "203" | "204" | "500" | "503",
    message: string,
    endpoint: string,
    retryable: boolean,
  };
  ```
  Code mapping standar BPJS:
  - `200` = OK
  - `201` = Data tidak ditemukan
  - `202` = Data sudah pernah dimasukkan (duplicate)
  - `203` = Eligibility expired
  - `204` = Validasi gagal
  - `500` = Server error BPJS
  - `503` = Service unavailable

- [x] **`BPJSAuditEntry`** — log per call:
  ```ts
  {
    id: string,
    timestamp: string,         // ISO
    endpoint: string,          // e.g. "/SEP/{noSEP}"
    method: "GET" | "POST" | "PUT" | "DELETE",
    requestHash: string,       // SHA-256 of request body (no plaintext)
    responseCode: string,      // BPJS metaData.code
    responseHash?: string,
    success: boolean,
    durationMs: number,
    actor: string,             // user RS
    actorRole: string,
    consId: string,
    idempotencyKey?: string,
    errorType?: string,
    retryCount?: number,
  }
  ```

- [x] **`IdempotencyKey`** — `generateIdempotencyKey(payload) → string` deterministic hash. Disimpan di mutation request body untuk hindari duplicate submit. ✅ djb2 hash + canonical JSON (key-sorted).

- [x] **`TONE_PALETTE_BPJS`** — static palette purge-safe (sudah ada di BP0.1):
  ```ts
  {
    kepesertaan: "sky", sep: "emerald", rujukan: "teal",
    monitoring: "amber", "rencana-kontrol": "violet", aplicares: "pink",
    audit: "slate",
  }
  ```

### BP0.3 Mock seed ✅ (2026-05-28)

- [x] **`pesertaMock.ts`** ✅ — 12 peserta lintas tipe (4 PBI APBN K3 · 3 Non-PBI Mandiri K1 · 2 Non-PBI Mandiri K2 · 1 PNS K1 · 1 expired Non-Aktif · 1 tunggakan). Helpers: `findPesertaByKartu/Nik`.
- [x] **`sepMock.ts`** ✅ — 20 SEPRecordExt lintas status (10 Issued · 3 Closed · 2 Updated · 2 Suplesi Jasa Raharja · 2 Deleted · 1 Draft). Builder helper `buildSEP()` reduces boilerplate. Helpers: `findSEPByNo/findSEPsByKartu/filterSEPByStatus`.
- [x] **`rujukanMock.ts`** ✅ — 15 RujukanRecord (10 FKTP + 5 FKRTL · lintas diagnosa I21/O82/E11/I10/K35/H25/M17/J18/A09/I50/I25/C50/N18/I63/S82). Cross-link peserta via `peserta: PESERTA_MOCK[i]`. Helpers: `findRujukanByNo/findRujukansByKartu/findRujukansByDiagnosa`.
- [x] **`rencanaKontrolMock.ts`** ✅ — 10 RK Kontrol + 5 SPRI lintas status (Issued/Used/Expired/Cancelled). Cross-link `noSEPAsal` ke SEP_MOCK closed/updated entries. Helpers: `findRKByNoSurat/findRKsBySEP/filterRKByPeriode`.
- [x] **`monitoringMock.ts`** ✅ — Derive `KUNJUNGAN_BPJS_MOCK + HISTORI_PELAYANAN_MOCK + JASA_RAHARJA_MOCK` dari `SEP_MOCK` (skip Deleted/Draft). Biaya offset deterministic via hash noSEP. Helpers: `listKunjunganByPeriode/listHistoriByPeserta`.
- [x] **`aplicaresKamarMock.ts`** ✅ — Derive dari `RUANGAN_MOCK` (3 LocationNode inpatient dengan beds) + 3 synthetic (Anggrek K2 · Cendrawasih K3 · HCU K1). Map RS kelas → BPJS kode + okupansi deterministic. Helpers: `findKamarByKode/listKamarByKelas/aggregateKamarKPI`.

### BP0.4 Adapter extension ✅ (2026-05-28)

- [x] **Extend `vClaimAdapter.ts`** ✅ — di-split per domain ke 5 file (file limit ≤800L per CLAUDE.md), entry `vClaimAdapter.ts` re-export semua. Methods:
  - `getPesertaByKartu(noKartu, tgl, config)`
  - `getPesertaByNik(nik, tgl, config)`
  - `insertSEP(payload, config)` + `updateSEP(payload, config)` + `deleteSEP(noSEP, config)`
  - `updateTglPulang(noSEP, tglPulang, config)` + `listUpdateTglPulang(tglMulai, tglAkhir, config)`
  - `suplesiCek(payload, config)` + `sepJasaRaharja(payload, config)` + `sepInternalInsert/Update(payload, config)`
  - `getFingerPrint(noKartu, tgl, config)` + `listFingerPrint(tglMulai, tglAkhir, config)`
  - `getRujukan(noRujukan, jenisFaskes, config)` + `listRujukan(noKartu, jenisFaskes, config)`
  - `listRujukanKhusus(kdDiag, tgl, config)` + `listSpesialistik(config)` + `listSarana(nama, jenisFaskes, config)`
  - `monitoringKunjungan(tgl, jns, config)` + `monitoringKlaim(tgl, jns, status, config)`
  - `monitoringHistoriPelayanan(noKartu, tglMulai, tglAkhir, config)` + `monitoringJasaRaharja(tgl, jns, config)`
  - `insertRK(payload, config)` + `insertSPRI(payload, config)` + `updateRK(payload, config)` + `deleteRK(noSurat, config)`
  - `getNoSuratKontrol(noSurat, config)` + `listRKFiltered(tglAwal, tglAkhir, filter, config)`
  - `getPoliRK(jns, tgl, config)` + `getDokterRK(jns, kdPoli, tgl, config)`
  - Semua return `Promise<Result<BPJSEnvelope<T>, BPJSError>>` consistent. **Total ~25 method baru ✅**.

  **File breakdown BP0.4 vClaim:**
  - [vClaimKepesertaan.ts](src/lib/bpjs/vClaimKepesertaan.ts) (~70L · 2 method)
  - [vClaimSEP.ts](src/lib/bpjs/vClaimSEP.ts) (~370L · 11 method)
  - [vClaimRujukan.ts](src/lib/bpjs/vClaimRujukan.ts) (~165L · 5 method)
  - [vClaimMonitoring.ts](src/lib/bpjs/vClaimMonitoring.ts) (~125L · 4 method)
  - [vClaimRencanaKontrol.ts](src/lib/bpjs/vClaimRencanaKontrol.ts) (~225L · 8 method)
  - [vClaimAdapter.ts](src/lib/bpjs/vClaimAdapter.ts) (entry, re-export semua + 3 method legacy)

- [x] **`aplicaresAdapter.ts` BARU** ✅ — 7 method ([aplicaresAdapter.ts](src/lib/bpjs/aplicaresAdapter.ts) ~225L):
  - `getReferensiKamar(config)` + `getMapKelas(config)` (cached referensi)
  - `listKamar(config)` + `insertKamar(payload, config)` + `updateKamar(payload, config)` + `deleteKamar(payload, config)`
  - `setMaintenance(payload, config)` — wrapper updateKamar
  - Semua return `Promise<Result<BPJSEnvelope<T>, BPJSError>>`.

- [x] **`referenceCache.ts`** ✅ — TTL 24h cache untuk 6 kind referensi (diagnosa/poli/dokter/faskes/spesialistik/pasca-pulang). Public API: `getCached/setCached/getOrFetch/invalidate/invalidateAll/getCacheStatus/getAllCacheStatus`. ISO timestamp untuk testability via `_setNowForTest()` injection.

- [x] **`auditStore.ts` + `vClaimShared.ts` (HOF wrapWithAudit)** ✅ — supporting infrastructure:
  - [auditStore.ts](src/lib/bpjs/auditStore.ts) — ring buffer 200 entry · `logAuditEntry/getAuditEntries/filterAuditEntries/subscribeAudit` + `summarizeAudit24h` untuk KPI strip.
  - [vClaimShared.ts](src/lib/bpjs/vClaimShared.ts) — HOF `wrapWithAudit<T>(meta, fn)` auto-log audit entry + helpers `preflightMock/okEnvelope/errEnvelope/okEnvelopeEmpty`. Pattern: setiap adapter method wajib bungkus pakai HOF ini → audit-first enforced.
  - [idempotencyKey.ts](src/lib/bpjs/idempotencyKey.ts) — re-export `generateIdempotencyKey` + helper `keyForInsertSEP/keyForUpdateSEP/keyForInsertRK` per-mutation type.

**Acceptance BP0:** ✅ Folder `src/lib/bpjs/` lengkap (15 file: 4 core + 6 mock + 5 adapter+infra) · TSC clean (`npx tsc --noEmit` exit 0) · mock 12 peserta + 20 SEP + 15 rujukan + 10 RK + 5 SPRI + 6 bed Aplicares ready · adapter relocation tidak break eklaim existing (shim aktif) · referenceCache TTL helper jalan · authHeader generate header shape benar (mock signature) · 25 V-Claim method + 7 Aplicares method via HOF wrapWithAudit auto-log audit · idempotency key untuk semua mutation (Insert SEP/Update SEP/Insert RK/Insert SPRI).

---

## Phase BP1 — Beranda BPJS

**Route:** `/ehis-bpjs` · **Effort:** 2 hari
**Pattern reference:** Beranda Eklaim V2 (single-viewport interactive) + Beranda Billing KPI

### BP1.1 Layout ✅ (2026-05-29)

- [x] **Hero header** emerald-accent (icon `ShieldCheck` + eyebrow "EHIS BPJS · Integration Hub" + h1 "Pusat Bridging BPJS Kesehatan" + timestamp pill `Snapshot HH:mm` + **"Sync Referensi" CTA** dengan spin animation).
- [x] **Status Sistem Strip** di bawah hero — 3 service pill horizontal: V-Claim · Aplicares · LZ-String. Per pill: dot pulse `Online`(emerald)/`Degraded`(amber)/`Offline`(rose) + label + ago fmt. Tooltip via native `title`. Health derive dari `summarizeAudit24h` fail rate.
- [x] **KPI Strip 5 Card** (grid 2/3/5 responsive · stagger animation · hover lift):
  - **SEP** (emerald `FileText` · count total + breakdown Issue/Upd/Del)
  - **Rujukan** (teal `Share2` · total + FKTP/FKRTL split)
  - **Rencana Kontrol** (violet `CalendarCheck` · total + Kontrol/SPRI split)
  - **Bed Sync** (pink `BedDouble` · % okupansi + N ruang + ago last sync)
  - **Failed 24j** (rose/slate `Activity` · count + top failed endpoint truncated)

### BP1.2 Body Layout ✅ (2026-05-29)

- [x] **Quick Nav Grid 8 Card** group-by section (V-Claim 5 + Aplicares 3):
  - V-Claim group header (`ShieldCheck` + count 5) → Kepesertaan(sky) · SEP(emerald) · Rujukan(teal) · Monitoring(amber) · Rencana Kontrol(violet)
  - Aplicares group header (`BedDouble` + count 3) → Referensi Kamar(pink) · Map Kelas(rose) · Ketersediaan(emerald · subtitle "N bed kosong")

- [x] **Sidebar Panel tabbed** (Recent Calls / Referensi) — 1 sidebar 5/12 lg col-span untuk hindari long-scroll:
  - **Recent Calls tab** — 12 audit entry terakhir via `useSyncExternalStore(subscribeAudit, getAuditEntries)` auto-refresh saat adapter dipanggil. Per row: method chip(sky/emerald/amber/rose) + code chip(200 emerald/201 amber/202-203 violet/4xx-5xx rose) + endpoint truncated mid + ago. Footer: actor + durationMs + idempotencyKey + errorType.
  - **Referensi tab** — 6 cache kind (Diagnosa/Poli/Dokter/Faskes/Spesialistik/Pasca Pulang) dari `getAllCacheStatus()`. Per row: icon + label + staleness chip (Fresh emerald · Stale amber · Expired rose) + count entri + ago last sync. Footer CTA: "Refresh Semua Referensi" → `invalidateAll()`.
  - Klik "Lihat semua" → deep-link `/ehis-bpjs/audit` atau `/ehis-bpjs/aplicares/referensi-kamar`.

### BP1.3 Components ✅ (2026-05-29)

- [x] [BerandaBPJSPage.tsx](src/components/bpjs/beranda/BerandaBPJSPage.tsx) (~170L) — orchestrator: skeleton 500ms via `useSkeletonDelay` + AnimatePresence fade + 2-panel grid `lg:grid-cols-12` (LEFT 7 + RIGHT 5) + seed mock onMount.
- [x] [berandaBPJSShared.ts](src/components/bpjs/beranda/berandaBPJSShared.ts) (~390L) — `BPJS_TONE` 8 palette · `getBPJSKPIs()` derive dari SEP/RUJUKAN/RENCANA_KONTROL/APLICARES_KAMAR + `summarizeAudit24h` · `getSystemStatuses()` health derive · `getBPJSQuickNav()` 8 card · `getReferenceRows()` + `getRecentCalls()` · `seedBerandaBPJSMocks()` idempotent seed audit ring buffer + reference cache (4 fresh + 2 expired) · helpers `fmtAgo/fmtClockId/truncateMiddle`.
- [x] [SystemStatusStrip.tsx](src/components/bpjs/beranda/SystemStatusStrip.tsx) (~75L) — 3 pill horizontal + dot ping animation untuk Online/Degraded · responsive stack di mobile.
- [x] [BPJSKPIStrip.tsx](src/components/bpjs/beranda/BPJSKPIStrip.tsx) (~75L) — 5 card grid (2 / 3 / 5 col) stagger fade-up + hover bar accent + truncate hint.
- [x] [QuickNavGridBPJS.tsx](src/components/bpjs/beranda/QuickNavGridBPJS.tsx) (~175L) — section-by-group (V-Claim 5-col + Aplicares 3-col) + GroupHeader icon+count badge + disabled lock state + chevron translate hover.
- [x] [BPJSSidebarPanel.tsx](src/components/bpjs/beranda/BPJSSidebarPanel.tsx) (~265L) — tab nav segmented (motion layoutId) + AnimatePresence body swap + `useSyncExternalStore` subscribe ke `auditStore` + invalidateAll handler.
- [x] **Route entry** [src/app/ehis-bpjs/layout.tsx](src/app/ehis-bpjs/layout.tsx) (`ModuleLayout moduleKey="bpjs"`) + [page.tsx](src/app/ehis-bpjs/page.tsx) (Suspense-ready).
- [x] **Navigation update** [navigation.ts](src/lib/navigation.ts): tambah `ModuleKey "bpjs"` · MODULES entry (emerald accent) · `bpjsNav` 4 group (Utama / V-Claim 5 / Aplicares 3 / Audit) · `NAV_MAP.bpjs` wiring.

**Acceptance BP1:** ✅ Layout 1-viewport (no long-scroll, sidebar internal scroll) · skeleton 500ms · KPI stagger animation · Quick Nav 8 card group-by section · sidebar tab nav Calls/Referensi · `useSyncExternalStore` audit feed · reference panel `Refresh Semua` trigger (invalidateAll) · status sistem 3-dot live · text-sm minimum (zero text-xs) · emerald accent + multi-tone per tab · **TSC clean (`npx tsc --noEmit` exit 0)**.

---

## Phase BP2 — V-Claim Tab Kepesertaan ✅ (2026-05-29)

**Route:** `/ehis-bpjs/vclaim/kepesertaan` · **Effort:** 1 hari · **Accent: sky**

### BP2.1 Cek Status Kepesertaan ✅

- [x] **Form 2-mode toggle:** No Kartu (13-digit) atau NIK (16-digit) — segmented control sky-accent + framer-motion spring pill
- [x] **Validation real-time:** No Kartu 13 digit · NIK 16 digit · angka-only auto-strip · inline error AnimatePresence
- [x] **Tanggal SEP picker** — date input (default hari ini, max +30 hari, min -7 hari)
- [x] **Submit** → call `getPesertaByKartu()` atau `getPesertaByNik()` → `Result<PesertaRecord, BPJSError>`
- [x] **Loading state** — Loader2 spin + "Memanggil V-Claim BPJS…" + skeleton RIGHT panel
- [x] **PesertaDetailCard** — 2-panel split (LEFT form, RIGHT result), 4-section grid:
  - Header strip: nama + status chip (Aktif emerald/Non-Aktif rose) + PRB badge
  - Identitas (noKartu mono + NIK mono + tglLahir)
  - Kepesertaan (hakKelas chip + jenisPeserta chip + tglTAT)
  - FKTP Terdaftar (nmProvider + kdProvider)
  - No. RM & Kontak (noMR + noTelepon + tglTMT)
  - COB section (conditional — jika ada asuransi tambahan)
- [x] **Quick actions**: "Buat SEP" deep-link `/ehis-registration` · "Cari Rujukan" deep-link `/ehis-bpjs/vclaim/rujukan`
- [x] **Error state** per BPJSError type: 201 slate SearchX · 203 amber AlertTriangle · rose WifiOff + retry button
- [x] **Dev sample buttons** untuk 5 kartu + 3 NIK test values (dev-helper UX)

### BP2.2 Components ✅

- [x] [KepesertaanPage.tsx](src/components/bpjs/kepesertaan/KepesertaanPage.tsx) (~85L) — orchestrator + lifted state + adapter call
- [x] [CekPesertaForm.tsx](src/components/bpjs/kepesertaan/CekPesertaForm.tsx) (~165L) — toggle + form + validation + sample buttons
- [x] [PesertaDetailCard.tsx](src/components/bpjs/kepesertaan/PesertaDetailCard.tsx) (~255L) — 4 state machine (idle/loading/found/error)
- [x] [kepesertaanShared.ts](src/components/bpjs/kepesertaan/kepesertaanShared.ts) (~90L) — types + chip helpers + errorLabel + sample data
- [x] Route entry: [src/app/ehis-bpjs/vclaim/kepesertaan/page.tsx](src/app/ehis-bpjs/vclaim/kepesertaan/page.tsx)
- [x] VClaim layout: [src/app/ehis-bpjs/vclaim/layout.tsx](src/app/ehis-bpjs/vclaim/layout.tsx) (passthrough)

**Acceptance BP2:** ✅ 2-panel viewport (LEFT form fixed + RIGHT result scroll) · skeleton 400ms · segmented mode toggle spring · validation real-time · adapter call wired `getPesertaByKartu/getPesertaByNik` · PesertaDetailCard 4-state · COB section conditional · quick actions deep-link · error state per BPJSError · framer-motion stagger · TSC clean (`npx tsc --noEmit` exit 0).

---

## Phase BP3 — V-Claim Tab SEP

**Route:** `/ehis-bpjs/vclaim/sep` · **Effort:** 5 hari · **Accent: emerald**

Komponen kompleks — 9 sub-fungsi. Sub-tab internal SEP page:

### BP3.1 Cari SEP ✅ (2026-05-29)

- [x] **Form Cari** — input No SEP mono → `getSEP(noSEP)` → display detail SEP full (semua field SEPRecordExt)
- [x] **SEP Detail Card** — 7-section: SEP Header (noSEP + status + jnsPelayanan) · Tgl Terbit/Berlaku/Pulang · Poli/DPJP · Kelas Rawat · Diagnosa Awal · Identitas & Kontak · Rujukan (conditional) · Jaminan KLL (conditional) · Audit trail
- [x] **Quick actions:** Hapus SEP (modal trigger) · Update Tgl Pulang (deep-link)
- [x] **Dev sample** 6 SEP numbers (collapsible) — Issued RI/RJ · Closed · Updated · Suplesi KLL · Deleted
- [x] Route entry [src/app/ehis-bpjs/vclaim/sep/page.tsx](src/app/ehis-bpjs/vclaim/sep/page.tsx)

### BP3.2 Hapus SEP ✅ (2026-05-29)

- [x] **`HapusSEPModal`** — noSEP header + alasan textarea (min 20 char audit trail) + char counter
- [x] **Warning banner rose** — explain irreversible + UU PDP 27/2022 compliance note
- [x] **Guard:** SEP Closed/Deleted → block hapus dengan amber banner + penjelasan alasan
- [x] **Confirm** → call `deleteSEP({ noSep, user })` → success state (CheckCircle emerald) · error state dengan retry
- [x] **onDeleted callback** → parent re-fetch SEP untuk reflect status Deleted

### BP3.3 Update Tanggal Pulang ✅ (2026-05-29)

- [x] **Form** — noSEP input (prefillable via `?update=` URL param) + date picker tglPulang (max hari ini) + statusPulang select (1/3/4/5)
- [x] **Validation:** required fields + conditional noSuratMeninggal+tglMeninggal jika statusPulang="4"
- [x] **Submit** → `updateTglPulang(payload)` → success state emerald (CheckCircle) + "Update SEP Lain" reset
- [x] **List Update Tanggal Pulang panel** — bulan+tahun+filter → `listUpdateTglPulang()` → table (noSEP/Kartu · Pasien/jnsPel · Tgl SEP · Tgl Pulang emerald badge · Oleh)
- [x] **Auto tab-switch** — `?update={noSEP}` di URL auto-switch ke tab "Update Tgl Pulang" + prefill form

### BP3.4 Integrasi SEP dengan iDRG / INA-CBG ✅ (2026-05-29)

- [x] **`SEPIntegrasiInaCBGCard`** — input noSEP → `getSEP()` + lookup `CLAIM_BOARD_MOCK` via `penjamin.sep?.noSEP`
- [x] Jika **belum**: amber info banner + "Buat Klaim Baru di E-Klaim" → deep-link `/ehis-eklaim/klaim/baru?noSEP={noSEP}&diagAwal={kode}&noKartu={kartu}` (pre-fill data peserta + diagnosa awal)
- [x] Jika **sudah**: `ClaimFound` card — grouper chip (violet=iDRG / slate=INA-CBG Legacy) + kode 7-digit + severity level+label + diagnosaPrimer.kode+deskripsi + tarif 3-col (RS/Approved/Selisih) + status klaim + "Buka di E-Klaim" emerald CTA

### BP3.5 Suplesi Jasa Raharja & Data Induk Kecelakaan ✅ (2026-05-29)

- [x] **`SuplesiJasaRaharjaForm`** — noKartu (13-digit) + tglPelayanan → `suplesiCek()` → table `SuplesiJaminanItem[]` (noRegister · noSep/noSepAwal · tglKejadian · tglSep) + dev samples KLL/KK + amber accent
- [x] **`DataIndukKecelakaanForm`** — noKartu → `dataIndukKecelakaan()` → card list `DataIndukKecelakaanItem[]` (noSEP · tglKejadian · ketKejadian · lokasi prop/kab/kec · noSEPSuplesi conditional) + rose accent
- [x] Tab "Suplesi JR" — 2-panel split: LEFT `SuplesiJasaRaharjaForm` / RIGHT `DataIndukKecelakaanForm`

### BP3.6 SEP Internal ✅ (2026-05-29)

- [x] **`SEPInternalForm`** — noSEP lookup → `dataSepInternal()` → list `SEPInternalItem[]` dengan inline hapus per row (confirm → `hapusSepInternal()` → auto re-fetch) + sky accent
- [x] **`SEPInternalList`** — filter noKartu → derive RI SEPs dari `SEP_MOCK` → table (noSEP/Kartu · Diagnosa · Tgl · Status · Internal count lazy via hover) + "Detail" CTA per row → panggil SEPInternalForm
- [x] Tab "SEP Internal" — 2-panel split: LEFT `SEPInternalForm` / RIGHT `SEPInternalList`
- [x] Note: spec V-Claim hanya punya GET + DELETE untuk SEP Internal (tidak ada Insert/Update per spec resmi)

### BP3.7 Fingerprint ✅ (2026-05-29)

- [x] **`FingerprintPanel`** — noKartu + tglPelayanan → `getFingerPrint()` → status card (Verified emerald CheckCircle / Not Captured rose XCircle) + compliance reminder Permenkes 26/2021 + indigo accent
- [x] **`FingerprintListPanel`** — tglPelayanan date → `listFingerPrint()` → table (noKartu · nama dari `findPesertaByKartu()` · noSEP · status peserta) + quick-date shortcuts 3 tanggal mock
- [x] Tab "Fingerprint" — 2-panel split: LEFT `FingerprintPanel` / RIGHT `FingerprintListPanel`

### BP3.8 Components ✅ BP3.1–BP3.7 (2026-05-29)

- [x] [SEPPage.tsx](src/components/bpjs/sep/SEPPage.tsx) — **6-tab** orchestrator (Cari SEP · Update Tgl Pulang · Integrasi E-Klaim · Suplesi JR · SEP Internal · Fingerprint) + scrollable tab bar (`overflow-x-auto`) + Suspense boundary + `?update=` auto-switch
- [x] [CariSEPPanel.tsx](src/components/bpjs/sep/CariSEPPanel.tsx) (~140L) — context info + no SEP input + emerald submit + collapsible dev samples
- [x] [SEPDetailCard.tsx](src/components/bpjs/sep/SEPDetailCard.tsx) (~290L) — 4-state machine (idle/loading/found/error) + 7-section detail layout
- [x] [HapusSEPModal.tsx](src/components/bpjs/sep/HapusSEPModal.tsx) (~200L) — spring animation + block guard + alasan textarea + success/error states
- [x] [sepShared.ts](src/components/bpjs/sep/sepShared.ts) (~90L) — SEPResult union + statusChipCls + helpers + SAMPLE_SEP
- [x] [UpdateTglPulangForm.tsx](src/components/bpjs/sep/UpdateTglPulangForm.tsx) (~230L) — statusPulang select + conditional meninggal fields + `updateTglPulang()` + success state
- [x] [UpdateTglPulangList.tsx](src/components/bpjs/sep/UpdateTglPulangList.tsx) (~195L) — bulan/tahun/filter controls + `listUpdateTglPulang()` + animated table
- [x] [SEPIntegrasiInaCBGCard.tsx](src/components/bpjs/sep/SEPIntegrasiInaCBGCard.tsx) (~310L) — noSEP lookup → `ClaimFound` (iDRG/INA-CBG · tarif · deep-link) or `ClaimNotFound` (CTA baru)
- [x] [SuplesiJasaRaharjaForm.tsx](src/components/bpjs/sep/SuplesiJasaRaharjaForm.tsx) (~215L) — `suplesiCek()` + amber accent + dev samples
- [x] [DataIndukKecelakaanForm.tsx](src/components/bpjs/sep/DataIndukKecelakaanForm.tsx) (~185L) — `dataIndukKecelakaan()` + rose accent + card list
- [x] [SEPInternalForm.tsx](src/components/bpjs/sep/SEPInternalForm.tsx) (~200L) — `dataSepInternal()` + inline hapus row + sky accent
- [x] [SEPInternalList.tsx](src/components/bpjs/sep/SEPInternalList.tsx) (~185L) — derive RI SEPs + lazy count hover + "Detail" CTA
- [x] [FingerprintPanel.tsx](src/components/bpjs/sep/FingerprintPanel.tsx) (~185L) — `getFingerPrint()` + status card + compliance note + indigo accent
- [x] [FingerprintListPanel.tsx](src/components/bpjs/sep/FingerprintListPanel.tsx) (~175L) — `listFingerPrint()` + enrich `findPesertaByKartu()` + quick dates

**Acceptance BP3:** ✅ BP3.1+BP3.2+BP3.3+BP3.4+BP3.5+BP3.6+BP3.7 ✅ · 14 file `src/components/bpjs/sep/` · 6-tab SEPPage scrollable · TSC clean.

---

## Phase BP4 — V-Claim Tab Rujukan

**Route:** `/ehis-bpjs/vclaim/rujukan` · **Effort:** 2 hari · **Accent: teal**

### BP4.1 Pencarian Rujukan ✅ (2026-05-30)

- [x] **Form 2-mode toggle:** "Cari by No Rujukan" atau "Cari by No Kartu + Jenis Faskes" — segmented teal pill
- [x] **Mode 1:** input No Rujukan mono → call `getRujukan(noRujukan, jenisFaskes)` → single `RujukanResultCard`
- [x] **Mode 2:** input No Kartu (13-digit) + segmented FKTP/FKRTL → `listRujukanByPeserta(noKartu, jenisFaskes)` → list `RujukanResultCard[]`
- [x] **RujukanResultCard** — display detail rujukan: status chip (Aktif teal/Expired rose/Used slate) + asal badge (FKTP sky/FKRTL violet) + PPK route arrow (asal → RS Tujuan) + diagnosa kode+nama + poli + peserta card + masa berlaku + keluhan/catatan amber note
- [x] **FaskesToggle** sub-component (FKTP/FKRTL) + animated form swap via `AnimatePresence mode="wait"` + slide-x per direction
- [x] **Dev samples** RUJUKAN_NOS (3 sample) + KARTU (3 sample) + idle empty state + error state

### BP4.2 List Rujukan Khusus ✅ (2026-05-30)

- [x] **`ListRujukanKhususPanel`** — bulan (select 1–12) + tahun (number input) + Cari → `listRujukanKhusus(bulan, tahun)` → table `RujukanKhususListItem[]`
- [x] **Table cols:** ID/No Rujukan · Nama/Kartu · Diagnosa chip teal · Periode (awal→akhir dengan ChevronRight)
- [x] **Quick shortcuts:** Mei 2026 · Jun 2026 · Jul 2026 (active highlight teal)
- [x] **Footer badge** — "{N} rujukan khusus · {Bulan} {Tahun}" teal
- [x] Note: kdDiag per spec `listRujukanKhusus(bulan, tahun)` — bukan per-diagnosa per endpoint 9 spec resmi

### BP4.3 List Spesialistik ✅ (2026-05-30)

- [x] **`ListSpesialistikPanel`** — `listSpesialistik()` auto-load on mount → table 3-col (no. · kode chip teal · nama) · loading/error states · footer badge · content-only (no outer shell)

### BP4.4 List Sarana ✅ (2026-05-30)

- [x] **`ListSaranaPanel`** — `FaskesToggle` FKTP/FKRTL + search input nama + `listSarana()` → table (kode · nama · alamat · jenis badge sky/violet) · idle ghost + loading + empty + results states · content-only (no outer shell)

### BP4.5 Components ✅ BP4.1–BP4.4 (2026-05-30)

- [x] [rujukanShared.ts](src/components/bpjs/rujukan/rujukanShared.ts) — `fmtDate` · `jnsPelLabel` · `statusCls` · `asalBadgeCls` · `SearchState` type · sample arrays
- [x] [RujukanPage.tsx](src/components/bpjs/rujukan/RujukanPage.tsx) — skeleton 600ms + 3 StatCard stagger + **3-panel** `lg:flex-row`: Form(w-75) + Results(flex-1) + ReferensiPanel(flex-1)
- [x] [CariRujukanForm.tsx](src/components/bpjs/rujukan/CariRujukanForm.tsx) — form-only · `isLoading` + `onStateChange` props · mode toggle hash/kartu + FaskesToggle + slide AnimatePresence · `lg:w-75 shrink-0`
- [x] [RujukanResultsPanel.tsx](src/components/bpjs/rujukan/RujukanResultsPanel.tsx) — terima `SearchState` dari parent · idle ghost + loading + error + empty + found (RujukanResultCard list) · `flex-1`
- [x] [RujukanResultCard.tsx](src/components/bpjs/rujukan/RujukanResultCard.tsx) — PPK route arrow + diagnosa/poli grid + peserta card + masa berlaku + keluhan amber note
- [x] [ListRujukanKhususPanel.tsx](src/components/bpjs/rujukan/ListRujukanKhususPanel.tsx) — refactored: `export KhususContent` + default standalone outer shell · bulan/tahun filter + quick shortcuts + KhususRow table
- [x] [ListSpesialistikPanel.tsx](src/components/bpjs/rujukan/ListSpesialistikPanel.tsx) — auto-load `listSpesialistik()` · table no/kode/nama · footer badge · content-only
- [x] [ListSaranaPanel.tsx](src/components/bpjs/rujukan/ListSaranaPanel.tsx) — FaskesToggle + search input + `listSarana()` · 4-col table kode/nama/alamat/jenis badge · content-only
- [x] [ReferensiPanel.tsx](src/components/bpjs/rujukan/ReferensiPanel.tsx) — outer shell + 3 tab buttons (Khusus Kronik·Spesialistik·Sarana Faskes) + `AnimatePresence` slide-x per tab direction · imports `KhususContent`+`ListSpesialistikPanel`+`ListSaranaPanel`
- [x] Route entry [src/app/ehis-bpjs/vclaim/rujukan/page.tsx](src/app/ehis-bpjs/vclaim/rujukan/page.tsx)

**Acceptance BP4.1–BP4.4:** ✅ 3-panel layout (Form|Results|ReferensiPanel) · `SearchState` lifted ke `RujukanPage` · `ReferensiPanel` 3-tab (Khusus/Spesialistik/Sarana) slide-x AnimatePresence · `listSpesialistik()` auto-load · `listSarana(nama, jenisFaskes)` wired · TSC clean · 9 file `src/components/bpjs/rujukan/` + route entry.

---

## Phase BP5 — V-Claim Tab Monitoring ✅ (2026-05-30)

**Route:** `/ehis-bpjs/vclaim/monitoring` · **Effort:** 2 hari · **Accent: amber**

Aligned 1:1 dengan [Monitoring-Contracts.md](contracts/Monitoring-Contracts.md) — 4 endpoint · 4 sub-tab internal · wire-format types.

### BP5.1 Data Kunjungan (spec endpoint 1) ✅

- [x] **`KunjunganPanel`** — filter tglSEP (date) + segmented jnsPelayanan (R.Inap/R.Jalan)
- [x] Submit → `monitoringKunjungan(tglSEP, jns)` → `KunjunganMonitoringItem[]`
- [x] **Table 8-col:** noSep mono · noKartu mono · nama · diagnosa chip teal · jnsPelayanan chip (emerald/sky) · kelasRawat chip · poli (null → "—") · tglPlgSep
- [x] **Summary footer** — count + jnsPelayanan + tgl
- [x] **Export CSV** RFC 4180 + BOM UTF-8 via `exportCsv()`
- [x] Dev sample date chips (2026-05-01 / 2026-05-10 / 2026-04-11)

### BP5.2 Data Klaim (spec endpoint 2) ✅

- [x] **`KlaimPanel`** — filter tglPulang + jnsPelayanan + statusKode (3-way: Proses/Pending/Klaim)
- [x] Submit → `monitoringKlaim(tglPulang, jns, statusKode)` → `KlaimMonitoringItem[]`
- [x] **Table 9-col:** noSEP mono · peserta (nama/noKartu/noMR multi-line) · Inacbg chip + nama tooltip · poli · kelasRawat chip · `BiayaCell` (pengajuan/setujui/topup mini-card) · noFPK (— jika "") · status chip warna per kode · tglPulang
- [x] **Summary footer** — count · total tagih · total disetujui · selisih · % approval pill (emerald/amber/rose per threshold)
- [x] Dev sample date chips

### BP5.3 Histori Pelayanan Peserta (spec endpoint 3) ✅

- [x] **`HistoriPelayananPanel`** — filter noKartu (13-digit validation) + date range tglMulai/tglAkhir (max 90 hari, inline periodeError)
- [x] Submit → `monitoringHistoriPelayanan(noKartu, tglMulai, tglAkhir)` → `HistoriPelayananMonitoringItem[]`
- [x] **Peserta header banner** — fade-in (namaPeserta + noKartu + periode + count) setelah loaded
- [x] **Timeline view** sort tglSep desc — per entry: RI/RJ dot + kelasRawat badge + noSep · tgl range · poli · diagnosa + footer noRujukan + ppkPelayanan
- [x] Empty state "Tidak ada riwayat pelayanan dalam periode ini"
- [x] Dev sample kartu chips (last-4 digit: 7891/7892)

### BP5.4 Klaim Jasa Raharja (spec endpoint 4) ✅

- [x] **`JasaRaharjaPanel`** — filter jnsPelayanan + date range tglMulai/tglAkhir
- [x] Submit → `monitoringJasaRaharja(jns, tglMulai, tglAkhir)` → `JasaRaharjaMonitoringItem[]`
- [x] **Card per item** — header (noSEP + tgl range + jnsPelayanan chip + diagnosa chip + status Dijamin pill) · 2-col body (peserta | JR detail: noRegister/tglKejadian/ketStatusDikirim chip/biaya 3-grid)
- [x] **Summary footer** — count · total biayaDijamin · total jmlDibayar

### BP5.5 Components ✅ (2026-05-30)

- [x] [monitoringShared.ts](src/components/bpjs/monitoring/monitoringShared.ts) — `errMsg/fmtDate/fmtRupiah/jnsLabel/jnsChipCls/statusKlaimChipCls/kelasChipCls/dijaminChipCls/today/daysAgo/daysBetween/exportCsv` + sample arrays
- [x] [MonitoringPage.tsx](src/components/bpjs/monitoring/MonitoringPage.tsx) (~185L) — skeleton 600ms + 4 StatCard stagger + 4-tab panel amber + `AnimatePresence` slide-x per tab direction + `absolute inset-0` pattern
- [x] [KunjunganPanel.tsx](src/components/bpjs/monitoring/KunjunganPanel.tsx) (~235L) — `JnsToggle` + table 8-col + export CSV + footer
- [x] [KlaimPanel.tsx](src/components/bpjs/monitoring/KlaimPanel.tsx) (~280L) — `JnsToggle` + `StatusToggle` + `BiayaCell` + table 9-col + footer summary % approval
- [x] [HistoriPelayananPanel.tsx](src/components/bpjs/monitoring/HistoriPelayananPanel.tsx) (~265L) — `HistoriEntry` timeline card + peserta banner header + 90-day validation
- [x] [JasaRaharjaPanel.tsx](src/components/bpjs/monitoring/JasaRaharjaPanel.tsx) (~255L) — `JRCard` 2-section nested + biaya 3-grid + footer
- [x] Route [src/app/ehis-bpjs/vclaim/monitoring/page.tsx](src/app/ehis-bpjs/vclaim/monitoring/page.tsx)

**Acceptance BP5:** ✅ 4 sub-tab functional · 4 endpoint wired (wire-format types) · filter periode + statusKode numeric · export CSV kunjungan · histori timeline sort desc · card-per-item JR · TSC clean · 7 file `src/components/bpjs/monitoring/` + route entry.

---

## Phase BP6 — V-Claim Tab Rencana Kontrol ✅ (2026-05-30)

**Route:** `/ehis-bpjs/vclaim/rencana-kontrol` · **Effort:** 4 hari (naik dari 3 karena PRB form) · **Accent: violet**

Aligned 1:1 dengan [RencanaKontrol-Contracts.md](contracts/RencanaKontrol-Contracts.md) — 11 endpoint · 7 sub-tab internal.

### BP6.1 Cari SEP untuk RK (spec endpoint 6)

- [x] **`CariSEPRKPanel`** — input noSEP → call `getSEPUntukRK(noSEP)` → display `SEPUntukRKRecord` (shape khusus: poli & diagnosa format display "KODE - Nama" · peserta ringkas · provUmum FKTP · provPerujuk)
- [x] Cek apakah sudah ada RK linked di `RENCANA_KONTROL_MOCK` (`findRKsBySEP(noSEP)`)
- [x] Jika belum: tombol "Buat Rencana Kontrol V2" → buka `InsertRKV2Modal` (sub-tab BP6.2)
- [x] Cross-link "Buat SPRI tanpa SEP" → `InsertSPRIModal` (sub-tab BP6.3) untuk kasus admisi elektif tanpa kunjungan RJ

### BP6.2 Insert/Update RK V2 (+ PRB Form) (spec endpoint 1, 2)

- [x] **`InsertRKV2Modal`** — form 2-step:
  - **Step 1 — Header:** `noSEP` (auto-fill) · `kodeDokter` (dropdown via `getDokterRK`) · `poliKontrol` (dropdown via `getPoliRK`) · `tglRencanaKontrol` (date picker, min hari ini) · `user` (auto dari session)
  - **Step 2 — `FormPRB`:** segmented `kdStatusPRB` (9 chip: 01-09) → render input dinamis sesuai penyakit yang dipilih:
    - DM (01): HBA1C · GDP · GD2JPP · eGFR · TD_Sistolik/Diastolik · LDL (7 field)
    - HT (02): eGFR · Rata_TD_Sistolik/Diastolik · JantungKoroner · Stroke · VaskularPerifer · Aritmia · AtrialFibrilasi (8 field)
    - Asma (03): Terkontrol · Gejala2xMinggu · BangunMalam · KeterbatasanFisik · FungsiParu (5 field)
    - Jantung (04): NadiIstirahat · Rata_TD_Sistolik/Diastolik · Aritmia · SesakNapas3Bulan · NyeriDada3Bulan · SesakNapasAktivitas · NyeriDadaAktivitas (8 field)
    - PPOK (05): SkorMMRC · Eksaserbasi1Tahun · MampuAktivitas (3 field)
    - Skizofrenia (06): Remisi · TerapiRumatan · Usia (3 field)
    - Stroke (07): GDP · TD_Sistolik/Diastolik · LDL · AsamUrat (5 field)
    - Epilepsi (08): Epileptik6Bulan · EfekSampingOAB · HamilMenyusui (3 field)
    - SLE (09): RemisiSLE · Hamil (2 field)
- [x] **Validasi inline per field** sesuai spec range (HBA1C 0.1-15 · GDP/GD2JPP 10-500 · dst). Pakai helper `validatePRBField(kode, field, value)`.
- [x] Submit → `insertRKV2(payload)` → idempotency key auto-generate · success toast violet → tampilkan `noSurat`
- [x] **`UpdateRKV2Modal`** — sama struktur, prefill dari `getNoSuratKontrol(noSurat)` (response include formPRB embedded) → submit `updateRKV2(payload)`
- [x] Guard: jika `status: "Used"` → disable edit

### BP6.3 Insert/Update SPRI (spec endpoint 4, 5)

- [x] **`InsertSPRIModal`** — form simpel (TANPA formPRB): `noKartu` · `kodeDokter` · `poliKontrol` · `tglRencanaKontrol` · `user`
- [x] Submit → `insertSPRI(payload)` → response `{ noSPRI }`
- [x] **`UpdateSPRIModal`** — `noSPRI` (read-only) + edit `kodeDokter/poliKontrol/tglRencanaKontrol/user` → `updateSPRI(payload)`
- [x] Guard: jika `status: "Used"` → block update

### BP6.4 Hapus RK/SPRI (spec endpoint 3)

- [x] **`HapusRKModal`** — input `noSuratKontrol` + `user` (auto session) + alasan textarea (≥10 char untuk audit)
- [x] Guard cek `status: "Used"` block hapus
- [x] Submit → `deleteRK(noSuratKontrol, user)` → success toast emerald

### BP6.5 Cari Nomor Surat Kontrol (spec endpoint 7)

- [x] **`CariNoSuratPanel`** — input noSurat → `getNoSuratKontrol(noSurat)` → display `RKDetailRecord`:
  - Header: noSurat · jnsKontrol chip (1=SPRI / 2=Kontrol) · tglTerbit · tglRencanaKontrol · flagKontrol · namaJnsKontrol
  - Section SEP: jika `jnsKontrol="2"` tampil SEP asal (peserta · pelayanan · poli · diagnosa) · jika `"1"` (SPRI) → null/hide
  - Section formPRB: tampil chip `kdStatusPRB` + grid 37 field dengan value (null = "—")
- [x] Quick actions: "Edit" → `UpdateRKV2Modal` · "Hapus" → `HapusRKModal` · "Cetak Surat" → print template A4 KOP RS

### BP6.6 Data RK List — by Kartu & Periode (spec endpoint 8, 9)

- [x] **`DataRKByKartuPanel`** (spec 8) — filter `bulan` (dropdown 01-12) + `tahun` (number) + `noKartu` (13 digit) + segmented `filter: "1"=tgl entri | "2"=tgl rencana` → `listRKByKartu(...)` → table 11-col (`RKListByKartuItem`):
  - noSuratKontrol · jnsPelayanan · jnsKontrol chip · namaJnsKontrol · tglRencanaKontrol · tglTerbitKontrol · noSepAsalKontrol · poliAsal · poliTujuan · namaDokter · terbitSEP chip (Sudah/Belum)
- [x] **`DataRKPeriodePanel`** (spec 9) — filter `tglAwal/tglAkhir` + segmented filter → `listRKFiltered(...)` → table 10-col (`RKListPeriodeItem`)
- [x] Per row aksi (kedua panel): "Detail" (modal `getNoSuratKontrol`) · "Edit" · "Hapus" · "Cetak"
- [x] Export CSV RFC 4180 + BOM UTF-8

### BP6.7 Referensi Poli & Dokter (spec endpoint 10, 11)

- [x] **`DataPoliPanel`** (spec 10) — input `jnsKontrol` (1=SPRI / 2=RK) + `nomor` (auto: noKartu jika SPRI, noSEP jika RK) + `tglRencana` → `getPoliRK(jnsKontrol, nomor, tglRencana)` → table (`PoliRKSpecItem`): kodePoli · namaPoli · kapasitas · jmlRencanaKontroldanRujukan · persentase utilisasi (progress bar)
- [x] **`DataDokterPanel`** (spec 11) — input `jnsKontrol` + `kdPoli` + `tglRencana` → `getDokterRK(...)` → table (`DokterRKSpecItem`): kodeDokter · namaDokter · jadwalPraktek · kapasitas
- [x] Cross-link dokter → master `DOKTER_MOCK`

### BP6.8 Components

- [x] `RencanaKontrolPage.tsx` (~180L) — 7 sub-tab nav
- [x] `CariSEPRKPanel.tsx` (~200L)
- [x] `InsertRKV2Modal.tsx` (~350L) — 2-step + PRB dinamis (split ke sub: `PRBFormFields.tsx` ~250L per-penyakit render)
- [x] `UpdateRKV2Modal.tsx` (~280L) — reuse PRBFormFields
- [x] `PRBFormFields.tsx` (~280L) — 9 penyakit · dynamic field render · inline range validation
- [x] `InsertSPRIModal.tsx` (~160L) + `UpdateSPRIModal.tsx` (~150L)
- [x] `HapusRKModal.tsx` (~150L)
- [x] `CariNoSuratPanel.tsx` (~220L) — detail card + PRB display grid
- [x] `DataRKByKartuPanel.tsx` (~260L) + `DataRKPeriodePanel.tsx` (~250L) — filter + table + actions
- [x] `DataPoliPanel.tsx` (~170L) + `DataDokterPanel.tsx` (~190L)
- [x] Print template `RKSPRISuratTemplate.tsx` (~220L) — A4 KOP RS + PRB summary table

**Acceptance BP6:** ✅ 7 sub-tab functional · 11 endpoint wired via adapter · `formPRB` dinamis sesuai 9 penyakit kronik · validasi range per-field · SPRI ↔ RK terpisah (insert/update method beda) · filter list by Kartu (spec 8) + periode (spec 9) · print surat A4 KOP RS + PRB summary · jadwal dokter cross-ref master · TSC clean.

---

## Phase BP7 — Aplicares (Bed Monitoring Sync)

**Route prefix:** `/ehis-bpjs/aplicares/*` · **Effort:** 2 hari · **Accent: pink**

### BP7.1 Referensi Kamar ✅ (2026-05-30)

- [x] **`ReferensiKamarPage`** — `getRefKelas()` → table 5-col (No · Kode chip pink · Nama · Catatan · Status) + info banner · "Sync Now" CTA `RotateCw` spin · `CacheStatus` pill (Fresh/Stale/Empty).
- [x] StatCard strip 3-col: Total Kelas · Kelas Tarif Valid (non-NON/VVP) · Cache Status + waktu sync.
- [x] Row highlight: tarif aktif hover pink · non-tarif hover slate.
- [x] Route `src/app/ehis-bpjs/aplicares/referensi-kamar/page.tsx` ✅

### BP7.2 Map Kelas ✅ (2026-05-30)

- [x] **`MapKelasPage`** — `getMapKelas()` → table 6-col (Kelas BPJS chip · Nama BPJS · Kelas Lokal chip · Nama Lokal · Multiplier badge · Aksi) + AnimatePresence row.
- [x] StatCard strip 2-col: Total Mapping · Multiplier Aktif (custom vs standar count).
- [x] CRUD: "Tambah Mapping" button → `KamarMappingForm` modal (add) · PencilLine per row (edit) · Trash2 per row → `DeleteConfirmRow` inline confirm.
- [x] Saved flash — row bg-emerald-50 + "Disimpan" Check icon 1.5s setelah save.
- [x] **`KamarMappingForm`** — 3 field: kdKelasBPJS select (VIP/1/2/3) · kdKelasLokal select (KelasRawat enum) · multiplier number input + preview badge real-time.
- [x] Validasi: no duplikat (kdKelasBPJS, kdKelasLokal) pair · multiplier > 0 · skip own id saat edit.
- [x] **`aplicaresShared.ts`** — `MapRowLocal` · `CacheStatus` helpers · `kelasBPJSChipCls` · `kelasLokalChipCls` · `multiplierBadgeCls/Label` · `isDuplicateMapping` guard · `KELAS_LOKAL_OPTIONS`.
- [x] Route `src/app/ehis-bpjs/aplicares/map-kelas/page.tsx` ✅
- [x] TSC clean (`npx tsc --noEmit` exit 0) ✅

### BP7.3 Ketersediaan Kamar (Bed Sync)

- [ ] **`KetersediaanKamarPage`** — main UI Aplicares:
  - Header: "Sync Status" badge (lastSyncISO · auto-refresh tiap 5 menit) + "Force Refresh" CTA
  - Table per ruangan derive dari `LOCATION_MOCK + beds[]` di master Ruangan:
    - Kolom: Kode Ruang · Nama Ruang · Kelas BPJS (dari MapKelas) · Kapasitas · Terisi · Tersedia · Maintenance · Last Update
  - Per row aksi: "Set Maintenance" (modal alasan + estimasi durasi) · "Force Sync" (call `updateKamar`)
- [ ] **BedSyncStatusBanner** — tampil di atas table:
  - Hijau: synced dalam 5 menit
  - Amber: 5-15 menit
  - Rose: >15 menit (need attention)
- [ ] **Cross-link**: klik nama ruang → buka master Ruangan `/ehis-master/ruangan?id={locationId}`
- [ ] **Real-time link**: saat workflow klinis di RI admisi/discharge mengubah bed status, push update ke Aplicares via adapter. Beranda BPJS KPI "Bed Sync" count update.

### BP7.4 Components

- [ ] `ReferensiKamarPage.tsx` (~170L)
- [ ] `MapKelasPage.tsx` (~220L) + `KamarMappingForm.tsx` (~190L)
- [ ] `KetersediaanKamarPage.tsx` (~280L)
- [ ] `BedSyncStatusBanner.tsx` (~130L)

**Acceptance BP7:** ✅ 3 sub-page functional · MapKelas CRUD · Ketersediaan derive dari master Ruangan/Bed · force refresh + maintenance toggle · cross-link master Ruangan · sync status banner · TSC clean.

---

## Phase BP8 — Polish + Audit Trail

**Effort:** 1.5 hari

### BP8.1 Audit Trail Viewer

- [ ] **`AuditTrailPage`** (`/ehis-bpjs/audit`) — filter:
  - Periode (tglMulai/tglAkhir)
  - Endpoint (multi-select dari list endpoints aktif)
  - Method (GET/POST/PUT/DELETE)
  - Status (Success/Error/All)
  - Actor (search nama)
- [ ] Table 10-col: timestamp · endpoint · method · responseCode chip · success · durationMs · actor · idempotencyKey · errorType · action (lihat detail modal)
- [ ] **Detail modal** per entry: full request hash · response hash · stack trace jika error · retry button (jika retryable)
- [ ] **Export CSV** untuk audit eksternal (BPJS audit · KARS verifikator)

### BP8.2 Reference Sync Scheduler (UI only)

- [ ] **Status panel di Beranda** — visual saat tiap referensi terakhir di-sync
- [ ] Manual "Sync All References" CTA di Beranda
- [ ] Konfigurasi auto-sync interval (default 24h, dapat di-set di config)

### BP8.3 Error Recovery + Retry

- [ ] **Global toast notification** — semua adapter error muncul toast emerald/amber/rose
- [ ] **Retry button** per failed call dari audit trail
- [ ] **Idempotency check** — saat retry mutation, kirim sama `idempotencyKey` untuk hindari duplicate

### BP8.4 Print Templates

- [ ] **Cetak SEP** (`SEPCetakTemplate`) A4 KOP RS
- [ ] **Cetak Rencana Kontrol/SPRI** (`RKSPRISuratTemplate`) A4 KOP RS
- [ ] **Cetak Audit Report** (`AuditReportTemplate`) — periode + summary + tabel detail

### BP8.5 Update Workflow Docs

- [ ] **Update [CLAUDE.md](CLAUDE.md)** — tambah entry `/ehis-bpjs` row di Module Map. Cross-ref ke `/ehis-eklaim` (klaim consume V-Claim) + `/ehis-registration` (SEP saat admisi) + `/ehis-master/ruangan` (Aplicares bed sync).
- [ ] **Update [TODOS_BACKEND.md](TODOS_BACKEND.md)** — tambah Phase B-BPJS:
  - Auth header HMAC-SHA256 (Node crypto)
  - LZ-String compression NPM `lz-string`
  - Secret manager untuk consId/consSecret/userKey
  - Audit log table di DB
  - Scheduled job referensi sync (BullMQ atau cron)
  - WebSocket push untuk bed status realtime
- [ ] **Update [TECH_DEBT.md](TECH_DEBT.md)** — catat:
  - vClaimAdapter relocation backward-compat sementara → cleanup setelah eklaim refactor
  - Real HMAC signature implementation (mock skip)
  - Real LZ-String compression (mock skip)
  - Wilayah Kemendagri JSON untuk dropdown propinsi/kabupaten/kecamatan
  - Reference sync scheduler (frontend manual → backend cron)
- [ ] **Update [navigation.ts](src/lib/navigation.ts)** — tambah `/ehis-bpjs` ke sidebar utama dengan icon `ShieldCheck` + bpjsNav internal nav (V-Claim 5 + Aplicares 3 + Audit)

**Acceptance BP8:** ✅ Audit viewer filter + export · retry mechanism · 3 print template · CLAUDE.md + TODOS_BACKEND.md + TECH_DEBT.md + navigation.ts updated · TSC clean across all files.

---

## 🚫 Out of Scope (Phase 1) — Ditunda ke Phase Later

| Feature | Alasan Ditunda | Kandidat Phase |
|---|---|---|
| **Antrol BPJS (Antrian Online)** | Modul terpisah (mobile JKN check-in queue). Effort besar (RFID/QR + realtime). | Separate module `/ehis-antrol` |
| **APOL (Apotek Online) BPJS** | Klaim obat kronis FKTL. Sudah di-stub di [apolAdapter.ts](src/lib/eklaim/apolAdapter.ts). | BPJS Phase 2 |
| **Cetak Kartu Peserta** | Layout printing kartu fisik. Effort polish. | Backend Phase |
| **PRB (Program Rujuk Balik)** | Klaim obat program kronik. Workflow batch terpisah. | Separate module `/ehis-prb` |
| **Real HMAC-SHA256 signature** | Backend implementation, butuh secret manager + crypto. | Backend Phase B-BPJS |
| **Real LZ-String compression** | Production-only, mock no-op cukup di Phase 1. | Backend Phase |
| **Auto-sync scheduler (cron)** | Backend implementation. Phase 1 manual refresh. | Backend Phase |
| **WebSocket bed status push** | Aplicares realtime push. Backend implementation. | Backend Phase |
| **Multi-RS Group (untuk RS chain)** | Phase 1 single-tenant. Multi-tenant ditunda. | Far future |
| **Verifikasi sidik jari hardware** | Butuh device integration (fingerprint reader USB/network). | Backend Phase + hardware partner |
| **Bridging SISRUTE Kemenkes** | Rujukan terintegrasi Kemenkes (terpisah dari V-Claim). | Separate module `/ehis-sisrute` |
| **Sinkron data sosial ekonomi peserta** | Untuk pengembalian iuran PBI. Out of scope. | Backend Phase |
| **Dashboard analytics V-Claim** | Trend submit success, latency per endpoint, error rate. | After BP8 Polish |

---

## 📊 Progress Tracker

| Phase | Tasks | Done | % |
|---|---|---|---|
| BP0 — Foundation | 4 sections (Auth + Types + Mock + Adapter) | 4 | **100%** ✅ |
| BP1 — Beranda BPJS | 3 sections | 3 | **100%** ✅ |
| BP2 — Kepesertaan | 2 sections | 0 | 0% |
| BP3 — SEP | 8 sections | 0 | 0% |
| BP4 — Rujukan | 5 sections | 0 | 0% |
| BP5 — Monitoring | 5 sections | 0 | 0% |
| BP6 — Rencana Kontrol | 8 sections (11 endpoint + PRB form) | 0 | 0% |
| BP7 — Aplicares | 4 sections | 2 | **50%** 🚧 |
| BP8 — Polish + Audit | 5 sections | 0 | 0% |
| **Total** | **44 sections** | **9** | **20%** |

---

## 🛠️ Convention & Standards

### File Structure per Sub-Page
```
src/lib/bpjs/*Mock.ts                    # types + mock data + helpers
src/lib/bpjs/*Adapter.ts                 # transport layer + Result<T, E>
src/app/ehis-bpjs/<area>/<sub>/page.tsx  # route entry (Suspense + import)
src/components/bpjs/<area>/
├── <Sub>Page.tsx                        # orchestrator (~120L)
├── <Sub>Form.tsx                        # form + validation
├── <Sub>ResultCard.tsx                  # display response
├── <Sub>List.tsx                        # filter + table
└── modals/<Sub>Modal.tsx                # confirm/edit modals
```

### Design Principles (apply setiap halaman)
1. **Invoke `frontend-design` skill** sebelum coding UI (memory-persisted preference)
2. **Skeleton 500ms** via `useSkeletonDelay` + Framer Motion AnimatePresence
3. **No long-scroll** — tab internal + collapsible sections
4. **Form fields dark text** (`text-slate-800`), label uppercase `text-slate-500`
5. **No indigo · No purple primary** — emerald base BPJS + tone per tab (sky/teal/amber/violet/pink)
6. **Mono + tabular-nums** untuk noKartu/NIK/noSEP/noRujukan/noSurat
7. **Density tokens `m-*`** untuk monitoring panel (banyak baris)
8. **File limit ≤800 lines**
9. **Accent per tab:** kepesertaan sky · SEP emerald · rujukan teal · monitoring amber · rencana kontrol violet · aplicares pink · audit slate
10. **Print stylesheet** untuk SEP/RK/SPRI/Audit Report A4 KOP RS
11. **Idempotency** untuk semua mutation
12. **Audit trail** untuk semua adapter call

### Acceptance per Sub-Page
- [ ] Route accessible
- [ ] Form validation real-time dengan typed error
- [ ] Adapter call return `Result<T, BPJSError>`
- [ ] Success state: result card display field lengkap
- [ ] Error state per BPJSError type (201/202/203/204/500/503/NetworkError)
- [ ] Audit log tercatat per call (timestamp + endpoint + actor + responseCode)
- [ ] Cross-link deep-link benar (jika applicable)
- [ ] Print stylesheet A4 KOP RS (untuk surat resmi)
- [ ] TypeScript clean (no errors)
- [ ] File terbesar <800 lines

### Tracking Workflow
Setiap selesai task:
1. Centang `[x]` di TODO-BPJS.md
2. Tambah catatan ringkas + tanggal (mis. `[x] BP2.1 Cek Peserta ✅ (2026-06-XX) — 2-mode toggle + validation + PesertaDetailCard 6-section`)
3. Update progress tracker
4. Update [CLAUDE.md](CLAUDE.md) `/ehis-bpjs` status saat phase major selesai
5. Commit format: `bpjs: phase BPX.Y — <singkat>`

---

## 🔗 Cross-Module Integration Points

### Consumer: `/ehis-registration`
- **Pasien Baru/Admisi** — saat input penjamin BPJS, panggil `getPesertaByNik()` auto-populate
- **Buat Kunjungan** — saat eligibility cek, panggil `insertSEP()` dari [pasienBaruShared.tsx](src/components/registration/pasien-baru/pasienBaruShared.tsx)
- **Cari Rujukan** — di tab Rujukan kunjungan, panggil `listRujukan()` dari [RujukanForm.tsx](src/components/registration/kunjungan/Tabs/RujukanForm.tsx)
- **Data Kecelakaan** — sync dengan SEP Jasa Raharja di [KecelakaanForm.tsx](src/components/registration/kunjungan/Tabs/KecelakaanForm.tsx)

### Consumer: `/ehis-eklaim`
- **Submit Klaim** — sudah pakai `vClaimAdapter.submitClaim()` di [SubmissionTab.tsx](src/components/eklaim/detail/tabs/SubmissionTab.tsx)
- **Eligibility Check** — sudah pakai `vClaimAdapter.getEligibility()` di [eligibilityChecker.ts](src/lib/eklaim/eligibilityChecker.ts)
- **Cek SEP detail** — `vClaimAdapter.checkSEP()` di EK3.1 banner
- **Cross-link dari `/ehis-bpjs` ke `/ehis-eklaim`** — saat SEP sudah ada klaim linked

### Consumer: `/ehis-care/rawat-inap`
- **Update Tanggal Pulang SEP** — saat workflow PasienPulangTab di-finalize, deep-call `updateTglPulang()` ke `/ehis-bpjs` adapter
- **Discharge Aplicares Bed** — saat status pulang, `updateKamar()` dengan status Tersedia

### Consumer: `/ehis-care/igd`
- **Insert SEP IGD emergency** — saat triase P1/P2 BPJS, `insertSEP()` dengan `jnsPelayanan: "1"` (rawat inap potensial) atau "2" (RJ singkat)

### Consumer: `/ehis-master`
- **Ruangan & Bed** — Aplicares bed sync read dari `LOCATION_MOCK + beds[]`. Update dari Aplicares push ke master Bed.
- **Penjamin × Ruangan** — `MAPPING_INITIAL` di [penjaminStore.ts](src/lib/master/penjaminStore.ts) cross-ref dengan map kelas BPJS.
- **BPJS Ruangan Catalog** — [bpjsRuanganCatalog.ts](src/lib/master/bpjsRuanganCatalog.ts) dipakai sebagai cache referensi poli BPJS.

### Cross-link: `/ehis-dashboard`
- Beranda Dashboard KPI strip ambil **Failed BPJS Calls 24h** dari `auditStore`
- Status Sistem strip Dashboard cek bridging V-Claim/Aplicares health
- Recent Activity Dashboard feed include BPJS audit entry severity warning/critical

---

## 🔗 Roadmap Berikutnya (After BP0–BP8)

### Phase 2 BPJS (post-MVP)
- [ ] APOL (Apotek Online) FKTL — implementasi adapter `apolAdapter.ts` (saat ini stub di eklaim)
- [ ] Cetak kartu peserta + print template
- [ ] PRB (Program Rujuk Balik) — workflow batch klaim obat kronis
- [ ] Antrol BPJS (Antrian Online via Mobile JKN)
- [ ] SISRUTE Kemenkes bridging
- [ ] Bidirectional sync — saat data berubah di V-Claim BPJS (di luar RS), polling refresh local cache

### Backend Integration (depends TODOS_BACKEND.md Phase B-BPJS)
- [ ] Real HMAC-SHA256 signature implementation
- [ ] Real LZ-String compression (NPM `lz-string`)
- [ ] Secret manager (env vars + Vault/AWS Secrets Manager)
- [ ] Audit log DB table + retention policy (UU PDP 27/2022: 5 tahun)
- [ ] Scheduled job referensi sync (BullMQ + Redis)
- [ ] WebSocket push untuk Aplicares bed realtime
- [ ] Rate limiting per cons-id (BPJS impose limit)
- [ ] Circuit breaker pattern untuk handle V-Claim outage
- [ ] Retry queue dengan exponential backoff untuk failed mutations
- [ ] Dashboard analytics adapter (success rate per endpoint, latency histogram, error trend)

### Compliance & Integrasi
- [ ] BPJS audit submission (laporan klaim bulanan)
- [ ] KARS verifikator integration (audit trail export format khusus)
- [ ] SatuSehat FHIR cross-ref (peserta BPJS punya IHS ID Kemenkes)
- [ ] BPJS Mobile JKN bridging (QR check-in)

### Operasional BPJS Layer
- [ ] Bulk operations — bulk insert SEP dari CSV, bulk update tgl pulang
- [ ] Reconciliation tools (lihat juga TODO-EKLAIM EK7 Reconciliation)
- [ ] Custom alert rule (mis. "jika failed calls >10/hari → email admin BPJS")
- [ ] Multi-RS Group view (untuk RS chain — out of scope Phase 1)

---

## 📚 Catatan Implementasi

- **Pattern reference utama:** [vClaimAdapter.ts](src/lib/eklaim/vClaimAdapter.ts) (existing partial) untuk Result pattern + envelope shape. [BerandaEklaimPage.tsx](src/components/eklaim/beranda/BerandaEklaimPage.tsx) V2 untuk layout interactive. [BerkasTab.tsx](src/components/eklaim/detail/tabs/BerkasTab.tsx) untuk auto-pull pattern.

- **Adapter migration safety:** Phase BP0.1 relocate `vClaimAdapter.ts` harus dilakukan dengan re-export backward-compat. Eklaim test wajib jalan setelah relocation. Cleanup re-export setelah seluruh eklaim refactor selesai (catat di TECH_DEBT.md).

- **Mock determinism:** `BPJSConfig.failRate` + `fixedLatencyMs` + `forceResult` (pattern sudah ada di [vClaimAdapter.ts](src/lib/eklaim/vClaimAdapter.ts:155)) wajib untuk test fixtures. Test scenario: peserta tidak ditemukan (201), SEP duplicate (202), eligibility expired (203), validation gagal (204), server error (500).

- **Audit-first development:** setiap kali tulis adapter method baru, **wajib** tulis audit log entry **sebelum** return Result. Phase BP0.2 buat helper `wrapWithAudit(method, fn)` HOF untuk auto-log.

- **Reference cache deterministic:** `referenceCache.ts` TTL 24h pakai timestamp ISO bukan `Date.now()` untuk testability. Test fixture override `now()` injection.

- **Cross-link konsisten:** semua deep-link pakai router.push (Next App Router). Breadcrumb di setiap page sub-tab BPJS tampil "/ehis-bpjs / V-Claim / SEP / Cari" dengan tombol Back ke parent.

- **PDP compliance:** request hash + response hash untuk audit log (bukan plaintext). NoKartu/NIK di-log tapi audit detail modal expose hanya 4 digit terakhir untuk operator non-admin.

- **Print template wajib KOP RS:** reuse `KopSuratEklaim.tsx` ([src/components/eklaim/berkas/KopSuratEklaim.tsx](src/components/eklaim/berkas/KopSuratEklaim.tsx)) untuk konsistensi cross-modul.
