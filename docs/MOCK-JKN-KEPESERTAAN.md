# MOCK — Cek Kepesertaan JKN (BPJS) "Selalu Aktif"

> **Status:** 🟡 MOCK aktif (pengembangan) · dibuat 2026-06-24
> **Tujuan:** alur Pendaftaran Kunjungan Baru (penjamin BPJS → SEP) bisa dijalankan tanpa integrasi V-Claim.
> **Aksi produksi:** ganti satu fungsi (`cariKepesertaanJkn`) ke panggilan V-Claim BPJS. Checklist di bawah.

---

## Apa yang di-mock

Cek kepesertaan JKN **selalu sukses & status `Aktif`** dengan data peserta lengkap. Tidak pernah
mengembalikan `null` / `Tidak Aktif`:

- **Nama peserta = nama pasien yang sedang didaftarkan** (override `query.nama` dari `patient.name`, diteruskan via `BpjsPanel.patientName`). Tanpa override → fallback nama `BPJS_MOCK`/sintesis.
- Nomor yang dikenal (`BPJS_MOCK`) → pakai FKTP aslinya, **status dipaksa `Aktif`** + masa berlaku diperpanjang.
- Nomor lain → data peserta **tersintesis deterministik** dari digit (jenis PBI/Non-PBI, kelas, FKTP).
- `berlakuSd` = 5 tahun dari hari ini (selalu masih berlaku).
- Ada delay ~600ms meniru latensi jaringan (UX skeleton tetap terlihat).

## Sumber tunggal (swap point)

| Item | Lokasi |
|---|---|
| **Fungsi mock** | [`src/components/registration/kunjungan/Tabs/sep/kepesertaanJknMock.ts`](../src/components/registration/kunjungan/Tabs/sep/kepesertaanJknMock.ts) → `cariKepesertaanJkn(query)` |
| Tipe data peserta | `BpjsData` di [`sepTypes.ts`](../src/components/registration/kunjungan/Tabs/sep/sepTypes.ts) |
| Data demo lama | `BPJS_MOCK` di `sepTypes.ts` (masih dipakai sbg basis nama) |

```ts
// Kontrak yang harus dipertahankan saat ganti ke produksi:
export interface KepesertaanQuery { mode: "kartu" | "nik"; value: string }
export async function cariKepesertaanJkn(q: KepesertaanQuery): Promise<BpjsData>
```

## Call-site (siapa memakai)

| Komponen | Lokasi | Status wiring |
|---|---|---|
| **`BpjsPanel`** (dipakai modal **Pendaftaran Kunjungan Baru** → Step Penjamin) | [`BpjsSearch.tsx`](../src/components/registration/kunjungan/Tabs/sep/BpjsSearch.tsx) → `handleSearch` | ✅ **memakai mock** (`cariKepesertaanJkn`) |
| `SepStep1` (alur Update SEP / Ubah Penjamin) | `BpjsSearch.tsx` → `SepStep1.handleSearch` | ⛔ **belum di-wire** — masih lookup `BPJS_MOCK` langsung (bisa `Tidak Aktif`/`notfound`). Pindahkan ke `cariKepesertaanJkn` saat produksi agar konsisten. |

Catatan UI: kotak "Demo" di `BpjsPanel` sudah diganti jadi banner **"Mode Demo · Mock JKN"** (amber) — hapus saat produksi.

---

## ✅ Checklist migrasi ke PRODUKSI (V-Claim)

1. Implementasikan body `cariKepesertaanJkn()` → panggil BFF V-Claim BPJS:
   - cek kepesertaan **by No. Kartu** & **by NIK** (2 endpoint V-Claim berbeda) sesuai `query.mode`.
   - map respons V-Claim → `BpjsData` (nama, noKartu, nik, jenis PBI/Non-PBI, hak kelas, FKTP, **status & tglAkhirBerlaku ASLI**).
   - referensi lib integrasi yang sudah ada: [`src/lib/bpjs/`](../src/lib/bpjs/) (modul BPJS Integration Hub).
2. Kembalikan kemungkinan **gagal**: lempar/return sinyal "tidak ditemikan" & "Tidak Aktif" → UI `BpjsSearch` perlu MENGAKTIFKAN kembali cabang `notfound` + status `Tidak Aktif` (sekarang dipaksa `found`/`Aktif`):
   - `BpjsPanel.handleSearch`: `setPhase(found ? "found" : "notfound")` & jangan paksa status.
   - `SEPCardStep1` & blok hasil sudah punya rendering `Tidak Aktif` → otomatis bekerja lagi.
3. Wire **`SepStep1`** ke `cariKepesertaanJkn` (atau hapus mock-nya) agar satu sumber.
4. Hapus banner "Mode Demo · Mock JKN" di `BpjsPanel` (atau ubah jadi hint nomor uji sandbox).
5. (Opsional) Pindahkan resolver dari folder `components/.../sep/` ke layer `lib/bpjs/` bila ingin dipakai server-side juga.
6. Hapus paksaan `status: "Aktif"` & `berlakuSd 5 tahun` di mock.

## Cara mematikan mock cepat (tanpa produksi penuh)

Untuk sementara mengembalikan perilaku lama (lookup `BPJS_MOCK`, bisa `Tidak Aktif`/`notfound`),
ubah `BpjsPanel.handleSearch` kembali ke pola `BPJS_MOCK[key] ?? null`. Lihat git history file
`BpjsSearch.tsx` (commit penambahan mock 2026-06-24).
