export type JenisFaskes       = "RS Umum" | "RS Khusus" | "RSIA" | "Puskesmas" | "Klinik Pratama" | "Klinik Utama" | "Balai Kesehatan" | "Lab Klinik";
export type TipePPK           = "Pratama" | "Utama" | "Umum" | "Khusus";
export type KelasFaskes       = "A" | "B" | "C" | "D" | "-";
export type KepemilikanFaskes = "Pemerintah" | "Swasta" | "BUMN" | "TNI/Polri";

export interface PPKRecord {
  id:          string;
  kodeFaskes:  string;
  nama:        string;
  jenis:       JenisFaskes;
  kepemilikan: KepemilikanFaskes;
  tipe:        TipePPK;
  kelas:       KelasFaskes;
  alamat:      string;
  rt?:         string;
  rw?:         string;
  kodePos?:    string;
  kota:        string;
  telepon?:    string;
  fax?:        string;
}

export const PPK_INITIAL: PPKRecord[] = [
  {
    id:          "ppk-1",
    kodeFaskes:  "0001R001",
    nama:        "Puskesmas Menteng",
    jenis:       "Puskesmas",
    kepemilikan: "Pemerintah",
    tipe:        "Pratama",
    kelas:       "-",
    alamat:      "Jl. Menteng Raya No. 48",
    rt: "001", rw: "002",
    kodePos:     "10340",
    kota:        "Jakarta Pusat",
    telepon:     "021-3924006",
  },
  {
    id:          "ppk-2",
    kodeFaskes:  "0001K021",
    nama:        "Klinik Pratama Sehat Abadi",
    jenis:       "Klinik Pratama",
    kepemilikan: "Swasta",
    tipe:        "Pratama",
    kelas:       "-",
    alamat:      "Jl. Cikini Raya No. 15",
    rt: "003", rw: "004",
    kodePos:     "10330",
    kota:        "Jakarta Pusat",
    telepon:     "021-3143200",
  },
  {
    id:          "ppk-3",
    kodeFaskes:  "0001RS01",
    nama:        "RSUPN Dr. Cipto Mangunkusumo",
    jenis:       "RS Umum",
    kepemilikan: "Pemerintah",
    tipe:        "Umum",
    kelas:       "A",
    alamat:      "Jl. Diponegoro No. 71",
    rt: "002", rw: "001",
    kodePos:     "10430",
    kota:        "Jakarta Pusat",
    telepon:     "021-5004580",
    fax:         "021-3144736",
  },
  {
    id:          "ppk-4",
    kodeFaskes:  "0001RS02",
    nama:        "RSPAD Gatot Subroto",
    jenis:       "RS Umum",
    kepemilikan: "TNI/Polri",
    tipe:        "Umum",
    kelas:       "A",
    alamat:      "Jl. Abdul Rahman Saleh No. 24",
    rt: "001", rw: "003",
    kodePos:     "10410",
    kota:        "Jakarta Pusat",
    telepon:     "021-3441008",
    fax:         "021-3441008",
  },
];
