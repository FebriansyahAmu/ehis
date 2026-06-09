// Zod + DTO — Asesmen Medis · RINGKASAN STATUS (read-only, lintas sub-menu).
// Satu panggilan mengembalikan flag "sudah terisi atau belum" per sub-menu, agar
// progress + indikator hijau di SubNav langsung tampil tanpa membuka tiap sub-tab.
// Tak ada Input (GET murni). Semantik "terisi" = ada baris hidup di tabel terkait:
//   anamnesis · riwayat (salah satu dari 9 sub-pane) · alergi (NKA true | item aktif)
//   · skrining (gizi) · edukasi (pasien | emergency | EOL plan | pertemuan).

export interface AsesmenRingkasanDTO {
  kunjunganId: string;
  anamnesis: boolean;
  riwayat: boolean;
  alergi: boolean;
  skrining: boolean;
  edukasi: boolean;
}
