import type { Metadata } from "next";
import { PengaturanPage } from "@/components/antrean/pengaturan/PengaturanPage";

export const metadata: Metadata = { title: "Pengaturan — Antrean" };

export default function Page() {
  return <PengaturanPage />;
}
