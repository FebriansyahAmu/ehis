// Unit test pegawaiService (FLOWS §15). NO DB: DAL + `transaction` di-mock, `clock`
// di-stub (deterministik). Fokus: guard bisnis, dedup NIK/NIP, optimistic concurrency,
// DTO mapping (mask NIK / namaTampil / isDokter). PII (enc/hash/mask) pakai impl asli
// (node:crypto, dev key) → deterministik antar-run.

import { describe, it, expect, vi, beforeEach } from "vitest";

// `transaction` jadi passthrough (jalankan callback dgn tx palsu); cegah Prisma nyata.
vi.mock("@/lib/db/prisma", () => ({
  transaction: (fn: (tx: unknown) => unknown) => fn({}),
  db: (tx: unknown) => tx,
  prisma: {},
}));

import { makePegawaiService } from "@/lib/services/pegawaiService";
import { encryptPii } from "@/lib/crypto/pii";
import { fixedClock } from "@/lib/core/clock";
import type * as PegawaiDalNS from "@/lib/dal/pegawaiDal";
import type { Actor } from "@/lib/auth/actor";
import type { CreatePegawaiInput } from "@/lib/schemas/pegawai";

const NIK = "3201234567890123";
const NOW = "2026-06-04T00:00:00.000Z";
const actor = {} as Actor; // service abaikan actor (stub) — cukup placeholder

// ── Fixtures ──────────────────────────────────────────────────────────────────
function makeEntity(over: Record<string, unknown> = {}) {
  return {
    id: "p1",
    nip: "198001012020121001",
    nikEnc: encryptPii(NIK),
    nikHash: "hash",
    namaLengkap: "Budi Santoso",
    gelarDepan: "dr.",
    gelarBelakang: "Sp.JP",
    jenisKelamin: "L",
    tempatLahir: "Jakarta",
    tanggalLahir: new Date("1980-01-01T00:00:00.000Z"),
    statusPegawai: "ASN",
    profesi: null,
    unitKerja: "RI",
    tglMasuk: new Date("2020-12-01T00:00:00.000Z"),
    alamat: "Jl. Mawar",
    noHp: "08123",
    email: "budi@rs.id",
    foto: null,
    practitionerId: null,
    user: null,
    isActive: true,
    version: 0,
    createdAt: new Date(NOW),
    updatedAt: new Date(NOW),
    deletedAt: null,
    kontakDarurat: [],
    ...over,
  };
}

function makeDal(over: Record<string, unknown> = {}) {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByNikHash: vi.fn().mockResolvedValue(null),
    findByNip: vi.fn().mockResolvedValue(null),
    list: vi.fn(),
    updateWithVersion: vi.fn(),
    replaceKontakDarurat: vi.fn().mockResolvedValue(undefined),
    softDeleteWithVersion: vi.fn(),
    ...over,
  };
}

function build(dalOver: Record<string, unknown> = {}) {
  const dal = makeDal(dalOver);
  const svc = makePegawaiService({ clock: fixedClock(NOW), dal: dal as unknown as typeof PegawaiDalNS });
  return { svc, dal };
}

const baseCreate: CreatePegawaiInput = {
  nik: NIK,
  nip: "198001012020121001",
  namaLengkap: "Budi Santoso",
  gelarDepan: "dr.",
  gelarBelakang: "Sp.JP",
  jenisKelamin: "L",
  statusPegawai: "ASN",
};

/** Assert promise rejects dengan AppError ber-code tertentu (katalog FLOWS §4). */
async function rejectsCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toMatchObject({ code });
}

beforeEach(() => vi.clearAllMocks());

// ── createPegawai ─────────────────────────────────────────────────────────────
describe("createPegawai", () => {
  it("happy: enkripsi NIK, mask di DTO, namaTampil tergabung", async () => {
    const { svc, dal } = build({ create: vi.fn().mockResolvedValue(makeEntity()) });
    const dto = await svc.createPegawai(baseCreate, actor);

    expect(dto.nikMasked).toBe("3201••••••••0123");
    expect(dto.namaTampil).toBe("dr. Budi Santoso, Sp.JP");
    expect(dto.isDokter).toBe(false);

    // NIK yang masuk ke DAL harus TER-enkripsi + ber-hash (bukan plaintext).
    const arg = dal.create.mock.calls[0][0] as { nikEnc: string; nikHash: string };
    expect(arg.nikEnc).not.toContain(NIK);
    expect(arg.nikHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("profesi 'Dokter' → isDokter true walau practitionerId belum tertaut", async () => {
    const { svc } = build({ create: vi.fn().mockResolvedValue(makeEntity({ profesi: "Dokter", practitionerId: null })) });
    const dto = await svc.createPegawai({ ...baseCreate, profesi: "Dokter" }, actor);
    expect(dto.isDokter).toBe(true);
    expect(dto.profesi).toBe("Dokter");
  });

  it("profesi non-klinis 'Administrator' → isDokter false", async () => {
    const { svc } = build({ create: vi.fn().mockResolvedValue(makeEntity({ profesi: "Administrator", practitionerId: null })) });
    const dto = await svc.createPegawai({ ...baseCreate, profesi: "Administrator" }, actor);
    expect(dto.isDokter).toBe(false);
  });

  it("NIK duplikat → CONFLICT, tak menyentuh create", async () => {
    const { svc, dal } = build({ findByNikHash: vi.fn().mockResolvedValue({ id: "other" }) });
    await rejectsCode(svc.createPegawai(baseCreate, actor), "CONFLICT");
    expect(dal.create).not.toHaveBeenCalled();
  });

  it("NIP duplikat → CONFLICT", async () => {
    const { svc } = build({ findByNip: vi.fn().mockResolvedValue({ id: "other" }) });
    await rejectsCode(svc.createPegawai(baseCreate, actor), "CONFLICT");
  });

  it("tanggal lahir di masa depan → VALIDATION", async () => {
    const { svc } = build();
    await rejectsCode(svc.createPegawai({ ...baseCreate, tanggalLahir: "2027-01-01" }, actor), "VALIDATION");
  });
});

// ── getPegawai ────────────────────────────────────────────────────────────────
describe("getPegawai", () => {
  it("tak ada → NOT_FOUND", async () => {
    const { svc } = build({ findById: vi.fn().mockResolvedValue(null) });
    await rejectsCode(svc.getPegawai("x", actor), "NOT_FOUND");
  });

  it("ada + practitionerId → isDokter true, umur dihitung via clock", async () => {
    const { svc } = build({ findById: vi.fn().mockResolvedValue(makeEntity({ practitionerId: "dr-1" })) });
    const dto = await svc.getPegawai("p1", actor);
    expect(dto.isDokter).toBe(true);
    expect(dto.tanggalLahir).toBe("1980-01-01");
    expect(dto.umur).toBe(46); // 2026-06-04 − 1980-01-01
  });

  it("punyaAkun: ada user tertaut → true; null → false", async () => {
    const { svc } = build({ findById: vi.fn().mockResolvedValue(makeEntity({ user: { id: "u1" } })) });
    expect((await svc.getPegawai("p1", actor)).punyaAkun).toBe(true);
    const { svc: svc2 } = build({ findById: vi.fn().mockResolvedValue(makeEntity({ user: null })) });
    expect((await svc2.getPegawai("p1", actor)).punyaAkun).toBe(false);
  });
});

// ── listPegawai ───────────────────────────────────────────────────────────────
describe("listPegawai", () => {
  it("map item + cursor; aktif 'true' → boolean true ke DAL", async () => {
    const { svc, dal } = build({
      list: vi.fn().mockResolvedValue({ items: [makeEntity()], nextCursor: "c1" }),
    });
    const res = await svc.listPegawai({ aktif: "true", limit: 20 });
    expect(res.cursor).toBe("c1");
    expect(res.items[0].namaTampil).toBe("dr. Budi Santoso, Sp.JP");
    expect(dal.list).toHaveBeenCalledWith(expect.objectContaining({ aktif: true, limit: 20 }));
  });

  it("aktif tak diisi → undefined (tak memfilter)", async () => {
    const { svc, dal } = build({ list: vi.fn().mockResolvedValue({ items: [], nextCursor: null }) });
    await svc.listPegawai({ limit: 20 });
    expect(dal.list).toHaveBeenCalledWith(expect.objectContaining({ aktif: undefined }));
  });
});

// ── updatePegawai ─────────────────────────────────────────────────────────────
describe("updatePegawai", () => {
  it("tak ada → NOT_FOUND", async () => {
    const { svc } = build({ findById: vi.fn().mockResolvedValue(null) });
    await rejectsCode(svc.updatePegawai("x", { expectedVersion: 0 }, actor), "NOT_FOUND");
  });

  it("version stale → CONFLICT_VERSION", async () => {
    const { svc } = build({
      findById: vi.fn().mockResolvedValue(makeEntity()),
      updateWithVersion: vi.fn().mockResolvedValue(0),
    });
    await rejectsCode(svc.updatePegawai("p1", { expectedVersion: 0 }, actor), "CONFLICT_VERSION");
  });

  it("ganti NIK ke milik pegawai lain → CONFLICT", async () => {
    const { svc } = build({
      findById: vi.fn().mockResolvedValue(makeEntity({ id: "p1" })),
      findByNikHash: vi.fn().mockResolvedValue({ id: "other" }),
    });
    await rejectsCode(
      svc.updatePegawai("p1", { nik: "3201234567890999", expectedVersion: 0 }, actor),
      "CONFLICT",
    );
  });

  it("happy + kontakDarurat dikirim → replaceKontakDarurat dipanggil", async () => {
    const { svc, dal } = build({
      findById: vi.fn().mockResolvedValue(makeEntity()),
      updateWithVersion: vi.fn().mockResolvedValue(1),
    });
    await svc.updatePegawai(
      "p1",
      { namaLengkap: "Budi Baru", kontakDarurat: [{ nama: "Ani", hubungan: "Istri", noHp: "0812" }], expectedVersion: 0 },
      actor,
    );
    expect(dal.replaceKontakDarurat).toHaveBeenCalledOnce();
  });

  it("happy tanpa kontakDarurat → replaceKontakDarurat TIDAK dipanggil", async () => {
    const { svc, dal } = build({
      findById: vi.fn().mockResolvedValue(makeEntity()),
      updateWithVersion: vi.fn().mockResolvedValue(1),
    });
    await svc.updatePegawai("p1", { namaLengkap: "Budi Baru", expectedVersion: 0 }, actor);
    expect(dal.replaceKontakDarurat).not.toHaveBeenCalled();
  });
});

// ── deletePegawai ─────────────────────────────────────────────────────────────
describe("deletePegawai", () => {
  it("tak ada → NOT_FOUND", async () => {
    const { svc } = build({ findById: vi.fn().mockResolvedValue(null) });
    await rejectsCode(svc.deletePegawai("x", 0, actor), "NOT_FOUND");
  });

  it("version stale → CONFLICT_VERSION", async () => {
    const { svc } = build({
      findById: vi.fn().mockResolvedValue(makeEntity()),
      softDeleteWithVersion: vi.fn().mockResolvedValue(0),
    });
    await rejectsCode(svc.deletePegawai("p1", 0, actor), "CONFLICT_VERSION");
  });

  it("happy → softDelete dipanggil dgn waktu dari clock", async () => {
    const { svc, dal } = build({
      findById: vi.fn().mockResolvedValue(makeEntity()),
      softDeleteWithVersion: vi.fn().mockResolvedValue(1),
    });
    await svc.deletePegawai("p1", 0, actor);
    expect(dal.softDeleteWithVersion).toHaveBeenCalledWith("p1", 0, new Date(NOW));
  });
});
