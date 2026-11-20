// Unit test penjaga asal request (SG-02). Keputusan murni checkOrigin — tanpa jaringan/DB.

import { describe, it, expect } from "vitest";
import { checkOrigin, parseTrustedOrigins } from "@/lib/http/originGuard";

const APP = "ehis.rs.test";

function req(method: string, headers: Record<string, string> = {}): Request {
  return new Request(`http://${APP}/api/v1/kunjungan`, {
    method,
    headers: { host: APP, ...headers },
  });
}

const none = new Set<string>();

describe("checkOrigin", () => {
  it("lolos: browser same-origin (Sec-Fetch-Site + Origin sama)", () => {
    const r = req("POST", { origin: `https://${APP}`, "sec-fetch-site": "same-origin" });
    expect(checkOrigin(r, none).ok).toBe(true);
  });

  it("tolak: POST lintas situs", () => {
    const r = req("POST", { origin: "https://jahat.test", "sec-fetch-site": "cross-site" });
    expect(checkOrigin(r, none)).toEqual({ ok: false, reason: "sec-fetch-site=cross-site" });
  });

  it("tolak: GET lintas situs ke API juga ditolak", () => {
    const r = req("GET", { "sec-fetch-site": "cross-site" });
    expect(checkOrigin(r, none).ok).toBe(false);
  });

  it("tolak: same-site (subdomain lain belum tentu tepercaya)", () => {
    const r = req("POST", { origin: "https://lain.rs.test", "sec-fetch-site": "same-site" });
    expect(checkOrigin(r, none).ok).toBe(false);
  });

  it("lolos: di belakang reverse proxy, Host internal ≠ Origin tapi browser bilang same-origin", () => {
    const r = new Request("http://10.0.0.5:3000/api/v1/x", {
      method: "POST",
      headers: { host: "10.0.0.5:3000", origin: `https://${APP}`, "sec-fetch-site": "same-origin" },
    });
    expect(checkOrigin(r, none).ok).toBe(true);
  });

  it("lolos: Origin cocok X-Forwarded-Host walau tanpa Sec-Fetch-Site", () => {
    const r = new Request("http://10.0.0.5:3000/api/v1/x", {
      method: "POST",
      headers: { host: "10.0.0.5:3000", "x-forwarded-host": APP, origin: `https://${APP}` },
    });
    expect(checkOrigin(r, none).ok).toBe(true);
  });

  it("lolos: origin terdaftar di TRUSTED_ORIGINS walau lintas situs", () => {
    const trusted = parseTrustedOrigins("https://portal.rs.test");
    const r = req("POST", { origin: "https://portal.rs.test", "sec-fetch-site": "cross-site" });
    expect(checkOrigin(r, trusted).ok).toBe(true);
  });

  it("tolak: browser lama tanpa Sec-Fetch-Site, POST ber-Origin asing", () => {
    const r = req("POST", { origin: "https://jahat.test" });
    expect(checkOrigin(r, none)).toEqual({ ok: false, reason: "origin tidak tepercaya" });
  });

  it("tolak: Origin 'null' (iframe sandbox)", () => {
    const r = req("POST", { origin: "null" });
    expect(checkOrigin(r, none).ok).toBe(false);
  });

  it("lolos: klien non-browser tanpa Origin & Sec-Fetch-Site (Postman/curl)", () => {
    expect(checkOrigin(req("POST"), none).ok).toBe(true);
    expect(checkOrigin(req("GET"), none).ok).toBe(true);
  });
});

describe("parseTrustedOrigins", () => {
  it("normalisasi, buang path/slash, abaikan entri rusak", () => {
    const s = parseTrustedOrigins(" https://a.test/ , bukan-url, https://b.test:8443/x ");
    expect([...s]).toEqual(["https://a.test", "https://b.test:8443"]);
  });

  it("kosong → set kosong", () => {
    expect(parseTrustedOrigins(undefined).size).toBe(0);
  });
});
