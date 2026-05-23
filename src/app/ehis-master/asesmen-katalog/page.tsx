import type { Metadata } from "next";
import AsesmenKatalogPage from "@/components/master/asesmen-katalog/AsesmenKatalogPage";

export const metadata: Metadata = { title: "Asesmen Katalog — Master" };

export default function Page() {
  return <AsesmenKatalogPage />;
}
