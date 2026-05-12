// ── Informed Consent — Types & Constants ──────────────────

export type SignatureMethod = "draw" | "webcam";

export type HubunganPenanda =
  | "Pasien Sendiri"
  | "Suami"
  | "Istri"
  | "Ayah"
  | "Ibu"
  | "Anak"
  | "Saudara Kandung"
  | "Wali Sah";

export interface ICConsentResult {
  signatureMethod: SignatureMethod;
  signatureImagePng: string;  // base64 PNG data URL
  hubungan: HubunganPenanda;
  namaPenanda: string;
  saksiNama: string;
  saksiJabatan: string;
  consentedAt: string;        // ISO timestamp
}

export interface InformedConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (result: ICConsentResult) => void;
  tindakan: string;
  deskripsiTindakan?: string;
  dokterPelaksana: string;
  pasienNama: string;
  pasienNoRM: string;
  ruangan?: string;
  risiko?: string[];
  manfaat?: string[];
  alternatif?: string[];
}

export const HUBUNGAN_OPTIONS: HubunganPenanda[] = [
  "Pasien Sendiri",
  "Suami",
  "Istri",
  "Ayah",
  "Ibu",
  "Anak",
  "Saudara Kandung",
  "Wali Sah",
];

export const SAKSI_JABATAN_OPTIONS = [
  "Perawat",
  "Bidan",
  "Dokter",
  "Apoteker",
  "Tenaga Kesehatan Lain",
];

export const DEFAULT_RISIKO = [
  "Nyeri, bengkak, atau memar di area tindakan",
  "Perdarahan ringan selama atau setelah tindakan",
  "Infeksi lokal di area tindakan",
  "Reaksi alergi terhadap obat, bahan, atau alat yang digunakan",
  "Kegagalan prosedur yang memerlukan tindakan ulang",
];

export const DEFAULT_MANFAAT = [
  "Membantu menegakkan atau mengkonfirmasi diagnosis",
  "Mempercepat proses penyembuhan dan pemulihan",
  "Mengurangi gejala, nyeri, atau keluhan pasien",
  "Mencegah komplikasi yang lebih serius",
];

export const DEFAULT_ALTERNATIF = [
  "Penanganan konservatif (tanpa tindakan invasif)",
  "Observasi dan pemantauan berkala tanpa intervensi",
  "Dapat didiskusikan lebih lanjut dengan dokter penanggung jawab",
];
