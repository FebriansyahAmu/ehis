import type { Metadata } from "next";
import DokterPage from "@/components/master/dokter/DokterPage";

export const metadata: Metadata = { title: "Dokter & Nakes — Master" };

export default function Page() {
  return <DokterPage />;
}
