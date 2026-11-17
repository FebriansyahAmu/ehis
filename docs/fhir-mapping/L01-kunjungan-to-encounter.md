# L01 · `kunjunganToEncounter` — Kunjungan → Encounter

| | |
|---|---|
| Status | ✅ dikoreksi S2 2026-11-17 ([encounter.ts](../../src/lib/fhir/adapters/encounter.ts)) — sisa: riwayat lokasi (#4, menunggu fitur pindah ruangan) |
| Kamar | **Encounter** · class `AMB` (RJ) · `EMER` (IGD) · `IMP` (RI) — system `http://terminology.hl7.org/CodeSystem/v3-ActCode` |
| Playbook | RJ §2 + §28 Pembaharuan · IGD §2 + §27 · RI §2 + §28 (+ variasi kasus kelas/kamar) [V] |
| Contoh resmi | entry Encounter di `bundles/bundle-{rawat-jalan,igd,rawat-inap}.json` |
| Bergantung | Organization & Location (FH1) · Patient IHS (FH2) · Practitioner IHS DPJP · L03 (CC) · L13 (diagnosis) · L24 (disposisi) |

## Sumber EHIS

`encounter.Kunjungan` (noKunjungan · unit · status · waktuKunjungan · dilayaniAt · selesaiAt · dpjpId · ruanganId ·
kelas · kelasHak · titipan · bedId) · `encounter.BedAllocation` (riwayat bed: occupiedAt/releasedAt) ·
`medicalrecord.Triase.waktuTriase` (IGD) · `medicalrecord.Disposisi` (lewat L24).

## Pemetaan elemen (`*` = wajib di playbook)

| Elemen FHIR | Sumber | Aturan |
|---|---|---|
| `identifier*` | `noKunjungan` | system `http://sys-ids.kemkes.go.id/encounter/{Org_id}` ✅ |
| `status*` | `Kunjungan.status` | ConceptMap §Siklus |
| `statusHistory*` | waktu lokal | RJ: `arrived → in-progress → finished` · IGD: `arrived → triaged → in-progress → finished` (contoh resmi) · RI: `in-progress → finished` |
| `class*` | `unit` | `AMB` / `EMER` / `IMP` ✅ |
| `classHistory*` | `unit` + `period` | **belum dikirim** — ditandai wajib di playbook (contoh Postman tidak memuatnya); isi 1 entri `{class, period}` |
| `subject*` | Patient IHS | ✅ |
| `participant*` | DPJP (`dpjpId` → Practitioner IHS) | type `ATND` system `v3-ParticipationType` ✅. Ganti DPJP → entri baru ber-`period` (variasi kasus IGD/RI) |
| `period*` | start = `waktuKunjungan` · end = `selesaiAt` | end hanya saat `finished` |
| `length` | `selesaiAt − waktuKunjungan` | Saat selesai. RJ/IGD menit (`min`), RI hari (`d`, contoh resmi RI) — UCUM |
| `location*` | ruangan (`ruanganId`) + riwayat `BedAllocation` | Satu entri per ruangan dengan `period`; `period.end` lokasi lama = `period.start` lokasi baru [V RI] |
| `location.extension` ServiceClass | `kelas` · `kelasHak` · `titipan` | URL `https://fhir.kemkes.go.id/r4/StructureDefinition/ServiceClass` ✅ — lihat ConceptMap |
| `diagnosis*` | L03 (CC) + L13 (diagnosis klinis) | **CC wajib saat PUT `finished`** [V semua playbook]. Diagnosis klinis `use` `DD` + `rank` (1 = Utama) — sesuai contoh RJ & RI |
| `hospitalization.dischargeDisposition*` | `Disposisi.jenis` | Lewat L24 (wajib di IGD) |
| `serviceProvider*` | Org RS | ✅ |
| `basedOn` | SPRI (L25) | Hanya Encounter RI dari IGD/RJ (FG-34) |

## Siklus kirim

| Momen EHIS | Aksi | `status` | Tambahan |
|---|---|---|---|
| Diterima (`receive` → InService) | POST | `in-progress` | statusHistory sampai saat ini; IGD sisipkan `triaged` dari `Triase.waktuTriase` bila ada |
| Pindah ruangan/bed · ganti DPJP · titip rawat kembali ke kelas hak | PUT | `in-progress` | `location[]` / `participant[]` bertambah, kelas diperbarui |
| Selesai (`complete`) | PUT ("Pembaharuan Data Kunjungan") | `finished` | `period.end`, `length`, `diagnosis` (CC + DD), `dischargeDisposition`, + resource kondisi pulang & tindak lanjut (L24/L25) |
| Batal setelah terkirim | PUT | `cancelled` | — |
| Batal Selesai (reopen) | **tidak mengirim status mundur** | tetap `finished` | Perbaikan data dikirim sebagai PUT `finished` berikutnya (FG-29) |

PUT wajib membawa `Encounter.id` dari respons POST pertama [V] → diambil dari `resource_map`.

## ConceptMap

| Lokal | Kode |
|---|---|
| `InService` | `in-progress` |
| `Completed`/`Closed`/`Billed`/`Claimed` | `finished` |
| `Cancelled` | `cancelled` |
| `Registered`/`Queued` | belum dikirim (FG-31) |
| Kelas RI `Kelas_1/2/3`/`VIP` | `1`/`2`/`3`/`vip` — system `…/locationServiceClass-Inpatient`. `ICU/HCU/Isolasi` tanpa kode → extension dihilangkan (FG-28) |
| RJ/IGD | `reguler` (atau `eksekutif` untuk poli eksekutif) — system `…/locationServiceClass-Outpatient` |
| `kelas` vs `kelasHak` · `titipan` | `kelas-tetap` · `naik-kelas` · `turun-kelas` · `titip-rawat` — system `…/locationUpgradeClass` |

## Gerbang pra-kirim

Patient IHS ada · Location ruangan sudah onboarding · DPJP punya IHS (`participant*` wajib → DPJP tanpa IHS =
belum siap, jangan kirim Encounter tanpa participant) · saat `finished`: ada ≥1 Condition CC (L03) terkirim.

## Jangan salah kamar

- Diagnosis klinis **bukan** use `CC`; keluhan utama **bukan** use `DD`.
- IGD → Rawat Inap = **2 Encounter** (EMER selesai `oth` "dipindahkan ke rawat inap" + IMP baru), bukan 1 Encounter berganti class. Pengecualian: observasi IGD → `OBSENC` via `classHistory` [V IGD variasi kasus].
- Bed tidak dikirim sebagai Encounter terpisah — hanya `location` (bed sebagai Location menunggu FG-13).

## Gap & koreksi

| # | Temuan | Tindakan |
|---|---|---|
| 1 | ✅ S2 — `diagnosis` hanya DD, tanpa CC | CC dari L03 (tanpa `rank`) + DD ber-`rank`. **Gerbang:** tanpa CC atau tanpa DD → Encounter tetap `in-progress` + Issue `syarat-finished` (FLOW §4) |
| 2 | ✅ S2 — Meninggal dikirim `exp` (system HL7) | `exp-lt48h`/`exp-gt48h` system Kemkes (L24) |
| 3 | ✅ S2 — `classHistory` tidak dikirim | 1 entri `{class, period}` |
| 4 | 🟡 Riwayat lokasi tidak dilacak (FG-30) | S2: `location[0].period` (= period kunjungan, pola contoh RI). EHIS **belum punya fitur pindah ruangan/bed** → riwayat multi-lokasi dibangun saat fitur itu ada |
| 5 | ✅ S2 — Status `triaged` IGD tidak dikirim | Dari `Triase.waktuTriase` pertama; dilewati bila di luar rentang datang–dilayani |
| 6 | ✅ S2 — `length` tidak dikirim | RI: hari kalender WIB (min 1, contoh resmi `d`) · RJ/IGD: menit (`min`) |
| 7 | ✅ S1 — Waktu `+07:00` | UTC (D9) |
| 8 | Extension status pengunjung (`new/returning`) | ⛔ system URL belum ditemukan di playbook — tunda |
