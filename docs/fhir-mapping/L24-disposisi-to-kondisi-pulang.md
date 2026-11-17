# L24 · `disposisiToKondisiPulang` — Disposisi → Kondisi Saat Pulang (Condition) + Cara Keluar (Encounter)

| | |
|---|---|
| Status | 📋 Condition belum ada · ⚠️ `dischargeDisposition` ada di [encounter.ts](../../src/lib/fhir/adapters/encounter.ts) dengan kode meninggal salah |
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

Waktu meninggal: `meninggalWaktu` (bila terisi) else `waktuKeluar`; batas 48 jam dihitung dari `waktuKunjungan`
kunjungan **ini** (IGD/RI). Kunjungan RI dari IGD: verifikasi apakah 48 jam dihitung dari masuk IGD (D16).

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
- `268910001` Perbaikan **tidak dipakai**: itu tren (dibanding kondisi masuk), tidak bisa diturunkan dari satu nilai kondisi umum.
- Disposisi `Meninggal` → **tanpa** Condition kondisi (cukup `exp-*`).

`localId` = `<disposisiId>:kondisi`. Disposisi dihapus (Batal Selesai) → Condition `entered-in-error`.

## Jangan salah kamar

- Kondisi pulang berbagi category dengan keluhan penyerta (`problem-list-item`) — dibedakan oleh **kode** dan oleh section Composition (`10184-0`, L26). Jangan pakai `encounter-diagnosis`.
- "Rawat inap" **bukan** kode `dischargeDisposition` — rencana rawat inap = ServiceRequest (L25).
