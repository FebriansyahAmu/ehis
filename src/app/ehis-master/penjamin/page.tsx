import type { Metadata } from "next";
import PenjaminPage from "@/components/master/penjamin/PenjaminPage";

export const metadata: Metadata = { title: "Penjamin & Kontrak — EHIS Master" };

export default function Page() {
  return <PenjaminPage />;
}
