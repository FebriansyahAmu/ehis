## Ringkasan

<!-- Apa yang berubah dan kenapa. Satu PR = satu topik. -->

## Jenis

- [ ] feat — fitur baru
- [ ] fix — perbaikan bug
- [ ] refactor — tanpa perubahan perilaku
- [ ] chore / docs

## Definition of Done ([ENGINEERING-RULES §6](../docs/ENGINEERING-RULES.md))

- [ ] Branch dari `main` terbaru, satu topik
- [ ] Diagnostik editor bersih untuk file yang disentuh
- [ ] `npm run check:changed` lulus (lint + test file berubah)
- [ ] Migrasi additive (bila ada) sudah diterapkan & ditandai `migrate resolve`
- [ ] Dokumen diperbarui (CLAUDE.md / TODO-* / *-GAP.md)
- [ ] CI hijau

## Checklist keamanan (OWASP — [ENGINEERING-RULES §3](../docs/ENGINEERING-RULES.md))

- [ ] Endpoint baru lewat `route()` dengan `resource` + `action` RBAC yang tepat
- [ ] Akses data per kunjungan/pasien dicek kepemilikannya (BOLA/IDOR) — `scopeKunjungan` atau cek di Service
- [ ] Input divalidasi Zod di batas (body, query, params)
- [ ] SQL hanya Prisma / raw berparameter — tak ada nilai user di-string-kan ke query
- [ ] Tak ada PII/PHI (NIK, nama, diagnosis) di log, pesan error, atau URL
- [ ] Secret hanya server-side (`server-only`), tak ada di bundle klien / repo
- [ ] Tidak berlaku — PR tanpa permukaan keamanan (jelaskan singkat)

## Catatan review / verifikasi tertunda

<!-- Mis. belum dibuka di browser, belum diuji sandbox, gap baru FG-xx/SG-xx. -->
