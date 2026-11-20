import type { Metadata } from "next";
import JejakAksesPage from "@/components/master/jejak-akses/JejakAksesPage";

export const metadata: Metadata = { title: "Jejak Akses Rekam Medis — Master" };

// Data diambil di klien setelah pengguna memilih pasien/pegawai (gate API audit.akses:read).
export default function Page() {
  return <JejakAksesPage />;
}
