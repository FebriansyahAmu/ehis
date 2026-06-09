// ringkasanDal — Prisma MURNI: cek eksistensi baris hidup per tabel Asesmen Medis
// dalam 1 batch paralel (existence-only via findFirst select id → LIMIT 1, murah).
// Tabel ber-soft-delete difilter deletedAt: null. Tanpa aturan bisnis (OR/compose
// derajat "selesai" ada di Service). Terima `tx?`.

import { db, type Tx } from "@/lib/db/prisma";

/** Flag eksistensi granular per tabel — Service yang menggabungkan jadi DTO. */
export interface RingkasanRaw {
  anamnesis: boolean;
  riwayat: boolean; // salah satu dari 9 sub-pane riwayat
  alergiItem: boolean; // ada item alergi aktif
  alergiNka: boolean; // header NKA dengan nka = true
  gizi: boolean;
  edukasiPasien: boolean;
  edukasiEmergency: boolean;
  edukasiEol: boolean; // care plan EOL
  edukasiMeeting: boolean; // catatan pertemuan keluarga
}

export async function getRingkasan(kunjunganId: string, tx?: Tx): Promise<RingkasanRaw> {
  const d = db(tx);
  const k = kunjunganId;
  const live = { where: { kunjunganId: k, deletedAt: null }, select: { id: true } } as const;
  const any = { where: { kunjunganId: k }, select: { id: true } } as const;

  const [
    anamnesis,
    rwDahulu, rwObat, rwGaya, rwFaktor, rwKeluarga, rwTb, rwGinek, rwRawat, rwObstetri,
    alergiItem, alergiNkaRow, gizi,
    eduPasien, eduEmergency, eduEol, eduMeeting,
  ] = await Promise.all([
    d.anamnesis.findFirst(any),
    d.asesmenPenyakitDahulu.findFirst(any),
    d.asesmenObat.findFirst(any),
    d.asesmenGayaHidup.findFirst(any),
    d.asesmenFaktorResiko.findFirst(any),
    d.asesmenPenyakitKeluarga.findFirst(any),
    d.asesmenTuberkulosis.findFirst(any),
    d.asesmenGinekologi.findFirst(any),
    d.asesmenPerawatan.findFirst(any),
    d.asesmenObstetri.findFirst(any),
    d.asesmenAlergi.findFirst(live),
    d.asesmenAlergiNka.findUnique({ where: { kunjunganId: k }, select: { nka: true } }),
    d.asesmenGizi.findFirst(any),
    d.asesmenEdukasiPasien.findFirst(live),
    d.asesmenEdukasiEmergency.findFirst(live),
    d.asesmenEdukasiEol.findFirst(any),
    d.asesmenEdukasiEolMeeting.findFirst(live),
  ]);

  return {
    anamnesis: anamnesis !== null,
    riwayat: [
      rwDahulu, rwObat, rwGaya, rwFaktor, rwKeluarga, rwTb, rwGinek, rwRawat, rwObstetri,
    ].some((r) => r !== null),
    alergiItem: alergiItem !== null,
    alergiNka: alergiNkaRow?.nka === true,
    gizi: gizi !== null,
    edukasiPasien: eduPasien !== null,
    edukasiEmergency: eduEmergency !== null,
    edukasiEol: eduEol !== null,
    edukasiMeeting: eduMeeting !== null,
  };
}
