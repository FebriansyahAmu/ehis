# MOCK — Insert SEP (V-Claim `Peserta/sep/2.0/insert`)

> Status: **MOCK server-side** (BPJS V-Claim belum di-hit — belum ada cons-id). Seam siap swap
> ke `callBpjs` saat sandbox tersedia. Lihat [BPJS-WS-RULES.md](BPJS-WS-RULES.md) · [TODO-BPJS-WS.md](../TODO-BPJS-WS.md).

## Layering (Route → Service → Connector)

| Layer | File | Tanggung jawab |
|---|---|---|
| Kontrak | [src/lib/schemas/bpjs/sepInsert.ts](../src/lib/schemas/bpjs/sepInsert.ts) | `InsertSEPPayload` (t_sep, reuse vClaimSEP) · `buildInsertSepPayload()` (SepInput + konteks → t_sep) · `toSepWire()` · `BpjsMetaError` · `InsertSepConnectorResult` |
| Konektor (mock) | [src/lib/services/bpjs/sepInsertMock.ts](../src/lib/services/bpjs/sepInsertMock.ts) | `insertSepMock(payload, now)` → `{ ok }` / `{ ok:false, error }`. Simulasi metaData BPJS. `now` = jam server (clock inject) untuk aturan batas tanggal (R7); konektor NYATA mengabaikannya. |
| Domain | [src/lib/services/bpjsService.ts](../src/lib/services/bpjsService.ts) | `issueSep()` build payload → konektor → persist `SEP` (status `Terbit`) saat ok |
| Use-case | [src/lib/services/kunjunganService.ts](../src/lib/services/kunjunganService.ts) | `registerKunjungan` — resolve `noTelp`/`diagAwal`/rujukan; tangani error + `forceSep` |
| API | `POST /api/v1/kunjungan` | SEP diterbitkan sebagai bagian Pendaftaran Kunjungan Baru |

Wire BPJS final: `{ "request": { "t_sep": <InsertSEPPayload> } }`.

## Aturan validasi mock (mengembalikan error ala asli)

`insertSepMock` mengembalikan error metaData (code ≠ "200") saat:

| Aturan | Kondisi | code | Pesan | `field` |
|---|---|---|---|---|
| R1 | No. Kartu < 10 digit numerik | `201` | No. Kartu peserta tidak ditemukan / tidak valid | `noKartu` |
| R2 | Kartu demo non-aktif (`0009876543210`) | `204` | Peserta tidak aktif pada bulan pelayanan | `noKartu` |
| R3 | `noTelp` kosong | `412` | No. Telepon peserta wajib diisi | `noTelp` |
| R4 | `diagAwal` kosong (< 2 char) | `412` | Diagnosa awal (ICD-10) wajib diisi | `diagAwal` |
| R5 | Rawat Inap tanpa `skdp.noSurat` (SPRI) | `412` | No. Surat Kontrol (SPRI) wajib untuk Rawat Inap | `skdpNoSurat` |
| R6 | `ppkPelayanan` kosong | `500` | Kode PPK pelayanan tidak valid | `ppkPelayanan` |
| R7 | Batas tanggal penerbitan SEP (lihat di bawah) | `412` | Melewati batas waktu penerbitan SEP | `tglSep` |

Selain itu → **sukses**; No. SEP digenerate Service via sequence DB (`no_sep_seq`, unik).
Konektor NYATA kelak mengisi `noSep` dari respons BPJS.

### R7 — Batas waktu penerbitan SEP (tata cara BPJS)

`tglSep` = tanggal pelayanan (RJ/IGD = tgl kunjungan · RI = tgl masuk); `now` = jam server penerbitan.

- **Rawat Jalan & IGD** (`jnsPelayanan="2"`, IGD tetap SEP Rawat Jalan) → SEP **WAJIB pada tanggal
  pelayanan yang sama**. Contoh: kunjungan **29 Jun**, SEP baru dibuat **30 Jun** → **DITOLAK**.
- **Rawat Inap** (`jnsPelayanan="1"`) → maksimal **3×24 jam HARI KERJA** sejak tgl masuk. **Sabtu &
  Minggu tidak dihitung** (bukan hari kerja). Lebih dari 3 hari kerja berlalu → **DITOLAK**.

Perhitungan hari kerja berbasis UTC-midnight (`workdaysBetween`, rentang `(tglSep, now]`). **Libur
nasional belum diperhitungkan** — perlu kalender libur (TECH_DEBT). Aturan dipusatkan di konektor
(bukan Service/FE) agar sekali tulis berlaku untuk **Pendaftaran Kunjungan Baru** & **Ubah Penjamin**;
saat swap ke V-Claim NYATA, BPJS menegakkan aturan ini di sisinya (param `now` diabaikan konektor asli).

## Sumber data turunan SEP (Rawat Inap dari SPRI)

- **Diagnosa awal (`diagAwal`)** = **diagnosa utama IGD** asal. SPRI worklist (`GET /spri`) di-enrich
  `diagAwalKode`/`diagAwalNama` (batched `diagnosaDal.listUtamaByKunjunganIds`). FE prefill saat
  operator memilih SPRI di form SEP.
- **No. Telepon (`noTelp`)** = `Pasien.noHp` (prefill FE) — **wajib**; UI memberi peringatan bila kosong.
- **No. SKDP (`skdp.noSurat`)** = No. Referensi SPRI terpilih.
- **Kode DPJP (`skdp.kodeDPJP`)** ✅ = di-resolve server-side: `No.Ref SPRI → SPRI.dpjpPegawaiId →
  resolveKodeDpjpBpjsByPegawai` (mapping `bpjs.DpjpMapping → RefDpjp.kode`), fallback DPJP kunjungan
  (`input.dpjpId → resolveKodeDpjpBpjs`). `""` bila dokter belum dipetakan di Mapping Hub → DPJP BPJS.
- **`dpjpLayan`** (DPJP melayani) = RJ saja (kosong saat RI per aturan V-Claim); masih teks form (gap).

## Penanganan error di UI (Pendaftaran Kunjungan Baru — step Review)

Saat "Daftarkan & Terbitkan SEP" dan SEP DITOLAK BPJS:

- **Default (`forceSep=false`)** → pendaftaran **dibatalkan** (rollback tx), modal **tidak ditutup**,
  dialihkan ke **step SEP**, banner menampilkan kode + pesan + field penyebab, dengan 2 pilihan:
  - **Tetap Daftarkan (SEP ditangguhkan)** → kirim ulang `forceSep=true` → kunjungan **dibuat**,
    SEP **ditangguhkan** (`KunjunganDTO.sepError` terisi; terbitkan ulang nanti). SEP TIDAK dipersist.
  - **Revisi Dulu** → tutup banner, perbaiki field di form SEP, lalu daftarkan ulang.

Penjamin **Umum** → tanpa SEP (langkah SEP tak muncul). `terbitSep=false` (BPJS) → SEP ditangguhkan tanpa upaya.

## Swap ke NYATA

Ganti isi `insertSepMock` dengan panggilan konektor:
```
const res = await callBpjs({ service: "vclaim", method: "POST",
  path: "/SEP/2.0/insert", body: toSepWire(payload) });
// decode envelope → metaData.code === "200" ? { ok:true, noSep: response.sep.noSep } : { ok:false, error: metaData }
```
Audit (PII di-hash), idempotency (anti SEP ganda), outbox (panggilan di luar tx) per BPJS-WS-RULES.md.
