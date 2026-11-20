// Penjaga asal request — SG-02 (CSRF / Fetch Metadata), docs/SECURITY-GAP.md.
// Dipanggil PALING AWAL di route() dan di handler mentah (auth login/logout/refresh,
// enhance-signature), SEBELUM AuthN: penolakan tak boleh membocorkan ada/tidaknya sesi.
//
// Aturan (urut):
//  1. Origin tepercaya → lolos. Tepercaya = host aplikasi sendiri (Host / X-Forwarded-Host)
//     atau daftar env TRUSTED_ORIGINS (dipisah koma, mis. "https://ehis.rs.id").
//  2. Ada Sec-Fetch-Site (browser modern, dihitung browser — tak bisa dipalsukan halaman lain):
//     hanya `same-origin` dan `none` yang lolos. `same-site` DITOLAK karena subdomain lain di
//     domain RS belum tentu tepercaya. Berlaku untuk SEMUA method (GET lintas situs ke API juga
//     ditolak — API EHIS tak punya konsumen lintas situs).
//  3. Tanpa Sec-Fetch-Site (browser lama / klien non-browser): method mutasi ber-Origin asing →
//     tolak; tanpa Origin sama sekali → lolos (curl/Postman/server-to-server tak membawa cookie
//     korban, jadi bukan vektor CSRF).
//
// Sengaja di handler, BUKAN di proxy: proxy bukan penjaga authoritative (lihat src/proxy.ts).

import { Errors } from "@/lib/errors/appError";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const ALLOWED_FETCH_SITES = new Set(["same-origin", "none"]);

export type OriginVerdict = { ok: true } | { ok: false; reason: string };

const OK: OriginVerdict = { ok: true };

/** "https://a.id, https://b.id/" → Set origin ter-normalisasi. Entri rusak diabaikan. */
export function parseTrustedOrigins(raw: string | undefined): Set<string> {
  const out = new Set<string>();
  for (const part of (raw ?? "").split(",")) {
    const v = part.trim();
    if (!v) continue;
    try {
      out.add(new URL(v).origin);
    } catch {
      // abaikan entri yang bukan URL
    }
  }
  return out;
}

function requestHost(headers: Headers): string | null {
  const raw = headers.get("x-forwarded-host") ?? headers.get("host");
  const first = raw?.split(",")[0]?.trim().toLowerCase();
  return first || null;
}

function isTrustedOrigin(origin: string, headers: Headers, trusted: Set<string>): boolean {
  if (origin === "null") return false; // iframe sandbox, redirect privasi, file://
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (trusted.has(url.origin)) return true;
  const host = requestHost(headers);
  return host !== null && url.host.toLowerCase() === host;
}

/** Keputusan murni (tanpa efek samping) — diuji di originGuard.test.ts. */
export function checkOrigin(
  req: Request,
  trusted: Set<string> = parseTrustedOrigins(process.env.TRUSTED_ORIGINS),
): OriginVerdict {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");

  if (origin && isTrustedOrigin(origin, req.headers, trusted)) return OK;

  if (site) {
    return ALLOWED_FETCH_SITES.has(site) ? OK : { ok: false, reason: `sec-fetch-site=${site}` };
  }

  if (origin && !SAFE_METHODS.has(req.method.toUpperCase())) {
    return { ok: false, reason: "origin tidak tepercaya" };
  }
  return OK;
}

/** Lempar FORBIDDEN (403) bila request datang dari situs lain. */
export function assertAllowedOrigin(req: Request): void {
  if (!checkOrigin(req).ok) throw Errors.forbidden("Permintaan lintas situs ditolak");
}
