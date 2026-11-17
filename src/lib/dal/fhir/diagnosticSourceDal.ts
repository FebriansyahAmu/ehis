// diagnosticSourceDal — baca order + hasil Lab/Rad kunjungan dan LOINC master untuk FH6.
// Prisma murni, read-only. Order soft-deleted IKUT (→ entered-in-error bila pernah terkirim).
// Hasil = baris TERBARU per order (append-only "latest wins").

import { db, type Tx } from "@/lib/db/prisma";

export function listLab(kunjunganId: string, tx?: Tx) {
  return db(tx).labOrder.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, prioritas: true, status: true, authorPegawaiId: true, catatan: true, createdAt: true, deletedAt: true,
      items: { orderBy: { createdAt: "asc" }, select: { id: true, labTestId: true, kodeTes: true, namaTes: true } },
      results: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true, authorPegawaiId: true, validatorUserId: true, validatedAt: true, catatanValidator: true,
          values: {
            orderBy: { urutan: "asc" },
            select: { labTestId: true, labParameterId: true, rowKey: true, nama: true, nilai: true, satuan: true, rujukanStr: true, flag: true },
          },
        },
      },
    },
  });
}

export function listRad(kunjunganId: string, tx?: Tx) {
  return db(tx).radOrder.findMany({
    where: { kunjunganId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, prioritas: true, status: true, authorPegawaiId: true, catatan: true, createdAt: true, deletedAt: true,
      items: { orderBy: { createdAt: "asc" }, select: { id: true, radCatalogId: true, kode: true, nama: true } },
      results: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, temuan: true, kesan: true, saran: true, authorPegawaiId: true, validatorUserId: true, validatedAt: true },
      },
    },
  });
}

export function listLabTestLoinc(ids: string[], tx?: Tx) {
  if (!ids.length) return Promise.resolve([]);
  return db(tx).labTest.findMany({
    where: { id: { in: ids } },
    select: { id: true, nama: true, kategori: true, loincCode: true, loincDisplay: true },
  });
}

/** Kategori Permintaan/Hasil kode lab di Lampiran LOINC Laboratorium resmi (master.terminologi_lab) — gerbang L16. */
export function listTerminologiLabKategori(codes: string[], tx?: Tx) {
  if (!codes.length) return Promise.resolve([]);
  return db(tx).terminologiLab.findMany({
    where: { code: { in: codes } },
    select: { code: true, permintaanHasil: true },
  });
}

/**
 * Parameter katalog SAAT INI per tes. Catatan: update Katalog Lab = replace-all parameter (id baru),
 * jadi `LabResultValue.labParameterId` hasil lama bisa menunjuk id yang sudah terhapus → Service
 * mencocokkan fallback by (testId, nama parameter).
 */
export function listLabParametersByTest(testIds: string[], tx?: Tx) {
  if (!testIds.length) return Promise.resolve([]);
  return db(tx).labParameter.findMany({
    where: { testId: { in: testIds } },
    select: { id: true, testId: true, nama: true, tipeHasil: true, loincCode: true, loincDisplay: true },
  });
}

export function listRadCatalogLoinc(ids: string[], tx?: Tx) {
  if (!ids.length) return Promise.resolve([]);
  return db(tx).radCatalog.findMany({ where: { id: { in: ids } }, select: { id: true, nama: true, loincCode: true, loincDisplay: true } });
}

/** userId (validator) → pegawaiId (kunci peta Practitioner). */
export function listUserPegawai(userIds: string[], tx?: Tx) {
  if (!userIds.length) return Promise.resolve([]);
  return db(tx).user.findMany({ where: { id: { in: userIds } }, select: { id: true, pegawaiId: true } });
}
