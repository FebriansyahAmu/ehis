import type { NextConfig } from "next";

// ── Header keamanan — SG-01 (docs/SECURITY-GAP.md) ─────────────────────────────
// headers() dievaluasi saat `next build` → env di bawah (HSTS_MAX_AGE) harus tersedia saat build.

const isProd = process.env.NODE_ENV === "production";

// HSTS: mulai pendek (default 300 detik) agar salah konfigurasi HTTPS tak mengunci situs di browser
// pengguna. Naikkan HSTS_MAX_AGE ke 31536000 (≥ 1 tahun, ASVS L2) setelah domain dan SEMUA
// subdomainnya dipastikan HTTPS (includeSubDomains ikut berlaku). Hanya production.
const hstsMaxAge = Number.parseInt(process.env.HSTS_MAX_AGE ?? "300", 10);

// CSP DITEGAKKAN: hanya direktif yang tak memecah aplikasi — anti-clickjacking, tanpa plugin,
// tanpa pembajakan <base>, form hanya ke origin sendiri. Aplikasi tak memakai iframe sendiri.
const cspEnforced = [
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
].join("; ");

// CSP REPORT-ONLY: kebijakan sasaran; pelanggaran muncul di konsol / tab Issues DevTools, tidak
// memblokir. Belum ada nonce → script-src masih 'unsafe-inline' (skrip inline hidrasi Next).
// Langkah berikut (SG-16): nonce per request + 'strict-dynamic' + endpoint laporan, lalu enforce.
const cspReportOnly = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'report-sample'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspEnforced },
  { key: "Content-Security-Policy-Report-Only", value: cspReportOnly },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kamera dipakai WebcamCapturePane (foto informed consent, tanpa audio); fitur lain tak dipakai.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  ...(isProd && hstsMaxAge > 0
    ? [{ key: "Strict-Transport-Security", value: `max-age=${hstsMaxAge}; includeSubDomains` }]
    : []),
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Respons API bergantung pada asal request (lib/http/originGuard.ts) → cache perantara
      // tidak boleh menyajikan respons yang sama untuk asal berbeda.
      { source: "/api/:path*", headers: [{ key: "Vary", value: "Origin, Sec-Fetch-Site" }] },
    ];
  },
};

export default nextConfig;
