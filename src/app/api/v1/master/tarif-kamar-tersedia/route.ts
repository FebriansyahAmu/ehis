// REST: /api/v1/master/tarif-kamar-tersedia — Tarif Ruang Rawat untuk KONSUMSI (bukan kelola master).
//   GET → semua baris (kelas × penjamin → harga/hari). Konsumen resolve rate per (kelas, penjaminKode).
// RBAC: gate `registration.kunjungan:read` (loket/registrasi) — BUKAN `master.tarif` (loket tak punya
// hak master; tarif = uang, gate khusus di halaman master). Tanpa params.id → scopeKunjungan:false.
// Pola konsumen *-tersedia (mis. lab-test-tersedia): baca katalog master lewat gate konsumen.
// Dipakai: registrasi → Ubah Paket → Pindah Kelas (harga ruangan = tarif matriks).

import { route, reply } from "@/lib/http/route";
import { tarifKamarService } from "@/lib/services/master/tarifKamarService";

export const GET = route({
  resource: "registration.kunjungan",
  action: "read",
  scopeKunjungan: false, // katalog tarif murni (tanpa konteks kunjungan)
  handler: async () => {
    // Baris tarif kamar sedikit (7 kelas × beberapa penjamin) → satu halaman cukup.
    const { items } = await tarifKamarService.list({ limit: 500 });
    return reply(items);
  },
});
