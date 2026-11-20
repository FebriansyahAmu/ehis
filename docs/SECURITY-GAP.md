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
| 2 | `fix/security-p1` ✅ 2026-11-21 | **SG-01** header · **SG-02** cek Origin · **SG-03** `AUTH_ENFORCE` · **SG-15** enhance-signature | Selesai di branch (menunggu merge). CSP sasaran masih Report-Only → lanjut **SG-16**. |

Sebelum branch `fix/security-p1` masuk `main`: **jangan deploy** ke lingkungan yang dapat diakses orang lain.

**Konfigurasi deploy (env, dibaca saat build/runtime):**

| Env | Default | Fungsi |
|---|---|---|
| `TRUSTED_ORIGINS` | kosong | Origin tambahan yang boleh memanggil API, dipisah koma (mis. `https://ehis.rs.id`). Biasanya tak perlu: origin = host aplikasi sudah otomatis dipercaya. |
| `HSTS_MAX_AGE` | `300` | Detik. Dibaca saat `next build`. Naikkan ke `31536000` setelah domain dan semua subdomainnya dipastikan HTTPS. |
| `AUTH_ENFORCE` | — | Di production penegakan auth selalu aktif; set `true` agar eksplisit (server memberi peringatan bila tidak). |

**Reverse proxy:** teruskan `Host` asli atau set `X-Forwarded-Host`. Lewat HTTP biasa (bukan HTTPS/localhost) browser tidak mengirim `Sec-Fetch-Site`, sehingga penjaga Origin membandingkan `Origin` dengan host. Bila proxy menulis ulang host tanpa `X-Forwarded-Host`, request mutasi akan ditolak 403 (atasi dengan header itu atau `TRUSTED_ORIGINS`).

---

## Konfigurasi & sesi

| ID | Status | Gap | Referensi | Cara tutup |
|---|---|---|---|---|
| SG-01 | ✅ 2026-11-21 · `fix/security-p1` | **Tanpa security header** — [next.config.ts](../next.config.ts) kosong: tidak ada CSP, HSTS, `frame-ancestors`/X-Frame-Options, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. Halaman rekam medis bisa di-*iframe* (clickjacking), tanpa lapisan mitigasi XSS. | A02 Security Misconfiguration · ASVS Web Frontend Security | `headers()` di next.config: HSTS (prod), `frame-ancestors 'none'`, `nosniff`, `strict-origin-when-cross-origin`, `Permissions-Policy` (kamera hanya `self` — dipakai `react-webcam`). CSP mulai **Report-Only**, lalu enforce setelah dipastikan tak memblokir (framer-motion inline style, `next/font`). **Ditutup:** [next.config.ts](../next.config.ts) `headers()` — CSP **ditegakkan** untuk `frame-ancestors 'none'` · `object-src 'none'` · `base-uri 'none'` · `form-action 'self'` + `X-Frame-Options: DENY` · `nosniff` · `Referrer-Policy` · `Permissions-Policy` (kamera `self`) · COOP `same-origin-allow-popups` · CORP `same-origin` · HSTS production (`HSTS_MAX_AGE`, default 300 dtk) · `Vary: Origin, Sec-Fetch-Site` di `/api`. CSP sasaran lengkap = **Report-Only** → SG-16. |
| SG-02 | ✅ 2026-11-21 · `fix/security-p1` | **Tanpa cek Origin pada request mutasi** — perlindungan CSRF hanya `sameSite=lax` cookie ([cookies.ts](../src/lib/auth/cookies.ts)); [route()](../src/lib/http/route.ts) tidak memverifikasi `Origin`/`Sec-Fetch-Site` untuk POST/PUT/PATCH/DELETE. | A01 · ASVS Web Frontend Security (origin separation) | Di `route()`: method mutasi wajib `Origin` = host aplikasi (atau `Sec-Fetch-Site: same-origin`), selain itu 403. Daftar origin tepercaya dari env. **Ditutup:** [originGuard.ts](../src/lib/http/originGuard.ts) dipanggil paling awal di `route()` (sebelum AuthN) + handler mentah auth login/logout/refresh + enhance-signature. `Sec-Fetch-Site` hanya `same-origin`/`none` (semua method; `same-site` ditolak); tanpa header itu → `Origin` harus = host (`Host`/`X-Forwarded-Host`) atau `TRUSTED_ORIGINS`; klien tanpa `Origin` (Postman/curl) lolos. Test: [originGuard.test.ts](../src/lib/http/originGuard.test.ts) (12 kasus, lulus lokal). |
| SG-03 | ✅ 2026-11-21 · `fix/security-p1` | **`AUTH_ENFORCE` default `false` → setiap request tanpa sesi menjadi DEV actor superuser** ([actor.ts](../src/lib/auth/actor.ts)). Deployment yang lupa men-set flag = akses penuh tanpa login. | A07 Authentication Failures · A02 | Fail-fast: saat `NODE_ENV=production` dan `AUTH_ENFORCE !== "true"` → server menolak start / semua request 503. DEV actor hanya boleh di development. **Ditutup (varian fail-safe, bukan fail-fast):** [enforce.ts](../src/lib/auth/enforce.ts) `isAuthEnforced()` = `AUTH_ENFORCE === "true"` **atau** `NODE_ENV === "production"` — dipakai `getActor` dan proxy, jadi production tak pernah memakai DEV actor apa pun nilai flag; [instrumentation.ts](../src/instrumentation.ts) memberi peringatan saat start bila flag tak eksplisit. Dipilih karena server tetap melayani dengan aman alih-alih mati. |
| SG-04 | 🟡 | **Rate-limit login hanya lockout per akun** (DB `failedLoginCount/lockedUntil`, [authService.ts](../src/lib/services/authService.ts)) — tanpa batas per IP: *credential stuffing* lintas akun tak terbendung, dan penyerang bisa sengaja mengunci akun petugas (DoS). | A07 · ASVS Authentication | Throttle per IP + per username (in-memory sekarang, Redis saat multi-instance); lockout progresif (backoff) bukan kunci keras; pesan error login generik. |
| SG-15 | ✅ 2026-11-21 · `fix/security-p1` | **`POST /api/enhance-signature` tanpa autentikasi & tanpa batas ukuran** — handler mentah (bukan `route()`, di luar matcher proxy) memproses gambar base64 dengan `sharp` (CPU + memori berat): siapa pun yang menjangkau server bisa membebaninya. | A01 · API4 Unrestricted Resource Consumption | **Ditutup:** [route.ts](../src/app/api/enhance-signature/route.ts) — `assertAllowedOrigin` + `getActor` (401 tanpa sesi saat auth ditegakkan) + batas 10 MB (`content-length` → 413, `imageData` non-string/terlalu besar → 400). Pemanggil tunggal [imageEnhance.ts](../src/lib/informed-consent/imageEnhance.ts) fetch same-origin (cookie ikut). |
| SG-16 | 🟡 | **CSP sasaran belum ditegakkan** — kebijakan lengkap (`default-src`/`script-src`…) baru Report-Only dengan `script-src 'unsafe-inline'` (tanpa nonce) dan tanpa endpoint laporan; pelanggaran hanya terlihat di konsol/tab Issues DevTools. HSTS default 300 dtk. | A05 (XSS) · ASVS Web Frontend Security | Nonce per request di proxy + `'strict-dynamic' 'report-sample'` (Next membaca nonce dari header CSP; halaman jadi dinamis) → `Reporting-Endpoints` + endpoint laporan (tanpa PII, rate-limited) → amati beberapa hari → enforce. Naikkan `HSTS_MAX_AGE` ke 31536000 setelah HTTPS domain + subdomain pasti. |
| SG-13 | ⚪ | Cookie sesi tanpa prefix `__Host-` (mengikat cookie ke host, path `/`, `Secure`). | ASVS Session Management | Ganti nama ke `__Host-ehis_at` / `__Host-ehis_rt` di production (proxy + cookies.ts + migrasi sesi = logout sekali). |

## Akses & data

| ID | Status | Gap | Referensi | Cara tutup |
|---|---|---|---|---|
| SG-05 | 🟡 | **Jalur otorisasi tanpa test** — baru 4 file test (auth/user/pegawai); `route()` RBAC, `scopeKunjungan`, careUnit ABAC, SDM Assignment, dan cek kepemilikan Service (anti-IDOR) belum punya test regresi. | API1 BOLA · API5 BFLA · A01 | Test unit: `route()` (izin kurang → 403, kunjungan di luar scope → 404/403), service yang menerima id anak (order ∈ kunjungan). Tambah bertahap per fitur yang disentuh (ENGINEERING-RULES B8). |
| SG-09 | ⚪ | **Payload FHIR di konsol `/ehis-fhir` memuat PHI** (nama, diagnosis, hasil) — dibatasi `fhir.sync:read` (Admin). Sama dengan FG-74. | ASVS Data Protection · UU PDP | Izin baca payload terpisah (mis. `fhir.payload:read`) + catat akses di audit. |
| SG-10 | 🟡 (akses-baca RM ✅ 2026-11-21 · `feat/audit-akses-rekam-medis`) | **Tanpa log kejadian keamanan** — login gagal/lockout, penolakan RBAC/scope (403), refresh token tak valid tidak dicatat terpusat (audit hanya BPJS/FHIR/billing). Akses rekam medis tak terlacak per pengguna. | A09 Security Logging & Alerting Failures · PMK 24/2022 | Tabel `auth.SecurityEvent` (aktor, jenis, resource, ip-hash, waktu) ditulis dari authService & `route()`; tanpa PII. Akses-baca rekam medis → pertimbangkan jejak akses per kunjungan. **Akses-baca RM ditutup:** `auth.akses_rekam_medis` (append-only via trigger DB) ditulis `route()` lewat `after()` — GET ber-scopeKunjungan otomatis + opsi `aksesLog` (detail pasien/kunjungan, order Lab/Rad/Farmasi) + percobaan di luar unit (`denied`); dedup 15 menit; IP di-HMAC. Halaman [Jejak Akses](../src/components/master/jejak-akses/JejakAksesPage.tsx) (gate `audit.akses:read`). **Sisa:** login gagal/lockout/403/refresh tak valid → `auth.SecurityEvent`. |

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
