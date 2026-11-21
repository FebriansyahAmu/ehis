// UUIDv7 (RFC 9562) — 48 bit milidetik + acak. Dipakai INSERT raw SQL ke tabel ber-PK
// `@default(uuid(7))` (default Prisma dibuat di klien, bukan di DB). Terurut waktu → sisipan
// B-tree selalu di ujung kanan (lebih ringan daripada UUIDv4 acak).

import { randomBytes } from "node:crypto";

export function uuidv7(): string {
  const b = randomBytes(16);
  const ms = Date.now();
  b[0] = Math.floor(ms / 2 ** 40) & 0xff;
  b[1] = Math.floor(ms / 2 ** 32) & 0xff;
  b[2] = (ms >>> 24) & 0xff;
  b[3] = (ms >>> 16) & 0xff;
  b[4] = (ms >>> 8) & 0xff;
  b[5] = ms & 0xff;
  b[6] = (b[6] & 0x0f) | 0x70; // versi 7
  b[8] = (b[8] & 0x3f) | 0x80; // varian RFC
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
