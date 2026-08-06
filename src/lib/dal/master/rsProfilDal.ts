// rsProfilDal — akses Prisma MURNI master.RsProfil (SINGLETON id="rs-profil").
// Tanpa aturan bisnis. Terima `tx?`. Blok bertingkat = JSONB (Prisma.InputJsonValue).

import { db, type Tx } from "@/lib/db/prisma";
import type {
  RsAlamatDTO, RsAkreditasiDTO, RsShiftDTO, RsKopDTO,
} from "@/lib/schemas/master/profilRs";

export const RS_PROFIL_ID = "rs-profil";

/** Data tekstual profil (tanpa logo — dikelola terpisah). */
export interface RsProfilData {
  nama:        string;
  namaInggris: string | null;
  kode:        string;
  kelas:       string;
  tipe:        string;
  kepemilikan: string;
  telp:        string;
  fax:         string | null;
  email:       string;
  website:     string | null;
  alamat:      RsAlamatDTO;
  akreditasi:  RsAkreditasiDTO;
  shift:       RsShiftDTO;
  kop:         RsKopDTO;
  updatedBy:   string | null;
}

export type RsProfilEntity = NonNullable<Awaited<ReturnType<typeof get>>>;

/** Ambil baris singleton (null bila belum pernah disimpan). */
export function get(tx?: Tx) {
  return db(tx).rsProfil.findUnique({ where: { id: RS_PROFIL_ID } });
}

/** Upsert singleton profil tekstual. Logo tak disentuh (kolom di luar payload). */
export function upsert(data: RsProfilData, tx?: Tx) {
  const jsonFields = {
    nama: data.nama,
    namaInggris: data.namaInggris,
    kode: data.kode,
    kelas: data.kelas,
    tipe: data.tipe,
    kepemilikan: data.kepemilikan,
    telp: data.telp,
    fax: data.fax,
    email: data.email,
    website: data.website,
    alamat: data.alamat,
    akreditasi: data.akreditasi,
    shift: data.shift,
    kop: data.kop,
    updatedBy: data.updatedBy,
  };
  return db(tx).rsProfil.upsert({
    where: { id: RS_PROFIL_ID },
    create: { id: RS_PROFIL_ID, ...jsonFields },
    update: jsonFields,
  });
}

/** Set/clear logo (data URI atau null). Asumsi baris sudah ada. */
export function updateLogo(dataUrl: string | null, updatedBy: string | null, tx?: Tx) {
  return db(tx).rsProfil.update({
    where: { id: RS_PROFIL_ID },
    data: { logoDataUrl: dataUrl, updatedBy },
  });
}
