// Unit test userService (provisioning). NO DB: DAL (user+pegawai) + `transaction` di-mock.
// Fokus: zero-orphan (pegawai wajib ada) · 1 akun/pegawai · username unik · password DI-HASH
// (bukan plaintext) · resolve key role → CONFLICT/VALIDATION · DTO (roles=key, namaTampil).

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prisma", () => ({
  transaction: (fn: (tx: unknown) => unknown) => fn({}),
  db: (tx: unknown) => tx,
  prisma: {},
}));

import { makeUserService } from "@/lib/services/userService";
import type * as UserDalNS from "@/lib/dal/userDal";
import type * as PegawaiDalNS from "@/lib/dal/pegawaiDal";
import type { Actor } from "@/lib/auth/actor";
import type { CreateUserInput } from "@/lib/schemas/user";

const NOW = "2026-06-04T00:00:00.000Z";
const actor = {} as Actor;

function makePeg(over: Record<string, unknown> = {}) {
  return { id: "p1", gelarDepan: "dr.", namaLengkap: "Budi Santoso", gelarBelakang: "Sp.JP", ...over };
}

function makeUser(over: Record<string, unknown> = {}) {
  return {
    id: "u1",
    username: "budi.santoso",
    passwordHash: "scrypt$16384$8$1$x$y",
    status: "Active",
    mustChangePassword: true,
    pegawaiId: "p1",
    createdAt: new Date(NOW),
    roles: [] as { role: { key: string } }[],
    ...over,
  };
}

function makeUserDal(over: Record<string, unknown> = {}) {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByUsername: vi.fn().mockResolvedValue(null),
    findByPegawaiId: vi.fn().mockResolvedValue(null),
    findRolesByKeys: vi.fn(),
    replaceRoles: vi.fn().mockResolvedValue(undefined),
    updateStatus: vi.fn().mockResolvedValue(undefined),
    ...over,
  };
}

function build(userOver: Record<string, unknown> = {}, pegOver: Record<string, unknown> = {}) {
  const dal = makeUserDal(userOver);
  const pegawaiDal = { findById: vi.fn().mockResolvedValue(makePeg()), ...pegOver };
  const svc = makeUserService({
    dal: dal as unknown as typeof UserDalNS,
    pegawaiDal: pegawaiDal as unknown as typeof PegawaiDalNS,
  });
  return { svc, dal, pegawaiDal };
}

const baseCreate: CreateUserInput = {
  pegawaiId: "p1",
  username: "budi.santoso",
  password: "rahasia123",
  mustChangePassword: true,
};

async function rejectsCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toMatchObject({ code });
}

beforeEach(() => vi.clearAllMocks());

describe("createUser", () => {
  it("happy: password DI-HASH (bukan plaintext), DTO namaTampil + roles kosong", async () => {
    const { svc, dal } = build({ create: vi.fn().mockResolvedValue(makeUser()) });
    const dto = await svc.createUser(baseCreate, actor);

    expect(dto.username).toBe("budi.santoso");
    expect(dto.namaTampil).toBe("dr. Budi Santoso, Sp.JP");
    expect(dto.roles).toEqual([]);

    const arg = dal.create.mock.calls[0][0] as { passwordHash: string };
    expect(arg.passwordHash).not.toContain("rahasia123");
    expect(arg.passwordHash.startsWith("scrypt$")).toBe(true);
  });

  it("pegawai tak ada → NOT_FOUND, tak buat akun", async () => {
    const { svc, dal } = build({}, { findById: vi.fn().mockResolvedValue(null) });
    await rejectsCode(svc.createUser(baseCreate, actor), "NOT_FOUND");
    expect(dal.create).not.toHaveBeenCalled();
  });

  it("pegawai sudah punya akun → CONFLICT", async () => {
    const { svc } = build({ findByPegawaiId: vi.fn().mockResolvedValue({ id: "u-lama" }) });
    await rejectsCode(svc.createUser(baseCreate, actor), "CONFLICT");
  });

  it("username sudah dipakai → CONFLICT", async () => {
    const { svc } = build({ findByUsername: vi.fn().mockResolvedValue({ id: "u-lain" }) });
    await rejectsCode(svc.createUser(baseCreate, actor), "CONFLICT");
  });
});

describe("assignRoles", () => {
  it("akun tak ada → NOT_FOUND", async () => {
    const { svc } = build({ findById: vi.fn().mockResolvedValue(null) });
    await rejectsCode(svc.assignRoles("x", { roles: ["Dokter"] }, actor), "NOT_FOUND");
  });

  it("key role tak dikenal → VALIDATION", async () => {
    const { svc } = build({
      findById: vi.fn().mockResolvedValue(makeUser()),
      findRolesByKeys: vi.fn().mockResolvedValue([{ id: "r1", key: "Dokter" }]), // "Hantu" tak ada
    });
    await rejectsCode(svc.assignRoles("u1", { roles: ["Dokter", "Hantu"] }, actor), "VALIDATION");
  });

  it("happy: replaceRoles dgn id ter-resolve + status, DTO roles=key", async () => {
    const userWithRoles = makeUser({ roles: [{ role: { key: "Dokter" } }, { role: { key: "SpPK" } }] });
    const { svc, dal } = build({
      findById: vi.fn().mockResolvedValue(userWithRoles),
      findRolesByKeys: vi.fn().mockResolvedValue([
        { id: "r-dok", key: "Dokter" },
        { id: "r-sppk", key: "SpPK" },
      ]),
    });
    const dto = await svc.assignRoles("u1", { roles: ["Dokter", "SpPK"], status: "Suspended" }, actor);

    expect(dal.replaceRoles).toHaveBeenCalledWith("u1", ["r-dok", "r-sppk"], expect.anything());
    expect(dal.updateStatus).toHaveBeenCalledWith("u1", "Suspended", expect.anything());
    expect(dto.roles).toEqual(["Dokter", "SpPK"]);
    expect(dto.namaTampil).toBe("dr. Budi Santoso, Sp.JP");
  });

  it("tanpa status → updateStatus tidak dipanggil", async () => {
    const { svc, dal } = build({
      findById: vi.fn().mockResolvedValue(makeUser()),
      findRolesByKeys: vi.fn().mockResolvedValue([{ id: "r-dok", key: "Dokter" }]),
    });
    await svc.assignRoles("u1", { roles: ["Dokter"] }, actor);
    expect(dal.updateStatus).not.toHaveBeenCalled();
  });
});
