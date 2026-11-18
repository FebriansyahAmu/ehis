# FHIR Mapping — Arsitektur & Best Practice

> **Status: USULAN (draft 2026-11-17) — menunggu persetujuan sebelum flow & coding.**
> Menjawab: *"mapping EMR → FHIR sebaiknya pakai procedure di database atau apa, supaya performa & kualitas
> data konsisten dan rapi?"* Indeks semua link → [README.md](README.md).

## 1. Rekomendasi singkat

**Mapping tetap di aplikasi (TypeScript, fungsi murni per link), BUKAN stored procedure / function PL/pgSQL.**
Database dipakai untuk hal yang memang paling kuat dikerjakan database:

| Tugas | Tempat | Alasan |
|---|---|---|
| Menyimpan **kode standar** (SNOMED/LOINC/KFA/ICD) milik data katalog | **DB** — kolom di master katalog (`master.Obat.kfa`, `LabTest.loinc`, `AsesmenItem.snomedCode`, …) | Dipilih petugas saat entry → kode benar sejak sumber, bisa dikoreksi admin tanpa deploy |
| **Menjaga format kode** (ICD-10, LOINC, KFA 8 digit) | **DB** — `CHECK` constraint di kolom kode master + Zod di Service | Data salah ditolak saat ditulis, bukan saat dikirim |
| **Identitas & deteksi perubahan** (lokal ↔ IHS id, hash payload) | **DB** — `fhir.resource_map` (sudah ada) | Anti duplikat (R8), kirim hanya yang berubah |
| **Antrean kirim** | **DB** — `fhir.sync_log` outbox (sudah ada) | Kirim di luar transaksi klinis (R4), retry aman |
| **Ambil data sumber per kunjungan** | **DB** — query ber-indeks `kunjungan_id`, paralel | Satu "snapshot" per kunjungan, tanpa N+1 |
| **Mengubah data lokal → JSON FHIR** (struktur, kategori, value[x], referensi) | **Aplikasi** — mapper murni per link | Teruji unit, ber-tipe, di-review di PR, cepat diubah saat profil SatuSehat berubah |
| **Nilai tetap ⇄ kode** (status, disposisi, kelas, triase, kesadaran) | **Aplikasi** — `ConceptMap` konstanta ber-tipe | Exhaustive-check TypeScript: nilai enum baru yang lupa dipetakan = error compile |
| **Validasi pra-kirim** (elemen wajib profil, sistem kode, referensi) | **Aplikasi** — gerbang per resource | Alasan "belum siap" tampil di konsol, tidak dikirim setengah jadi |

## 2. Kenapa bukan stored procedure

| Kriteria | Stored procedure (PL/pgSQL `jsonb_build_object`) | Mapper TypeScript murni (rekomendasi) |
|---|---|---|
| **Performa** | Transform di dalam DB memang cepat, tapi itu **bukan bottleneck**: biaya terbesar = round-trip HTTP ke SatuSehat + rate limit. Menghemat milidetik transform tidak berdampak. | Transform di memori jauh lebih kecil dari 1 round-trip jaringan. Yang dioptimasi = **jumlah query** (1 snapshot/kunjungan) & **jumlah kirim** (hash → skip yang tak berubah). |
| **Kecepatan mengikuti perubahan profil** | Playbook berubah rutin (RJ **v7.0** 10 Jan 2026 · RI **v6.0** 10 Jan 2026 · IGD **v5.2** 30 Okt 2025). Tiap ubah = migrasi SQL → rawan drift (repo ini sudah punya riwayat drift checksum migrasi). | Ubah 1 file link + test → PR → CI. Rollback = revert commit. |
| **Kualitas & konsistensi** | JSON bersyarat (25+ resource, puluhan elemen opsional) di SQL sulit dibaca & di-review; tanpa tipe. | Tipe output per resource + exhaustive switch + test golden payload resmi. |
| **Testability** (laptop dev RAM terbatas) | Butuh DB hidup untuk tiap test. | Test murni tanpa DB (vitest, ringan) — cocok aturan verifikasi bertingkat. |
| **Konsistensi arsitektur** | Logika bisnis pecah di 2 tempat (Service + DB), melanggar layering Route→Service→DAL. | Satu tempat: `src/lib/fhir/links/*` dipanggil Service. |
| **Reuse** | Terkunci ke Postgres. | Builder yang sama dipakai untuk **BPJS e-RM** nanti (keputusan 2026-10-26). |
| **Keamanan/PHI** | Payload PHI terbentuk di DB, sulit diaudit per akses. | Payload terbentuk di Service yang sudah ber-audit (R9/R14). |

**Satu-satunya pengecualian yang wajar:** pekerjaan *set-based* massal (mis. backfill ribuan kunjungan lama) —
pakai SQL untuk **memilih kandidat & meng-enqueue job**, bukan untuk membangun JSON.
**Trigger DB untuk enqueue juga tidak disarankan**: enqueue sudah eksplisit di Service dalam tx yang sama
(FH3), dan trigger menyembunyikan logika dari review.

Alternatif lain yang dipertimbangkan & tidak dipilih:
- **FHIR Mapping Language / StructureMap engine** — standar HL7, tapi butuh engine (HAPI/Java) + kurva belajar; berlebihan untuk 1 target (SatuSehat).
- **Integration engine eksternal (Mirth/HAPI FHIR server)** — menambah server & operasional; data harus disalin keluar dulu.
- **View SQL per resource** — boleh untuk *membaca* bila profiling menunjukkan query berat, tapi tetap tanpa logika FHIR di dalamnya.

## 3. Pipeline target

```
aksi klinis (Service, tx)  ──enqueue──▶  fhir.sync_log (deskriptor job, BUKAN payload)
                                               │  worker (di luar tx)
                                               ▼
 ① EXTRACT   loadEncounterSnapshot(kunjunganId)        1 putaran query paralel ber-indeks, kolom minimal
 ② RESOLVE   refs: Patient/Practitioner/Location IHS    dari resource_map (+ resolve-first bila belum ada)
 ③ MAP       link.build(row, ctx) per link L01–L27      murni, tanpa I/O, tanpa Date.now()
 ④ CODE      ConceptMap (enum→kode) · kolom master      teks bebas TIDAK dikodekan otomatis
 ⑤ VALIDATE  gerbang profil: wajib, system URL, ref     gagal → "belum siap: <alasan>" (tak dikirim)
 ⑥ DIFF      canonical hash vs resource_map.hash        sama → skip (noop)
 ⑦ SINK      Bundle transaction / single (ResourceSink) urut dependensi (Encounter dulu)
 ⑧ RECORD    resource_map (ihsId, hash) · sync_log · audit
```

Langkah ①, ⑤, dan "link registry" adalah bagian **baru**; ②③⑥⑦⑧ sudah ada (FH0–FH7) dan dirapikan ke kontrak di §4.

## 4. Kontrak "link" (satu file = satu link)

```ts
// src/lib/fhir/links/<id>-<nama>.ts — RANCANGAN, belum dikode
interface FhirLink<Row, Res extends FhirResource> {
  id: "L08";                               // stabil; dipakai docs, konsol, log
  name: "ttvToObservation";
  resourceType: Res["resourceType"];
  units: Array<"IGD" | "RawatJalan" | "RawatInap">;
  dependsOn: LinkId[];                     // urutan referensi di Bundle (L01 Encounter selalu dulu)
  rows(s: EncounterSnapshot): Row[];       // pilih baris dari snapshot — tanpa query
  localId(row: Row, key?: string): string; // kunci resource_map, deterministik
  readiness(row: Row, ctx: BuildCtx): Issue[];        // alasan belum siap (kode kosong, nakes tanpa IHS, …)
  build(row: Row, ctx: BuildCtx): Array<{ key?: string; resource: Res }>; // murni
}
```

Aturan link:
1. **Satu baris sumber → satu resource** (atau N deterministik ber-`key`, mis. TTV `<id>:sbp`). Tidak ada resource yang dibangun dari "gabungan tebakan".
2. **`build` murni**: semua waktu dari kolom klinis (bukan `new Date()`), semua id dari `ctx` — hasil sama untuk input sama → hash stabil.
3. **Kategori & kode resource ditetapkan oleh link, bukan oleh pemanggil** → satu tempat menjamin "kamar" yang benar.
4. Link baru wajib punya dokumen `L<nn>-*.md` di folder ini + test golden.

## 5. Terminologi — di mana kode tinggal

| Jenis nilai | Contoh | Penyimpanan kode | Aturan |
|---|---|---|---|
| **Enum tetap lokal** | status kunjungan, jenis disposisi, kelas, triase P1–P4, kesadaran, kategori alergi | `src/lib/fhir/conceptMap.ts` (konstanta `Record<Enum, Coding>`) | Exhaustive: enum baru tanpa peta = error compile |
| **Item katalog** | obat (KFA), tes lab (LOINC), pemeriksaan rad (LOINC/KPTL), tindakan (ICD-9-CM/KPTL), allergen/penyakit (SNOMED/KFA), skala (LOINC/OC) | **kolom di master katalog** | Diisi admin/petugas lewat picker; validasi format di Zod + `CHECK` |
| **Teks bebas** | keluhan utama ketik bebas, catatan | **tidak dikodekan otomatis** | Masuk `text`/`note`. Bila elemen `code` wajib → resource **belum siap**, bukan dikirim dengan kode tebakan |

Prinsip ini sudah dipakai untuk LOINC lab ("salah lebih buruk dari kosong", FH6) dan diperluas ke semua link.
SatuSehat **tidak punya terminology server** yang bisa di-query (R12) → validasi format & daftar kode lokal.

**Kamus SNOMED lokal (sementara, 2026-11-17):** `master.snomed_concept` + `master.snomed_description`
(model [snomed.prisma](../../prisma/schema/snomed.prisma)), di-seed dari dump Kemenkes `docs/snomend_ct.sql`
(file lokal, **tidak di-commit**) oleh [seed-snomed.mts](../../prisma/scripts/seed-snomed.mts). Dipakai untuk picker
SNOMED (L03/L04/L05/L06/L15) dan cek "kode ada di kamus" di gerbang pra-kirim. Isi: 542.274 deskripsi aktif unik ·
325.768 konsep · pencarian istilah via indeks trigram (±5 ms). Batasan (FG-87):
- Rilis lama (effectiveTime 2002-01-31) — hanya **50/77** kode SNOMED yang disebut playbook ada di kamus. Kode dari
  tabel playbook (ConceptMap) **tetap sah** walau tak ada di kamus; kamus hanya dipakai untuk kode pilihan petugas.
- Hanya ±25% konsep punya FSN → `display` konsep lain = sinonim terpendek (`display_source = 'SYN'`).
- Tanpa relationship → ECL (`< 404684003`) tak bisa dihitung; `semantic_tag` hanya ada di ±9% konsep → hierarki
  dijaga lewat **subset terkurasi** (katalog asesmen berisi kode yang dipilih admin), bukan filter otomatis.
- Ganti dengan rilis SNOMED terbaru bila tersedia (skrip seed sama, cukup ganti `SNOMED_SQL_FILE`).

**Terminologi Lab resmi SatuSehat (2026-11-17):** LOINC **tidak** di-seed penuh (±100 rb kode, hampir tak terpakai).
Yang di-seed = **Lampiran LOINC Laboratorium SatuSehat** → `master.terminologi_lab` + `master.terminologi_lab_jawaban`
(detail & aturan di [L16](L16-lab-to-diagnostic.md)). Kode LOINC tetap dari playbook (tanda vital, Morse, section
Composition, …) cukup konstanta di ConceptMap.

| Terminologi | Di-seed? | Alasan |
|---|---|---|
| SNOMED (sementara, dump Kemenkes) | ✅ | Dipilih klinisi saat entry, ruang kode luas |
| Lampiran LOINC Lab SatuSehat | ✅ | Kategori Permintaan/Hasil + answer list = aturan resmi gerbang L16 |
| LOINC penuh | ❌ | Kode lab dipilih sekali per item katalog; sisanya konstanta playbook |
| KPTL / pemetaan ICD-9-CM↔KPTL | belum | Kandidat berikutnya (L14/L16) — lampiran resmi tersedia di docs SatuSehat |

## 6. Gerbang kualitas data (3 lapis)

1. **Di sumber (saat entry)** — Zod di Service + `CHECK`/`NOT NULL` di DB untuk kolom kode; picker katalog, bukan ketik bebas, untuk elemen yang wajib berkode.
2. **Pra-kirim** — `readiness()` per link: elemen wajib profil (tanda `*` di playbook), sistem kode kanonik (R17), referensi sudah punya IHS id, tanggal ≥ 2014-06-03. Hasil "belum siap" ditampilkan di konsol `/ehis-fhir` per kunjungan, dengan alasan.
3. **Pasca-kirim** — `OperationOutcome` SatuSehat → `sync_log` + konsol; koreksi di sumber, lalu kirim ulang (hash berubah → PUT).

## 7. Performa — aturan

- **1 snapshot per kunjungan**: semua tabel sumber dibaca dalam satu putaran `Promise.all`, `select` kolom yang dipakai saja. Semua tabel `medicalrecord.*` sumber sudah ber-indeks `kunjungan_id` (cek skema 2026-11-17); tabel hasil/telaah/dispensing diakses via `*_order_id` yang juga ber-indeks.
- **Kirim inkremental**: hash kanonik (key terurut, tanpa elemen volatil) dibanding `resource_map.hash` → hanya resource berubah yang dikirim. Penting untuk RI multi-shift (TTV ratusan baris).
- **Bundle per kunjungan** (default FH7). Bundle besar (FG-62) → pecah per fase dependensi: Encounter → klinis (≤ N entry/bundle) → Encounter update + Composition.
- **Worker terbatas** (concurrency kecil, backoff) — rate limit SatuSehat & token 1×/menit (R5, R11).
- **Tidak ada query di dalam `build()`** — semua lookup (IHS id, katalog) masuk `ctx` lewat batch sebelum map.

## 8. Konvensi wajib (berlaku semua link)

| Hal | Aturan | Sumber |
|---|---|---|
| Waktu | Kirim **UTC** (`...+00:00`). Adapter sekarang mengirim `+07:00` (instant sama, tapi playbook menulis eksplisit UTC+00) → ubah ke UTC. | Playbook RJ/IGD/RI "Ketentuan umum" |
| Batas tanggal | Tanggal < **2014-06-03** ditolak SatuSehat → gerbang pra-kirim | Playbook |
| Hapus | Soft-delete lokal → `entered-in-error` (PUT), **tidak** DELETE | R8 + FH4 |
| `identifier` | `http://sys-ids.kemkes.go.id/<jenis>/{Org_id}` + id lokal | Playbook + bundle resmi |
| `localId` resource_map | `<id baris>` atau `<id baris>:<key>` (deterministik) | FH4 |
| Satu kode per payload | Lab/Rad: 1 ServiceRequest/Specimen/Observation/DiagnosticReport = 1 kode | Playbook RI "Ketentuan umum" |
| Display | Display kode standar (Inggris) di `coding.display`; nama lokal di `text` | FG-39 |
| Unit | UCUM `http://unitsofmeasure.org` | Playbook |

## 9. Testing (ringan, sesuai ENGINEERING-RULES §2)

- **Golden test per link**: bangun resource dari fixture baris lokal → bandingkan *struktur kunci* (resourceType, category, system/code, elemen wajib) dengan entri padanan di [`docs/fhir-postman/bundles/*`](../fhir-postman/bundles/). Murni, tanpa DB.
- **Test ConceptMap exhaustive** — tiap nilai enum punya kode.
- Uji **sandbox** tetap terpisah (FG-02) setelah link selesai.
