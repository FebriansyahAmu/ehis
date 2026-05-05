import type { Metadata } from "next";
import PasienListPage from "@/components/registration/pasien-list/PasienListPage";

export const metadata: Metadata = { title: "Daftar Pasien — Registrasi" };

export default function PasienListRoutePage() {
  return <PasienListPage />;
}
