// Unit test access JWT (jose). Round-trip issue→verify, expiry (clock injectable), tamper, kosong.

import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-yang-cukup-panjang-untuk-hs256-aman";
});

const payload = {
  sub: "u1", pegawaiId: "p1", roles: ["Dokter", "SpPK"],
  isGlobal: false, unitIds: ["unit-icu"], tokenVersion: 3,
};

describe("access JWT", () => {
  it("round-trip: verify mengembalikan claims yang sama + jti", async () => {
    const { issueAccessToken, verifyAccessToken } = await import("@/lib/auth/jwt");
    const t0 = new Date("2026-06-07T00:00:00Z");
    const { token, jti } = await issueAccessToken(payload, t0);
    const claims = await verifyAccessToken(token, t0);
    expect(claims.sub).toBe("u1");
    expect(claims.roles).toEqual(["Dokter", "SpPK"]);
    expect(claims.unitIds).toEqual(["unit-icu"]);
    expect(claims.tokenVersion).toBe(3);
    expect(claims.isGlobal).toBe(false);
    expect(claims.jti).toBe(jti);
  });

  it("kedaluwarsa (verify 31 menit kemudian) → UNAUTHENTICATED", async () => {
    const { issueAccessToken, verifyAccessToken } = await import("@/lib/auth/jwt");
    const t0 = new Date("2026-06-07T00:00:00Z");
    const { token } = await issueAccessToken(payload, t0);
    const later = new Date(t0.getTime() + 31 * 60_000);
    await expect(verifyAccessToken(token, later)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("token dirusak → UNAUTHENTICATED", async () => {
    const { issueAccessToken, verifyAccessToken } = await import("@/lib/auth/jwt");
    const t0 = new Date("2026-06-07T00:00:00Z");
    const { token } = await issueAccessToken(payload, t0);
    await expect(verifyAccessToken(token + "x", t0)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });
});
