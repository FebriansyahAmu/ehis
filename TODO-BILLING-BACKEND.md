# TODO — Billing Backend (Invoice DB + Charge Ingestion Server-Side)

> **Status: 📋 Planned (2026-07-13).** Roadmap fase **BB0–BB9**.
> FE Billing (board/detail/kasir) sudah operasional tapi **seluruh data charge hidup di client
> (`billingStore` + `chargeIngest`)** — hilang saat refresh, tidak multi-user, tidak auditable.
> Dokumen ini = kontrak data `billing.*` + **peta wiring charge dari SEMUA sumber klinis**
> (Tindakan · Lab · Rad · Resep · BMHP · Akomodasi · Administrasi · Jasa Dokter).
>
> Referensi: [TODO-BILLING.md](TODO-BILLING.md) (roadmap FE BL0–BL9 — BB ini merealisasikan sisa
> BL0/BL6 secara server-side) · [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md) (layering/error/DoD —
> menang bila konflik) · [docs/API-RULES.md](docs/API-RULES.md) (pola endpoint) ·
> [docs/BACKEND-MAPPING.md §5](docs/BACKEND-MAPPING.md) (Tarif Matrix) ·
> [TODO-INVENTORY-BACKEND.md](TODO-INVENTORY-BACKEND.md) (pola ledger→proyeksi yang kita tiru).

---

## 0 · Masalah Hari Ini (kenapa backend ini wajib)

| # | Masalah | Bukti di kode |
|---|---|---|
| 1 | Charge di-ingest **di browser** saat aksi klinis | [chargeIngest.ts](src/lib/billing/chargeIngest.ts) dipanggil dari `lab/tabs/ValidasiPane` · `rad/tabs/EkspertasiPane` · `farmasi/FarmasiOrderTabs` · `rawat-inap/PasienPulangTab` · `InvoiceDetailPage` (akomodasi on-mount) |
| 2 | Store client-side → **hilang saat refresh, tak multi-user** | [billingStore.ts](src/lib/billing/billingStore.ts) (`useSyncExternalStore`, dedupe `sourceRef` in-memory) |
| 3 | Kasir & klinisi melihat **dunia berbeda** — ingest hanya terjadi di browser yang kebetulan membuka pane | tak ada tabel `billing.*` di Prisma |
| 4 | Harga di-resolve ulang di klien ([priceResolver.ts](src/lib/billing/priceResolver.ts)) → bisa **drift** dari snapshot order | padahal snapshot beku sudah ada di baris order DB (lihat §3) |
| 5 | `kunjungan.invoiceId` sudah disiapkan di schema tapi **belum pernah diisi** | [encounter.prisma:206](prisma/schema/encounter.prisma#L206) `invoiceId String? @unique // FK→billing.Invoice saat siap` |
| 6 | Akomodasi TITIPAN salah basis — billing belum baca `kelasHak` | follow-up tercatat di CLAUDE.md baris Rawat Inap |

**Modal besar yang SUDAH kita punya** (kerja hulu selesai — BB tinggal menyambung):
semua order klinis **membekukan harga saat dicatat** (§3 kolom "Snapshot"), Tarif Matrix 3-tabel
per (item × penjaminKode × jenisRuangan) + komponen PMK 85, dan FE billing yang kontraknya
(`ChargeItem`/`sourceRef`/kategori) tinggal dipindah ke server 1:1.

---

## 1 · Prinsip Inti (B1–B10) — baca sebelum menulis kode billing

- **B1 — Charge lahir SERVER-SIDE, dalam transaksi yang SAMA dengan aksi klinis sumbernya.**
  Validasi lab menulis `LabResult` + baris `InvoiceItem` dalam 1 tx. Tidak ada lagi
  `ingest*()` dari browser. (Tak ada panggilan eksternal di jalur ini → aman 1 tx, beda dengan
  aturan outbox BPJS.)
- **B2 — Harga = SNAPSHOT BEKU di baris sumber, bukan re-resolve saat ingest.**
  `InvoiceItem.hargaSatuan` disalin dari `LabOrderItem.harga` / `ResepItem.harga` / dst.
  Satu-satunya resolve-saat-ingest: sumber tanpa snapshot (Akomodasi, Administrasi).
  Estimasi yang dilihat klinisi saat order = angka yang ditagih. Anti-drift.
- **B3 — Idempoten by `sourceRef`.** `@@unique([invoiceId, sourceRef])` di DB — replay/refetch/
  race dobel-klik tak bisa menggandakan charge. Format ref per sumber di §3.
- **B4 — VOID, bukan DELETE.** Pembatalan order/tindakan → `InvoiceItem.status=Void` +
  `voidReason` (jejak audit ala rekam medis). Total invoice = agregat item non-Void.
- **B5 — Invoice 1:1 kunjungan, lazy-create.** Dibuat saat charge PERTAMA datang (atau saat
  registrasi — lihat keputusan BB1); id ditulis balik ke `kunjungan.invoiceId`. Nomor
  `INV-<YYMM><NNNN>` via counter atomik (pola `InvCounter`).
- **B6 — Total = proyeksi transaksional.** Kolom `totalBruto/totalDiskon/totalNetto/totalBayar/sisa`
  di Invoice di-update dalam tx yang sama dengan mutasi item/payment (pola `StockBalance`
  Inventory: baris item = kebenaran, kolom total = proyeksi cepat untuk board).
- **B7 — Tier tarif RI mengikuti `kelasHak` saat TITIPAN.** `jenisRuangan` charge RI =
  `RAWAT_INAP:{kelasHak ?? kelas}` — pasien titipan ditagih sesuai HAK kelasnya, bukan kamar
  fisik ([encounter.prisma:108](prisma/schema/encounter.prisma#L108)).
- **B8 — FE = read + aksi kasir saja.** `billingStore`/`chargeIngest`/`priceResolver` klien
  di-retire bertahap (BB8); board/detail fetch `/api/v1/billing/*`. Kontrak `ChargeItem` FE
  dipertahankan → swap tanpa refactor UI (pola mock-first repo).
- **B9 — RBAC baru `billing.*`** (`billing.invoice` r/u · `billing.payment` c/r · `billing.kasir`)
  + role **Kasir**. Klinisi TIDAK butuh grant billing — ingest terjadi via Service dalam tx aksi
  klinis yang sudah ter-authz gate-nya sendiri (`ancillary.lab.validate` dst.), bukan via route billing.
- **B10 — Layered Route→Service→DAL, error taxonomy, optimistic version di Invoice** — mengikuti
  [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md) tanpa kecuali. Primitif tunggal
  `billingIngestService.postCharges(kunjunganId, items[], tx)` — SEMUA sumber lewat sini
  (pola `movementService.postMovement` Inventory).

---

## 2 · Data Contracts (Prisma — schema Postgres baru `billing`)

Migrasi additive (schema baru + FK `kunjungan.invoiceId` di-constraint-kan). Ikuti
anti-drift `[[project_migration_drift_pattern]]` (`db execute` + `migrate resolve --applied`).

### 2.1 `billing.Invoice`

```
id            uuid v7 PK
kunjunganId   uuid @unique          — 1:1 kunjungan (tulis balik ke kunjungan.invoiceId)
noInvoice     "INV-<YYMM><NNNN>"    — counter atomik billing.InvoiceCounter
patientId     uuid                  — denorm utk board (join Pasien: noRM/nama)
unit          CareUnit              — IGD/RawatInap/RawatJalan (denorm)
penjaminTipe  string                — snapshot saat create (BPJS_Non_PBI/Umum/…)
penjaminKode  string                — kode tarif ('UMUM'/'BPJS'/…) — dipakai resolve non-snapshot
kelasTarif    string?               — tier RI efektif ('RAWAT_INAP:KELAS_1' dst; null utk RJ/IGD)
status        Draft | Final | Lunas | Batal
  · Draft  = kunjungan berjalan, charge mengalir
  · Final  = kunjungan complete → di-freeze utk kasir (administrasi masuk di sini)
  · Lunas  = sisa == 0 (di-derive, di-stamp saat payment menutup sisa)
  · Batal  = kunjungan cancel → semua item Void
totalBruto/totalDiskon/totalNetto/totalBayar/sisa  Int  — proyeksi (B6)
finalizedAt/paidAt  timestamptz?
version       Int                   — optimistic concurrency (aksi kasir)
createdAt/updatedAt/deletedAt
```

### 2.2 `billing.InvoiceItem`

```
id           uuid v7 PK
invoiceId    FK → Invoice (Cascade read-model; item tak hidup tanpa invoice)
sourceRef    string                 — kunci idempoten (§3); @@unique([invoiceId, sourceRef])
sourceModul  Tindakan|Lab|Rad|Farmasi|BMHP|Akomodasi|Administrasi|JasaDokter|Manual
kategori     string                 — kategori tampilan FE (selaras KategoriCharge FE)
nama         string                 — label baris ("Lab — Hemoglobin")
tanggal      timestamptz            — waktu layanan (bukan waktu ingest)
qty          Int · satuan string · hargaSatuan Int · subtotal Int (= qty × hargaSatuan)
diskon       Int @default(0)        — per-baris (BL5 adjustment nanti)
coverage     Penjamin | Pasien      — default: Umum→Pasien, selainnya→Penjamin (pola FE)
komponen     Json?                  — {jasaSarana,jasaMedis,jasaParamedis} bila tarif dirinci (remunerasi)
status       Aktif | Void
voidReason   string? · voidedAt timestamptz? · voidedBy uuid?
createdAt
```

### 2.3 `billing.Payment` *(BB7)*

```
id · invoiceId FK · noKwitansi "KWT-<YYMM><NNNN>" (counter)
metode  Tunai|Debit|Kredit|Transfer|QRIS · jumlah Int
kasirUserId uuid (server-otoritatif dari sesi — anti-spoof) · shiftId? (BB9)
catatan? · status Aktif|Batal (void kwitansi = jejak, bukan delete)
createdAt
```

### 2.4 `billing.InvoiceCounter` / `KwitansiCounter`

Scope `<YYMM>` reset bulanan, `UPDATE … RETURNING` atomik (pola `KunjunganCounter`/`InvCounter`).

---

## 3 · WIRING MATRIX — charge per sumber klinis (inti dokumen ini)

> Kolom **Hook server** = titik Service yang SUDAH ADA tempat `postCharges` disisipkan
> (dalam tx yang sama). Kolom **Snapshot** = dari mana `hargaSatuan` disalin (B2).

| # | Sumber | Tabel sumber (ada ✅) | Hook server (momen charge) | Snapshot harga | `sourceRef` | Reversal (Void) |
|---|---|---|---|---|---|---|
| 1 | **Tindakan** | `medicalrecord.TindakanMedis` ✅ (harga+penjaminKode+jenisRuangan sudah beku) | `tindakanService.create` — charge saat DICATAT | `TindakanMedis.harga` | `tindakan:{itemId}` | update jumlah → re-post subtotal (void+insert); soft-delete → Void |
| 2 | **Lab** | `medicalrecord.LabOrder`+`LabOrderItem` ✅ (`harga` per item dari Tarif Matrix) | `labResultService.validate` (POST `/lab/orders/:id/validasi`, Divalidasi→**Selesai**) — charge saat hasil TERVALIDASI | `LabOrderItem.harga` | `lab:{orderId}:{labTestId}` | order cancel pra-proses → tak pernah ter-charge; pasca-validasi → void manual kasir (BL5) |
| 3 | **Rad** | `medicalrecord.RadOrder`+`RadOrderItem` ✅ (`harga` per item) | `radResultService.saveHasil(finalize)` (terbit+validasi+rilis sekaligus → **Selesai**) | `RadOrderItem.harga` | `rad:{orderId}:{radCatalogId}` | idem Lab |
| 4 | **Resep / Farmasi** | `medicalrecord.ResepOrder`+`ResepItem` ✅ (`harga` = Obat.hargaSatuan saat order) | `resepService` transisi **serah/Selesai** (gate `ancillary.farmasi.serah`, tempat `ResepDispensing` ditulis) — charge saat obat DISERAHKAN | `ResepItem.harga × jumlah` | `resep:{orderId}:{itemId}` | item batal saat telaah → tak ter-charge (charge hanya item terserahkan); order Dibatalkan → no-op |
| 5 | **BMHP** | `medicalrecord.BmhpOrder`+`BmhpOrderItem` ✅ (`harga` per item) | transisi **Selesai** BmhpOrder (selaras Lab) | `BmhpOrderItem.harga` | `bmhp:{orderId}:{itemId}` | idem Resep |
| 6 | **Akomodasi (RI)** | `encounter.BedAllocation` ✅ + `kunjungan.{kelas,kelasHak,titipan}` ✅ — **tarif kamar BELUM ada master** (§6 G-1) | **akrual harian** saat `complete` (hitung rentang Occupied→Released per hari) + opsional cron malam utk Draft berjalan | resolve `master.TarifKamar` (BARU, §6) by `kelasHak ?? kelas` (B7) | `akomodasi:{kunjunganId}:{YYYY-MM-DD}` (1 baris/hari — pola FE dipertahankan) | pindah bed/kelas di tengah → hari berjalan ikut kelas efektif hari itu; reopen menyeluruh → recompute delta hari |
| 7 | **Administrasi** | — (charge level-kunjungan; keputusan lama: TIDAK di tarif tindakan) | `kunjunganService.transition("complete")` — 1 baris flat saat FINALIZE | `master.KonfigurasiBilling` (BARU, §6 G-2) per unit/penjamin | `admin:{kunjunganId}` | ikut Invoice Batal |
| 8 | **Jasa Dokter (visite/konsul)** | — belum ada domain sumber | **DITUNDA** — keputusan §6 G-3: derive dari `TindakanMedis` kategori Visite/Konsultasi (tarif komponen `jasaMedis` sudah dirinci PMK 85) ATAU domain baru | (ikut keputusan) | `jasadr:{ref}` | — |
| 9 | Gizi · OK/IBS · Transfusi | — modul belum ada | Phase later — masuk lewat primitif `postCharges` yang sama | — | `{modul}:{ref}` | — |

### 3.1 Aturan lintas-sumber

- **Momen charge = layanan TERLAKSANA**, bukan saat order: Lab=tervalidasi · Rad=expertise terbit ·
  Resep=diserahkan · Tindakan=dicatat · Akomodasi=hari terlewati. (Selaras trigger FE hari ini →
  angka tidak berubah di mata user, hanya pindah ke server.)
- **Order dibatalkan SEBELUM momen charge → tidak pernah menyentuh billing** (tak butuh reversal).
  Ini menutup mayoritas kasus batal (cancel resep/lab/rad saat `Menunggu`).
- **`penjaminKode`/`kelasTarif` di-stamp di Invoice saat create** — kalau penjamin kunjungan
  berubah (jarang; edit loket), butuh aksi kasir "re-price" eksplisit (BL5), bukan otomatis.
- **Komponen tarif (jasaSarana/Medis/Paramedis)** ikut disalin ke `InvoiceItem.komponen` bila
  baris tarif sumbernya dirinci → laporan remunerasi (BL7) tinggal agregasi.
- **Pasien demo (id non-UUID) tak pernah menyentuh `billing.*`** — guard UUID standar repo.

### 3.2 Interaksi lifecycle kunjungan (complete / reopen / cancel)

| Transisi | Efek billing (dalam tx transisi yang sama) |
|---|---|
| `complete` (disposisi baru) | akrual akomodasi final → charge Administrasi → `Invoice.status=Final` + `finalizedAt` |
| `complete` re-lock (perbaikan pengimputan, tanpa disposisi) | invoice TETAP Final (tak ada charge baru yang mungkin — rekam hanya dikoreksi input) |
| `reopen` koreksi (tgl keluar tetap) | Invoice `Final→Draft` HANYA bila `totalBayar==0`; bila sudah ada pembayaran → tolak reopen ATAU paksa jalur adjustment kasir (keputusan §6 G-4) |
| `reopen` menyeluruh (`resetSelesai`) | idem + akrual akomodasi di-recompute saat complete berikutnya (delta hari → void/insert baris harian) |
| `cancel` | `Invoice.status=Batal` + semua item Void (alasan "kunjungan dibatalkan") |

---

## 4 · Fase Eksekusi (BB0–BB9)

> Vertical slice per fase; tiap fase tutup dengan `tsc` + eslint + smoke pg (pola repo).
> **BB2 (Tindakan) sengaja pertama** — snapshot+konteks tarifnya paling lengkap, hook paling
> sederhana (CRUD sendiri), tak menunggu keputusan gap apa pun.

- [ ] **BB0 — Contracts & RBAC** *(±1 hari)*
  Schema `billing` (Invoice/InvoiceItem/Payment/counters) + migrasi + `prisma generate` ·
  RBAC `billing.*` + role Kasir (grant; superuser bypass) · Zod `schemas/billing/*` + DTO.
- [ ] **BB1 — Invoice core** *(±1–2 hari)*
  `invoiceDal` + `billingIngestService.postCharges` (primitif tunggal: lazy-create invoice →
  upsert-skip by sourceRef → update proyeksi total) · `GET /api/v1/billing/invoices`
  (board, cursor+filter) + `GET /billing/invoices/:id` (detail+items) · tulis balik
  `kunjungan.invoiceId`. **Keputusan di fase ini:** lazy-create vs create-saat-registrasi
  (rekomendasi: lazy — hindari invoice kosong utk kunjungan batal).
- [ ] **BB2 — Wiring Tindakan** *(±0,5 hari)*
  Hook `tindakanService` create/updateJumlah/softDelete → post/void. Bukti konsep primitif.
- [ ] **BB3 — Wiring Lab + Rad** *(±1 hari)*
  Hook `labResultService.validate` + `radResultService.saveHasil(finalize)`.
  Hapus ingest klien di `lab/tabs/ValidasiPane` + `rad/tabs/EkspertasiPane|ValidasiPane`.
- [ ] **BB4 — Wiring Resep + BMHP** *(±1 hari)*
  Hook transisi serah farmasi + Selesai BMHP (hanya item non-batal). Hapus ingest
  `FarmasiOrderTabs`. Sinergi Inventory (dispensing→OUT) dicatat, TIDAK digabung fasenya.
- [ ] **BB5 — Akomodasi + TITIPAN** *(±1–2 hari)*
  **Prasyarat G-1**: master `TarifKamar` (kelas × penjaminKode → rate/hari) + seed + UI mini di
  Mapping Hub Tarif. Akrual harian by `BedAllocation` (kelas efektif per hari, B7 `kelasHak`).
- [ ] **BB6 — Finalize + Administrasi + Reversal lifecycle** *(±1 hari)*
  Hook `transition()` complete/reopen/cancel sesuai §3.2 · konfigurasi biaya admin (G-2) ·
  guard reopen-vs-pembayaran (G-4).
- [ ] **BB7 — Pembayaran Kasir** *(±1–2 hari)*
  `POST /billing/invoices/:id/payments` (kasir=sesi login server-otoritatif · guard sisa≥jumlah ·
  stamp Lunas · void kwitansi) · kwitansi print data dari DB.
- [ ] **BB8 — FE swap** *(±2 hari)*
  Tagihan Board + Invoice Detail + Kasir Counter fetch DB (SSR-hybrid) · **retire**
  `billingStore`/`chargeIngest`/`tagihanBoardMock` · `BillingGateBanner`/`BillingMiniWidget`
  baca `GET /billing/invoices?kunjunganId=` · deep-link registrasi tetap.
- [ ] **BB9 — Hardening & sisa** *(later)*
  Deposit · shift kasir · adjustment/diskon ber-otorisasi (BL5) · laporan (BL7/`ehis-report`) ·
  re-price · SSE board kasir · purge policy.

**Estimasi kasar total BB0–BB8: ±9–12 hari kerja.**

---

## 5 · DoD / Verifikasi end-to-end (gate sebelum tandai ✅)

1. Order lab pasien BPJS → validasi SpPK → baris `InvoiceItem` muncul di DB (harga = snapshot
   `LabOrderItem.harga`) → board kasir menampilkan tagihan **dari browser lain** (multi-user).
2. Validasi di-replay (dobel-klik/refetch) → **0 duplikat** (unique sourceRef).
3. Resep 3 item, 1 dibatalkan saat telaah → hanya 2 ter-charge saat serah.
4. Pasien RI TITIPAN (kamar Kelas 1, hak Kelas 3, 3 hari) → 3 baris akomodasi tarif **Kelas 3**.
5. `complete` → Administrasi + Final; `reopen` koreksi saat belum dibayar → Draft lagi; setelah
   ada payment → reopen tertolak/jalur adjustment (sesuai keputusan G-4).
6. Pembayaran menutup sisa → `Lunas` + kwitansi; void kwitansi → sisa kembali.
7. `tsc` + eslint bersih · smoke pg rollback-wrapped per fase · `billingStore` klien tak lagi
   di-import dari pane klinis (grep bersih).

---

## 6 · Gap & Keputusan Tertunda (selesaikan di fase terkait)

| # | Gap | Dampak | Fase | Rekomendasi |
|---|---|---|---|---|
| G-1 | **Tarif kamar/akomodasi belum ada master** (FE hardcode `AKOMODASI_RATE_PER_HARI` di priceResolver) | Akomodasi tak bisa server-side | BB5 | Tabel `master.TarifKamar` (kelas × penjaminKode → rate/hari) — JANGAN taruh di RS profil (butuh per-penjamin utk KRIS) |
| G-2 | **Biaya administrasi belum ada konfigurasi** (keputusan lama: bukan tarif tindakan) | Charge admin saat finalize | BB6 | Baris konfigurasi per (unit × penjaminKode) — bisa menumpang tabel TarifKamar-like atau `config` |
| G-3 | **Jasa dokter visite/konsul tanpa domain sumber** | Sumber #8 kosong | BB9 | Derive dari `TindakanMedis` kategori Visite/Konsultasi (komponen `jasaMedis` sudah ada) — hindari domain baru |
| G-4 | **Kebijakan reopen setelah ada pembayaran** | Konflik lock vs kasir | BB6 | Tolak reopen bila `totalBayar>0` dengan pesan arahan ke adjustment kasir (aman medico-legal + akuntansi) |
| G-5 | `penjaminKode` masih string (belum FK master Penjamin) | Konsisten dgn Tarif Matrix | ikut Tier-3 Penjamin | Biarkan string dulu (keputusan BACKEND-MAPPING) |
| G-6 | Coverage obat per penjamin (formularium universal, belum ada mapping tanggungan) | `coverage` masih rule kasar Umum/non-Umum | BB9 | Ikut keputusan FE lama; mapping coverage = fase Penjamin |
| G-7 | E-Klaim masih mock — Invoice `Final` kelak jadi feeder klaim | Integrasi hilir | pasca-BB | Simpan `Invoice.status` netral (jangan tambah status Klaim dulu) |

---

## 7 · Peta File (rencana — ikuti konvensi lib per-domain repo)

```
prisma/schema/billing.prisma                         — Invoice/InvoiceItem/Payment/counters
src/lib/schemas/billing/{invoice,payment}.ts         — Zod + DTO
src/lib/dal/billing/{invoiceDal,paymentDal}.ts       — Prisma murni, tx?, soft-delete-aware
src/lib/services/billing/billingIngestService.ts     — postCharges/voidBySourceRef (primitif tunggal)
src/lib/services/billing/invoiceService.ts           — board/detail/finalize/reopen/cancel
src/lib/services/billing/paymentService.ts           — bayar/void kwitansi (BB7)
src/app/api/v1/billing/invoices/route.ts             — GET board
src/app/api/v1/billing/invoices/[id]/route.ts        — GET detail
src/app/api/v1/billing/invoices/[id]/payments/route.ts — POST/GET (BB7)
src/lib/api/billing/*.ts                             — client fetch (BB8)
```

Hook = **edit Service sumber yang sudah ada** (tindakanService/labResultService/radResultService/
resepService/kunjunganService) — panggil `billingIngestService.postCharges(…, tx)`; TIDAK ada
route billing yang ditulis dari pane klinis.
