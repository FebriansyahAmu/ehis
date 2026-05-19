import type { Metadata } from "next";
import KatalogTindakanPage from "@/components/master/katalog-tindakan/KatalogTindakanPage";

export const metadata: Metadata = { title: "Katalog Tindakan — Master" };

export default function Page() {
  return <KatalogTindakanPage />;
}
