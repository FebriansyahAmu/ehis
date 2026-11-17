// medicationSourceDal — baca resep + dispensing kunjungan dan master Obat (KFA) untuk FH5.
// Prisma murni, read-only. Order resep TERMASUK yang soft-deleted (→ entered-in-error bila pernah
// terkirim). ResepItem ↔ master.Obat via `kode` (soft-ref, tanpa FK).

import { db, type Tx } from "@/lib/db/prisma";

export function listResep(kunjunganId: string, tx?: Tx) {
  return db(tx).resepOrder.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, depoKode: true, depoNama: true, prioritas: true, status: true, isObatPulang: true,
      authorPegawaiId: true, createdAt: true, deletedAt: true,
      items: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true, kodeObat: true, namaObat: true, dosis: true, dosisSekali: true, signa: true, jumlah: true,
          rute: true, aturanPakai: true, durasiHari: true, keterangan: true,
        },
      },
      dispensings: {
        orderBy: { createdAt: "asc" },
        select: { id: true, apoteker: true, authorPegawaiId: true, createdAt: true },
      },
      // L19 — tiap telaah (append-only; telaah ulang = baris baru) → 1 QuestionnaireResponse Q0007.
      telaahs: {
        orderBy: { createdAt: "asc" },
        select: { id: true, hasil: true, answers: true, catatan: true, authorPegawaiId: true, createdAt: true },
      },
    },
  });
}

/**
 * L21 — catatan pemberian obat (MAR) kunjungan, append-only "latest wins" per slot
 * (resepItemId × tanggal × shift). Reduksi ke entri terakhir per slot di links/mar.ts.
 */
export function listMar(kunjunganId: string, tx?: Tx) {
  return db(tx).marEntry.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, resepItemId: true, dosis: true, rute: true, tanggal: true, shift: true, status: true,
      waktuPemberian: true, perawat2: true, catatan: true, authorPegawaiId: true, createdAt: true,
    },
  });
}

export function listObatByKode(kodes: string[], tx?: Tx) {
  if (!kodes.length) return Promise.resolve([]);
  return db(tx).obat.findMany({
    where: { kode: { in: kodes }, deletedAt: null },
    select: { id: true, kode: true, namaGenerik: true, namaDagang: true, bentuk: true, kekuatan: true, status: true, kfa: true },
  });
}

export function listLocationByKode(kodes: string[], tx?: Tx) {
  if (!kodes.length) return Promise.resolve([]);
  return db(tx).location.findMany({ where: { kode: { in: kodes }, deletedAt: null }, select: { id: true, kode: true, nama: true } });
}
