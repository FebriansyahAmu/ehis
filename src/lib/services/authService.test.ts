// Unit test authService (login/refresh/logout/revoke/changePassword). NO DB: authDal +
// transaction + jwt + rbacCache + password di-mock. Fokus jalur keamanan: lockout brute-force,
// reuse-detection refresh (cabut family + bump tokenVersion), rotasi, akun terkunci/non-aktif.

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  transaction: (fn: (tx: unknown) => unknown) => fn({}),
  db: (tx: unknown) => tx,
  prisma: {},
}));
vi.mock("@/lib/auth/jwt", () => ({
  ACCESS_TTL_SEC: 1800,
  issueAccessToken: vi.fn().mockResolvedValue({ token: "AT", jti: "jti-1", expiresAt: new Date("2026-06-07T00:30:00Z") }),
}));
vi.mock("@/lib/auth/rbacCache", () => ({
  permissionsForRoles: vi.fn().mockResolvedValue(new Set(["clinical.cppt:read", "clinical.cppt:create"])),
}));
vi.mock("@/lib/crypto/password", () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn().mockReturnValue("scrypt$baru"),
}));

import { makeAuthService } from "@/lib/services/authService";
import { verifyPassword } from "@/lib/crypto/password";
import type * as AuthDalNS from "@/lib/dal/authDal";

const NOW = new Date("2026-06-07T00:00:00Z");
const clock = () => NOW;
const verify = vi.mocked(verifyPassword);

function makeUser(over: Record<string, unknown> = {}) {
  return {
    id: "u1", username: "budi.santoso", passwordHash: "scrypt$lama",
    status: "Active", tokenVersion: 0, mustChangePassword: false,
    failedLoginCount: 0, lockedUntil: null, pegawaiId: "p1",
    roles: [{ role: { key: "Dokter", unitScoped: true, isActive: true } }],
    unitScopes: [{ unitId: "unit-icu" }],
    pegawai: { namaLengkap: "Budi Santoso", gelarDepan: "dr.", gelarBelakang: "Sp.JP" },
    ...over,
  };
}

function makeDal(over: Record<string, unknown> = {}) {
  return {
    findByUsername: vi.fn().mockResolvedValue(makeUser()),
    findAuthById: vi.fn().mockResolvedValue(makeUser()),
    loadRolePermissions: vi.fn(),
    incFailedLogin: vi.fn().mockResolvedValue(undefined),
    resetFailedLogin: vi.fn().mockResolvedValue(undefined),
    bumpTokenVersion: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    createRefresh: vi.fn().mockResolvedValue(undefined),
    findRefreshByHash: vi.fn(),
    revokeRefresh: vi.fn().mockResolvedValue(undefined),
    revokeFamily: vi.fn().mockResolvedValue(undefined),
    revokeAllUserRefresh: vi.fn().mockResolvedValue(undefined),
    touchRefresh: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function build(over: Record<string, unknown> = {}) {
  const dal = makeDal(over);
  const svc = makeAuthService({ dal: dal as unknown as typeof AuthDalNS, clock });
  return { svc, dal };
}

async function rejectsCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toMatchObject({ code });
}

beforeEach(() => vi.clearAllMocks());

describe("login", () => {
  it("happy: terbit access+refresh, reset gagal, sesi memuat roles/unit/permission", async () => {
    verify.mockReturnValue(true);
    const { svc, dal } = build();
    const r = await svc.login({ username: "budi.santoso", password: "benar" }, { ip: "1.1.1.1", userAgent: "ua" });

    expect(r.accessToken).toBe("AT");
    expect(r.refreshToken).toEqual(expect.any(String));
    expect(r.session.roles).toEqual(["Dokter"]);
    expect(r.session.isGlobal).toBe(false);
    expect(r.session.unitIds).toEqual(["unit-icu"]);
    expect(r.session.permissions).toContain("clinical.cppt:read");
    expect(dal.resetFailedLogin).toHaveBeenCalledWith("u1", "1.1.1.1", NOW, expect.anything());
    expect(dal.createRefresh).toHaveBeenCalledTimes(1);
  });

  it("password salah → UNAUTHENTICATED + incFailedLogin (belum lock)", async () => {
    verify.mockReturnValue(false);
    const { svc, dal } = build({ findByUsername: vi.fn().mockResolvedValue(makeUser({ failedLoginCount: 0 })) });
    await rejectsCode(svc.login({ username: "budi.santoso", password: "salah" }), "UNAUTHENTICATED");
    expect(dal.incFailedLogin).toHaveBeenCalledWith("u1", null);
    expect(dal.createRefresh).not.toHaveBeenCalled();
  });

  it("gagal ke-5 → set lockedUntil (lockout brute-force)", async () => {
    verify.mockReturnValue(false);
    const { svc, dal } = build({ findByUsername: vi.fn().mockResolvedValue(makeUser({ failedLoginCount: 4 })) });
    await rejectsCode(svc.login({ username: "budi.santoso", password: "salah" }), "UNAUTHENTICATED");
    expect(dal.incFailedLogin).toHaveBeenCalledWith("u1", expect.any(Date));
  });

  it("akun terkunci → UNAUTHENTICATED tanpa verifikasi password", async () => {
    const { svc } = build({
      findByUsername: vi.fn().mockResolvedValue(makeUser({ lockedUntil: new Date("2026-06-07T00:10:00Z") })),
    });
    await rejectsCode(svc.login({ username: "x", password: "y" }), "UNAUTHENTICATED");
    expect(verify).not.toHaveBeenCalled();
  });

  it("akun non-aktif → FORBIDDEN", async () => {
    verify.mockReturnValue(true);
    const { svc } = build({ findByUsername: vi.fn().mockResolvedValue(makeUser({ status: "Suspended" })) });
    await rejectsCode(svc.login({ username: "x", password: "y" }), "FORBIDDEN");
  });

  it("username tak ada → UNAUTHENTICATED (pesan generik)", async () => {
    const { svc } = build({ findByUsername: vi.fn().mockResolvedValue(null) });
    await rejectsCode(svc.login({ username: "hantu", password: "y" }), "UNAUTHENTICATED");
  });
});

describe("refresh", () => {
  it("reuse detection: token sudah-revoked dipakai lagi → cabut family + bump tokenVersion", async () => {
    const { svc, dal } = build({
      findRefreshByHash: vi.fn().mockResolvedValue({
        id: "r1", familyId: "f1", userId: "u1",
        revokedAt: new Date("2026-06-06T23:00:00Z"), expiresAt: new Date("2026-06-07T02:00:00Z"),
      }),
    });
    await rejectsCode(svc.refresh("stolen"), "UNAUTHENTICATED");
    expect(dal.revokeFamily).toHaveBeenCalledWith("f1", NOW, expect.anything());
    expect(dal.bumpTokenVersion).toHaveBeenCalledWith("u1", expect.anything());
  });

  it("token kedaluwarsa → UNAUTHENTICATED", async () => {
    const { svc } = build({
      findRefreshByHash: vi.fn().mockResolvedValue({
        id: "r1", familyId: "f1", userId: "u1", revokedAt: null, expiresAt: new Date("2026-06-06T23:00:00Z"),
      }),
    });
    await rejectsCode(svc.refresh("old"), "UNAUTHENTICATED");
  });

  it("happy: rotasi — terbit refresh baru + cabut lama", async () => {
    const { svc, dal } = build({
      findRefreshByHash: vi.fn().mockResolvedValue({
        id: "r1", familyId: "f1", userId: "u1", revokedAt: null, expiresAt: new Date("2026-06-07T02:00:00Z"),
      }),
    });
    const r = await svc.refresh("valid");
    expect(dal.createRefresh).toHaveBeenCalledTimes(1);
    expect(dal.revokeRefresh).toHaveBeenCalledWith("r1", NOW, null, expect.anything());
    expect(r.accessToken).toBe("AT");
  });

  it("token tak dikenal → UNAUTHENTICATED", async () => {
    const { svc } = build({ findRefreshByHash: vi.fn().mockResolvedValue(null) });
    await rejectsCode(svc.refresh("ghost"), "UNAUTHENTICATED");
  });
});

describe("revokeAllSessions / changePassword", () => {
  it("revokeAllSessions: bump tokenVersion + cabut semua refresh", async () => {
    const { svc, dal } = build();
    await svc.revokeAllSessions("u1");
    expect(dal.bumpTokenVersion).toHaveBeenCalledWith("u1", expect.anything());
    expect(dal.revokeAllUserRefresh).toHaveBeenCalledWith("u1", NOW, expect.anything());
  });

  it("changePassword: password lama salah → VALIDATION", async () => {
    verify.mockReturnValue(false);
    const { svc } = build();
    await rejectsCode(svc.changePassword("u1", { passwordLama: "salah", passwordBaru: "barubanget" }), "VALIDATION");
  });

  it("changePassword happy: simpan hash baru + paksa re-login (bump + revoke)", async () => {
    verify.mockReturnValue(true);
    const { svc, dal } = build();
    await svc.changePassword("u1", { passwordLama: "benar", passwordBaru: "barubanget" });
    expect(dal.updatePassword).toHaveBeenCalledWith("u1", "scrypt$baru", expect.anything());
    expect(dal.bumpTokenVersion).toHaveBeenCalled();
    expect(dal.revokeAllUserRefresh).toHaveBeenCalled();
  });
});
