import type { Metadata } from "next";
import KatalogObatPage from "@/components/master/katalog-obat/KatalogObatPage";

export const metadata: Metadata = { title: "Katalog Obat — Master" };

export default function Page() {
  return <KatalogObatPage />;
}
