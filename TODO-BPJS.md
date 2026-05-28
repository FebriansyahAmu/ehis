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
> **Last updated:** 2026-05-28
> **Status:** 📋 **Planning** — scope confirmed (V-Claim 5 sub-menu + Aplicares 3 sub-menu). Adapter `vClaimAdapter.ts` existing di [src/lib/eklaim/vClaimAdapter.ts](src/lib/eklaim/vClaimAdapter.ts) akan di-relocate + di-extend di Phase BP0.
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

### Authentication (semua endpoint pakai 4 header)
- `X-cons-id` — consumer ID per RS (BPJS assign)
- `X-timestamp` — Unix epoch second
- `X-signature` — `HMAC-SHA256(cons-id&timestamp, consumer-secret) → base64`
- `User-Key` — API key per RS
- Body: **LZ-String compressed JSON** di production

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

#### 4. Monitoring (Phase BP5)
| Endpoint | Method | Tujuan | Status |
|---|---|---|---|
| `/monitoring/Kunjungan/Tanggal/{tgl}/JnsPelayanan/{jns}` | GET | Data Kunjungan per tgl | ❌ BP5 |
| `/monitoring/Klaim/Tanggal/{tgl}/JnsPelayanan/{jns}/Status/{status}` | GET | Data Klaim per tgl + status | ❌ BP5 |
| `/monitoring/HistoriPelayanan/NoKartu/{noKartu}/tglMulai/{m}/tglAkhir/{a}` | GET | Histori Pelayanan Peserta | ❌ BP5 |
| `/monitoring/KlaimJaminanJasaRaharja/Tanggal/{tgl}/JnsPelayanan/{jns}` | GET | Klaim Jaminan Jasa Raharja | ❌ BP5 |

#### 5. Rencana Kontrol (Phase BP6)
| Endpoint | Method | Tujuan | Status |
|---|---|---|---|
| `/RencanaKontrol/insert` | POST | Insert Rencana Kontrol | ❌ BP6 |
| `/RencanaKontrol/InsertSPRI` | POST | Insert SPRI (Surat Pengantar Rawat Inap) | ❌ BP6 |
| `/RencanaKontrol/Update` | PUT | Update RK/SPRI | ❌ BP6 |
| `/RencanaKontrol/Delete` | DELETE | Hapus RK/SPRI | ❌ BP6 |
| `/RencanaKontrol/noSuratKontrol/{noSurat}` | GET | Cari nomor surat kontrol | ❌ BP6 |
| `/RencanaKontrol/ListRencanaKontrol/tglAwal/{m}/tglAkhir/{a}/filter/{filter}` | GET | List RK/SPRI filterable | ❌ BP6 |
| `/RencanaKontrol/ListSPRI/tglAwal/{m}/tglAkhir/{a}/filter/{filter}` | GET | List SPRI khusus | ❌ BP6 |
| `/RencanaKontrol/SpesialistikRS/JnsKontrol/{jns}/tglRencanaKontrol/{tgl}` | GET | Data Poli/Spesialistik untuk RK | ❌ BP6 |
| `/RencanaKontrol/JadwalPraktekDokter/JnsKontrol/{jns}/KdPoli/{poli}/TglRencanaKontrol/{tgl}` | GET | Data Dokter untuk RK | ❌ BP6 |

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
├── rencana-kontrol/               # BP6
│   ├── RencanaKontrolPage.tsx     # sub-tab: Cari SEP · Hapus · No Surat · Data RK/SPRI · Poli · Dokter
│   ├── CariSEPRKPanel.tsx
│   ├── HapusRKModal.tsx
│   ├── CariNoSuratPanel.tsx
│   ├── DataRKSPRIPanel.tsx        # filter tglAwal/tglAkhir + nomorKartu + jenis (Kontrol/SPRI)
│   ├── DataPoliPanel.tsx
│   └── DataDokterPanel.tsx
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

### BP0.1 Adapter relocation + auth foundation

- [ ] **Buat folder `src/lib/bpjs/`** + 4 file core: `bpjsShared.ts` · `credentialsStore.ts` · `authHeader.ts` · `lzStringHelper.ts`.
- [ ] **Relocate `vClaimAdapter.ts`** dari `src/lib/eklaim/` ke `src/lib/bpjs/` — pindah file, update import path di:
  - [eligibilityChecker.ts](src/lib/eklaim/eligibilityChecker.ts)
  - [groupingResolver.ts](src/lib/eklaim/groupingResolver.ts) (jika ada)
  - Semua `src/components/eklaim/` yang import
- [ ] **Backward-compat re-export** sementara di `src/lib/eklaim/vClaimAdapter.ts`:
  ```ts
  export * from "@/lib/bpjs/vClaimAdapter";
  ```
- [ ] **`credentialsStore.ts`** — mock credentials:
  ```ts
  export const BPJS_CREDS_MOCK = {
    consId: "12345",
    consSecret: "abcd1234efgh5678",  // mock, real di env
    userKey: "user-key-mock",
    baseUrl: "https://apijkn.bpjs-kesehatan.go.id/vclaim-rest",
  };
  ```
- [ ] **`authHeader.ts`** — `generateBpjsHeaders(creds)` return `{ "X-cons-id", "X-timestamp", "X-signature", "User-Key" }`:
  ```ts
  const ts = Math.floor(Date.now() / 1000).toString();
  const signature = hmacSha256Base64(`${consId}&${ts}`, consSecret);
  ```
  Mock skip real HMAC — Phase backend pakai `crypto.subtle` atau Node `crypto`.
- [ ] **`lzStringHelper.ts`** — `compressLZ(body) → string` + `decompressLZ(body) → object`. Mock no-op (return as-is), production Phase pasang NPM `lz-string`.

### BP0.2 Types di [src/lib/bpjs/bpjsShared.ts](src/lib/bpjs/bpjsShared.ts)

- [ ] **`PesertaRecord`** — peserta BPJS detail (replace flat envelope):
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

- [ ] **`SEPRecordExt`** — extend `SEPRecord` di eklaim dengan field lengkap V-Claim 2.0:
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

- [ ] **`RujukanRecord`** — rujukan FKTP atau FKRTL:
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

- [ ] **`RencanaKontrolRecord`** + **`SPRIRecord`** (extend dari RK):
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

- [ ] **`KunjunganBPJSRecord`** — untuk monitoring kunjungan:
  ```ts
  {
    noSEP, noKartu, namaPeserta,
    tglSEP, jnsPelayanan, kelasRawat,
    poli, diagnosaAwal, dpjpLayan,
    biayaTagih?: Rupiah, biayaSetuju?: Rupiah,
    statusKlaim?: ClaimStatus,
  }
  ```

- [ ] **`HistoriPelayananRecord`** — untuk monitoring histori per peserta:
  ```ts
  {
    noSEP, tglSEP, jnsPelayanan, poli, diagnosa, dpjp,
    biayaTagih: Rupiah, biayaSetuju: Rupiah, statusVerifikasi: string,
  }
  ```

- [ ] **`AplicaresKamarRecord`** — bed Aplicares:
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

- [ ] **`MapKelasRecord`** — mapping BPJS kelas ↔ local kelas:
  ```ts
  {
    kdKelasBPJS: "1" | "2" | "3" | "VIP",
    namaKelasBPJS: string,
    kdKelasLokal: KelasRawat,  // reuse dari eklaimShared
    namaKelasLokal: string,
    multiplier?: number,  // untuk tarif adjustment
  }
  ```

- [ ] **`BPJSError`** — extends `ClaimError` reuse + tambah BPJS-specific:
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

- [ ] **`BPJSAuditEntry`** — log per call:
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

- [ ] **`IdempotencyKey`** — `generateIdempotencyKey(payload) → string` deterministic hash. Disimpan di mutation request body untuk hindari duplicate submit.

- [ ] **`TONE_PALETTE_BPJS`** — static palette purge-safe:
  ```ts
  {
    kepesertaan: "sky", sep: "emerald", rujukan: "teal",
    monitoring: "amber", "rencana-kontrol": "violet", aplicares: "pink",
    audit: "slate",
  }
  ```

### BP0.3 Mock seed

- [ ] **`pesertaMock.ts`** — 12 peserta lintas tipe:
  - 4 PBI APBN (kelas 3)
  - 3 Non-PBI Mandiri kelas 1
  - 2 Non-PBI Mandiri kelas 2
  - 1 Non-PBI Pekerja kelas 1
  - 1 expired (status Non-Aktif untuk test error)
  - 1 tunggakan iuran (status Aktif tapi tunggakan)

- [ ] **`sepMock.ts`** — 20 SEP lintas status (Active/Suplesi/Closed/Deleted) — cross-link ke 25 ClaimRecord di [CLAIM_BOARD_MOCK](src/lib/eklaim/claimsMock.ts).

- [ ] **`rujukanMock.ts`** — 15 rujukan (10 FKTP + 5 FKRTL · lintas diagnosa).

- [ ] **`rencanaKontrolMock.ts`** — 10 RK + 5 SPRI lintas status.

- [ ] **`monitoringMock.ts`** — pre-aggregated kunjungan/klaim/histori/jasaraharja per tanggal.

- [ ] **`aplicaresKamarMock.ts`** — sync dari `LOCATION_MOCK + beds[]` di master Ruangan → mock Aplicares response.

### BP0.4 Adapter extension

- [ ] **Extend `vClaimAdapter.ts`** — tambah methods (lihat coverage map atas):
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
  - Semua return `Promise<Result<VClaimEnvelope<T>, BPJSError>>` consistent.

- [ ] **`aplicaresAdapter.ts` BARU** — methods:
  - `getReferensiKamar(config)` + `getMapKelas(config)`
  - `listKamar(config)` + `insertKamar(payload, config)` + `updateKamar(payload, config)` + `deleteKamar(payload, config)`
  - `setMaintenance(payload, config)`
  - Semua return `Promise<Result<T, BPJSError>>`.

- [ ] **`referenceCache.ts`** — local store dengan TTL 24h:
  ```ts
  getDiagnosa(query) → cached if fresh, else fetch
  getPoli(kode?) → cached
  getDokter(jns, sp) → cached
  getFaskes(nama, jenis) → cached
  refreshAll() → manual trigger dari Beranda
  ```

**Acceptance BP0:** ✅ Folder `src/lib/bpjs/` ada lengkap (10 file) · types compile clean (`npx tsc --noEmit`) · mock 12 peserta + 20 SEP + 15 rujukan + 10 RK + 5 SPRI + bed Aplicares ready · adapter relocation tidak break eklaim existing · referenceCache TTL helper jalan · authHeader generate header shape benar (mock signature).

---

## Phase BP1 — Beranda BPJS

**Route:** `/ehis-bpjs` · **Effort:** 2 hari
**Pattern reference:** Beranda Eklaim V2 (single-viewport interactive) + Beranda Billing KPI

### BP1.1 Layout

- [ ] **Hero header** emerald-accent (icon `ShieldCheck` + eyebrow "EHIS BPJS · Integration Hub" + h1 "Pusat Bridging BPJS Kesehatan" + description + timestamp pill + "Sync Referensi" CTA).
- [ ] **Status Sistem Strip** di bawah hero — 3 dot status: V-Claim · Aplicares · LZ-String. Per dot: `Online/Degraded/Offline` + lastSync ago. Hover → tooltip detail.
- [ ] **KPI Strip 5 Card** dengan tone:
  - **SEP Hari Ini** (emerald · count + Insert/Update/Delete breakdown)
  - **Rujukan Hari Ini** (teal · count FKTP + FKRTL)
  - **Rencana Kontrol Hari Ini** (violet · count RK + SPRI)
  - **Bed Sync Aplicares** (pink · last sync ago + count kamar sync)
  - **Failed Calls 24h** (rose · count + top endpoint error)

### BP1.2 Body Layout

- [ ] **Quick Nav Grid 8 Card** (V-Claim 5 + Aplicares 3):
  - Kepesertaan (sky · `UserCheck`)
  - SEP (emerald · `FileText`)
  - Rujukan (teal · `Share2`)
  - Monitoring (amber · `Activity`)
  - Rencana Kontrol (violet · `CalendarCheck`)
  - Referensi Kamar (pink · `BedDouble`)
  - Map Kelas (pink-light · `LayoutGrid`)
  - Ketersediaan Kamar (pink-darker · `Bed`)

- [ ] **Recent Calls Panel** sidebar — 12 audit entry terakhir (sort agoSec asc):
  - Per row: endpoint badge + method chip + response code (200 emerald / 201 amber / 500 rose) + actor + agoSec
  - Klik → audit detail di BP8

- [ ] **Reference Status Panel** sidebar — status cache 6 referensi:
  - Diagnosa (count + lastSync) · Poli · Dokter · Faskes · Spesialistik · Pasca Pulang
  - Per row: green dot jika <24h, amber jika 24-72h, rose >72h
  - "Refresh" button per row + "Refresh All" footer

### BP1.3 Components

- [ ] `BerandaBPJSPage.tsx` (~150L) — orchestrator skeleton + AnimatePresence + 2-panel layout
- [ ] `BPJSKPIStrip.tsx` (~110L) — 5 card stagger animation
- [ ] `RecentCallsPanel.tsx` (~120L) — feed dengan filter status code chip
- [ ] `ReferenceStatusPanel.tsx` (~130L) — 6 cache status + refresh trigger
- [ ] `QuickNavGridBPJS.tsx` (~110L) — 8 modul card

**Acceptance BP1:** ✅ Layout fit dalam viewport · skeleton 500ms · KPI animated · klik card navigate ke V-Claim/Aplicares page · status sistem 3-dot · reference panel refresh trigger (mock) · audit feed real dari `auditStore` · TSC clean.

---

## Phase BP2 — V-Claim Tab Kepesertaan

**Route:** `/ehis-bpjs/vclaim/kepesertaan` · **Effort:** 1 hari · **Accent: sky**

### BP2.1 Cek Status Kepesertaan

- [ ] **Form 2-mode toggle:** No Kartu (13-digit) atau NIK (16-digit) — segmented control sky-accent
- [ ] **Validation real-time:**
  - No Kartu: 13 digit numerik (auto-truncate/error inline)
  - NIK: 16 digit numerik (cek format dasar — 2 digit propinsi + 2 kab + 2 kec + 6 lahir + 4 unik)
- [ ] **Tanggal SEP picker** — date input (default hari ini, max +30 hari, min -7 hari)
- [ ] **Submit** → call `getPesertaByKartu()` atau `getPesertaByNik()` → `Result<PesertaRecord, BPJSError>`
- [ ] **Loading state** — Loader2 spin + "Memanggil V-Claim BPJS..." mono
- [ ] **PesertaDetailCard** — 6-section grid:
  - Identitas (nama + tglLahir + gender + nokartu mono + NIK)
  - Hak Kelas (chip emerald · "Kelas {N}")
  - Jenis Peserta (chip per tipe: PBI APBN amber · Mandiri sky · Pekerja teal)
  - Status Peserta (Aktif emerald / Non-Aktif rose) + tanggal aktif
  - MR (No MR mono · No Telepon)
  - Asuransi + Sisa Hari Rawat (jika ada) · Tunggakan (rose jika ada)
- [ ] **Quick actions** card footer: "Buat SEP" (deep-link ke `/ehis-registration/pasien/baru?peserta={noKartu}`) · "Cari Rujukan" (jump BP4 dengan filter no kartu)
- [ ] **Error state** — `BPJSError` per type:
  - 201 → "Data peserta tidak ditemukan" (slate empty)
  - 203 → "Eligibility expired" (amber warning)
  - NetworkError → "Sambungan ke V-Claim gagal · retry" (rose + retry button)

### BP2.2 Components

- [ ] `KepesertaanPage.tsx` (~80L) — page shell
- [ ] `CekPesertaForm.tsx` (~180L) — toggle + form + validation
- [ ] `PesertaDetailCard.tsx` (~220L) — display detail

**Acceptance BP2:** ✅ Form mode toggle Kartu/NIK · validation real-time · submit call adapter → display PesertaDetailCard · deep-link "Buat SEP" navigate ke registration · error state per BPJSError type · TSC clean.

---

## Phase BP3 — V-Claim Tab SEP

**Route:** `/ehis-bpjs/vclaim/sep` · **Effort:** 5 hari · **Accent: emerald**

Komponen kompleks — 9 sub-fungsi. Sub-tab internal SEP page:

### BP3.1 Cari SEP

- [ ] **Form Cari** — input No SEP mono → `getSEP(noSEP)` → display detail SEP full (semua field SEPRecordExt)
- [ ] **SEP Detail Card** — 8-section: Identitas Peserta · SEP Header (noSEP + tglTerbit + jnsPelayanan) · Faskes/Poli/DPJP · Diagnosa Awal · Rujukan (jika ada) · Kelas Rawat · Catatan · Audit (created/updated)
- [ ] **Quick actions:** Edit SEP · Hapus SEP · Update Tgl Pulang · Cetak SEP (`@media print` A4)
- [ ] **Cross-link "Lihat di E-Klaim"** jika sudah ada `ClaimRecord` linked (`claim.penjamin.sep.noSEP === noSEP`)

### BP3.2 Hapus SEP

- [ ] **`HapusSEPModal`** — input noSEP + alasan textarea (min 20 char audit trail)
- [ ] **Warning banner rose** — explain irreversible + check klaim status
- [ ] **Guard:** jika SEP sudah di-link ke ClaimRecord dengan status >= "Submitted" → block hapus dengan pesan "Klaim sudah disubmit ke BPJS, hapus SEP tidak diizinkan"
- [ ] **Confirm** → call `deleteSEP(noSEP)` → audit log "delete-sep"

### BP3.3 Update Tanggal Pulang

- [ ] **Form** — noSEP + date picker tglPulang (max hari ini, min tglTerbit SEP)
- [ ] **Validation:** tglPulang >= tglTerbit + 1 hari
- [ ] **Submit** → `updateTglPulang(noSEP, tglPulang)` → success toast emerald
- [ ] **List Update Tanggal Pulang panel** — filter tglMulai/tglAkhir → `listUpdateTglPulang()` → table 6-col (noSEP · nama peserta · tglTerbit · tglPulang lama · tglPulang baru · updatedBy + updatedAt)

### BP3.4 Integrasi SEP dengan iDRG / INA-CBG

- [ ] **`SEPIntegrasiInaCBGCard`** — input noSEP → fetch SEP + cek apakah sudah ada ClaimRecord di `CLAIM_BOARD_MOCK`
- [ ] Jika **belum**: tombol "Buat Klaim Baru di E-Klaim" → deep-link `/ehis-eklaim/klaim/baru?noSEP={noSEP}` (pre-fill data peserta + diagnosa awal)
- [ ] Jika **sudah**: tampil `ClaimSummaryCard` (status klaim · era grouper · iDRG/CBG code · tarif aktual · selisih) + tombol "Buka di E-Klaim" deep-link

### BP3.5 Suplesi Jasa Raharja & Data Induk Kecelakaan

- [ ] **`SuplesiJasaRaharjaForm`** — input noKartu + tglPelayanan + tipeKecelakaan (Lalu Lintas/Kerja/Lainnya) + penjamin (1=Jasa Raharja Bedah, 2=JR ditolak, 3=BPJS) + tglKejadian + lokasi
- [ ] Submit → `suplesiCek()` + `sepJasaRaharja()` → display result envelope
- [ ] **`DataIndukKecelakaanForm`** — schema mirip "Data Kecelakaan" di [ActionForms.tsx](src/components/registration/kunjungan/Tabs/ActionForms.tsx) (cross-link reuse)
- [ ] Cross-link ke modul registrasi (`KKPanel`/`KLLPanel` di `kecelakaan/`) jika applicable

### BP3.6 SEP Internal

- [ ] **`SEPInternalForm`** — untuk transfer antar SMF di RS (mis. dari Penyakit Dalam ke Bedah). Field: noSEPInduk + poliTujuan + dpjpTujuan + diagnosaTransfer + alasan
- [ ] Submit → `sepInternalInsert()` atau `sepInternalUpdate()`
- [ ] **`SEPInternalList`** — list SEP internal aktif (filter periode + noKartu)

### BP3.7 Fingerprint

- [ ] **`FingerprintPanel`** — input noKartu + tglPelayanan → `getFingerPrint()` → display fingerprint status (Verified emerald / Not Captured rose / Captured Today amber)
- [ ] **`FingerprintListPanel`** — filter tglMulai/tglAkhir → `listFingerPrint()` → table histori capture (per peserta · tanggal · faskes · status)
- [ ] Tampilkan compliance reminder: "Sidik jari wajib untuk peserta JKN klaim 4x/bulan (Permenkes 26/2021)"

### BP3.8 Components

- [ ] `SEPPage.tsx` (~140L) — tab internal nav 7 sub
- [ ] `CariSEPForm.tsx` (~150L) + `SEPDetailCard.tsx` (~250L)
- [ ] `HapusSEPModal.tsx` (~140L)
- [ ] `UpdateTglPulangForm.tsx` (~130L) + `UpdateTglPulangList.tsx` (~180L)
- [ ] `SEPIntegrasiInaCBGCard.tsx` (~200L) — cross-link ke eklaim
- [ ] `SuplesiJasaRaharjaForm.tsx` (~220L) + `DataIndukKecelakaanForm.tsx` (~190L)
- [ ] `SEPInternalForm.tsx` (~190L) + `SEPInternalList.tsx` (~170L)
- [ ] `FingerprintPanel.tsx` (~150L) + `FingerprintListPanel.tsx` (~180L)

**Acceptance BP3:** ✅ 7 sub-tab functional · CRUD SEP via adapter · cross-link eklaim deep-link benar · suplesi Jasa Raharja form lengkap · fingerprint compliance reminder · all forms validation · TSC clean.

---

## Phase BP4 — V-Claim Tab Rujukan

**Route:** `/ehis-bpjs/vclaim/rujukan` · **Effort:** 2 hari · **Accent: teal**

### BP4.1 Pencarian Rujukan

- [ ] **Form 2-mode toggle:** "Cari by No Rujukan" atau "Cari by No Kartu + Jenis Faskes"
- [ ] **Mode 1:** input No Rujukan mono → call `getRujukan(noRujukan, jenisFaskes)` 
- [ ] **Mode 2:** input No Kartu + segmented FKTP/FKRTL → call `listRujukan(noKartu, jenisFaskes)`
- [ ] **RujukanResultCard** — display detail rujukan (peserta + faskes asal + tujuan + poli + diagnosa + tgl rujukan + masa berlaku + status Aktif/Expired)
- [ ] **Quick actions:** "Buat SEP dari Rujukan" → deep-link `/ehis-registration/pasien/baru?rujukan={noRujukan}`

### BP4.2 List Rujukan Khusus

- [ ] **`ListRujukanKhususPanel`** — input kdDiag (ICD-10 picker reuse `ICD10_IM_MOCK`) + tglPelayanan → `listRujukanKhusus()` → display list rujukan khusus (kasus kronik, kanker, dialisis, jantung)

### BP4.3 List Spesialistik

- [ ] **`ListSpesialistikPanel`** — call `listSpesialistik()` (cached 24h via referenceCache) → table 3-col (kode · nama spesialistik · jumlah faskes tersedia)
- [ ] Reuse `BPJS_RUANGAN_CATALOG` saat backend belum ready

### BP4.4 List Sarana

- [ ] **`ListSaranaPanel`** — search faskes by nama + segmented FKTP/FKRTL → `listSarana()` → table (kode · nama · alamat · jenis · status)
- [ ] Reuse `PPK_INITIAL` saat backend belum ready

### BP4.5 Components

- [ ] `RujukanPage.tsx` (~120L) — internal tab nav
- [ ] `CariRujukanForm.tsx` (~170L) + `RujukanResultCard.tsx` (~220L)
- [ ] `ListRujukanKhususPanel.tsx` (~180L)
- [ ] `ListSpesialistikPanel.tsx` (~140L) + `ListSaranaPanel.tsx` (~170L)

**Acceptance BP4:** ✅ Form 2-mode cari rujukan · result card · 3 list panel functional · deep-link buat SEP dari rujukan · cached reference 24h · TSC clean.

---

## Phase BP5 — V-Claim Tab Monitoring

**Route:** `/ehis-bpjs/vclaim/monitoring` · **Effort:** 2 hari · **Accent: amber**

### BP5.1 Data Kunjungan

- [ ] **`KunjunganPanel`** — filter periode (tgl + jnsPelayanan RI/RJ) → `monitoringKunjungan()` → table 6-col (noSEP · noKartu · nama peserta · poli · dpjp · biaya tagih)
- [ ] **Summary header:** total count + total Rp tagih · breakdown per poli (top 5)
- [ ] **Export CSV** RFC 4180 + BOM UTF-8 (pattern reuse dari `klaimBoardLogic.exportKlaimCsv`)

### BP5.2 Data Klaim

- [ ] **`KlaimPanel`** — filter tgl + jnsPelayanan + status (Pending/Disetujui/Ditolak) → `monitoringKlaim()` → table 7-col
- [ ] Cross-link kolom noSEP → buka klaim di `/ehis-eklaim/klaim/{id}` jika linked

### BP5.3 Histori Pelayanan Peserta

- [ ] **`HistoriPelayananPanel`** — input noKartu + periode (tglMulai-tglAkhir, max 90 hari) → `monitoringHistoriPelayanan()` → timeline visit per visit
- [ ] Per timeline entry: tglSEP · poli · diagnosa · DPJP · biaya tagih/setuju · status verif chip

### BP5.4 Klaim Jasa Raharja

- [ ] **`JasaRaharjaPanel`** — filter tgl + jnsPelayanan → `monitoringJasaRaharja()` → table klaim laka lantas/kerja yang ditanggung JR

### BP5.5 Components

- [ ] `MonitoringPage.tsx` (~140L) — 4 sub-tab nav
- [ ] `KunjunganPanel.tsx` (~220L) + `KlaimPanel.tsx` (~230L)
- [ ] `HistoriPelayananPanel.tsx` (~250L) — timeline pattern reuse dari AuditTab eklaim
- [ ] `JasaRaharjaPanel.tsx` (~190L)

**Acceptance BP5:** ✅ 4 sub-tab monitoring · filter periode + status · cross-link ke eklaim · export CSV · histori timeline · TSC clean.

---

## Phase BP6 — V-Claim Tab Rencana Kontrol

**Route:** `/ehis-bpjs/vclaim/rencana-kontrol` · **Effort:** 3 hari · **Accent: violet**

### BP6.1 Cari SEP untuk RK

- [ ] **`CariSEPRKPanel`** — input noSEP → display SEP detail (reuse SEPDetailCard) + cek apakah sudah ada RK linked
- [ ] Jika belum: tombol "Buat Rencana Kontrol" → modal form Insert RK (poli tujuan · dokter · tglRencana · tipe Kontrol/SPRI · keterangan)
- [ ] Submit → `insertRK()` atau `insertSPRI()`

### BP6.2 Hapus RK/SPRI

- [ ] **`HapusRKModal`** — input noSurat + alasan → guard cek `status: "Used"` block hapus → `deleteRK()`

### BP6.3 Cari Nomor Surat Kontrol

- [ ] **`CariNoSuratPanel`** — input noSurat → `getNoSuratKontrol()` → display RK/SPRI detail

### BP6.4 Data Nomor Surat Kontrol (List Filter)

- [ ] **`DataRKSPRIPanel`** — filter `tglAwal/tglAkhir` + optional `noKartu` + segmented `jenis: Kontrol|SPRI|Semua` → `listRKFiltered()` → table 8-col
- [ ] Per row aksi: "Edit" (modal update) · "Hapus" · "Cetak Surat" (`@media print` A4 dengan KOP RS)

### BP6.5 Data Poli/Spesialistik untuk RK

- [ ] **`DataPoliPanel`** — input jnsKontrol + tglRencana → `getPoliRK()` → list poli aktif dengan jadwal hari tsb · reuse `BPJS_RUANGAN_CATALOG`

### BP6.6 Data Dokter untuk RK

- [ ] **`DataDokterPanel`** — input jnsKontrol + kdPoli + tglRencana → `getDokterRK()` → list dokter dengan kapasitas slot tersedia · reuse `DOKTER_MOCK`

### BP6.7 Components

- [ ] `RencanaKontrolPage.tsx` (~160L) — 6 sub-tab nav
- [ ] `CariSEPRKPanel.tsx` (~190L) + `InsertRKModal.tsx` (~230L)
- [ ] `HapusRKModal.tsx` (~150L) + `CariNoSuratPanel.tsx` (~140L)
- [ ] `DataRKSPRIPanel.tsx` (~280L) — filter + table + actions
- [ ] `DataPoliPanel.tsx` (~170L) + `DataDokterPanel.tsx` (~190L)
- [ ] Print template `RKSPRISuratTemplate.tsx` (~200L) — A4 KOP RS

**Acceptance BP6:** ✅ 6 sub-tab functional · CRUD RK/SPRI via adapter · filter list + aksi per row · print surat A4 KOP RS · jadwal dokter cross-ref ke master dokter · TSC clean.

---

## Phase BP7 — Aplicares (Bed Monitoring Sync)

**Route prefix:** `/ehis-bpjs/aplicares/*` · **Effort:** 2 hari · **Accent: pink**

### BP7.1 Referensi Kamar

- [ ] **`ReferensiKamarPage`** — call `getReferensiKamar()` → table master kamar BPJS (kdKelas + namaKelas + kapasitas standar)
- [ ] Cache 24h via referenceCache · tombol "Sync Now"

### BP7.2 Map Kelas

- [ ] **`MapKelasPage`** — table mapping `MapKelasRecord[]`:
  - Kolom: Kelas BPJS (kode + nama) · Kelas Lokal (`KelasRawat` enum dropdown) · Multiplier · Audit
  - CRUD row: tambah/edit/hapus mapping
- [ ] **`KamarMappingForm`** — modal edit mapping
- [ ] Validasi: 1 kelas BPJS hanya boleh 1 mapping aktif · multiplier > 0
- [ ] Single-source: reuse `STATUS_ENUM_GROUPS["kelas-perawatan"]` di [statusEnumMock.ts](src/lib/master/statusEnumMock.ts)

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
| BP0 — Foundation | 4 sections (Auth + Types + Mock + Adapter) | 0 | 0% |
| BP1 — Beranda BPJS | 3 sections | 0 | 0% |
| BP2 — Kepesertaan | 2 sections | 0 | 0% |
| BP3 — SEP | 8 sections | 0 | 0% |
| BP4 — Rujukan | 5 sections | 0 | 0% |
| BP5 — Monitoring | 5 sections | 0 | 0% |
| BP6 — Rencana Kontrol | 7 sections | 0 | 0% |
| BP7 — Aplicares | 4 sections | 0 | 0% |
| BP8 — Polish + Audit | 5 sections | 0 | 0% |
| **Total** | **43 sections** | **0** | **0%** |

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
