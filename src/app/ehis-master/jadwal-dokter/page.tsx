import type { Metadata } from "next";
import JadwalDokterPage from "@/components/master/jadwal-dokter/JadwalDokterPage";

export const metadata: Metadata = { title: "Jadwal Dokter — Master" };

export default function Page() {
  return <JadwalDokterPage />;
}
