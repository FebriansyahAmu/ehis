# EHIS Backend — Domain: **Auth** (Authentication · Session · RBAC/ABAC)

> Identitas, sesi, dan otorisasi seluruh sistem. **Dibangun di B0** (auth seam) sebelum domain lain — tapi
> enforcement RBAC penuh menyusul bertahap (di awal cukup identitas + audit jalan).
>
> ⚖️ **Mewarisi [BACKEND-FLOWS.md](BACKEND-FLOWS.md)** — terutama §6 (Authz 4 lapis). Bila konflik, FLOWS menang.
> **Terkait:** [BACKEND-ENCOUNTER.md](BACKEND-ENCOUNTER.md) · [TODOS_BACKEND.md](../TODOS_BACKEND.md) (B0/B1.9 RBAC) · memori `project_backend_stack`.
> Sumber RBAC existing (frontend mock): [rbacShared.ts](../src/components/master/mapping/rbac/rbacShared.ts) · [penggunaShared.ts](../src/components/master/pengguna/penggunaShared.ts).
>
> **Model auth:** Auth.js v5 **hybrid** — JWT access pendek + DB refresh rotating + Redis revocation.
> **Status:** 📋 Spec. Implementasi belum mulai.

---

## 1. Scope domain

**Auth OWNS:**
- Identitas user (`User`), kredensial (argon2id), status akun (aktif/suspend/lock).
- Sesi: access JWT pendek + refresh token DB (rotating) + revocation Redis.
- **Enforcement** authz 4 lapis (FLOWS §6): AuthN · RBAC · ABAC/unit-scope · IDOR helper.
- Guard helpers yang dipakai semua domain: `requireAuth` · `requirePermission` · `requireScope`.
- `proxy.ts` (optimistic redirect) + Auth.js v5 wiring.

**Auth TIDAK owns** (delegasi):
- **Matriks RBAC** (Role × leaf → actions) = **master data**, dikelola di **Mapping Hub** (`/ehis-master/mapping/rbac`) → domain Master. Auth meng-*konsumsi* + *enforce* + cache.
- Data dokter/nakes → domain Patient/Master (`User.dokterId` link).
- Audit log → **BACKEND-AUDIT** (Auth hanya emit event login/logout/revoke).

> **Boundary penting:** *siapa boleh apa* (kebijakan) diatur Admin di Mapping Hub (data). *Memaksakan* kebijakan itu (enforcement) = Auth. Pisahkan policy vs enforcement.

---

## 2. Entity model

> Semua tabel domain ini di Postgres schema **`auth`** (`@@schema("auth")`) — lihat FLOWS §9 topologi multi-schema.

### 2.1 `User`
| Field | Catatan |
|---|---|
| `id` PK | UUID v7 (`@default(uuid(7)) @db.Uuid`) |
| `username` unique · `email` (citext) unique | |
| `passwordHash` | **argon2id** (bukan bcrypt; tunable) |
| roles → **`UserRole` (M:N)** | **multi-role** (keputusan terkunci). Permission efektif = **union** semua role per leaf/action (§2.2) |
| `dokterId` FK→Practitioner nullable | link untuk role klinis (Dokter/SpPK/SpRad) |
| `status` enum | `Active`\|`Suspended`\|`Locked` |
| `tokenVersion` int default 0 | **bump = revoke semua sesi** (dicek per-request via Redis) |
| `mfaEnabled` bool · `mfaSecret` (encrypted) nullable | TOTP — **DITUNDA pasca-MVP**; field disiapkan (forward-compat) |
| `failedLoginCount` int · `lockedUntil` datetime nullable | brute-force lockout |
| `lastLoginAt` · `createdAt`/`updatedAt`/`deletedAt` | soft-delete |

### 2.2 `Role` · `Permission` · `RolePermission` *(matriks = master data, di-seed dari mock)*
- **`Role`** — 9 baris: `Admin · Dokter · Perawat · Apoteker · Radiografer · SpPK · SpRad · Kasir · Registrasi`. (`key`, `name`, `description`, **`unitScoped: boolean`** — global vs unit-scoped, lihat §2.3).
- **`UserRole`** — join **M:N** `(userId, roleId)`. **Permission efektif user = UNION** `grantedActions` lintas semua role-nya per leaf (paling permisif menang). Cache `perm:user:{userId}` (invalidate saat role/RBAC user berubah).
- **`Permission`** — **atomik per (resource × action)** dari `PERMISSION_TREE` (28 leaf × aksi ≈ 100 baris). Field: `resource` (leaf key mis. `clinical.cppt`), `action` (CrudAction), `kode` unik (`clinical.cppt:update`), `nama`, `modul`. *(Relasional & ternormalisasi — bukan `actions[]` array; selaras referensi `usr_permission`.)*
- **`RolePermission`** — **join murni** `(roleId, permissionId)` = `RBACMap`. Matrix leaf→actions[] untuk UI = hasil **derive** dari join ini. Editable di Mapping Hub. Seed dari `ROLE_DEFAULT_GRANTS`.
- **`CrudAction`** enum = `read · create · update · delete · export` (5).

### 2.3 `UserUnitScope` *(ABAC — least privilege)*
- `(userId, unitId/unitKey)` — unit yang boleh diakses user (mis. Perawat hanya ICU). Sumber: `Pengguna.unitAssignment` (Mapping Hub).
- **Semantik kosong (terkunci, best practice least-privilege):**
  - **Role global** (`Role.unitScoped=false` — Admin/Registrasi/Kasir) → cek unit-scope **di-bypass**, akses semua unit.
  - **Role unit-scoped** (`unitScoped=true` — Perawat/Dokter) → **wajib ≥1 unit**; `UserUnitScope` kosong = **tolak** akses data klinis (fail-closed).

### 2.4 `RefreshToken` (sesi)
| Field | Catatan |
|---|---|
| `id` PK · `userId` FK | |
| `tokenHash` | refresh token di-hash (jangan simpan plaintext) |
| `familyId` | grup rotasi — **reuse detection** |
| `expiresAt` | **3 jam** (idle timeout; sliding — di-perpanjang saat rotasi) |
| `revokedAt` nullable · `replacedById` nullable | rotasi/cabut |
| `ip` · `userAgent` · `createdAt` · `lastUsedAt` | audit sesi (UU PDP) |

### 2.5 Redis (bukan tabel)
- `revoked:jti:{jti}` → blocklist access token (TTL = sisa umur token).
- `tokenVersion:{userId}` → cache versi (cek cepat per-request; bump saat revoke).
- `rl:login:{ip|username}` → counter rate-limit login.
- `perm:{roleId}` → cache RBACMap role (invalidate saat Mapping Hub update).

---

## 3. Lifecycle sesi (state machine)

```
Login (kredensial) ─▶ Active ─(access exp 30m)─▶ Refresh(rotate) ─▶ Active …  [refresh idle 3h]
       │                     │
       │                     ├─(logout / idle timeout)─▶ Revoked (sesi ini)
       └─(gagal Nx)─▶ Locked └─(revoke-all: bump tokenVersion)─▶ Revoked (semua sesi user)
```

### Alur inti

**Login** — verifikasi `username`+password (argon2id) →
- terbitkan **access JWT** (**30m**; claims: `sub`, `roles[]`, `tokenVersion`, `jti`, `exp`, opsional `unitScope[]`),
- terbitkan **refresh token** (random, simpan **hash** di `RefreshToken`, set cookie httpOnly),
- catat `lastLoginAt` + emit audit `LOGIN`. Rate-limit + reset `failedLoginCount`.

**Per request (jalur panas)** — verify signature JWT (in-memory) → **1 cek Redis**: `jti` tak di-blocklist **dan** `tokenVersion` cocok → lolos. (≈ secepat JWT murni, tetap bisa dicabut.)

**Refresh** — access expired → kirim refresh → cek hash di DB + belum revoked + belum expired → **rotasi**: terbitkan refresh baru, `revokedAt` yang lama, link `replacedById`. **Reuse detection:** bila refresh sudah-revoked dipakai lagi → indikasi pencurian → revoke seluruh `familyId` + bump `tokenVersion`.

**Revoke instan** — logout 1 device: blocklist `jti` + revoke refresh. Revoke semua (pecat/ganti password/breach): **bump `tokenVersion`** (DB+Redis) → semua access invalid + hapus refresh user.

**Lockout** — `failedLoginCount ≥ N` → set `lockedUntil` (backoff). Rate-limit Redis per IP+username.

---

## 4. Layer breakdown

### 4.1 `proxy.ts` (Next.js 16, edge — optimistic saja)
- Set `correlationId`. Cek **cookie sesi ADA** → bila tidak & route butuh auth → redirect `/login`. Rate-limit kasar.
- **❌ TIDAK** verify signature/Redis/RBAC di sini (FLOWS §6 — edge bisa di-bypass). `config.matcher` untuk page routes.

### 4.2 Guards — `lib/auth/guards.ts` (dipakai semua Route)
- `requireAuth(req) → Actor` — verify JWT + Redis revoke check; gagal → `UNAUTHENTICATED` (401).
- `requirePermission(actor, leafKey, action)` — cek **union** `RolePermission` semua role actor (cache `perm:user:{id}`); gagal → `FORBIDDEN` (403).
- `requireScope(actor, unit)` — role global bypass; role unit-scoped cek `UserUnitScope` (kosong → tolak); di luar → `FORBIDDEN`/`NOT_FOUND`.
- `Actor = { userId, roles[], unitScope[], dokterId? }` — diteruskan ke Service untuk authz row-level (IDOR).

### 4.3 Service — `lib/services/authService.ts`
- `login(credentials, ctx)` · `refresh(token, ctx)` · `logout(jti)` · `revokeAllSessions(userId)` · `verifyMfa()` · `changePassword()`.
- Transaksi untuk rotasi refresh. Emit audit. Inject `clock`/`genId` (FLOWS §14).
- `getPermissions(role)` — baca `RolePermission` (cache-aside Redis `perm:{roleId}`).

### 4.4 DAL — `lib/dal/authDal.ts`
- `findUserByUsername` · `findRefreshByHash` · `createRefresh`/`rotateRefresh`/`revokeRefreshFamily` · `bumpTokenVersion` · `incFailedLogin`/`resetFailedLogin`.

### 4.5 Schema/DTO — `lib/schemas/auth.ts` (Zod)
- `LoginInput` (username, password, mfaCode?), `RefreshInput`. Output: **tak pernah** kirim hash/secret.

### 4.6 API — `app/api/v1/auth/*`
| Method | Path | Service |
|---|---|---|
| POST | `/api/v1/auth/login` | `login` |
| POST | `/api/v1/auth/refresh` | `refresh` |
| POST | `/api/v1/auth/logout` | `logout` |
| POST | `/api/v1/auth/mfa/verify` | `verifyMfa` |
| GET | `/api/v1/auth/me` | session + permissions (untuk UI gating) |

### 4.7 Auth.js v5 wiring
- **Credentials provider** (username+password) + **JWT session strategy** (cookie httpOnly + CSRF built-in).
- **Callbacks**: `jwt` inject `roles[]`/`tokenVersion`/`unitScope[]`; `session` expose ke `/me`.
- Refresh-rotation + revocation Redis = **lapisan kita** di `lib/auth` (Auth.js JWT default tak punya revoke). `auth()` Auth.js dipanggil di `requireAuth` lalu ditambah cek Redis.

---

## 5. Event (audit)
Emit ke **BACKEND-AUDIT**: `LOGIN`, `LOGIN_FAILED`, `LOGOUT`, `REFRESH`, `REVOKE_ALL`, `PASSWORD_CHANGE`, `MFA_ENABLED`, `ACCOUNT_LOCKED`. Simpan ip/ua/actor. **PII-scrubbing** — jangan log password/token.

---

## 6. Indexing
- `User.username` unique, `User.email` unique, `User.roleId`.
- `RefreshToken.tokenHash` unique, `(userId, revokedAt)`, `familyId`.
- `RolePermission (roleId, permissionKey)` unique composite.
- `UserUnitScope (userId, unitId)` unique composite.

---

## 7. Failure modes

| Skenario | Penanganan |
|---|---|
| Brute-force login | rate-limit Redis + `failedLoginCount`→`lockedUntil` (backoff) |
| Refresh token dicuri & dipakai ulang | reuse detection (familyId revoked) → cabut semua sesi user |
| Pecat staf / ganti password | `revokeAllSessions` → bump `tokenVersion` (instan) |
| RBAC matrix berubah di Mapping Hub | invalidate cache `perm:{roleId}` |
| **Redis down** | **graceful degradation** (terkunci): signature JWT tetap divalidasi (stateless); revoke-check di-skip → fall back JWT-only + **alert keras** + (opsional) cek `tokenVersion` ke DB untuk aksi sensitif. Risiko dibatasi TTL 30m. Revoke pada **refresh** tetap ketat (hit DB). **Bukan** fail-closed global (life-safety). |
| Clock skew JWT | toleransi kecil; `clock` injectable |

---

## 8. Migrasi mock → DB

- **Tak ada auth di frontend saat ini** — semua route terbuka. Frontend marker `// TODO(RBAC-B0)` (mis. di Antrean Pengaturan Hak Akses) menunggu domain ini.
- **Seed dari mock**: `Role` (9) + `Permission` (28 leaf dari `PERMISSION_TREE`) + `RolePermission` (dari `ROLE_DEFAULT_GRANTS`) + `User` contoh per role. `UserUnitScope` dari `Pengguna.unitAssignment`.
- **Frontend swap**: tambah login page + `/me` untuk UI permission-gating (sembunyikan menu/aksi sesuai `RolePermission`). Mapping Hub RBAC pane → `PUT /api/master/mapping/rbac` (domain Master) yang menulis `RolePermission` + invalidate cache Auth.
- Enforcement bertahap: B0 = identitas + audit jalan (gate longgar); kemudian aktifkan `requirePermission`/`requireScope` per modul.

---

## 9. Task checklist

### AUTH0 — Schema & seed
- [ ] Prisma model `User`/`Role`(+`unitScoped`)/`UserRole`(M:N)/`Permission`/`RolePermission`/`UserUnitScope`/`RefreshToken` + enum `CrudAction`/`UserStatus`.
- [ ] Index (§6) + unique constraints.
- [ ] Seed dari `rbacShared` (`PERMISSION_TREE` + `ROLE_DEFAULT_GRANTS`) + user contoh per role + password argon2id.

### AUTH1 — Core hybrid
- [ ] `lib/auth`: hash (argon2id), JWT issue/verify (inject `clock`), refresh rotation + reuse detection, Redis revoke (`jti` blocklist + `tokenVersion`).
- [ ] `authService` login/refresh/logout/revokeAll + rate-limit + lockout.
- [ ] `authDal`.

### AUTH2 — Auth.js v5 + proxy
- [ ] Auth.js Credentials + JWT strategy + callbacks (role/tokenVersion/unitScope).
- [ ] `proxy.ts` optimistic redirect + correlationId (BUKAN auth authoritative).

### AUTH3 — Guards & enforcement
- [ ] `requireAuth`/`requirePermission`/`requireScope` + `Actor` type.
- [ ] Cache RBAC `perm:{roleId}` (cache-aside + invalidate).
- [ ] Integrasi 1 domain percontohan (Encounter) sebagai bukti.

### AUTH4 — API & UI
- [ ] Route `/api/v1/auth/*` (login/refresh/logout/mfa/me) tipis + envelope.
- [ ] Login page + `/me` permission-gating frontend.

### AUTH5 — Polish *(MFA DITUNDA pasca-MVP)*
- [ ] Idle timeout (refresh 3h). Security headers.
- [~] MFA TOTP — **ditunda**; field `mfaEnabled`/`mfaSecret` tetap di schema untuk forward-compat (enforcement nanti).

### AUTH6 — Tests
- [ ] Unit: login sukses/gagal/lockout · refresh rotate · **reuse detection** · revoke bump version · `requirePermission` allow/deny · `requireScope`.
- [ ] Integration DAL (refresh family, RLS context set).

---

## 10. Keputusan (terkunci 2026-06-01)

1. ✅ **Multi-role** — user punya banyak role (`UserRole` M:N). Permission efektif = **union** lintas role (paling permisif menang).
2. ✅ **TTL** — access **30 menit** · refresh **3 jam** (idle timeout, sliding saat rotasi).
3. ✅ **MFA DITUNDA** pasca-MVP — field `mfaEnabled`/`mfaSecret` tetap di schema (forward-compat), enforcement nanti.
4. ✅ **Unit-scope least-privilege** — `Role.unitScoped` flag: role global (Admin/Registrasi/Kasir) bypass; role scoped (Perawat/Dokter) **wajib ≥1 unit**, kosong = tolak data klinis.
5. ✅ **Redis down = graceful degradation** — validasi JWT-only + alert + (opsional) `tokenVersion` ke DB untuk aksi sensitif; **bukan** fail-closed global (life-safety). Risiko dibatasi TTL 30m.
6. ⏳ **SSO/LDAP** — **terbuka** (Credentials lokal dulu; SSO menyusul bila RS punya IdP).
