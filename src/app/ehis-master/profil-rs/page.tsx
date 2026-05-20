import type { Metadata } from "next";
import ProfilRsPage from "@/components/master/profil-rs/ProfilRsPage";

export const metadata: Metadata = { title: "Profil RS — EHIS Master" };

export default function Page() {
  return <ProfilRsPage />;
}
