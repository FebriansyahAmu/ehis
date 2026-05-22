import type { Metadata } from "next";
import KatalogRadiologiPage from "@/components/master/katalog-radiologi/KatalogRadiologiPage";

export const metadata: Metadata = { title: "Katalog Radiologi — Master" };

export default function Page() {
  return <KatalogRadiologiPage />;
}
