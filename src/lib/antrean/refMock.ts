// ANT6 — Referensi HFIS: mapping poli RS ↔ poli BPJS (mock).
// Saat backend ready → tarik dari WS `ref/poli` (HFIS). Kode poli RS selaras onsiteMock.

export interface PoliHfisRef {
  rsKode: string;
  rsNama: string;
  bpjsKode: string;
  bpjsNama: string;
  aktif: boolean;
}

export const POLI_HFIS_MAP: ReadonlyArray<PoliHfisRef> = [
  { rsKode: "UMU", rsNama: "Poli Umum", bpjsKode: "001", bpjsNama: "Poliklinik Umum", aktif: true },
  { rsKode: "INT", rsNama: "Penyakit Dalam", bpjsKode: "INT", bpjsNama: "Spesialis Penyakit Dalam", aktif: true },
  { rsKode: "JAN", rsNama: "Jantung", bpjsKode: "JAN", bpjsNama: "Spesialis Jantung & Pembuluh Darah", aktif: true },
  { rsKode: "PAR", rsNama: "Paru", bpjsKode: "PAR", bpjsNama: "Spesialis Paru", aktif: true },
  { rsKode: "BED", rsNama: "Bedah", bpjsKode: "BED", bpjsNama: "Spesialis Bedah", aktif: true },
  { rsKode: "SAR", rsNama: "Saraf", bpjsKode: "SAR", bpjsNama: "Spesialis Saraf", aktif: true },
  { rsKode: "ANA", rsNama: "Anak", bpjsKode: "ANA", bpjsNama: "Spesialis Anak", aktif: true },
  { rsKode: "THT", rsNama: "THT-KL", bpjsKode: "THT", bpjsNama: "Spesialis THT-KL", aktif: true },
  { rsKode: "MAT", rsNama: "Mata", bpjsKode: "MAT", bpjsNama: "Spesialis Mata", aktif: true },
  { rsKode: "ORT", rsNama: "Ortopedi", bpjsKode: "ORT", bpjsNama: "Spesialis Orthopedi", aktif: true },
  { rsKode: "GIG", rsNama: "Gigi & Mulut", bpjsKode: "GIG", bpjsNama: "Poli Gigi", aktif: true },
  { rsKode: "OBG", rsNama: "Obstetri & Ginekologi", bpjsKode: "OBG", bpjsNama: "Spesialis Kebidanan & Kandungan", aktif: true },
];
