import type { Metadata } from "next";
import RegistrationBerandaPage from "@/components/registration/beranda/RegistrationBerandaPage";

export const metadata: Metadata = { title: "Beranda — Registrasi" };

export default function EhisRegistrationPage() {
  return <RegistrationBerandaPage />;
}
