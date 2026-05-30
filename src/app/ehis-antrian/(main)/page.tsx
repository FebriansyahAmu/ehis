import type { Metadata } from "next";
import AntrianBerandaPage from "@/components/antrean/beranda/AntrianBerandaPage";

export const metadata: Metadata = { title: "Beranda — Antrean" };

export default function EhisAntrianBeranda() {
  return <AntrianBerandaPage />;
}
