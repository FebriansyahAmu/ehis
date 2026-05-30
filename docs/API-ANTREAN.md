# EHIS Antrean — Kontrak API (REST-style, 1:1 spec resmi BPJS Antrean RS)

> Kontrak WS modul `/ehis-antrian` yang RS **ekspos** untuk dipanggil Mobile JKN (inbound).
> Sumber otoritatif payload/response: [contracts/WS-ANTREAN-RS.md](../contracts/WS-ANTREAN-RS.md).
> Pendamping: [TODO-ANTREAN.md](../TODO-ANTREAN.md) · [TODO-REGISTRASI.md](../TODO-REGISTRASI.md) (REG1.1) · [TODOS_BACKEND.md](../TODOS_BACKEND.md).
> **Last updated:** 2026-05-30.

---

## 1. Prinsip & Arah Integrasi

Ada **dua arah WS berbeda** (auth berbeda):

| Arah | Client | Server | Auth | Cakupan |
|---|---|---|---|---|
| **Inbound** | Mobile JKN | **RS (kita)** | `x-token`/`x-username` | endpoint di dokumen ini — **fokus sekarang** |
| **Outbound** | **RS (kita)** | BPJS Antrean RS | `cons-id` + `secret` + `user_key` + signature + timestamp | `updatewaktu` (taskid), onsite `antrean/add`, referensi, dashboard |

**3 channel antrean (akhirnya):** (1) **MJKN** online → inbound · (2) **Onsite** (pasien tanpa HP) → RS hit BPJS via outbound · (3) **Website resmi RS**. **Scope batch ini = MJKN saja.**

- **Penamaan endpoint = REST-style general**; **HTTP method = ikut spec BPJS** (`getToken`=GET, sisanya POST).
- Nama BPJS lama = kolom **alias/source** untuk traceability.
- Response BPJS asli `{ "response": {...}, "metadata": { "code", "message" } }` — **code di body** (200 sukses, 201 gagal, **202 = pasien baru** khusus Ambil Antrean).

> ⚠️ Bila MJKN memanggil path baku BPJS (registrasi HFIS), penamaan REST ini dipakai untuk layer internal/proxy + adapter tipis memetakan path baku → REST kita.

---

## 2. Auth

**Inbound (MJKN → RS)** — yang kita ekspos & jadi fokus:
| Endpoint | Header |
|---|---|
| `getToken` (GET) | `x-username`, `x-password` → `{ response:{ token }, metadata }` |
| Semua endpoint lain (POST) | `x-token`, `x-username` |

**Outbound (RS → BPJS Antrean RS)** — dipakai untuk `updatewaktu` (taskid, semua channel) & onsite `antrean/add`:
- `X-cons-id`, `X-timestamp`, `X-signature` (HMAC-SHA256 dari `cons-id&timestamp` pakai `secret`), `user_key`. Body/response ter-enkripsi+LZ-String (pola BPJS bridging). → **backend**.

---

## 3. Konvensi Response Internal

- Sukses: `{ "data": ..., "meta": ... }`; error: `application/problem+json`.
- **Metadata code map** (adapter): `200→200 OK` · `201→422/400 (gagal bisnis)` · `202→200 + flag `pasienBaru:true``.
- `waktutunggu` = **detik**, formula `SPM × (sisaantrean − 1)`. `estimasidilayani` = **timestamp ms**.

---

## 4. Mapping Endpoint (Source BPJS ↔ REST-style)

| Source BPJS *(alias)* | Method | **REST-style** | Body kunci |
|---|:---:|---|---|
| getToken | GET | `GET /auth/token` | — (header user/pass) |
| Status Antrean | POST | `POST /antrean/status` | `kodepoli, kodedokter, tanggalperiksa, jampraktek` |
| Ambil Antrean | POST | `POST /antrean` | lihat §5.2 — **balikan 202 bila pasien baru** |
| Sisa Antrean | POST | `POST /antrean/sisa` | `kodebooking` |
| Batal Antrean | POST | `POST /antrean/batal` | `kodebooking, keterangan` → task 99 |
| Check in | POST | `POST /antrean/checkin` | `kodebooking, waktu(ms)` |
| Pasien Baru | POST | `POST /pasien` | peserta ([REG1.1](../TODO-REGISTRASI.md)) → balikan `norm` |
| Ambil Antrean Farmasi | POST | `POST /antrean-farmasi` | `kodebooking` |
| Status Antrean Farmasi | POST | `POST /antrean-farmasi/status` | `kodebooking` |
| Jadwal Operasi RS | POST | `POST /jadwal-operasi/rs` | `tanggalawal, tanggalakhir` *(stub)* |
| Jadwal Operasi Pasien | POST | `POST /jadwal-operasi/pasien` | `nopeserta` *(stub)* |
| *(outbound→BPJS)* | POST | `POST /antrean/task` | `kodebooking, taskid, waktu` → `updatewaktu` |

---

## 5. Skema per endpoint *(1:1 spec)*

### 5.1 `POST /antrean/status` — cek antrean poli (pra-booking)
Req: `{ kodepoli, kodedokter, tanggalperiksa, jampraktek }`
Res: `{ namapoli, namadokter, totalantrean, sisaantrean, antreanpanggil, sisakuotajkn, kuotajkn, sisakuotanonjkn, kuotanonjkn, keterangan }`

### 5.2 `POST /antrean` — Ambil Antrean
Req: `{ nomorkartu, nik, nohp, kodepoli, norm, tanggalperiksa, kodedokter, jampraktek, jeniskunjungan, nomorreferensi }`
- `jeniskunjungan`: **1** Rujukan FKTP · **2** Rujukan Internal · **3** Kontrol · **4** Rujukan Antar RS.
- `nomorkartu`/`nomorreferensi` kosong bila NON-JKN.
Res (200): `{ nomorantrean, angkaantrean, kodebooking, norm, namapoli, namadokter, estimasidilayani(ms), sisakuotajkn, kuotajkn, sisakuotanonjkn, kuotanonjkn, keterangan }`
- **Res 202 = Pasien Baru** → MJKN lanjut hit `POST /pasien`. (Lihat alur §6.)

### 5.3 `POST /antrean/sisa`
Req: `{ kodebooking }` → Res: `{ nomorantrean, namapoli, namadokter, sisaantrean, antreanpanggil, waktutunggu(detik), keterangan }`

### 5.4 `POST /antrean/batal`
Req: `{ kodebooking, keterangan }` → Res: metadata only. → **emit task 99**.

### 5.5 `POST /antrean/checkin`
Req: `{ kodebooking, waktu(ms) }` → Res: metadata only. → **emit task 1 (baru) / 3 (lama)**.

### 5.6 `POST /pasien` — Pasien Baru
Req: `BpjsPesertaAutofill` (lihat [REG1.1](../TODO-REGISTRASI.md)).
Res: `{ response:{ norm }, metadata:{ code:200, message:"Harap datang ke admisi untuk melengkapi data rekam medis" } }`
- ⚠️ Kode wilayah BPJS ≠ Kemendagri (map saat FHIR). `rw`=RT, `rt`=RW (label terbalik).

### 5.7 `POST /antrean-farmasi`
Req: `{ kodebooking }` → Res: `{ jenisresep, nomorantrean, keterangan }`. → task 6.

### 5.8 `POST /antrean-farmasi/status`
Req: `{ kodebooking }` → Res: `{ jenisresep, totalantrean, sisaantrean, antreanpanggil, keterangan }`.

### 5.9 `POST /jadwal-operasi/rs` *(stub)*
Req: `{ tanggalawal, tanggalakhir }` → Res `list[]`: `{ kodebooking, tanggaloperasi, jenistindakan, kodepoli, namapoli, terlaksana, nopeserta, lastupdate }`.

### 5.10 `POST /jadwal-operasi/pasien` *(stub)*
Req: `{ nopeserta }` → Res `list[]` (idem tanpa nopeserta/lastupdate).

### 5.11 `POST /antrean/task` *(outbound)*
Req: `{ kodebooking, taskid:1..7|99, waktu(ms) }` — validasi berurutan + monoton + idempoten sebelum proxy `updatewaktu`.

---

## 6. Alur Pasien Baru Online *(penting — via code 202)*

```
MJKN → POST /antrean (Ambil Antrean)
        └─ RS tak temukan pasien → Res 202 (Pasien Baru)
MJKN → POST /pasien (kirim peserta)
        └─ RS buat pasien minimal → Res { norm } + "datang ke admisi melengkapi RM"
MJKN → POST /antrean (ulang, kini dgn norm) → Res { kodebooking } ✔
```

**Konsekuensi UI EHIS:** pasien baru via online **sudah punya `norm` + data minimal** sebelum tiba. Di loket, "Respon Kedatangan" = **buka `/pasien/{norm}` (data ter-prefill, incomplete) → lengkapi + Daftar Kunjungan + SEP**, bukan buat dari nol. Walk-in murni (tanpa online) tetap pakai `PasienBaruModal` penuh.

---

## 7. Catatan implementasi
- **Mock-first**: `antreanStore` mengimplement endpoint REST-style ini. Adapter auth (`x-token`) + path baku = backend ([TODOS_BACKEND.md](../TODOS_BACKEND.md)).
- **Validasi TaskID** di domain. **Jadwal operasi** stub sampai modul Bedah ada.
