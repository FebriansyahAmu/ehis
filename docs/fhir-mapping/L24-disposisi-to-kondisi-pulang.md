# L24 · `disposisiToKondisiPulang` — Disposisi → Kondisi Saat Pulang (Condition) + Cara Keluar (Encounter)

| | |
|---|---|
| Status | ✅ S2 2026-11-17 — Condition kondisi pulang ([encounterCondition.ts](../../src/lib/fhir/adapters/encounterCondition.ts)) · meninggal `exp-lt48h`/`exp-gt48h` (`dischargeDispositionOf` di [conceptMap.ts](../../src/lib/fhir/conceptMap.ts)) |
| Kamar | **Condition** `problem-list-item` (stabil/tidak stabil/perbaikan) + **`Encounter.hospitalization.dischargeDisposition`** (L01) |
| Playbook | RJ/IGD/RI §Kondisi Saat Meninggalkan RS · §Cara Keluar dari RS [V] |
| Contoh resmi | RJ & RI: `Condition cat=[problem-list-item] sct|359746009 Patient's condition stable` |

## Sumber EHIS

`medicalrecord.Disposisi` (jenis Pulang/Rawat_Inap/Rujuk/Meninggal/APS · waktuKeluar · kondisiUmum
Baik/Sedang/Buruk/Kritis · rujukTujuan · meninggalWaktu · instruksi) + `Kunjungan.waktuKunjungan` (hitung 48 jam).

## ConceptMap `Disposisi.jenis` → `dischargeDisposition`

| EHIS | Kode | System | Catatan |
|---|---|---|---|
| `Pulang` | `home` "Pulang atas persetujuan dokter" | `http://terminology.hl7.org/CodeSystem/discharge-disposition` | ✅ |
| `APS` | `aadvice` "Pulang atas permintaan sendiri" | HL7 | ✅ (playbook juga memakai `aadvice` untuk "pulang paksa") |
| `Rujuk` | `other-hcf` "Dirujuk" | HL7 | ✅ + `text` tujuan rujuk |
| `Meninggal` (< 48 jam sejak masuk) | **`exp-lt48h`** | **`http://terminology.kemkes.go.id/CodeSystem/discharge-disposition`** | ❌ sekarang `exp` system HL7 |
| `Meninggal` (≥ 48 jam) | **`exp-gt48h`** | Kemkes | ❌ sekarang `exp` |
| `Rawat_Inap` | `oth` + `text` "Pasien dipindahkan ke rawat inap" | HL7 | ✅ sesuai contoh resmi IGD; + ServiceRequest `737481003` (L25) |

Waktu meninggal = `Disposisi.waktuKeluar` (**`meninggalWaktu` tidak pernah diisi form** — MeninggalPanel menyimpan
jam lokal saja); batas 48 jam dihitung dari `waktuKunjungan` kunjungan **ini**; tepat 48 jam = `exp-gt48h`.
Kunjungan RI dari IGD: apakah dihitung dari masuk IGD masih menunggu D16. Display `exp-*` diambil dari ringkasan
tabel playbook ("Meninggal < 48 jam" / "Meninggal > 48 jam"), belum terverifikasi verbatim (FG-92).
`Rawat_Inap` → `oth` + teks "Pasien dipindahkan ke rawat inap" (contoh resmi IGD).

## Condition kondisi saat meninggalkan RS

| Elemen | Aturan |
|---|---|
| category | `problem-list-item` (system `condition-category`) |
| `code*` | SNOMED: `359746009` Stabil · `162668006` Tidak stabil · `268910001` Perbaikan |
| `subject*` · `encounter*` | ✅ |
| `recordedDate` | `waktuKeluar` |

**ConceptMap kondisiUmum (D11 ✅ diputuskan 2026-11-17):** form EHIS **tetap** memakai Baik/Sedang/Buruk/Kritis;
nilai disesuaikan ke kode SatuSehat **saat kirim** (konstanta ber-tipe di `conceptMap.ts`, exhaustive).

| EHIS (`Disposisi.kondisiUmum`) | SNOMED dikirim | `code.text` |
|---|---|---|
| Baik | `359746009` Patient's condition stable | "Kondisi umum: Baik" |
| Sedang | `359746009` Patient's condition stable | "Kondisi umum: Sedang" |
| Buruk | `162668006` Patient's condition unstable | "Kondisi umum: Buruk" |
| Kritis | `162668006` Patient's condition unstable | "Kondisi umum: Kritis" |

- Nilai lokal asli selalu ikut di `code.text` → tetap terlacak walau 4 nilai dipetakan ke 2 kode.
- Disposisi `Meninggal` → **tanpa** Condition kondisi (cukup `exp-*`). `Rawat_Inap` → tanpa Condition (pasien tidak
  meninggalkan RS; contoh resmi IGD juga tanpa).

**Temuan S2 — kolom `kondisiUmum` diisi DUA form dengan kosakata berbeda** (kolomnya teks bebas):

| Form | Nilai | Dikirim |
|---|---|---|
| SelesaikanDialog (header IGD/RJ) | Baik · Sedang · Buruk · Kritis | tabel D11 di atas |
| Pasien Pulang IGD (dipakai ulang RI) — **tidak menilai kondisi**, nilai diturunkan dari status pulang | Sembuh → "Baik" · **"Membaik"** · "Dalam perawatan" · "Dirujuk ke faskes lain" · "Pulang atas permintaan sendiri" · "Meninggal" | "Baik" → stabil · **"Membaik" → `268910001` Perbaikan** (tren eksplisit dari status pulang) · sisanya **tidak dikirim** + Issue L24 `kode-kosong` |

Akibatnya Rujuk/APS dari form Pasien Pulang tidak punya kondisi pulang → keputusan **D17** (kembalikan pilihan
kondisi untuk Rujuk/APS). Nilai di luar kedua kosakata → Issue `kode-tidak-valid`.

`localId` = `<kunjunganId>:kondisi-pulang` (**1 per kunjungan**; disposisi ulang setelah Batal Selesai = PUT
resource yang sama). Dikirim hanya saat kunjungan selesai.

## Jangan salah kamar

- Kondisi pulang berbagi category dengan keluhan penyerta (`problem-list-item`) — dibedakan oleh **kode** dan oleh section Composition (`10184-0`, L26). Jangan pakai `encounter-diagnosis`.
- "Rawat inap" **bukan** kode `dischargeDisposition` — rencana rawat inap = ServiceRequest (L25).
