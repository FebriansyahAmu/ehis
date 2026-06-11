// authService — autentikasi & sesi runtime (login/refresh/logout/revoke/changePassword).
// Acuan: docs/BACKEND-AUTH.md §3/§4.3. Tak impor prisma langsung (pakai `transaction` + DAL).
// Lapisan sesi = custom JWT (jose). Redis DITUNDA → rate-limit Redis & blocklist jti belum;
// lockout pakai DB (failedLoginCount/lockedUntil); revoke ditegakkan saat refresh (DB).

import { randomUUID } from "node:crypto";
import { transaction } from "@/lib/db/prisma";
import * as defaultAuthDal from "@/lib/dal/authDal";
import { verifyPassword, hashPassword } from "@/lib/crypto/password";
import { issueAccessToken } from "@/lib/auth/jwt";
import { generateRefreshToken, hashRefreshToken, refreshExpiry } from "@/lib/auth/tokens";
import { permissionsForRoles } from "@/lib/auth/rbacCache";
import { hasSuperuserRole } from "@/lib/auth/superuser";
import { careUnitsFromUnitKerja } from "@/lib/auth/careUnit";
import { Errors } from "@/lib/errors/appError";
import type { LoginInput, ChangePasswordInput, SessionDTO } from "@/lib/schemas/auth";
import type { AuthUserEntity } from "@/lib/dal/authDal";

const MAX_FAILED = 5; // §7 brute-force
const LOCK_MINUTES = 15;

export interface SessionContext {
  ip?: string | null;
  userAgent?: string | null;
}

export interface AuthResult {
  session: SessionDTO;
  accessToken: string;
  accessExpiresAt: Date;
  refreshToken: string;
  refreshExpiresAt: Date;
}

type AuthDal = typeof defaultAuthDal;

export function makeAuthService(deps: { dal?: AuthDal; clock?: () => Date } = {}) {
  const dal = deps.dal ?? defaultAuthDal;
  const now = deps.clock ?? (() => new Date());

  function namaTampil(p: { gelarDepan: string | null; namaLengkap: string; gelarBelakang: string | null }): string {
    const depan = p.gelarDepan ? `${p.gelarDepan} ` : "";
    const belakang = p.gelarBelakang ? `, ${p.gelarBelakang}` : "";
    return `${depan}${p.namaLengkap}${belakang}`;
  }

  /** Reduksi roles aktif + unit-scope → bahan claim/sesi. */
  function authzOf(u: AuthUserEntity) {
    const activeRoles = u.roles.map((r) => r.role).filter((r) => r.isActive);
    const roleKeys = activeRoles.map((r) => r.key);
    const isGlobal = activeRoles.some((r) => r.unitScoped === false);
    const unitIds = u.unitScopes.map((s) => s.unitId);
    const careUnits = careUnitsFromUnitKerja(u.pegawai.unitKerja); // ABAC: dari Pegawai.unitKerja
    return { roleKeys, isGlobal, unitIds, careUnits };
  }

  async function buildSession(u: AuthUserEntity): Promise<SessionDTO> {
    const { roleKeys, isGlobal, unitIds, careUnits } = authzOf(u);
    const perms = await permissionsForRoles(roleKeys);
    return {
      userId: u.id,
      pegawaiId: u.pegawaiId,
      username: u.username,
      namaTampil: namaTampil(u.pegawai),
      roles: roleKeys,
      isGlobal,
      isSuperuser: hasSuperuserRole(roleKeys),
      unitIds,
      careUnits,
      permissions: [...perms],
      mustChangePassword: u.mustChangePassword,
    };
  }

  /** Terbitkan access JWT + refresh (family baru) → simpan refresh hash dalam `tx`. */
  async function issueSession(
    u: AuthUserEntity,
    ctx: SessionContext,
    tx: Parameters<Parameters<typeof transaction>[0]>[0],
    at: Date,
  ): Promise<Omit<AuthResult, "session">> {
    const { roleKeys, isGlobal, unitIds, careUnits } = authzOf(u);
    const { token: accessToken, expiresAt: accessExpiresAt } = await issueAccessToken(
      { sub: u.id, pegawaiId: u.pegawaiId, roles: roleKeys, isGlobal, unitIds, careUnits, tokenVersion: u.tokenVersion },
      at,
    );
    const refreshToken = generateRefreshToken();
    const refreshExpiresAt = refreshExpiry(at);
    await dal.createRefresh(
      {
        userId: u.id,
        tokenHash: hashRefreshToken(refreshToken),
        familyId: randomUUID(),
        expiresAt: refreshExpiresAt,
        ip: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      },
      tx,
    );
    return { accessToken, accessExpiresAt, refreshToken, refreshExpiresAt };
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function login(input: LoginInput, ctx: SessionContext = {}): Promise<AuthResult> {
    const at = now();
    const u = await dal.findByUsername(input.username);
    // Pesan generik (anti user-enumeration). verifyPassword tetap dijalankan? user null → tolak.
    if (!u) throw Errors.unauthenticated("Username atau password salah");
    if (u.lockedUntil && u.lockedUntil > at) {
      throw Errors.unauthenticated("Akun terkunci sementara karena percobaan gagal. Coba lagi nanti.");
    }
    if (u.status !== "Active") throw Errors.forbidden("Akun tidak aktif. Hubungi administrator.");

    if (!verifyPassword(input.password, u.passwordHash)) {
      const willLock = u.failedLoginCount + 1 >= MAX_FAILED;
      const lockedUntil = willLock ? new Date(at.getTime() + LOCK_MINUTES * 60_000) : null;
      await dal.incFailedLogin(u.id, lockedUntil);
      throw Errors.unauthenticated("Username atau password salah");
    }

    const result = await transaction(async (tx) => {
      await dal.resetFailedLogin(u.id, ctx.ip ?? null, at, tx);
      return issueSession(u, ctx, tx, at);
    });
    return { session: await buildSession(u), ...result };
  }

  // ── Refresh (rotating + reuse detection) ─────────────────────────────────────
  async function refresh(refreshToken: string, ctx: SessionContext = {}): Promise<AuthResult> {
    const at = now();
    const row = await dal.findRefreshByHash(hashRefreshToken(refreshToken));
    if (!row) throw Errors.unauthenticated("Sesi tidak valid");

    // Reuse detection: token sudah-revoked dipakai lagi → indikasi pencurian.
    if (row.revokedAt) {
      await transaction(async (tx) => {
        await dal.revokeFamily(row.familyId, at, tx);
        await dal.bumpTokenVersion(row.userId, tx);
      });
      throw Errors.unauthenticated("Sesi dicabut. Silakan masuk kembali.");
    }
    if (row.expiresAt <= at) throw Errors.unauthenticated("Sesi kedaluwarsa. Silakan masuk kembali.");

    const u = await dal.findAuthById(row.userId);
    if (!u || u.status !== "Active") throw Errors.unauthenticated("Akun tidak aktif");

    const result = await transaction(async (tx) => {
      const issued = await issueSession(u, ctx, tx, at);
      // Rotasi: cabut token lama. (replacedById di-link via family — versi ringkas.)
      await dal.revokeRefresh(row.id, at, null, tx);
      return issued;
    });
    return { session: await buildSession(u), ...result };
  }

  // ── Logout (1 device) ────────────────────────────────────────────────────────
  async function logout(refreshToken: string | null): Promise<void> {
    if (!refreshToken) return;
    const row = await dal.findRefreshByHash(hashRefreshToken(refreshToken));
    if (row && !row.revokedAt) await dal.revokeRefresh(row.id, now(), null);
  }

  // ── Revoke semua sesi (pecat / ganti password / breach) ────────────────────---
  async function revokeAllSessions(userId: string): Promise<void> {
    const at = now();
    await transaction(async (tx) => {
      await dal.bumpTokenVersion(userId, tx);
      await dal.revokeAllUserRefresh(userId, at, tx);
    });
  }

  // ── Ganti password (paksa re-login semua sesi) ───────────────────────────────
  async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const u = await dal.findAuthById(userId);
    if (!u) throw Errors.notFound("Akun tidak ditemukan");
    if (!verifyPassword(input.passwordLama, u.passwordHash)) {
      throw Errors.validation("Password lama salah");
    }
    const at = now();
    await transaction(async (tx) => {
      await dal.updatePassword(userId, hashPassword(input.passwordBaru), tx);
      await dal.bumpTokenVersion(userId, tx);
      await dal.revokeAllUserRefresh(userId, at, tx);
    });
  }

  /** Bangun sesi dari userId (GET /auth/me). */
  async function getSession(userId: string): Promise<SessionDTO> {
    const u = await dal.findAuthById(userId);
    if (!u) throw Errors.unauthenticated("Sesi tidak valid");
    return buildSession(u);
  }

  return { login, refresh, logout, revokeAllSessions, changePassword, getSession };
}

export const authService = makeAuthService();
