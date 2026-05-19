import type { Metadata } from "next";
import KatalogLabPage from "@/components/master/katalog-lab/KatalogLabPage";

export const metadata: Metadata = { title: "Katalog Laboratorium — Master" };

export default function Page() {
  return <KatalogLabPage />;
}
