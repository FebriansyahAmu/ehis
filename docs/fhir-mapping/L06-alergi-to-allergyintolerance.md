# L06 · `alergiToAllergyIntolerance` — Alergi → AllergyIntolerance

| | |
|---|---|
| Status | 🟡 dikoreksi S3 2026-11-17 — obat = KFA 91 dari `bzaKode`, kode per kategori di [links/alergi.ts](../../src/lib/fhir/links/alergi.ts), tanpa kode = Issue · sisa: `reaction.manifestation` (#2, butuh kode item reaksi — S5) |
| Kamar | **AllergyIntolerance** |
| Playbook | RJ/IGD/RI §Anamnesis — Riwayat Alergi [V] |
| Contoh resmi | RI: `kfa|91000299 Aspirin` (obat) · `sct|226963000 Duck - meat` (makanan) · `sct|128488006 House dust` (lingkungan) · RJ/IGD: `kfa|91000928 Barium Sulfate` |

## Sumber EHIS

`medicalrecord.AsesmenAlergi` (category Obat/Makanan/Lainnya · allergen · reactions[] · severity · status ·
snomedCode · **bzaKode** · keterangan · deletedAt) · `AsesmenAlergiNka` ("tidak ada alergi").

## Pemetaan elemen (`*` wajib)

| Elemen | Aturan |
|---|---|
| `identifier` | `http://sys-ids.kemkes.go.id/allergy/{Org_id}` + id ✅ |
| `clinicalStatus` | `active` / `inactive` — system `allergyintolerance-clinical` |
| `verificationStatus` | Terkonfirmasi→`confirmed` · Dicurigai→`unconfirmed` · dihapus→`entered-in-error` ✅ |
| `category*` | Obat→`medication` · Makanan→`food` · Lainnya→`environment` (playbook juga `biologic`) |
| `code*` | **Obat → KFA bahan zat aktif (prefix `91…`) dari `bzaKode`, system `http://sys-ids.kemkes.go.id/kfa`** · Makanan/Lainnya → SNOMED `snomedCode` |
| `code.text` | allergen + reaksi (teks) |
| `criticality` | Berat→`high` · lainnya→`low` |
| `patient*` · `encounter*` | Patient · Encounter |
| `recorder*` | Practitioner IHS pencatat (`authorPegawaiId`) |
| `reaction[].manifestation*` | SNOMED reaksi dari katalog `ReaksiAlergi` (wajib di IGD) — **belum dikirim** |
| `recordedDate` | `createdAt` |

## Gerbang pra-kirim

Kode sesuai kategori ada (obat: `bzaKode`; lainnya: `snomedCode`) · recorder punya IHS · IGD: ≥1 manifestasi berkode.

## Jangan salah kamar

- Alergi obat dengan kode SNOMED substansi = **salah sistem** menurut contoh resmi → pakai KFA 91….
- "Tidak ada alergi" (`AsesmenAlergiNka`) — tidak ada pola resmi di playbook → **tidak dikirim** dulu (hindari kode "No known allergy" tanpa konfirmasi).
- Reaksi obat yang terjadi **selama kunjungan** (ROTD) bukan riwayat alergi → tidak dikirim di link ini.

## Gap & koreksi

| # | Temuan | Tindakan |
|---|---|---|
| 1 | ✅ S3 — Alergi obat dikirim SNOMED | Pakai `bzaKode` (KFA 91…) untuk category `medication` |
| 2 | `reaction.manifestation` tidak dikirim (FG-42) | Simpan kode item reaksi (bukan nama) → SNOMED dari katalog |
| 3 | ✅ S3 — Alergi tanpa kode dilewati diam-diam (FG-36) | Ubah jadi status "belum siap" + alasan di konsol |
