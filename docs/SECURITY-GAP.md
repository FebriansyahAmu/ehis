# Security GAP Register — OWASP

> Temuan keamanan EHIS terhadap **OWASP ASVS 5.0 (target L2)**, **OWASP Top 10:2025**, dan **OWASP API Security
> Top 10 (2023)**. Aturan kerja → [ENGINEERING-RULES.md §3](ENGINEERING-RULES.md). Format mengikuti
> [FHIR-GAP.md](FHIR-GAP.md): setiap gap = **apa · kenapa · cara tutup**. Tutup gap → ubah status ke ✅ + tanggal
> + branch (jangan hapus baris, jejak audit).

| Status | Arti |
|---|---|
| 🔴 | P1 — perbaiki sebelum ada deployment yang dapat diakses pengguna lain |
| 🟡 | P2 — perbaiki sebelum produksi |
| ⚪ | P3 — hardening / verifikasi |

Asesmen awal: **2026-11-17** (analisis statis kode + konfigurasi, tanpa pentest dinamis).

## Antrean perbaikan (ditunda — keputusan user 2026-11-17)

Dikerjakan setelah setup UI shadcn, masing-masing di branch sendiri ([ENGINEERING-RULES §1](ENGINEERING-RULES.md)):

| Urutan | Branch | Menutup | Prasyarat / catatan |
|---|---|---|---|
| 1 | `fix/ci-baseline` | **SG-14** (+FG-01) | Butuh hasil CI pertama di GitHub (push + PR). Perbaiki error tsc/ESLint lama yang muncul → aktifkan *Require status checks* untuk `main`. |
| 2 | `fix/security-p1` | **SG-01** header · **SG-02** cek Origin · **SG-03** `AUTH_ENFORCE` fail-fast | Wajib sebelum ada deployment yang dapat diakses pengguna lain (server bersama/staging). CSP mulai Report-Only. |

Selama antrean ini belum dikerjakan: **jangan deploy** ke lingkungan yang dapat diakses orang lain tanpa `AUTH_ENFORCE=true` dan header keamanan.

---

## Konfigurasi & sesi

| ID | Status | Gap | Referensi | Cara tutup |
|---|---|---|---|---|
| SG-01 | 🔴 | **Tanpa security header** — [next.config.ts](../next.config.ts) kosong: tidak ada CSP, HSTS, `frame-ancestors`/X-Frame-Options, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Halaman rekam medis bisa di-*iframe* (clickjacking), tanpa lapisan mitigasi XSS. | A02 Security Misconfiguration · ASVS Web Frontend Security | `headers()` di next.config: HSTS (prod), `frame-ancestors 'none'`, `nosniff`, `strict-origin-when-cross-origin`, `Permissions-Policy` (kamera hanya `self` — dipakai `react-webcam`). CSP mulai **Report-Only**, lalu enforce setelah dipastikan tak memblokir (framer-motion inline style, `next/font`). |
| SG-02 | 🔴 | **Tanpa cek Origin pada request mutasi** — perlindungan CSRF hanya `sameSite=lax` cookie ([cookies.ts](../src/lib/auth/cookies.ts)); [route()](../src/lib/http/route.ts) tidak memverifikasi `Origin`/`Sec-Fetch-Site` untuk POST/PUT/PATCH/DELETE. | A01 · ASVS Web Frontend Security (origin separation) | Di `route()`: method mutasi wajib `Origin` = host aplikasi (atau `Sec-Fetch-Site: same-origin`), selain itu 403. Daftar origin tepercaya dari env. |
| SG-03 | 🔴 | **`AUTH_ENFORCE` default `false` → setiap request tanpa sesi menjadi DEV actor superuser** ([actor.ts](../src/lib/auth/actor.ts)). Deployment yang lupa men-set flag = akses penuh tanpa login. | A07 Authentication Failures · A02 | Fail-fast: saat `NODE_ENV=production` dan `AUTH_ENFORCE !== "true"` → server menolak start / semua request 503. DEV actor hanya boleh di development. |
| SG-04 | 🟡 | **Rate-limit login hanya lockout per akun** (DB `failedLoginCount/lockedUntil`, [authService.ts](../src/lib/services/authService.ts)) — tanpa batas per IP: *credential stuffing* lintas akun tak terbendung, dan penyerang bisa sengaja mengunci akun petugas (DoS). | A07 · ASVS Authentication | Throttle per IP + per username (in-memory sekarang, Redis saat multi-instance); lockout progresif (backoff) bukan kunci keras; pesan error login generik. |
| SG-13 | ⚪ | Cookie sesi tanpa prefix `__Host-` (mengikat cookie ke host, path `/`, `Secure`). | ASVS Session Management | Ganti nama ke `__Host-ehis_at` / `__Host-ehis_rt` di production (proxy + cookies.ts + migrasi sesi = logout sekali). |

## Akses & data

| ID | Status | Gap | Referensi | Cara tutup |
|---|---|---|---|---|
| SG-05 | 🟡 | **Jalur otorisasi tanpa test** — baru 4 file test (auth/user/pegawai); `route()` RBAC, `scopeKunjungan`, careUnit ABAC, SDM Assignment, dan cek kepemilikan Service (anti-IDOR) belum punya test regresi. | API1 BOLA · API5 BFLA · A01 | Test unit: `route()` (izin kurang → 403, kunjungan di luar scope → 404/403), service yang menerima id anak (order ∈ kunjungan). Tambah bertahap per fitur yang disentuh (ENGINEERING-RULES B8). |
| SG-09 | ⚪ | **Payload FHIR di konsol `/ehis-fhir` memuat PHI** (nama, diagnosis, hasil) — dibatasi `fhir.sync:read` (Admin). Sama dengan FG-74. | ASVS Data Protection · UU PDP | Izin baca payload terpisah (mis. `fhir.payload:read`) + catat akses di audit. |
| SG-10 | 🟡 | **Tanpa log kejadian keamanan** — login gagal/lockout, penolakan RBAC/scope (403), refresh token tak valid tidak dicatat terpusat (audit hanya BPJS/FHIR/billing). Akses rekam medis tak terlacak per pengguna. | A09 Security Logging & Alerting Failures · PMK 24/2022 | Tabel `auth.SecurityEvent` (aktor, jenis, resource, ip-hash, waktu) ditulis dari authService & `route()`; tanpa PII. Akses-baca rekam medis → pertimbangkan jejak akses per kunjungan. |

## Injeksi & kode

| ID | Status | Gap | Referensi | Cara tutup |
|---|---|---|---|---|
| SG-08 | ⚪ | **`$queryRawUnsafe`** di [billingReadDal.ts](../src/lib/dal/billing/billingReadDal.ts) & [consoleDal.ts](../src/lib/dal/fhir/consoleDal.ts) — saat ini aman (nilai lewat `$n`, potongan SQL konstanta), tapi rawan regresi saat diubah. | A05 Injection | Pertahankan aturan S4; komentar peringatan di kedua fungsi; pertimbangkan `Prisma.sql`/`Prisma.join` (template ter-tipe) saat disentuh. |
| SG-11 | ⚪ | `dangerouslySetInnerHTML` di [MarginComparatorPanel.tsx](../src/components/eklaim/reports/MarginComparatorPanel.tsx) — konstanta CSS cetak statis (aman). | A05 (XSS) | Aturan S9; aktifkan `react/no-danger` sebagai *warn* agar pemakaian baru terlihat saat review. |

## Supply chain & proses

| ID | Status | Gap | Referensi | Cara tutup |
|---|---|---|---|---|
| SG-06 | 🟡 | **Secret scanning belum aktif** — `.env` sudah di-ignore, tapi tak ada pengaman bila secret tak sengaja masuk commit. | A04 · A02 | GitHub Settings → Code security → Secret scanning + **Push protection** (oleh pemilik repo). |
| SG-07 | 🟡 | **Audit dependensi belum menjadi gerbang** — job `audit` di [ci.yml](../.github/workflows/ci.yml) masih informasional (`continue-on-error`); baseline kerentanan belum diketahui. Dependabot ([dependabot.yml](../.github/dependabot.yml)) baru dikonfigurasi. | A03 Software Supply Chain Failures | Lihat hasil audit pertama di CI → tangani high/critical → hapus `continue-on-error`. Aktifkan Dependabot alerts di Settings. |
| SG-12 | ⚪ | **`xlsx` dipasang dari tarball CDN SheetJS** (0.20.3) — di luar registry npm, tidak tercakup `npm audit`/Dependabot. | A03 | Pantau rilis SheetJS manual (cek tiap kuartal); batasi pemakaian ke ekspor (bukan parsing file unggahan tak tepercaya) atau validasi ukuran/tipe sebelum parsing. |
| SG-14 | 🟡 | **Baseline CI belum diketahui** — `tsc` penuh & ESLint seluruh repo belum pernah lulus tercatat sejak lama (FG-01); CI pertama bisa merah karena utang lama. Branch protection `main` belum aktif. | Proses (ASVS Secure Coding & Architecture) | Jalankan CI pertama di PR `chore/engineering-rules` → perbaiki error di branch `fix/ci-baseline` → aktifkan *Require status checks* untuk `main`. |
