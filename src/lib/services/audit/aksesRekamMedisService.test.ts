// Unit test log akses BACA rekam medis (PRD E5 · FR-5.1). NO DB: DAL di-inject palsu.

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/dal/audit/aksesRekamMedisDal", () => ({}));

import {
  BUCKET_MS,
  bucketStart,
  domainFromPath,
  hashIp,
  jalurAkses,
  makeAksesRekamMedisService,
} from "@/lib/services/audit/aksesRekamMedisService";
import type { Actor } from "@/lib/auth/actor";
import type * as DalNS from "@/lib/dal/audit/aksesRekamMedisDal";

function actor(over: Partial<Actor> = {}): Actor {
  return {
    userId: "11111111-1111-1111-1111-111111111111",
    pegawaiId: "22222222-2222-2222-2222-222222222222",
    roles: ["Perawat"],
    permissions: new Set(["clinical.rekammedis:read"]),
    unitIds: [],
    careUnits: ["IGD"],
    isGlobal: false,
    isSuperuser: false,
    ...over,
  };
}

function fakeDal(over: Partial<typeof DalNS> = {}) {
  return {
    upsert: vi.fn(async () => 1),
    findKunjunganSubject: vi.fn(async () => ({ patient_id: "pasien-1", unit: "RawatInap" })),
    findPasienByNoRm: vi.fn(async () => ({ id: "pasien-1", no_rm: "26110001", nama: "BUDI" })),
    findPegawai: vi.fn(async () => null),
    searchPegawai: vi.fn(async () => []),
    list: vi.fn(async () => []),
    ...over,
  } as unknown as typeof DalNS;
}

describe("helper", () => {
  it("bucketStart membulatkan ke jendela 15 menit", () => {
    const t = new Date("2026-11-21T08:07:30.000Z");
    expect(bucketStart(t).toISOString()).toBe("2026-11-21T08:00:00.000Z");
    expect(bucketStart(new Date(t.getTime() + 8 * 60_000)).toISOString()).toBe("2026-11-21T08:15:00.000Z");
    expect(BUCKET_MS).toBe(900_000);
  });

  it("domainFromPath mengambil segmen sesudah id kunjungan", () => {
    expect(domainFromPath("/api/v1/kunjungan/abc/cppt")).toBe("cppt");
    expect(domainFromPath("/api/v1/kunjungan/abc/lab/xyz/hasil")).toBe("lab");
    expect(domainFromPath("/api/v1/kunjungan/abc")).toBe("kunjungan");
    expect(domainFromPath("/api/v1/lab/orders/xyz")).toBe("lab");
  });

  it("jalurAkses: unit sendiri · penunjang · global", () => {
    expect(jalurAkses(actor(), "IGD")).toBe("unit");
    expect(jalurAkses(actor({ isGlobal: true }), "RawatInap")).toBe("global");
    expect(jalurAkses(actor({ isSuperuser: true, careUnits: [] }), "IGD")).toBe("global");
  });

  it("hashIp tidak menyimpan IP mentah dan deterministik", () => {
    const h = hashIp("10.1.2.3");
    expect(h).not.toContain("10.1.2.3");
    expect(h).toBe(hashIp("10.1.2.3"));
    expect(hashIp(null)).toBeNull();
  });
});

describe("recordRead", () => {
  it("menurunkan pasien & unit dari kunjungan lalu upsert dengan kunci dedup kunjungan", async () => {
    const dal = fakeDal();
    const svc = makeAksesRekamMedisService(dal);
    const at = new Date("2026-11-21T08:07:00.000Z");
    await svc.recordRead({ actor: actor(), kunjunganId: "kunj-1", domain: "cppt", outcome: "allowed", ip: "10.0.0.9", at });

    expect(dal.findKunjunganSubject).toHaveBeenCalledWith("kunj-1");
    const arg = (dal.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(arg).toMatchObject({
      patientId: "pasien-1",
      kunjunganId: "kunj-1",
      subjectKey: "kunj-1",
      unit: "RawatInap",
      jalur: "unit", // Perawat IGD tanpa bypass → percobaan di luar unit tetap jalur "unit"
      domains: ["cppt"],
      outcome: "allowed",
    });
    expect(arg.bucketStart.toISOString()).toBe("2026-11-21T08:00:00.000Z");
    expect(arg.ipHash).not.toBe("10.0.0.9");
  });

  it("tanpa kunjungan: kunci dedup = p:<patientId>", async () => {
    const dal = fakeDal();
    await makeAksesRekamMedisService(dal).recordRead({
      actor: actor(), patientId: "pasien-9", domain: "identitas-pasien", outcome: "allowed", ip: null,
    });
    expect(dal.findKunjunganSubject).not.toHaveBeenCalled();
    expect((dal.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0].subjectKey).toBe("p:pasien-9");
  });

  it("gagal menulis log tidak melempar (pelayanan tak boleh gagal)", async () => {
    const dal = fakeDal({ upsert: vi.fn(async () => { throw new Error("db down"); }) as never });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      makeAksesRekamMedisService(dal).recordRead({
        actor: actor(), patientId: "p", domain: "x", outcome: "allowed", ip: null,
      }),
    ).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("list", () => {
  const row = (i: number) => ({
    id: `00000000-0000-0000-0000-00000000000${i}`,
    first_at: new Date("2026-11-21T08:00:00.000Z"),
    last_at: new Date(`2026-11-21T08:0${i}:00.000Z`),
    hit_count: 3, outcome: "allowed", jalur: "unit", domains: ["cppt"], unit: "IGD", roles: ["Perawat"],
    pegawai_id: "pg", pegawai_nama: "SITI", pegawai_nip: "123",
    patient_id: "pasien-1", no_rm: "26110001", pasien_nama: "BUDI",
    kunjungan_id: "k", no_kunjungan: "K-1",
  });

  it("per pasien: halaman pertama mencatat pembukaan log + cursor halaman berikut", async () => {
    const dal = fakeDal({ list: vi.fn(async () => [row(3), row(2), row(1)]) as never });
    const res = await makeAksesRekamMedisService(dal).list(
      { noRm: "26110001", limit: 2, dari: "2026-11-21", sampai: "2026-11-21" }, actor(), null,
    );
    expect(res.subjek).toEqual({ jenis: "pasien", id: "pasien-1", noRm: "26110001", nama: "BUDI" });
    expect(res.items).toHaveLength(2);
    expect(res.nextCursor).not.toBeNull();

    const f = (dal.list as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(f.dari.toISOString()).toBe("2026-11-20T17:00:00.000Z"); // 00:00 WIB
    expect(f.sampai.toISOString()).toBe("2026-11-21T17:00:00.000Z"); // eksklusif, akhir hari WIB

    const audit = (dal.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(audit).toMatchObject({ jalur: "audit", patientId: "pasien-1", domains: ["jejak-akses:pasien"] });
    expect(audit.subjectKey.startsWith("audit:")).toBe(true);
  });

  it("halaman lanjutan (cursor) tidak mencatat ulang", async () => {
    const dal = fakeDal({ list: vi.fn(async () => [row(1)]) as never });
    const svc = makeAksesRekamMedisService(dal);
    const first = await svc.list({ noRm: "26110001", limit: 1 }, actor(), null);
    expect(first.nextCursor).toBeNull();
    const cursor = Buffer.from(`2026-11-21T08:01:00.000Z|${row(1).id}`).toString("base64url");
    await svc.list({ noRm: "26110001", limit: 1, cursor }, actor(), null);
    expect(dal.upsert).toHaveBeenCalledTimes(1);
  });

  it("No. RM tak dikenal → NOT_FOUND", async () => {
    const dal = fakeDal({ findPasienByNoRm: vi.fn(async () => null) as never });
    await expect(makeAksesRekamMedisService(dal).list({ noRm: "x", limit: 10 }, actor(), null)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
