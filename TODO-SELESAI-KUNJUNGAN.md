# TODO — Fitur "Selesaikan Kunjungan" (IGD Disposisi + Lifecycle Lock)

> **Tujuan:** menutup episode kunjungan IGD secara klinis (disposisi: ke mana pasien) + mengunci rekam medis (immutable), dengan jalur Batal Selesai (reopen) yang aman & ber-jejak.
> Acuan: [docs/API-RULES.md](docs/API-RULES.md) · [docs/BACKEND-FLOWS.md](docs/BACKEND-FLOWS.md) · [TODO-CLINICAL.md](TODO-CLINICAL.md) (Domain Outcome/Disposisi). Dibuat 2026-06-16.

## Spec terkunci (hasil diskusi)

- **Penyelesai = Dokter & Perawat** (klinis) — authz `complete`/`reopen` dilonggarkan dari "loket" ke marker klinis (pola `receive`).
- **Lock NYATA** — saat `Completed`: rekam medis **blur + non-interaktif + banner terkunci** (reuse pola `withIdentitas`); backend tolak tulis `clinical.*` saat `lockedAt` terisi.
- **Dua timestamp** — `selesaiPertamaAt` (immutable, audit) + `selesaiAt` (efektif, boleh di-set ulang via DateTimePicker tiap complete).
- **Batal Selesai (reopen)** — `Completed→InService`, clear `lockedAt`, pertahankan kedua timestamp, simpan `alasanReopen` (opsional, medico-legal); complete berikutnya menimpa `selesaiAt`.
- **Disposisi domain** — `medicalrecord.Disposisi` append latest-wins + pointer `Kunjungan.disposisi`; ditulis HANYA via aksi complete (atomik).
- **Gate** — hard: ≥1 Diagnosa Utama (Pasti). Soft (warning): CPPT belum verifikasi, order pending.
- **Rawat_Inap** — tandai disposisi + deep-link ke pendaftaran RI (tak auto-admit).
- **Dua pintu** — (1) tombol kanan-atas + dialog konfirmasi memuat mini-form disposisi; (2) tab Pasien Pulang (form lengkap).
- **Board** — seksi "Selesai hari ini" → buka rekam medis read-only.

---

## Fase 1 — Schema + Migrasi ✅

- [x] `encounter.prisma` Kunjungan: tambah `selesaiPertamaAt` (immutable) + `disposisi` (pointer jenis) + `alasanReopen`; ubah komentar `selesaiAt` → efektif.
- [x] `medicalrecord.prisma` model `Disposisi` (append latest-wins per kunjungan; jenis/waktu/dokter/kondisi/diagnosaKeluar/instruksi + blok per-jenis; author; soft-delete).
- [x] Backref `Kunjungan.disposisiRiwayat Disposisi[]`.
- [x] Migration `20260616160000_selesai_kunjungan_disposisi` → apply via `pg` ([apply-disposisi.mjs](prisma/scripts/apply-disposisi.mjs)) + `migrate resolve --applied` → `prisma generate`. ✅ verified (kunjungan +3 kolom, disposisi 21 kolom).

## Fase 2 — Backend ✅

- [x] Disposisi: `lib/schemas/disposisi/disposisi.ts` (Zod input + DTO) · `lib/dal/disposisi/disposisiDal.ts` · `lib/services/disposisi/disposisiService.ts` (getLatest) · `lib/api/disposisi/disposisi.ts`.
- [x] Route GET `/kunjungan/:id/disposisi` (gate `clinical.keperawatan:read`).
- [x] Extend `kunjunganService.transition`: `complete{waktuSelesai,disposisi}` atomik (gate → tulis Disposisi → set selesaiAt/selesaiPertamaAt/lockedAt/pointer + lepas bed) · `reopen{alasanReopen}` (clear lockedAt + simpan alasan; timestamp dipertahankan).
- [x] Authz: `complete`/`reopen` izinkan klinis (Dokter/Perawat) di `assertTransitionAllowed`.
- [x] Gate hard ≥1 Diagnosa Utama (Pasti) sebelum complete (`forbiddenState`).
- [x] Lock guard di `route()` choke-point: tolak tulis `clinical.*` saat `lockedAt` terisi (baca lolos; transisi lifecycle tak terkena).
- [x] Extend `transitionKunjungan` API client + `KunjunganDTO` (lockedAt/selesaiAt/selesaiPertamaAt/disposisi/alasanReopen). tsc+eslint bersih.

## Fase 3 — FE Wiring ✅

- [x] **Shell** [IGDRecordShell](src/components/igd/IGDRecordShell.tsx) — pemilik lifecycle (status/version/locked/selesaiAt), self-fetch (UUID) / initialKunjungan (resolver) / demo (mock); handler complete+reopen; dipakai [page.tsx](src/app/ehis-care/(fullpage)/igd/[id]/page.tsx) + [IGDRecordResolver](src/components/igd/IGDRecordResolver.tsx).
- [x] Tab **Pasien Pulang**: submit → `onComplete` (build DisposisiInput + waktuSelesai); sukses → kunci. (Detail per-jenis panel = follow-up.)
- [x] **Tombol kanan-atas** (slot `headerAction` di PatientHeader) → [SelesaikanDialog](src/components/igd/selesai/SelesaikanDialog.tsx) mini-form (jenis+waktu+kondisi+catatan) + **konfirmasi ekstra** (checkbox "paham terkunci").
- [x] **Overlay blur+lock** saat `locked` di IGDRecordTabs + banner "rekam medis terkunci".
- [x] **Batal Selesai** [BatalSelesaiDialog](src/components/igd/selesai/BatalSelesaiDialog.tsx) (alasanReopen opsional + info waktu pertama dipertahankan) → `reopen`.
- [x] Gate Diagnosa Utama = **ditegakkan backend** (forbiddenState → toast); FE tak hard-block (patient.diagnosa kosong utk kunjungan DB).

## Fase 4 — Board ✅

- [x] IGDWorkspace: fetch `Completed` + seksi **"Selesai Hari Ini"** (filter `selesaiAt` UTC = hari ini) → `PatientCard` tanpa aksi → link `/igd/:uuid` → rekam medis read-only (overlay lock).

## DoD

- [x] eslint bersih file tersentuh (sisa `_actor` = ABAC seam disengaja).
- [x] `npx tsc --noEmit` bersih di `src/` (exit 2 = noise `.next`/`.mts` saja).
- [x] Update [TODO-CLINICAL.md](TODO-CLINICAL.md) (Domain Outcome/Disposisi: Pasien Pulang #19) + pointer [CLAUDE.md](CLAUDE.md).
- [x] Tandai progress di dokumen ini.

---

## Follow-up (di luar scope inti)

- Detail per-jenis disposisi (RujukanPanel tujuan/alasan · MeninggalPanel waktu/sebab · APSPanel alasan · SBARTransferPanel) belum di-lift ke payload — sub-panel masih confirmation-gated. Kolom DB sudah siap.
- TTV keluar tidak disimpan di Disposisi (single-source Observation) — form Pasien Pulang masih punya field TTV visual (tak persist).
- Rawat_Inap deep-link ke pendaftaran RI (`asalMasuk: Dari IGD`) belum dibuat (disposisi cuma menandai jenis).
- Riwayat reopen multi-kali (hanya `alasanReopen` terakhir disimpan) → menyusul audit-trail C1.
